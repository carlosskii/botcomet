import Comet from './Comet.js';
import { config } from 'dotenv';

config();

const comet = new Comet();
comet.Start(process.env.TOKEN!);