import Gurubot from './gurubot';

interface Bot {
	init(): void;
    destroy(): void;
    getCommands() : string[];
    handleWildcardMessage(message: any) : void;
}
declare let Bot: {
	new (gurubot: Gurubot): Bot;
};

export default Bot;