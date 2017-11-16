const fs = require("fs");
const path = require("path");

module.exports.setupDbStructure = (db, root) => {
	if (
		fs.readFileSync(path.resolve(root, "..", "db.sqlite3"), {
			encoding: "utf-8"
		}).length === 0
	) {
		db.serialize(() => {
			const tables = fs.readdirSync(
				path.resolve(root, "..", "database", "structure")
			);
			tables.forEach(fileName => {
				db.run(
					fs.readFileSync(
						path.resolve(root, "..", "database", "structure", fileName),
						{ encoding: "utf-8" }
					)
				);
			});

			fs
				.readFileSync(
					path.resolve(root, "..", "database", "indicies.sqlite3.sql"),
					{ encoding: "utf-8" }
				)
				.split("\n")
				.forEach(index => {
					db.run(index);
				});
		});
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
