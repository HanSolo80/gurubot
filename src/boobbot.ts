'use strict'

let nconf = require('nconf');
let sprintf = require('sprintf-js').sprintf;
let request = require("request");

import * as Bot from './bot';
import * as Gurubot from './gurubot';

class BoobBot implements Bot {

    gurubot: Gurubot;

    constructor(gurubot: Gurubot) {
        this.gurubot = gurubot;
    }

    public init(): void {
        this.gurubot.controller.hears('\\+boob', 'ambient', (bot, message) => {
            if (!this.gurubot.isCommandAllowed('boob', message)) {
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

namespace BoobBot {
    module.exports = BoobBot;
}

export = BoobBot;