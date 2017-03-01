'use strict';

let request = require('request');
import { Question } from './externals';

class Helpers {
	static getJSONFromUrl(url: string): Promise<any> {
		return new Promise(function (resolve: Function, reject: Function) {
			request.get({
				url: url,
				json: true,
				headers: { 'User-Agent': 'request' }
			}, (err, res, data) => {
				if (err) {
					console.log('Error:', err);
					reject('Error:', err);
				} else if (res.statusCode !== 200) {
					console.log('Status:', res.statusCode);
					reject('Status:', res.statusCode);
				} else {
					resolve(data);
				}
			});
		});
	}

	static getQuestionsFromURL(url: string): Promise<Question[]> {
		return new Promise(function (resolve: Function, reject: Function) {
			Helpers.getJSONFromUrl(url).then((data) => {
				resolve(data.results);
			});
		});
	}

	static printArray(array: string[]) {
		let out = '';
		for (let i = 0; i < array.length; i++) {
			out += array[i];
			if (i < array.length - 1) {
				out += ', ';
			}
		}
		return out;
	}
}

export { Helpers };