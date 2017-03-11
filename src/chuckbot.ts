'use strict'

let nconf = require('nconf');

import * as Bot from './bot';
import * as Gurubot from './gurubot';

import { Helpers } from './helpers';

class ChuckBot implements Bot {

    gurubot: Gurubot;

    constructor(gurubot: Gurubot) {
        this.gurubot = gurubot;
    }

    init(controller: any): void {
        controller.hears('\\+chuck', 'ambient', (bot, message) => {
            Helpers.getJSONFromUrl(nconf.get('norrisapi_url')).then((fact) => {
                bot.reply(message, fact.value.joke);
            });
        });
    }

    destroy(): void {

    }

    handleWildcardMessage(message: any) {

    }

    getCommands(): String[] {
        return ['chuck'];
    }
}

namespace ChuckBot {
    module.exports = ChuckBot;
}

export = ChuckBot;