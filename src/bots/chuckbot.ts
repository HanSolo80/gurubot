let nconf = require('nconf');
let entities = require('html-entities');

import Bot from '../bot';

import { Helpers } from '../utils/helpers';
import Gurubot from '../gurubot';

export default class ChuckBot implements Bot {


    constructor(gurubot: Gurubot) {
        gurubot.app.message('+chuck', async ({ message, say }) => {
            // say() sends a message to the channel where the event was triggered
            const fact = await  Helpers.getJSONFromUrl(nconf.get('norrisapi_url'));
            await say(entities.decode(fact.value.joke));
        });
    }

    public init(): void {
        
    }

    public destroy(): void {

    }

    public handleWildcardMessage(message: any) {

    }

    public getCommands(): string[] {
        return ['chuck'];
    }
}