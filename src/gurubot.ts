'use strict';


import {SlackAdapter} from 'botbuilder-adapter-slack';

let nconf = require('nconf');
let assert = require('assert');
import {Botkit, BotWorker} from 'botkit';
import Bot from './bot';
import Quizbot from './quizbot';
import ChuckBot from './chuckbot';
import BoobBot from './boobbot';
import { Member, Channel } from './externals';

export default class Gurubot {

	controller: Botkit;
	bot: BotWorker;
	users: Member[];
	channels: Channel[];
	token: string;
	activeBots: Bot[];
	commands: String[];

	/**
	 * @param {String} slackToken
	 */
	constructor(slackToken: string) {
		assert(slackToken, 'Slack Token is necessary obtain it at https://my.slack.com/services/new/bot and copy in configBot.json');
		let _this = this;
		this.activeBots = [];
		this.commands = [];
		this.token = slackToken;
		const adapter: SlackAdapter = new SlackAdapter({
			botToken: "",
			clientId: "",
			clientSecret: "",
			clientSigningSecret: "",
			enable_incomplete: false,
			getBotUserByTeam: function (p1: string) {
				return undefined;
			},
			getTokenForTeam: function (p1: string) {
				return undefined;
			},
			redirectUri: "",
			scopes: [],
			verificationToken: ""
		});
		this.controller = new Botkit({
			adapterConfig: {},
			dialogStateProperty: "",
			disable_console: false,
			disable_webserver: false,
			storage: undefined,
			webhook_uri: "",
			webserver: undefined,
			webserver_middlewares: [],
			adapter: adapter});

		async this.controller.spawn(
			{
				token: this.token
			}
		).then((bot => {
			this.bot = bot;
		}));
		this._startRTM();
	}

	private _startRTM() {
		let _this = this;
	}

	public run(): void {
		let _this = this;

		this.activeBots.push(new Quizbot(this));
		this.activeBots.push(new ChuckBot(this));
		this.activeBots.push(new BoobBot(this));

		this._initBots();

		this.controller.hears('\\+commands', 'ambient', async (bot, message) => {
			bot.reply(message, 'Commands: (+) ' + _this.commands);
		});

		this.controller.hears('', 'ambient', async (bot, message) => {
			this.activeBots.forEach((activeBot) => {
				activeBot.handleWildcardMessage(message);
			});
		});

	}

	public shutDown(): Promise<any> {
		let _this = this;
		return new Promise(function (resolve: Function) {
			_this._stopBots();
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
