'use strict';

import {Question} from "./externals";

interface QuestionProvider {
	fetchQuestions(): Promise<Question[]> ;
}
declare let QuestionProvider: {
	new(numberOfQuestions: Number): QuestionProvider;
};

export = QuestionProvider;