'use strict';

let nconf = require('nconf');
let Botkit = require('botkit');
let assert = require('assert');
let Quiz = require('./quiz');
//import {Quiz} from './quiz';
import {QuestionSimple, Member} from './externals';

export class Gurubot {

	controller: any;
	bot: any;
	quiz: Quiz;
	questionTimer: any;
	users: Member[];

	/**
	 * @param {String} slackToken Your Slack bot integration token (obtainable at https://my.slack.com/services/new/bot)
	 */
	constructor(slackToken) {
		assert(slackToken, 'Slack Token is necessary obtain it at https://my.slack.com/services/new/bot and copy in configBot.json');
		this.controller = Botkit.slackbot({
			debug: false,
		});

		this.bot = this.controller.spawn(
			{
				token: slackToken
			}
		).startRTM();
	}

	run() : void {
		let _this = this;

		this.controller.on('hello', (bot) => {
            bot.api.users.list({}, (err, data) => {
				_this.users = data.members;
			});
        });

		this.controller.hears('^\\+quiz\\s?(\\d*)$', 'ambient', (bot, message) => {
			if (!_this.quiz) {
				let numberToWin = 5;
				if(message.match[1]) {
					numberToWin = parseInt(message.match[1]);
				}
				_this.quiz = new Quiz(numberToWin, _this._askNextQuestion);
				bot.reply(message, 'Quiz started with ' + numberToWin + ' answers to win.');
				_this.quiz.run();
			} else {
				bot.reply(message, 'Quiz is already running!');
			}
		});

		this.controller.hears('\\+endquiz', 'ambient', (bot, message) => {
			if (_this.quiz) {
				_this.quiz = null;
				_this.quiz.stop();
				bot.reply(message, 'Quiz stopped');
			} else {
				bot.reply(message, 'No quiz running!');
			}
		});

		this.controller.hears('commands', 'direct_message,direct_mention,mention', (bot, message) => {
			bot.reply(message, '+quiz, +endquiz');
		});

		this.controller.hears('', 'ambient', (bot, message) => {
			if (_this.quiz && _this.quiz.isRunning() && _this.quiz.hasCurrentQuestion()) {
				let currentQuestion = _this.quiz.getCurrentQuestion();
				let correct = _this.quiz.postAnswer(_this.users[message.user].name, message.text);
				if (correct) {
					bot.reply(message, _this.users[message.user].name + ' got it correct: *' + currentQuestion.answer + '*');
					let winner = _this.quiz.checkWinner();
					if (winner) {
						_this.quiz = null;
						_this.quiz.stop();
					}
				}
			}
		});

		this.controller.on('bot_channel_join', (bot, message) => {
			bot.reply(message, 'Hello World');
		});
	}

	_askNextQuestion(bot: any, message: any) : void {
		this.quiz.askNextQuestion(bot, message).then((question: QuestionSimple) => {
			
		});
	}
}

module.exports = Gurubot;
