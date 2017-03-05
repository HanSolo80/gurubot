'use strict';

let nconf = require('nconf');
let Botkit = require('botkit');
let assert = require('assert');
import * as Quiz from './quiz';
import { Helpers } from './helpers';
import { QuestionSimple, Member, Channel } from './externals';

class Gurubot {

	controller: any;
	bot: any;
	quiz: Quiz;
	questionTimer: any;
	users: Member[];
	channels: Channel[];
	token: string;

	/**
	 * @param {String} slackToken Your Slack bot integration token (obtainable at https://my.slack.com/services/new/bot)
	 */
	constructor(slackToken) {
		assert(slackToken, 'Slack Token is necessary obtain it at https://my.slack.com/services/new/bot and copy in configBot.json');
		this.token = slackToken;
		this.controller = Botkit.slackbot({
			debug: false
		});

		this.bot = this.controller.spawn(
			{
				token: this.token
			}
		).startRTM();
	}

	run(): void {
		let _this = this;
		this.controller.on('hello', (bot, message) => {
			bot.api.users.list({}, (err, data) => {
				_this.users = data.members;
			});
			bot.api.channels.list({}, (err, data) => {
				_this.channels = data.channels;
				data.channels.forEach((channel) => {
					//bot.say({ text: 'Hello World. Guru is ready to give you knowlegde. Type *+commands* for command listing', channel: channel.id });
				});
			});
		});

		this.controller.hears('^\\+quiz\\s?(\\d*)$', 'ambient', (bot, message) => {
			if (!this._isCommandAllowed('quiz', message)) {
				bot.reply(message, '*Quiz not allowed in channel!*');
				return;
			}
			if (!_this.quiz || !_this.quiz.isRunning()) {
				let numberToWin = 5;
				if (message.match[1]) {
					numberToWin = parseInt(message.match[1]);
				}
				_this.quiz = new Quiz(numberToWin, bot, message);
				bot.reply(message, 'Quiz started with ' + numberToWin + ' answers to win.');
				_this.quiz.run();
			} else {
				bot.reply(message, 'Quiz is already running!');
			}
		});

		this.controller.hears('\\+endquiz', 'ambient', (bot, message) => {
			if (!this._isCommandAllowed('quiz', message)) {
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

		this.controller.hears('\\+scorequiz', 'ambient', (bot, message) => {
			if (!this._isCommandAllowed('quiz', message)) {
				return;
			}
			if (_this.quiz) {
				if (_this.quiz.isRunning()) {
					bot.reply(message, _this.quiz.printStandings());
				}
			}
		});

		this.controller.hears('\\+chuck', 'ambient', (bot, message) => {
			Helpers.getJSONFromUrl(nconf.get('norrisapi_url')).then((fact) => {
				bot.reply(message, fact.value.joke);
			});
		});

		this.controller.hears('\\+commands', 'ambient', (bot, message) => {
			bot.reply(message, 'Commands: (+) quiz [numberToWin], endquiz, scorequiz, chuck');
		});

		this.controller.hears('', 'ambient', (bot, message) => {
			if (_this.quiz) {
				if (_this.quiz.isRunning()) {
					if (message.channel === _this.quiz.message.channel) {
						_this.quiz.postAnswer(_this.users.find(user => user.id === message.user).name, message.text);
					}
				} else {
					_this.quiz = null;
				}
			}
		});
	}

	shutDown(): Promise<any> {
		var _this = this;
		return new Promise(function (resolve: Function, reject: Function) {
			if (_this.quiz && _this.quiz.isRunning()) {
				_this.quiz.stop();
				_this.quiz = null;
			}
			_this.channels.forEach((channel) => {
				//_this.bot.say({ text: 'Guru is signing off. Until next time', channel: channel.id });
			});
			setTimeout(function () {
				resolve();
			}, 2000);
		});
	}

	_isCommandAllowed(command: string, message: any): boolean {
		let channelId = message.channel;
		let channelName = this.channels.find(x => x.id === channelId).name;
		return nconf.get('allowed_channels')[command].indexOf(channelName) !== -1;
	}
}

namespace Gurubot {
	module.exports = Gurubot;
}

export = Gurubot;