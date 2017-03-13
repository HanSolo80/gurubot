'use strict';

let nconf = require('nconf');
let Entities = require('html-entities').AllHtmlEntities;
let shuffle = require('knuth-shuffle').knuthShuffle;

import { Question, QuestionSimple, Answer, Difficulty } from './externals';
import { Helpers } from './helpers';
import * as Bot from './bot';
import * as Gurubot from './gurubot';
import * as QuestionProvider from './questionprovider';
import * as TriviaDBProvider from './triviadbprovider';
import * as MariaDBProvider from './mariadbprovider';

class Quizbot implements Bot {

	gurubot: Gurubot;
	quiz: Quiz;

	constructor(gurubot: Gurubot) {
		this.gurubot = gurubot;
	}

	init(): void {
		var _this = this;
		this.gurubot.controller.hears('^\\+quiz\\s*(\\d*)\\s*(\\w*)\\s*$', 'ambient', (bot, message) => {
			if (!this.gurubot.isCommandAllowed('quiz', message)) {
				bot.reply(message, '*Quiz not allowed in channel!*');
				return;
			}
			if (!_this.quiz || !_this.quiz.isRunning()) {
				let numberToWin = 5;
				let difficulty = null;
				if (message.match[1]) {
					numberToWin = parseInt(message.match[1]);
				}
				if (message.match[2]) {
					switch (message.match[2].toLowerCase()) {
						case 'easy':
							difficulty = Difficulty.EASY;
							break;

						case 'medium':
							difficulty = Difficulty.MEDIUM;
							break;

						case 'hard':
							difficulty = Difficulty.HARD
							break;
					}
				}
				_this.quiz = new Quiz(numberToWin, bot, message, difficulty);
				bot.reply(message, 'Quiz started with ' + numberToWin + ' answers to win.');
				_this.quiz.run();
			} else {
				bot.reply(message, 'Quiz is already running!');
			}
		});

		this.gurubot.controller.hears('\\+endquiz', 'ambient', (bot, message) => {
			if (!this.gurubot.isCommandAllowed('quiz', message)) {
				return;
			}
			if (_this.quiz) {
				_this.quiz.stop();
				_this.quiz = null;
				bot.reply(message, 'Quiz stopped');
			} else {
				bot.reply(message, 'No quiz running!');
			}
		});

		this.gurubot.controller.hears('\\+scorequiz', 'ambient', (bot, message) => {
			if (!this.gurubot.isCommandAllowed('quiz', message)) {
				return;
			}
			if (_this.quiz) {
				if (_this.quiz.isRunning()) {
					bot.reply(message, _this.quiz.printStandings());
				}
			}
		});
	}

	handleWildcardMessage(message: any) {
		if (this.quiz) {
			if (this.quiz.isRunning()) {
				if (message.channel === this.quiz.message.channel) {
					this.quiz.postAnswer(this.gurubot.users.find(user => user.id === message.user).name, message.text);
				}
			} else {
				this.quiz = null;
			}
		}
	}

	destroy(): void {
		if (this.quiz && this.quiz.isRunning()) {
			this.quiz.stop();
			this.quiz = null;
		}
	}

	getCommands(): String[] {
		return ['quiz [numberToWin] [difficulty]', 'endquiz', 'scorequiz'];
	}

}

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
	questionProviders: QuestionProvider[];

	constructor(answersToWin: number, bot, message, difficulty?: Difficulty) {
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
		this.questionProviders = [];
		this.questionProviders.push(new TriviaDBProvider(20, difficulty));
		this.questionProviders.push(new MariaDBProvider(80, difficulty));
	}

	run(): void {
		var _this = this;
		_this._fetchQuestionsFromProviders(_this.questionProviders).then((questions) => {
			_this.questions = shuffle(questions);
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
			_this._fetchQuestionsFromProviders(_this.questionProviders).then((questions) => {
				_this.questions = shuffle(questions);
				_this._postNextQuestion();
			});
		} else {
			this._postNextQuestion();
		}
	}

	_fetchQuestionsFromProviders(providers: QuestionProvider[]): Promise<Question[]> {
		return new Promise(function (resolve: Function) {
			let result: Question[] = [];
			let promises: Promise<Question[]>[] = [];
			providers.forEach((provider) => {
				promises.push(provider.fetchQuestions());
			});
			Promise.all(promises).then((responses) => {
				responses.map((response) => {
					result = result.concat(response);
				});
				resolve(result);
			});
		});
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
					setTimeout(() => {
						this.bot.reply(this.message, "Final standing:\n" + this.printStandings());
					}, 1000);
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

namespace Quizbot {
	module.exports = Quizbot;
}

export = Quizbot;