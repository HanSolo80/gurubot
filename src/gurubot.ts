import {App, KnownEventFromType, LogLevel} from '@slack/bolt';
import {Channel} from '@slack/web-api/dist/response/ChannelsListResponse';

import Bot from './bot';
import ChuckBot from './bots/chuckbot';
import {Member} from './externals';
import BoobBot from './boobbot';

let nconf = require('nconf');

export default class Gurubot {

	app: App;
	users: Member[];
	channels:  Channel[] | undefined;
	activeBots: Bot[];
	commands: string[];


	constructor() {
		let _this = this;
		this.users = [];
		this.channels = [];
		this.activeBots = [];
		this.commands = [];

		this.app = new App({
			token: process.env.SLACK_BOT_TOKEN,
			signingSecret: process.env.SLACK_SIGNING_SECRET,
			appToken: process.env.SLACK_APP_TOKEN,
			logLevel: LogLevel.ERROR,
			socketMode: true,
		});
	}

	public async run(): Promise<any> {
		let _this = this;

		this.activeBots.push(new ChuckBot(this));
		this.activeBots.push(new BoobBot(this));
		this._initBots();

		this.app.message('+commands', async ({ message, say }) => {
			// say() sends a message to the channel where the event was triggered
			console.log(message);
			await say('Commands: (+) ' + this.commands.filter(x => this.isCommandAllowed(x, message)));
		});

		await this.app.start(Number(process.env.PORT) || 3000);

		const conversations = await this.app.client.conversations.list();
		this.channels = conversations.channels;

		console.log('⚡️ Bolt app is running!');

	}

	public async shutDown(): Promise<any> {
		let _this = this;
		return _this._stopBots();
	}

	public isCommandAllowed(command: string, message:  KnownEventFromType<"message">): boolean {
		try {
			const channelId = message.channel;
			const channelName = this.channels?.find(x => x.id === channelId)?.name;
			const allowedChannels = nconf.get('allowed_channels')[command];
			return allowedChannels?.indexOf(channelName) !== -1;
		} catch (e) {
			console.error(e);
		}
		return false;
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
