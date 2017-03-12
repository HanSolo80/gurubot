'use strict'

let nconf = require('nconf');
let sprintf = require('sprintf-js').sprintf;
let request = require("request");

import * as Bot from './bot';
import * as Gurubot from './gurubot';

import { Helpers } from './helpers';

class BoobBot implements Bot {

    gurubot: Gurubot;

    constructor(gurubot: Gurubot) {
        this.gurubot = gurubot;
    }

    _randomInt(high) {
        return Math.floor(Math.random() * high);
    }

    init(): void {
        this.gurubot.controller.hears('\\+boob', 'ambient', (bot, message) => {
            var boobsUrl = sprintf(nconf.get('boob_url'), this._randomInt(5000));
            request.get(boobsUrl, function (err, response) {

                // post back
                var payload = {
                    text: "http://media.oboobs.ru/" + JSON.parse(response.body)[0].preview
                };

                bot.reply(message, payload.text.replace('_preview', ''));
            });
        });
    }

    destroy(): void {

    }

    handleWildcardMessage(message: any) {

    }

    getCommands(): String[] {
        return ['boob'];
    }
}

namespace BoobBot {
    module.exports = BoobBot;
}

export = BoobBot;