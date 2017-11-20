const fs = require("fs");
const path = require("path");

const copyFile = (source, target) =>
	new Promise((resolve, reject) => {
		const rd = fs.createReadStream(source);

		rd.on("error", reject);

		const wr = fs.createWriteStream(target);
		wr.on("error", reject);
		wr.on("close", resolve);
		rd.pipe(wr);
	});

const copyFileSync = (source, destination) => {
	fs.writeFileSync(destination, fs.readFileSync(source));
};

module.exports.setupDbStructure = root => {
	try {
		fs.readFileSync(path.resolve(root, "db.sqlite3"), {
			encoding: "utf-8"
		});
	} catch (err) {
		copyFileSync(
			path.resolve(__dirname, "..", "db-empty.sqlite3"),
			path.resolve(root, "db.sqlite3")
		);
	}
};

const loadAll = (db, query, bindParams = []) => {
	return new Promise((resolve, reject) => {
		db.all(query, bindParams, (err, rows) => {
			if (err) {
				return reject(err);
			}

			resolve(rows);
		});
	});
};
module.exports.loadAll = loadAll;

const insert = (db, query, bindParams = []) => {
	return new Promise((resolve, reject) => {
		db.run(query, bindParams, function(err) {
			if (err) {
				return reject(err);
			}
			resolve(this.lastID);
		});
	});
};
module.exports.insert = insert;

module.exports.remove = (db, query, bindParams = []) => {
	return new Promise((resolve, reject) => {
		db.run(query, bindParams, err => {
			if (err) {
				return reject(err);
			}
			resolve();
		});
	});
};

const update = (db, query, bindParams = []) => {
	return new Promise((resolve, reject) => {
		db.run(query, bindParams, err => {
			if (err) {
				return reject(err);
			}
			resolve();
		});
	});
};
module.exports.update = update;

const get = (db, query, bindParams = []) => {
	return new Promise((resolve, reject) => {
		db.get(query, bindParams, (err, row) => {
			if (err) {
				return reject(err);
			}
			resolve(row);
		});
	});
};
module.exports.get = get;

const exists = async (db, table, column, value) => {
	return (await get(db, `SELECT * FROM ${table} WHERE ${column} = ?`, [value]))
		? true
		: false;
};
module.exports.exists = exists;

const findIdOrInsert = async (db, table, column, value) => {
	const row = await get(db, `SELECT * FROM ${table} WHERE ${column} = ?`, [
		value
	]);

	if (row) {
		//found, return
		return Promise.resolve(row.id);
	} else {
		return new Promise((resolve, reject) => {
			db.run(`INSERT INTO ${table} (${column}) VALUES(?)`, [value], function(
				err
			) {
				if (err) {
					return reject(err);
				}
				resolve(this.lastID);
			});
		});
	}
};
module.exports.findIdOrInsert = findIdOrInsert;
