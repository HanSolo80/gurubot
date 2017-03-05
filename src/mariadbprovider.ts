'use strict';

let nconf = require('nconf');
let shuffle = require('knuth-shuffle').knuthShuffle;
let Sequelize = require('sequelize');

import * as QuestionProvider from './questionprovider';
import { Question } from './externals';

class MariaDBProvider implements QuestionProvider {

    sequelize;
    Category;
    Question;

    constructor() {
        this.sequelize = new Sequelize(nconf.get('dburi'),
            {
                dialect: 'mariadb',
                pool: {
                    max: 5,
                    min: 0,
                    idle: 10000
                }
            }
        );
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
    }

    fetchQuestions(): Promise<Question[]> {
        var _this = this;
        return new Promise(function (resolve: Function, reject: Function) {
            let result: Question[] = [];
            _this.Question.findAll({
                limit: 40,
                order: [
                    Sequelize.fn('RAND'),
                ]
            }).then((entities: any[]) => {
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