'use strict';

let nconf = require('nconf');
let Entities = require('html-entities').AllHtmlEntities;
let shuffle = require('knuth-shuffle').knuthShuffle;

import { Question, QuestionSimple, Answer } from './externals';
import { Helpers } from './helpers';

class AnswerWorker {

	quiz: Quiz;
	timer: NodeJS.Timer;
	notified: boolean;

	constructor(quiz: Quiz) {
		this.quiz = quiz;
		this.notified = false;
	}

	run(): void {
		this.notifyNextQuestion();
		this.timer = setInterval(() => {
			this._doWork();
		}, 250);
	}

	notifyNextQuestion(): void {
		this.notified = true;

	}

	reset(): void {
		clearInterval(this.timer);
	}

	_doWork(): void {
		if (this.notified) {
			this.notified = false;
			this._triggerNextQuestion();
		} else {
			this._checkAnswer();
		}
	}

	_triggerNextQuestion(): void {
		this.quiz.resetQuestion();
		this.quiz.askNextQuestion(this.quiz.bot, this.quiz.message);
	}

	_checkAnswer(): void {
		if (this.quiz.isRunning && this.quiz._hasCurrentQuestion() && this.quiz.answerQueue.length > 0) {
			let answer = this.quiz.answerQueue.shift();
			this.quiz._checkAnswer(answer);
		}
	}
}

export class Quiz {

	numberToWin: number;
	answerTime: number;
	questionTimer: NodeJS.Timer;
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
		this.answerTime = 10000;
		this.questionTimer = null;
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
		clearTimeout(this.questionTimer);
		let next = this._fetchNextQuestion();
		this._setQuestion(next);
		this.questionTimer = setTimeout(() => {
			if (this.isRunning()) {
				this.bot.reply(this.message, "Answer was: " + this.getCurrentQuestion().answer);
				setTimeout(() => {
					this.answerWorker.notifyNextQuestion();
				}, 1000);
			}
		}, this.answerTime);
		this.bot.reply(this.message, this.entities.decode(next.question));
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
		if (nextQuestion.question.includes('Which of') ||
			nextQuestion.question.includes('Which one') ||
			nextQuestion.question.includes('following') ||
			nextQuestion.question.includes('which of') ||
			nextQuestion.question.includes('which one') ||
			nextQuestion.question.includes('NOT')) {
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
			return;
		}
		if (answer.answer.toLowerCase() === this.currentAnswer.toLowerCase()) {
			if (!this.participants[answer.name]) {
				this.participants[answer.name] = 0;
			}
			this.participants[answer.name]++;
			this.bot.reply(this.message, answer.name + " got it correct: *" + this.getCurrentQuestion().answer + '*');
			let winner = this._checkWinner();
			if (winner) {
				this.bot.reply(this.message, "The winner is: " + winner);
				this.stop();

			} else {
				setTimeout(() => {
					this.answerWorker.notifyNextQuestion();
				}, 1000);
			}
		};
	}

	_getShuffeledAnswers(correctAnswer: string, incorrectAnswers: string[]): string {
		let answers = incorrectAnswers;
		answers.push(correctAnswer);
		return Helpers.printArray(shuffle(answers));
	}
}

module.exports = Quiz;