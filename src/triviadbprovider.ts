'use strict';

let nconf = require('nconf');
let shuffle = require('knuth-shuffle').knuthShuffle;

import * as QuestionProvider from './questionprovider';
import { Question } from './externals';
import { Helpers } from './helpers';

class TriviaDBProvider implements QuestionProvider {

    fetchQuestions(): Promise<Question[]> {
        var _this = this;
        return new Promise(function (resolve: Function, reject: Function) {
            _this._loadQuestions().then((responses) => {
                resolve(_this._processQuestionResponses(responses));
            });
        });
    }

    _loadQuestions(): Promise<any> {
        let promises: Promise<Question[]>[] = [];
        for (let question_url of nconf.get('question_urls')) {
            promises.push(Helpers.getQuestionsFromURL(question_url));
        }
        return Promise.all(promises);
    }

    _processQuestionResponses(responses: Question[][]): Question[] {
        let result: Question[] = [];
        responses.map((response) => {
            result = result.concat(response);
        });
        result = shuffle(result);
        result = result.filter((question) => {
            return question.correct_answer.toLowerCase() !== 'false' && question.correct_answer.toLowerCase() !== 'true';
        });
        return result;
    }
}

namespace TriviaDBProvider {
    module.exports = TriviaDBProvider;
}

export = TriviaDBProvider;