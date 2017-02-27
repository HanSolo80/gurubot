'use strict'

let Gurubot = require('./gurubot');
let nconf = require('nconf');

nconf.add('config', {type: 'file', file: './configBot.json'});

try {
	let tokenSlack = process.env.Gurubot || nconf.get('tokenslack');
	this.gurubot = new Gurubot(tokenSlack).run();
} catch (error) {
	console.log('Bot failed' + error);
}
