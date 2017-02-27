'use strict';

let nconf = require('nconf');
let Entities = require('html-entities').AllHtmlEntities;
let shuffle = require('knuth-shuffle').knuthShuffle;

import {Question, QuestionSimple} from './externals';
import {Helpers} from './helpers';

export class Quiz {

	numberToWin: number;
	answerTime: number;
	questionTimer: Object;
	questionsAnswered: number;
	questionCallback: Function;
	participants: Object;
	questions: Question[];
	currentQuestion: string;
	currentAnswer: string;
	entities: any;
	bot: any;
	answer: any;

	constructor(answersToWin : number, callback: Function, bot, answer) {
		this.numberToWin = answersToWin;
		this.answerTime = 15;
		this.questionTimer = null;
		this.questionsAnswered = 0;
		this.questionCallback = callback;
		this.participants = {};
		this.questions = [];
		this.currentQuestion = null;
		this.currentAnswer = null;
		this.entities = new Entities();
		this.bot = bot;
		this.answer = answer;
	}

	run() : void {
		var _this = this;
		_this._loadQuestions().then((responses) => {
			responses.map((response) => {
				_this.questions = _this.questions.concat(response);
			});
			_this.questions = shuffle(_this.questions);
			console.log(_this.questions);
			console.log('new data fetched');
			_this.questionCallback();
		});
	}

	isRunning() {
		return this.questionsAnswered < this.numberToWin;
	}

	askNextQuestion(bot, answer) : Promise<QuestionSimple> {
		var _this = this;
		_this.questionTimer = setTimeout(() => {
			_this.questionCallback();
		}, _this.answerTime);
		if (this.questions.length == 0) {
			return new Promise((resolve: Function, reject: Function) => {
			_this._loadQuestions().then((responses) => {
				responses.map((response) => {
					_this.questions = _this.questions.concat(response);
				});
				_this.questions = shuffle(_this.questions);
				console.log(_this.questions);
				console.log('new data fetched');
				resolve(_this._fetchNextQuestion());
			});
		});
		} else {
			return new Promise((resolve) => {
				resolve(this._fetchNextQuestion());
			});
		}
	}

	getCurrentQuestion() : QuestionSimple {
		return {
			question: this.entities.decode(this.currentQuestion),
			answer: this.entities.decode(this.currentAnswer)
		};
	}

	hasCurrentQuestion() : boolean {
		return this.currentQuestion !== null && this.currentAnswer !== null;
	}

	postAnswer(user: string, answer: string) : boolean {
		if (this._checkAnswer(answer)) {
			if (!this.participants[user]) {
				this.participants[user] = 0;
			}
			this.currentAnswer = null;
			this.currentQuestion = null;
			this.participants[user]++;
			return true;
		} else {
			return false;
		}
	}

	checkWinner() : string {
		for (let user in this.participants) {
			if (this.participants.hasOwnProperty(user)) {
				if (this.participants[user] === this.numberToWin) {
					return user;
				}
			}
		}
		return null;
	}

	stop() : void {
		
	}

	_loadQuestions() : Promise<any> {
		let promises : Promise<Question[]>[] = [];
		for(let question_url of nconf.get('question_urls')) {
			promises.push(Helpers.getJSONFromUrl(question_url));
		}
		return Promise.all(promises);
	}


	_fetchNextQuestion() : QuestionSimple {
		let nextQuestion = this.questions[0];
		this.questions.splice(0, 1);
		if (nextQuestion.question.startsWith('Which of') ||
			nextQuestion.question.startsWith('Which one') ||
			nextQuestion.question.includes('following') ||
			nextQuestion.question.includes('which of') ||
			nextQuestion.question.includes('which one') ||
			nextQuestion.question.includes('NOT')) {
			let answers = this._getShuffeledAnswers(nextQuestion.correct_answer, nextQuestion.incorrect_answers);
			nextQuestion.question = nextQuestion.question + ' ( ' + answers + ' )';
		}
		this.currentQuestion = nextQuestion.question;
		this.currentAnswer = nextQuestion.correct_answer;
		return {
			question: this.entities.decode(this.currentQuestion),
			answer: this.entities.decode(this.currentAnswer)
		};
	}

	_checkAnswer(answer: string) : boolean {
		if(this.currentAnswer === null || this.currentQuestion === null) {
			return false;
		}
		return answer.toLowerCase() === this.currentAnswer.toLowerCase();
	}

	_getShuffeledAnswers(correctAnswer: string, incorrectAnswers: string[]) : string {
		let answers = incorrectAnswers;
		answers.push(correctAnswer);
		return Helpers.printArray(shuffle(answers));
	}
}

module.exports = Quiz;