'use strict';

import { Question } from './externals';

interface QuestionProvider {
    fetchQuestions() : Promise<Question[]> ;
}

namespace QuestionProvider {
	module.exports = QuestionProvider;
}

export = QuestionProvider;