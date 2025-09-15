const { createLogger, format, transports } = require("winston");
require("winston-daily-rotate-file");

// Define a daily rotating file transport for info logs
const infoTransport = new transports.DailyRotateFile({
  filename: "logs/info-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  level: "info",
  maxFiles: "14d", // keep 2 weeks of logs
  zippedArchive: true,
});

// Daily rotating file transport for error logs
const errorTransport = new transports.DailyRotateFile({
  filename: "logs/error-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  level: "error",
  maxFiles: "30d", // keep 1 month of error logs
  zippedArchive: true,
});

// Create the logger
const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.printf(
      ({ timestamp, level, message }) =>
        `${timestamp} [${level.toUpperCase()}] ${message}`
    )
  ),
  transports: [infoTransport, errorTransport, new transports.Console()],
});

module.exports = logger;
