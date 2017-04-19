'use strict';

let nconf = require('nconf');
let shuffle = require('knuth-shuffle').knuthShuffle;
let Sequelize = require('sequelize');

import * as QuestionProvider from './questionprovider';
import { Question, Difficulty } from './externals';

class MariaDBProvider implements QuestionProvider {

    sequelize;
    Category;
    Question;
    numberOfQuestions: number;
    difficulty: Difficulty;
    disabled: boolean;

    constructor(numberOfQuestions?: number, difficulty?: Difficulty) {
        try {
            this.numberOfQuestions = numberOfQuestions || 50;
            this.difficulty = difficulty;
            let connectOptions = {
                dialect: 'mariadb',
                pool: {
                    max: 5,
                    min: 0,
                    idle: 10000
                }
            };
            if (nconf.get('socketpath')) {
                connectOptions['dialectOptions'] = {
                    socketPath: nconf.get('socketpath')
                };
            }
            this.sequelize = new Sequelize(nconf.get('dburi'), connectOptions);
            this.Category = this.sequelize.define('category',
                {
                    name: {
                        type: Sequelize.STRING,
                        field: 'name'
                    }
                },
                {
                    freezeTableName: true,
                    timestamps: false
                });
            this.Question = this.sequelize.define('question',
                {
                    question: {
                        type: Sequelize.STRING,
                        field: 'question'
                    },
                    answer: {
                        type: Sequelize.STRING,
                        field: 'answer'
                    },
                    difficulty: {
                        type: Sequelize.INTEGER,
                        field: 'difficulty'
                    },
                    categoryName: {
                        type: Sequelize.STRING,
                        field: 'categoryname'
                    },
                    categoryId: {
                        type: Sequelize.INTEGER,
                        field: 'category_id'
                    }
                },
                {
                    freezeTableName: true,
                    timestamps: false
                });
            this.Category.hasMany(this.Question);
        } catch (e) {
            this.disabled = true;
        }

    }

    public fetchQuestions(): Promise<Question[]> {
        let _this = this;
        return new Promise(function (resolve: Function) {
            let result: Question[] = [];
            if (_this.disabled) {
                resolve(result);
                return;
            }
            let query = null;
            if (_this.difficulty == null) {
                let questionsEasy = Math.round(_this.numberOfQuestions / 5);
                let questionsMedium = Math.round(_this.numberOfQuestions * 3 / 5);
                let questionsHard = Math.round(_this.numberOfQuestions / 5);
                let promises: Promise<any[]>[] = [];
                promises.push(_this.Question.findAll({
                    where: {
                        difficulty: Difficulty.EASY
                    },
                    limit: questionsEasy,
                    order: [
                        Sequelize.fn('RAND'),
                    ]
                }));
                promises.push(_this.Question.findAll({
                    where: {
                        difficulty: Difficulty.MEDIUM
                    },
                    limit: questionsMedium,
                    order: [
                        Sequelize.fn('RAND'),
                    ]
                }));
                promises.push(_this.Question.findAll({
                    where: {
                        difficulty: Difficulty.HARD
                    },
                    limit: questionsHard,
                    order: [
                        Sequelize.fn('RAND'),
                    ]
                }));
                query = new Promise(function (resolve: Function) {
                    let _result = [];
                    Promise.all(promises).then((responses) => {
                        responses.map((response) => {
                            _result = _result.concat(response);
                        });
                        resolve(_result);
                    });
                });
            } else {
                query = _this.Question.findAll({
                    where: {
                        difficulty: _this.difficulty
                    },
                    limit: _this.numberOfQuestions,
                    order: [
                        Sequelize.fn('RAND'),
                    ]
                });
            }
            query.then((entities: any[]) => {
                entities.forEach((entity) => {
                    result.push({
                        category: entity.get('categoryName'),
                        type: '',
                        difficulty: entity.get('difficulty'),
                        question: entity.get('question'),
                        correct_answer: entity.get('answer'),
                        incorrect_answers: []
                    });
                });
                resolve(result);
            });
        });
    }

}

namespace MariaDBProvider {
    module.exports = MariaDBProvider;
}

export = MariaDBProvider;