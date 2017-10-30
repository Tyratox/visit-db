const winston = require("winston");
const transports = [];

transports.push(
	new winston.transports.Console({
		name: "console-log",
		level: "info",
		colorize: true,
		prettyPrint: true
	})
);
transports.push(
	new winston.transports.File({
		name: "file-log",
		level: "debug",
		filename: "./logs/debug.log",
		handleExceptions: true,
		colorize: false,
		prettyPrint: true
	})
);

const logger = new winston.Logger({
	transports,
	levels: {
		critical: 0,
		error: 1,
		warning: 2,
		info: 3,
		debug: 4
	}
});

winston.addColors({
	critical: "red",
	error: "red",
	warning: "yellow",
	info: "blue",
	debug: "magenta"
});

module.exports = logger;
