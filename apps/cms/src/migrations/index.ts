import * as migration_20261112_112756_initial from './20261112_112756_initial';
import * as migration_20261112_113608_content from './20261112_113608_content';

export const migrations = [
  {
    up: migration_20261112_112756_initial.up,
    down: migration_20261112_112756_initial.down,
    name: '20261112_112756_initial',
  },
  {
    up: migration_20261112_113608_content.up,
    down: migration_20261112_113608_content.down,
    name: '20261112_113608_content'
  },
];
