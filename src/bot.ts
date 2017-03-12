'use strict';

import * as Gurubot from './gurubot';

interface Bot {
	init(): void;
    destroy(): void;
    getCommands() : String[];
    handleWildcardMessage(message: any) : void;
}
declare let Bot: {
	new (gurubot: Gurubot): Bot;
};

export = Bot;