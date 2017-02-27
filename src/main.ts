'use strict'

let Gurubot = require('./gurubot');
let nconf = require('nconf');

nconf.add('config', { type: 'file', file: './configBot.json' });

try {
	let tokenSlack = process.env.Gurubot || nconf.get('tokenslack');
	this.gurubot = new Gurubot(tokenSlack).run();
	process.on('SIGTERM', function () {
		this.gurubot.shutDown(function () {
			process.exit(0);
		});
	});
} catch (error) {
	console.log('Bot failed' + error);
}
