'use strict'

let nconf = require('nconf');
let Entities = require('html-entities').AllHtmlEntities;

import * as Bot from './bot';
import * as Gurubot from './gurubot';

import { Helpers } from './helpers';

class ChuckBot implements Bot {

    gurubot: Gurubot;
    entities: any;

    constructor(gurubot: Gurubot) {
        this.gurubot = gurubot;
        this.entities = new Entities();
    }

    public init(): void {
        this.gurubot.controller.hears('\\+chuck', 'ambient', (bot, message) => {
            Helpers.getJSONFromUrl(nconf.get('norrisapi_url')).then((fact) => {
                bot.reply(message, this.entities.decode(fact.value.joke));
            });
        });
    }

    public destroy(): void {

    }

    public handleWildcardMessage(message: any) {

    }

    public getCommands(): String[] {
        return ['chuck'];
    }
}

namespace ChuckBot {
    module.exports = ChuckBot;
}

export = ChuckBot;