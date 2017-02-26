'use strict';

let Botkit = require('botkit');
let assert = require('assert');
import Quiz from './quiz';

class Gurubot {

	controller: any;
	bot: any;
	quiz: Quiz;

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

	run() {
		let _this = this;
		this.controller.hears('!quiz (\\d+)', 'ambient', function (bot, message) {
			if (!_this.quiz) {
				_this.quiz = new Quiz(parseInt(message.match[1]));
				bot.reply(message, 'Quiz started');
				_this.quiz.run().then(() => {
					_this.quiz.getNextQuestion().then((question) => {
						bot.reply(message, question);
					});
				});
			} else {
				bot.reply(message, 'Quiz is already running!');
			}
		});

		this.controller.hears('', 'ambient', function (bot, message) {
			if (_this.quiz && _this.quiz.isRunning()) {
				bot.api.users.info({user: message.user}, function (err, data) {
					let correct = _this.quiz.postAnswer(data.user.name, message.text);
					if (correct) {
						bot.reply(message, 'Answer was correct.');
						let winner = _this.quiz.checkWinner();
						if (winner) {
							bot.reply(message, 'The winner is: ' + winner);
							_this.quiz = null;
						} else {
							setTimeout(() => {
								_this.quiz.getNextQuestion().then((question) => {
									bot.reply(message, question);
								});
							}, 2000);
						}
					}
				});
			}
		});
	}
}

module.exports = Gurubot;
