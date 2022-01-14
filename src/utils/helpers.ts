import fetch from 'node-fetch';
import { Question } from '../externals';

class Helpers {
    public static async getJSONFromUrl(url: string): Promise<any> {
        const response = await fetch(url);
        return await response.json();
    }

    public static getQuestionsFromURL(url: string): Promise<Question[]> {
        return new Promise(function (resolve: Function) {
            Helpers.getJSONFromUrl(url).then((data) => {
                resolve(data.results);
            });
        });
    }

    public static printArray(array: string[]) {
        let out = '';
        for (let i = 0; i < array.length; i++) {
            out += array[i];
            if (i < array.length - 1) {
                out += ', ';
            }
        }
        return out;
    }

    public static randomInt(high: number) {
        return Math.floor(Math.random() * high);
    }
}

export { Helpers };