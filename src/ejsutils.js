const ejs = require("ejs");
const fs = require("fs");

module.exports.prepareTemplate = path => {
	return ejs.compile(fs.readFileSync(path, { encoding: "utf-8" }), {
		filename: path,
		rmWhitespace: true
	});
};
