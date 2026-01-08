import pino from "pino";

const logger = pino({ level: "info" });

export const debug = logger.debug.bind(logger);
export const error = logger.error.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);

export const setLogLevel = (level: pino.Level) => {
  logger.level = level;
};
