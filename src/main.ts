'use strict'

import * as Gurubot from './gurubot';
let nconf = require('nconf');

nconf.add('config', { type: 'file', file: './configBot.json' });

try {
	let tokenSlack = process.env.Gurubot || nconf.get('tokenslack');
	let gurubot : Gurubot = new Gurubot(tokenSlack);
	gurubot.run();
	process.on('SIGINT', function () {
		gurubot.shutDown(function () {
			process.exit(0);
		});
	});
} catch (error) {
	console.log('Bot failed' + error);
}
