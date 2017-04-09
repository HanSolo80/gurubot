'use strict';

let nconf = require('nconf');
let Botkit = require('botkit');
let assert = require('assert');
import * as Bot from './bot';
import * as Quizbot from './quizbot';
import * as ChuckBot from './chuckbot';
import * as BoobBot from './boobbot';
import { Helpers } from './helpers';
import { QuestionSimple, Member, Channel, Difficulty } from './externals';

class Gurubot {

	controller: any;
	bot: any;
	users: Member[];
	channels: Channel[];
	token: string;
	suspended: boolean;
	activeBots: Bot[];
	commands: String[];

	/**
	 * @param {String} slackToken
	 */
	constructor(slackToken) {
		assert(slackToken, 'Slack Token is necessary obtain it at https://my.slack.com/services/new/bot and copy in configBot.json');
		var _this = this;
		this.activeBots = [];
		this.commands = [];
		this.token = slackToken;
		this.controller = Botkit.slackbot({
			debug: false
		});

		this.bot = this.controller.spawn(
			{
				token: this.token
			}
		)
		this.controller.on('rtm_close', function (bot, err) {
			if (!this.suspended) {
				_this._stopBots();
				_this._initBots();
				_this._startRTM();
			}
		});
		this._startRTM();
	}

	private _startRTM() {
		var _this = this;
		this.bot.startRTM(function (err, bot, payload) {
			if (err) {
				console.log('Failed to start RTM')
				return setTimeout(_this._startRTM, 60000);
			}
			console.log("RTM started!");
		});
	}

	public run(): void {
		let _this = this;

		this.activeBots.push(new Quizbot(this));
		this.activeBots.push(new ChuckBot(this));
		this.activeBots.push(new BoobBot(this));

		this._initBots();

		this.controller.on('hello', (bot, message) => {
			bot.api.users.list({}, (err, data) => {
				_this.users = data.members;
			});
			bot.api.channels.list({}, (err, data) => {
				_this.channels = data.channels;
			});
		});

		this.controller.hears('\\+commands', 'ambient', (bot, message) => {
			bot.reply(message, 'Commands: (+) ' + _this.commands);
		});

		this.controller.hears('', 'ambient', (bot, message) => {
			this.activeBots.forEach((activeBot) => {
				activeBot.handleWildcardMessage(message);
			});
		});

	}

	public shutDown(): Promise<any> {
		var _this = this;
		return new Promise(function (resolve: Function, reject: Function) {
			_this.suspended = true;
			_this._stopBots();
			_this.bot.closeRTM();
			resolve();
		});
	}

	public isCommandAllowed(command: string, message: any): boolean {
		try {
			let channelId = message.channel;
			let channelName = this.channels.find(x => x.id === channelId).name;
			return nconf.get('allowed_channels')[command].indexOf(channelName) !== -1;
		} catch (e) {

		}
	}

	private _stopBots(): void {
		this.commands = [];
		this.activeBots.forEach((bot: Bot) => {
			bot.destroy();
		});
	}

	private _initBots(): void {
		this.activeBots.forEach((bot: Bot) => {
			bot.init();
			this.commands = this.commands.concat(bot.getCommands());
		});
	}
}

namespace Gurubot {
	module.exports = Gurubot;
}

export = Gurubot;
