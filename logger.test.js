import assert from 'node:assert/strict';
import {
  beforeEach,
  describe,
  mock,
  test,
} from 'node:test';

import chalk from 'chalk';

import Logger from './logger.js';

const testDate = Date.UTC(2023, 10, 1, 17, 10, 0);
const datePrefix = `[2023-11-01 ${new Date(testDate).getHours()}:10:00.000]`;

Date.now = mock.fn(() => testDate);

function outputFactory() {
  let output = '';
  return [
    () => output,
    (value) => { output += value; },
  ];
}

function resetConfiguration() {
  process.env.LOG_LEVEL = 'TRACE';
  Logger.configure({
    colors: {
      debug: chalk.gray,
      trace: chalk.grey,
      info: chalk.cyan,
      warn: chalk.yellow,
      error: chalk.redBright,
    },
    dateFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
    trim: true,
    ignoreEmpty: true,
    output: null,
  });
}

let getOutput;
let output;
beforeEach(() => {
  resetConfiguration();
  [getOutput, output] = outputFactory();
});

describe('Exports', () => {
  test('logger.js exports a function', () => {
    assert.equal(typeof Logger, 'function');
  });
  test('Logger.logger is an alias of Logger', () => {
    assert.deepEqual(Logger, Logger.logger);
  });
  test('Logger.default is an alias of Logger', () => {
    assert.deepEqual(Logger, Logger.default);
  });
});

describe('Factory', () => {
  test('Logger returns an object', () => {
    const logger = Logger('test');
    assert.equal(typeof logger, 'object');
  });
});

describe('Basic logging', () => {
  test('It can log a trace', () => {
    const logger = Logger('test', { output });
    logger.trace('Hello Jean Luc!');
    assert.equal(getOutput(), `${chalk.grey(`${datePrefix}[trace][test] Hello Jean Luc!`)}\n`);
  });
  test('It can log an info', () => {
    const logger = Logger('test', { output });
    logger.info('Hello Janeway!');
    assert.equal(getOutput(), `${chalk.cyan(`${datePrefix}[info][test] Hello Janeway!`)}\n`);
  });
  test('It can log a warning', () => {
    const logger = Logger('test', { output });
    logger.warn('Hello Kirk!');
    assert.equal(getOutput(), `${chalk.yellow(`${datePrefix}[warn][test] Hello Kirk!`)}\n`);
  });
  test('It can log an error', () => {
    const logger = Logger('test', { output });
    logger.error('The tea is too hot!');
    assert.equal(getOutput(), `${chalk.redBright(`${datePrefix}[error][test] The tea is too hot!`)}\n`);
  });
  test('Each lines are trimmed', () => {
    const logger = Logger('test', { output });
    logger.info('  I\'m on my way. ');
    assert.equal(getOutput(), `${chalk.cyan(`${datePrefix}[info][test] I'm on my way.`)}\n`);
  });
  test('Empty lines are ignored', () => {
    const logger = Logger('test', { output });
    logger.info('  ');
    assert.equal(getOutput(), '');
  });
});

describe('Configure options', () => {
  test('The date can be disabled', () => {
    Logger.configure({ dateFormat: '' });
    const logger = Logger('test', { output });
    logger.warn('Distortion 9 cannot be maintained!');
    assert.equal(getOutput(), `${chalk.yellow('[warn][test] Distortion 9 cannot be maintained!')}\n`);
  });
  test('Colors can be disabled', () => {
    Logger.configure({ colors: false });
    const logger = Logger('test', { output });
    logger.error('Data cannot laught!');
    assert.equal(getOutput(), `${datePrefix}[error][test] Data cannot laught!\n`);
  });
  test('Trim can be disabled', () => {
    Logger.configure({ trim: false });
    const logger = Logger('test', { output });
    logger.trace('  Data, report!  ');
    assert.equal(getOutput(), `${chalk.grey(`${datePrefix}[trace][test]   Data, report!  `)}\n`);
  });
  test('White lines can be kept', () => {
    Logger.configure({ ignoreEmpty: false });
    const logger = Logger('test', { output });
    logger.trace('');
    assert.equal(getOutput(), `${chalk.grey(`${datePrefix}[trace][test] `)}\n`);
  });
});

describe('Instances options', () => {
  test('Instances can receive a configuration', () => {
    const logger = Logger('customDate', { output, dateFormat: 'YYYY-MM-DD' });
    logger.warn('You will be assimilated!');
    assert.equal(getOutput(), `${chalk.yellow('[2023-11-01][warn][customDate] You will be assimilated!')}\n`);
  });
  test('The configuration can be defined without context', () => {
    const logger = Logger({ output, dateFormat: 'YYYY-MM-DD' });
    logger.info('Q!!');
    assert.equal(getOutput(), `${chalk.cyan('[2023-11-01][info][logger.test.js] Q!!')}\n`);
  });
});

describe('Context', () => {
  test('The context can be omitted to get the file path', () => {
    const logger = Logger({ output });
    logger.info('');
    assert.equal(getOutput(), `${chalk.cyan(`${datePrefix}[info][logger.test.js] `)}\n`);
  });
});

describe('Object logging', () => {
  test('Errors can be logged', () => {
    const logger = Logger('error', { output });
    logger.error(new Error('The distortion cannot be ignited.'));
    const lines = getOutput().split('\n');
    assert.equal(lines[0], `${chalk.redBright(`${datePrefix}[error][error] The distortion cannot be ignited.`)}`);
    assert.equal(lines[1], `${chalk.redBright(`${datePrefix}[error][error] Stack trace:`)}`);
    assert(lines.length > 3);
  });
  test('Objects can be logged', () => {
    const logger = Logger('ships', { output });
    logger.info({ enterprise: 'Picard', voyager: 'Janeway' });
    const lines = getOutput().split('\n');
    assert.equal(lines[0], `${chalk.cyan(`${datePrefix}[info][ships] {`)}`);
    assert.equal(lines[1], `${chalk.cyan(`${datePrefix}[info][ships]   "enterprise": "Picard",`)}`);
    assert.equal(lines[2], `${chalk.cyan(`${datePrefix}[info][ships]   "voyager": "Janeway"`)}`);
    assert.equal(lines[3], `${chalk.cyan(`${datePrefix}[info][ships] }`)}`);
  });
});

describe('Log levels', () => {
  describe('From environment', () => {
    test('TRACE: All logs are outputed', () => {
      process.env.LOG_LEVEL = 'TRACE';
      const logger = Logger('for-trace', { output, colors: null, dateFormat: null });
      logger.trace('Trace log');
      logger.info('Info log');
      logger.warn('Warn log');
      logger.error('Error log');
      assert.equal(
        getOutput(),
        '[trace][for-trace] Trace log\n'
        + '[info][for-trace] Info log\n'
        + '[warn][for-trace] Warn log\n'
        + '[error][for-trace] Error log\n',
      );
    });
    test('INFO: TRACE logs are ignored', () => {
      process.env.LOG_LEVEL = 'INFO';
      const logger = Logger('for-trace', { output, colors: null, dateFormat: null });
      logger.trace('Trace log');
      logger.info('Info log');
      logger.warn('Warn log');
      logger.error('Error log');
      assert.equal(
        getOutput(),
        '[info][for-trace] Info log\n'
        + '[warn][for-trace] Warn log\n'
        + '[error][for-trace] Error log\n',
      );
    });
    test('WARN: TRACE and INFO logs are ignored', () => {
      process.env.LOG_LEVEL = 'WARN';
      const logger = Logger('for-trace', { output, colors: null, dateFormat: null });
      logger.trace('Trace log');
      logger.info('Info log');
      logger.warn('Warn log');
      logger.error('Error log');
      assert.equal(
        getOutput(),
        '[warn][for-trace] Warn log\n'
        + '[error][for-trace] Error log\n',
      );
    });
    test('ERROR: TRACE, INFO and WARN logs are ignored', () => {
      process.env.LOG_LEVEL = 'ERROR';
      const logger = Logger('for-trace', { output, colors: null, dateFormat: null });
      logger.trace('Trace log');
      logger.info('Info log');
      logger.warn('Warn log');
      logger.error('Error log');
      assert.equal(
        getOutput(),
        '[error][for-trace] Error log\n',
      );
    });
  });
  describe('From options', () => {
    test('TRACE: All logs are outputed', () => {
      const logger = Logger('for-trace', {
        output, colors: null, dateFormat: null, logLevel: 'TRACE',
      });
      logger.trace('Trace log');
      logger.info('Info log');
      logger.warn('Warn log');
      logger.error('Error log');
      assert.equal(
        getOutput(),
        '[trace][for-trace] Trace log\n'
        + '[info][for-trace] Info log\n'
        + '[warn][for-trace] Warn log\n'
        + '[error][for-trace] Error log\n',
      );
    });
    test('INFO: TRACE logs are ignored', () => {
      const logger = Logger('for-trace', {
        output, colors: null, dateFormat: null, logLevel: 'INFO',
      });
      logger.trace('Trace log');
      logger.info('Info log');
      logger.warn('Warn log');
      logger.error('Error log');
      assert.equal(
        getOutput(),
        '[info][for-trace] Info log\n'
        + '[warn][for-trace] Warn log\n'
        + '[error][for-trace] Error log\n',
      );
    });
    test('WARN: TRACE and INFO logs are ignored', () => {
      const logger = Logger('for-trace', {
        output, colors: null, dateFormat: null, logLevel: 'WARN',
      });
      logger.trace('Trace log');
      logger.info('Info log');
      logger.warn('Warn log');
      logger.error('Error log');
      assert.equal(
        getOutput(),
        '[warn][for-trace] Warn log\n'
        + '[error][for-trace] Error log\n',
      );
    });
    test('ERROR: TRACE, INFO and WARN logs are ignored', () => {
      const logger = Logger('for-trace', {
        output, colors: null, dateFormat: null, logLevel: 'ERROR',
      });
      logger.trace('Trace log');
      logger.info('Info log');
      logger.warn('Warn log');
      logger.error('Error log');
      assert.equal(
        getOutput(),
        '[error][for-trace] Error log\n',
      );
    });
  });
  test('If no LOG_LEVEL is defined, the default is WARN', () => {
    delete process.env.LOG_LEVEL;
    const logger = Logger('for-trace', { output, colors: null, dateFormat: null });
    logger.trace('Trace log');
    logger.info('Info log');
    logger.warn('Warn log');
    logger.error('Error log');
    assert.equal(
      getOutput(),
      '[warn][for-trace] Warn log\n'
      + '[error][for-trace] Error log\n',
    );
  });
  test('If an invalid LOG_LEVEL is defined, the default is WARN', () => {
    process.env.LOG_LEVEL = 'DEBUG';
    const logger = Logger('for-trace', { output, colors: null, dateFormat: null });
    logger.trace('Trace log');
    logger.info('Info log');
    logger.warn('Warn log');
    logger.error('Error log');
    assert.equal(
      getOutput(),
      '[warn][for-trace] Warn log\n'
      + '[error][for-trace] Error log\n',
    );
  });
  test('Lower case log levels also works', () => {
    process.env.LOG_LEVEL = 'info';
    const logger = Logger('for-trace', { output, colors: null, dateFormat: null });
    logger.trace('Trace log');
    logger.info('Info log');
    logger.warn('Warn log');
    logger.error('Error log');
    assert.equal(
      getOutput(),
      '[info][for-trace] Info log\n'
      + '[warn][for-trace] Warn log\n'
      + '[error][for-trace] Error log\n',
    );
  });
});

describe('Instance.getLogLevel()', () => {
  test('It returns the current log level if defined on the options', () => {
    const logger = Logger({ logLevel: 'WARN' });
    assert.equal(logger.getLogLevel(), 'WARN');
  });
  test('It returns the current log level if defined from the environment', () => {
    process.env.LOG_LEVEL = 'INFO';
    const logger = Logger();
    assert.equal(logger.getLogLevel(), 'INFO');
  });
});

describe('Logger.configure', () => {
  test('Logger.configure can be called after the instances creation', () => {
    const first = Logger('first-instance', { output });
    Logger.configure({ dateFormat: 'YYYY-mm-DD' });
    const second = Logger('second-instance', { output });
    first.info('First');
    second.info('Second');
    assert.equal(
      getOutput(),
      `${chalk.cyan('[2023-10-01][info][first-instance] First')}\n`
      + `${chalk.cyan('[2023-10-01][info][second-instance] Second')}\n`,
    );
  });
});
