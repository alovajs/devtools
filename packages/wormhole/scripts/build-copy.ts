import { copy } from 'fs-extra';
import { resolve } from 'node:path';

copy(resolve(__dirname, '../src/templates'), resolve(__dirname, '../dist/templates'));
