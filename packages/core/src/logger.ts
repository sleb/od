import pino from "pino";

// Send logs to stderr so they don't disrupt Ink's stdout UI
const logger = pino({ level: "info" }, process.stderr);

export const debug = logger.debug.bind(logger);
export const error = logger.error.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);

export const setLogLevel = (level: pino.Level) => {
  logger.level = level;
};
