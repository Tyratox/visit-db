const fs = require("fs");
const path = require("path");

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./db.sqlite3");
const logger = require("./logger");
const ejs = require("ejs");

const express = require("express");
const expressSession = require("express-session");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const compression = require("compression");

process.on("uncaughtException", err => {
	logger.log("error", err);
});

process.on("unhandledRejection", (reason, p) => {
	logger.log("error", "Unhandled Rejection at:", p, "reason:", reason);
});

const app = new express();

if (fs.readFileSync("./db.sqlite3", { encoding: "utf-8" }).length === 0) {
	db.serialize(() => {
		const tables = fs.readdirSync(
			path.resolve(__dirname, "..", "database", "structure")
		);
		tables.forEach(fileName => {
			db.run(
				fs.readFileSync(
					path.resolve(__dirname, "..", "database", "structure", fileName),
					{ encoding: "utf-8" }
				)
			);
		});

		fs
			.readFileSync(
				path.resolve(__dirname, "..", "database", "indicies.sqlite3.sql"),
				{ encoding: "utf-8" }
			)
			.split("\n")
			.forEach(index => {
				db.run(index);
			});
	});
}

app.use(helmet());
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
	expressSession({
		secret: Math.random().toString(),
		saveUninitialized: false,
		resave: false
	})
);

const prepareTemplate = path => {
	return new Promise((resolve, reject) => {
		fs.readFile(path, { encoding: "utf-8" }, (err, data) => {
			if (err) {
				reject(err);
			}

			resolve(
				ejs.compile(data, { filename: path, strict: true, rmWhitespace: true })
			);
		});
	});
};

app.use("/static", express.static(path.resolve(__dirname, "../static")));

const setupRouting = async () => {
	app.get("/", async (request, response) => {
		const indexTemplate = await prepareTemplate(
			path.resolve(__dirname, "templates", "pages", "index.ejs")
		);
		response.header("Content-Type", "text/html");
		response.end(indexTemplate({}));
	});
};

setupRouting().then(() => {
	const httpServer = app.listen(8080, "0.0.0.0", () => {
		logger.log(
			"info",
			"Server running on",
			"http://" + httpServer.address().address + ":" + httpServer.address().port
		);
	});
});
