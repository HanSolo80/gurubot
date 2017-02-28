'use strict';

let nconf = require('nconf');
let Botkit = require('botkit');
let assert = require('assert');
let Quiz = require('./quiz');
//import {Quiz} from './quiz';
import { QuestionSimple, Member, Channel } from './externals';

export class Gurubot {

	controller: any;
	bot: any;
	quiz: Quiz;
	questionTimer: any;
	users: Member[];
	channels: Channel[];

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

	run(): void {
		let _this = this;

		this.controller.on('hello', (bot, message) => {
			bot.api.users.list({}, (err, data) => {
				_this.users = data.members;
			});
			bot.api.channels.list({}, (err, data) => {
				_this.channels = data.channels;
				data.channels.forEach((channel) => {
					bot.say({ text: 'Hello World. Guru is ready to give you knowlegde. Type *+commands* for command listing', channel: channel.id });
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

		this.controller.hears('\\+commands', 'ambient', (bot, message) => {
			bot.reply(message, 'Commands: +quiz [numberToWin], +endquiz');
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

		this.controller.on('bot_channel_join', (bot, message) => {
			bot.reply(message, 'Hello World');
		});
	}

	shutDown(callback: Function) {
		var _this = this;
		this.bot.api.channels.list({}, (err, data) => {
			data.channels.forEach((channel) => {
				_this.bot.say({ text: 'Guru is signing off. Until next time', channel: channel.id });
			});
		});
		callback();
	}

	_isCommandAllowed(command: string, message: any): boolean {
		let channelId = message.channel;
		let channelName = this.channels.find(x => x.id === channelId).name;
		return nconf.get('allowed_channels')[command].indexOf(channelName) !== -1;
	}
}

module.exports = Gurubot;
