'use strict';

let nconf = require('nconf');
let Entities = require('html-entities').AllHtmlEntities;
let shuffle = require('knuth-shuffle').knuthShuffle;

import { Question, QuestionSimple, Answer } from './externals';
import { Helpers } from './helpers';

class Quiz {

	numberToWin: number;
	answerTime: number;
	questionsAnswered: number;
	questionCallback: Function;
	participants: Object;
	questions: Question[];
	currentQuestion: string;
	currentAnswer: string;
	running: boolean;
	entities: any;
	bot: any;
	message: any;
	answerQueue: Answer[];
	answerWorker: AnswerWorker;

	constructor(answersToWin: number, bot, message) {
		this.numberToWin = answersToWin;
		this.answerTime = nconf.get('question_timeout');
		this.questionsAnswered = 0;
		this.participants = {};
		this.questions = [];
		this.currentQuestion = null;
		this.currentAnswer = null;
		this.entities = new Entities();
		this.bot = bot;
		this.message = message;
		this.running = false;
	}

	run(): void {
		var _this = this;
		_this._loadQuestions().then((responses) => {
			responses.map((response) => {
				_this.questions = _this.questions.concat(response);
			});
			_this.questions = shuffle(_this.questions);
			console.log(_this.questions);
			console.log('new data fetched');
			this.answerWorker = new AnswerWorker(this);
			this.answerWorker.run();
			this.running = true;
		});
	}

	isRunning(): boolean {
		return this.running;
	}

	askNextQuestion(bot, answer): void {
		var _this = this;
		if (this.questions.length == 0) {
			_this._loadQuestions().then((responses) => {
				responses.map((response) => {
					_this.questions = _this.questions.concat(response);
				});
				_this.questions = shuffle(_this.questions);
				console.log(_this.questions);
				console.log('new data fetched');
				_this._postNextQuestion();
			});
		} else {
			this._postNextQuestion();
		}
	}

	_postNextQuestion() {
		let next = this._fetchNextQuestion();
		this._setQuestion(next);
		let reply = {
			'text': 'Next question: ',
			'attachments': [
				{
					'fallback': this.entities.decode(next.question),
					'text': this.entities.decode(next.question),
					'color': 'good'
				}
			]
		}
		this.bot.reply(this.message, reply);
	}

	getCurrentQuestion(): QuestionSimple {
		return {
			question: this.entities.decode(this.currentQuestion),
			answer: this.entities.decode(this.currentAnswer)
		};
	}

	postAnswer(user: string, answer: string): void {
		this.answerQueue.push({ name: user, answer: answer });
	}

	printStandings(): string {
		let result = '';
		let participants = [];
		for (let user in this.participants) {
			if (this.participants.hasOwnProperty(user)) {
				participants.push({ name: user, points: this.participants[user] });
			}
		}
		participants.sort((a, b) => {
			return b.points - a.points;
		});
		participants.forEach(user => {
			result += user.name + '\t\t' + user.points + '\n';
		});
		return result;
	}

	_checkWinner(): string {
		for (let user in this.participants) {
			if (this.participants.hasOwnProperty(user)) {
				if (this.participants[user] === this.numberToWin) {
					return user;
				}
			}
		}
		return null;
	}

	stop(): void {
		this.answerWorker.reset();
		this.running = false;
	}

	_loadQuestions(): Promise<any> {
		let promises: Promise<Question[]>[] = [];
		for (let question_url of nconf.get('question_urls')) {
			promises.push(Helpers.getJSONFromUrl(question_url));
		}
		return Promise.all(promises);
	}


	_fetchNextQuestion(): Question {
		let nextQuestion = this.questions[0];
		this.questions.splice(0, 1);
		if (!(nextQuestion.correct_answer.toLowerCase() === 'false' || nextQuestion.correct_answer.toLowerCase() === 'true') &&
			(nextQuestion.question.includes('Which of') ||
				nextQuestion.question.includes('Which one') ||
				nextQuestion.question.includes('following') ||
				nextQuestion.question.includes('which of') ||
				nextQuestion.question.includes('which one') ||
				nextQuestion.question.includes('which is not') ||
				nextQuestion.question.includes('isn\'t') ||
				nextQuestion.question.includes('not') ||
				nextQuestion.question.includes('NOT'))
		) {
			let answers = this._getShuffeledAnswers(nextQuestion.correct_answer, nextQuestion.incorrect_answers);
			nextQuestion.question = nextQuestion.question + ' ( ' + answers + ' )';
		}
		this._setQuestion(nextQuestion);
		return nextQuestion;
	}

	_setQuestion(nextQuestion: Question): void {
		this.currentQuestion = nextQuestion.question;
		this.currentAnswer = nextQuestion.correct_answer;
	}

	resetQuestion(): void {
		this.currentQuestion = null;
		this.currentAnswer = null;
		this.answerQueue = [];
	}

	_hasCurrentQuestion(): boolean {
		return this.currentQuestion !== null && this.currentAnswer !== null;
	}

	_checkAnswer(answer: Answer): boolean {
		if (this.currentAnswer === null || this.currentQuestion === null) {
			return false;
		}
		if (this._decode(answer.answer).toLowerCase() === this._decode(this.currentAnswer).toLowerCase()) {
			if (!this.participants[answer.name]) {
				this.participants[answer.name] = 0;
			}
			this.participants[answer.name]++;
			this.bot.reply(this.message, answer.name + " got it correct: *" + this.getCurrentQuestion().answer + '*');
			let winner = this._checkWinner();
			if (winner) {
				this.stop();
				setTimeout(() => {
					this.bot.reply(this.message, "The winner is: " + winner);
					this.bot.reply(this.message, "Final standing:\n" + this.printStandings());
				}, 1500);
				return false;
			} else {
				return true;
			}
		} else {
			return false;
		}
	}

	_decode(text: string): string {
		let decoded: string = this.entities.decode(text);
		decoded = decoded.replace('&uuml;', 'ü');
		decoded = decoded.replace('&ouml;', 'ö');
		decoded = decoded.replace('&auml;', 'ä');
		return decoded;
	}

	_getShuffeledAnswers(correctAnswer: string, incorrectAnswers: string[]): string {
		let answers = incorrectAnswers;
		answers.push(correctAnswer);
		return Helpers.printArray(shuffle(answers));
	}
}

class AnswerWorker {

	quiz: Quiz;
	timer: NodeJS.Timer;
	solutionTime: number;

	constructor(quiz: Quiz) {
		this.quiz = quiz;
	}

	run(): void {
		this._triggerNextQuestion();
		this.timer = setInterval(() => {
			this._doWork();
		}, 250);
	}

	reset(): void {
		clearInterval(this.timer);
	}

	_doWork(): void {
		if (this.quiz._hasCurrentQuestion()) {
			if (new Date().getTime() > this.solutionTime) {
				this.reset();
				this.quiz.bot.reply(this.quiz.message, "Answer was: *" + this.quiz.getCurrentQuestion().answer + '*');
				this.run();
			} else {
				this._checkAnswer();
			}
		}

	}

	_triggerNextQuestion(): void {
		this.quiz.resetQuestion();
		setTimeout(() => {
			this.solutionTime = new Date().getTime() + nconf.get('question_timeout');
			this.quiz.askNextQuestion(this.quiz.bot, this.quiz.message);
		}, 1500);
	}

	_checkAnswer(): void {
		if (this.quiz.isRunning && this.quiz.answerQueue.length > 0) {
			let answer = this.quiz.answerQueue.shift();
			let correct = this.quiz._checkAnswer(answer);
			if (correct) {
				this.reset();
				this.run();
			}
		}
	}
}

namespace Quiz {
	module.exports = Quiz;
}

export = Quiz;