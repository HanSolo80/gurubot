import { resolve } from 'path';
import { config } from 'dotenv';

const nconf = require('nconf');

const pathToEnv = '../../.env.slack';
const pathToConfig = '../../configBot.json';
config({ path: resolve(__dirname, pathToEnv) });
nconf.add('config', { type: 'file', file: resolve(__dirname, pathToConfig) });