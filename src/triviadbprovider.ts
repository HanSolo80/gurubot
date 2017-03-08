'use strict';

let nconf = require('nconf');
let sprintf = require('sprintf-js').sprintf;
let shuffle = require('knuth-shuffle').knuthShuffle;

import * as QuestionProvider from './questionprovider';
import { Question, Difficulty } from './externals';
import { Helpers } from './helpers';

class TriviaDBProvider implements QuestionProvider {

    numberOfQuestions: number;
    difficulty: Difficulty;

    constructor(numberOfQuestions?: number, difficulty?: Difficulty) {
        this.numberOfQuestions = numberOfQuestions || 50;
        this.difficulty = difficulty;
    }

    fetchQuestions(): Promise<Question[]> {
        let _this = this;
        return new Promise(function (resolve: Function) {
            _this._loadQuestions().then((responses) => {
                resolve(_this._processQuestionResponses(responses));
            });
        });
    }

    _loadQuestions(): Promise<any> {
        if (this.difficulty) {
            return Helpers.getQuestionsFromURL(sprintf(nconf.get('question_url'), this.numberOfQuestions, Difficulty[this.difficulty].toLowerCase()));
        } else {
            let promises: Promise<Question[]>[] = [];
            let questionsEasy = Math.round(this.numberOfQuestions * 1 / 5);
            let questionsMedium = Math.round(this.numberOfQuestions * 3 / 5);
            let questionsHard = Math.round(this.numberOfQuestions * 1 / 5);
            promises.push(Helpers.getQuestionsFromURL(sprintf(nconf.get('question_url'), questionsEasy, Difficulty[Difficulty.EASY].toLowerCase())));
            promises.push(Helpers.getQuestionsFromURL(sprintf(nconf.get('question_url'), questionsMedium, Difficulty[Difficulty.MEDIUM].toLowerCase())));
            promises.push(Helpers.getQuestionsFromURL(sprintf(nconf.get('question_url'), questionsHard, Difficulty[Difficulty.HARD].toLowerCase())));
            return Promise.all(promises);
        }
    }

    _processQuestionResponses(responses: Question[][]): Question[] {
        let result: Question[] = [];
        responses.map((response) => {
            result = result.concat(response);
        });
        return result;
    }
}
namespace TriviaDBProvider {
    module.exports = TriviaDBProvider;
}

export = TriviaDBProvider;