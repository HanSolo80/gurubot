'use strict';

let nconf = require('nconf');
let Helpers = require('./helpers.js');
let Entities = require('html-entities').AllHtmlEntities;
let shuffle = require('knuth-shuffle').knuthShuffle;

class Quiz {
	constructor(number) {
		this.numberToWin = number;
		this.questionsAnswered = 0;
		this.participants = {};
		this.questions = null;
		this.currentQuestion = null;
		this.currentAnswer = null;
		this.entities = new Entities();
	}

	run() {
		return new Promise((resolve, reject) => {
			Helpers.getJSONFromUrl(nconf.get('question_url')).then((data) => {
				this.questions = data;
				console.log(data);
				resolve();
			}).catch((err) => reject(err));
		});
	}

	isRunning() {
		return this.questionsAnswered < this.numberToWin;
	}

	getNextQuestion() {
		if (this.questions.length == 0) {
			return new Promise((resolve) => {
				Helpers.getJSONFromUrl(nconf.get('question_url')).then((data) => {
					this.questions = data;
					console.log(data);
					console.log('new data fetched');
					resolve(this._fetchNextQuestion());
				});
			});
		} else {
			return new Promise((resolve) => {
				resolve(this._fetchNextQuestion());
			});
		}
	}

	postAnswer(user, answer) {
		if (this._checkAnswer(answer)) {
			if (!this.participants[user]) {
				this.participants[user] = 0;
			}
			this.participants[user]++;
			return true;
		} else {
			return false;
		}
	}

	checkWinner() {
		for (let user in this.participants) {
			if (this.participants.hasOwnProperty(user)) {
				if (this.participants[user] === this.numberToWin) {
					return user;
				}
			}
		}
		return null;
	}


	_fetchNextQuestion() {
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
		return this.entities.decode(this.currentQuestion);
	}

	_checkAnswer(answer) {
		return answer.toLowerCase() === this.currentAnswer.toLowerCase();
	}

	_getShuffeledAnswers(correctAnswer, incorrectAnswers) {
		let answers = incorrectAnswers;
		answers.push(correctAnswer);
		return Helpers.printArray(shuffle(answers));
	}
}

module.exports = Quiz;