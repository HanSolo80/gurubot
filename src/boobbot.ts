import fetch from 'node-fetch';
import Bot from './bot';
import {Helpers} from './utils/helpers';
import Gurubot from './gurubot';

let nconf = require('nconf');
let sprintf = require('sprintf-js').sprintf;

export default class BoobBot implements Bot {

    constructor(gurubot: Gurubot) {
        gurubot.app.message('+boob', async ({ message, say }) => {
            if(!gurubot.isCommandAllowed('boob', message)) {
                return;
            }
            const boobsUrl = sprintf(nconf.get('boob_url'), Helpers.randomInt(5000));
            const response = await fetch(boobsUrl);
            const boob = await response.text();
            const payload = {
                text: "http://media.oboobs.ru/" + JSON.parse(boob)[0].preview
            };
            await say(payload.text.replace('_preview', ''));
        });
    }

    public init(): void {
        
    }

    public destroy(): void {

    }

    public handleWildcardMessage(message: any) {

    }

    public getCommands(): string[] {
        return ['boob'];
    }
}