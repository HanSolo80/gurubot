'use strict'

let nconf = require('nconf');
let sprintf = require('sprintf-js').sprintf;
let request = require("request");

import Bot from './bot';
import Gurubot from './gurubot';

export default class BoobBot implements Bot {

    gurubot: Gurubot;

    constructor(gurubot: Gurubot) {
        let _this = this;
        this.gurubot = gurubot;
        gurubot.controller.hears('\\+boob', 'ambient', async (bot, message) => {
            if (!_this.gurubot.isCommandAllowed('boob', message)) {
				return;
			}
            let boobsUrl = sprintf(nconf.get('boob_url'), this._randomInt(5000));
            request.get(boobsUrl, function (err, response) {

                let payload = {
                    text: "http://media.oboobs.ru/" + JSON.parse(response.body)[0].preview
                };

                bot.reply(message, payload.text.replace('_preview', ''));
            });
        });
    }

    public init(): void {
        
    }

    public destroy(): void {

    }

    public handleWildcardMessage(message: any) {

    }

    public getCommands(): String[] {
        return ['boob'];
    }

    private _randomInt(high) {
        return Math.floor(Math.random() * high);
    }
}