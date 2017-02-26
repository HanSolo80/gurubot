let Gurubot = require('./Gurubot');
let nconf = require('nconf');

nconf.add('config', {type: 'file', file: './configBot.json'});

try {
	let tokenSlack = process.env.TOKEN_SLACK || nconf.get('tokenslack');

	this.gurubot = new Gurubot(tokenSlack).run();
} catch (error) {
	console.log('Bot failed' + error);
}
