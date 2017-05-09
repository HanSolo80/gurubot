'use strict'

require('console-stamp')(console);

import Gurubot from './gurubot';
let nconf = require('nconf');

nconf.add('config', { type: 'file', file: './configBot.json' });
nconf.env();
let gurubot: Gurubot = null;

try {
	let tokenSlack = nconf.get('tokenslack');
	gurubot = new Gurubot(tokenSlack);
	gurubot.run();
	process.on('SIGINT', function () {
		gurubot.shutDown().then(function () {
			process.exit(0);
		});
	});
} catch (error) {
	if(gurubot != null) {
		gurubot.shutDown();
	}
	console.log('Bot failed' + error);
}
