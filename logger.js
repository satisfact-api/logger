import path from 'node:path';
import chalk from 'chalk';
import deepmerge from 'deepmerge';
import dayjs from 'dayjs';

const sContext = Symbol('logger.context');
const sGetOptions = Symbol('logger.get-options');
const sOptions = Symbol('logger.options');
const sOptionsVersion = Symbol('logger.options-version');
const sOutput = Symbol('logger.output');
const sToLineString = Symbol('logger.to-line-string');
const sShouldLog = Symbol('logger.should-log');

const levels = ['TRACE', 'INFO', 'WARN', 'ERROR'];
const levelsIds = {};
levels.forEach((level, index) => {
  levelsIds[level] = index;
});

let optionsVersion = 0;
let options = {
  colors: {
    trace: chalk.grey,
    info: chalk.cyan,
    warn: chalk.yellow,
    error: chalk.redBright,
  },
  dateFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
  trim: true,
  ignoreEmpty: true,
  logLevel: 'WARN',
  output: null,
};

function getContextPath() {
  return (new Error()).stack
    .split('\n')[3]
    .split(path.resolve('.'))[1]
    .split(':')[0]
    .slice(1);
}

function logger(...args) {
  const context = typeof args[0] === 'string' ? args.shift() : undefined;
  const contextOptions = typeof args[0] === 'object' ? args.shift() : {};

  const instance = {
    [sOptionsVersion]: -1,
    [sContext]: context || getContextPath(),
    [sOptions]: {},
    [sOptionsVersion]: -1,
    [sGetOptions]: () => {
      if (instance[sOptionsVersion] !== optionsVersion) {
        instance[sOptions] = deepmerge(
          { ...options, logLevel: process.env.LOG_LEVEL || 'WARN' },
          contextOptions,
        );

        instance[sOptions].logLevel = instance[sOptions].logLevel.toUpperCase();
        if (!levels.includes(instance[sOptions].logLevel)) {
          instance[sOptions].logLevel = 'WARN';
        }

        instance[sOptionsVersion] = optionsVersion;
      }
      return instance[sOptions];
    },
    [sShouldLog]: (key) => levelsIds[key] >= levelsIds[instance[sGetOptions]().logLevel],
    [sToLineString]: (value) => {
      if (!value) {
        return [''];
      }
      if (value instanceof Error) {
        return [
          value.message,
          'Stack trace:',
          ...value.stack.split('\n').slice(1),
        ];
      }
      if (typeof value === 'object') {
        return JSON.stringify(value, null, 2).split('\n');
      }
      return value.split('\n')
        .map((line) => (instance[sGetOptions]().trim ? line.trim() : line))
        .filter((line) => !!line);
    },
    [sOutput]: (color, type, key, value) => {
      if (!instance[sShouldLog](key)) return;

      const date = instance[sGetOptions]().dateFormat
        ? `[${dayjs(Date.now()).format(instance[sGetOptions]().dateFormat)}]`
        : '';
      instance[sToLineString](value).forEach((line) => {
        const text = `${date}[${type}][${instance[sContext]}] ${line}`;
        const coloredText = color ? `${color(text)}\n` : `${text}\n`;
        if (instance[sGetOptions]().output) {
          instance[sGetOptions]().output(coloredText);

        // Tests does not listen to the defaut behavior
        /* c8 ignore next 3 */
        } else {
          process.stdout.write(coloredText);
        }
      });
    },
    trace: (value) => {
      instance[sOutput](instance[sGetOptions]().colors?.trace, 'trace', 'TRACE', value);
    },
    info: (value) => {
      instance[sOutput](instance[sGetOptions]().colors?.info, 'info', 'INFO', value);
    },
    warn: (value) => {
      instance[sOutput](instance[sGetOptions]().colors?.warn, 'warn', 'WARN', value);
    },
    error: (value) => {
      instance[sOutput](instance[sGetOptions]().colors?.error, 'error', 'ERROR', value);
    },
    getLogLevel: () => instance[sGetOptions]().logLevel.toUpperCase(),
  };
  return instance;
}

logger.configure = function configure(newOptions) {
  options = deepmerge(
    options,
    newOptions,
  );
  optionsVersion += 1;
};

logger.logger = logger;
logger.default = logger;
export default logger;
