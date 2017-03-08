'use strict';

import { Question, Difficulty } from "./externals";

interface QuestionProvider {
	fetchQuestions(): Promise<Question[]>;
}
declare let QuestionProvider: {
	new (numberOfQuestions?: number, difficulty?: Difficulty): QuestionProvider;
};

export = QuestionProvider;