# Satisfact-api / Logger
![Test and lint](https://github.com/satisfact-api/logger/actions/workflows/test-and-lint.yml/badge.svg)

> Simple and easy to use text logger.

## Usage

The logger must be initialized then can be called with one of the four log levels:

- `trace`
- `info`
- `warn`
- `error`

```js
import Logger from 'project-logger';

const logger = Logger('context');

logger.warn('Here comes an object');
logger.warn({
  hello: 'World',
});
```

Output:

![Output](https://raw.githubusercontent.com/satisfact-api/logger/master/.github/example-1.png)

## Reference

The Logger module exports a factory function that is used to generate loggers instances.

- [`Factory`](#factory)
- [`configure`](#configure)
- [`Instance`](#instance)

### Factory

**`Logger([context], [options])`**

**`Logger([options])`**

The factory generates logger instances, it can be initialized with a context and with options.

If no context is provided, the logger will take the current file location as context.

Examples:

```js
import Logger from 'logger';

// Simple initialization with a context
const simple = Logger('my-context');

// No context provided, the file location will be used
const noContext = Logger();

// The logger instance can be initialized with some options
const withOptions = Logger('my-context', {
  trim: false,
});
```

#### Options

The `options` attribute is an object that can contains :

- **colors** (`object`): Object defining the colors used for each kind of log levels: `trace`,
  `info`, `warn`, `error`. Each attribute of the color option must be a function that will receive
  an input and returns it colorized. Internally, [`chalk`][chalk] do the default colorization.
  If null, colorization is disabled.
- **dateFormat** (`string`): Date format used to display the dates. The formater being
  [`dayjs`][days], the format must follow their own [format described here][dayjs-format].
  If null or empty, no date will be displayed.
- **trim** (`boolean`): Option to toggle the trim of each strings to log. It does not affect objects
  and errors.
- **ignoreEmpty** (`boolean`): Option to toggle the empty lines removal.
- **output** (`function`): Output method called for each line to display. Defaults to
  `process.stdout.write`.
- **logLevel** (`string`): Minimum log level to diplay. Can be either `TRACE`, `INFO`, `WARN` or
  `ERROR`. Defaults to `process.env.LOG_LEVEL` or `WARN` if it does not exists.

### configure

**`configure(options)`**

The module also export a method overriding the global configuration of all the Logger instances.
It takes the same arguments as the [`Factory`](#factory) options.

### Instance

Each instance consist of 4 methods: `trace`, `info`, `warn`, `error`:

**`logger.trace(content)`**

**`logger.info(content)`**

**`logger.warn(content)`**

**`logger.error(content)`**

The attribute `content` can be a `string`, `object` or `error`. The log only outputs if the
configured log level is equal or _"inferior"_ of the log method.

#### Get the current log level

**`getLogLevel()`**

You can retrieve the current log level with the method `getLogLevel`. It can be useful if you need
to conditionnaly start heavy log loops on your processes.

[chalk]: https://github.com/chalk/chalk
[dayjs]: https://github.com/iamkun/dayjs
[dayjs-format]: https://day.js.org/docs/en/display/format
