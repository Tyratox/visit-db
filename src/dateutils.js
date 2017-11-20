const unixTimestampToString = timestamp => {
	return jsTimestampToString(timestamp * 1000);
};
module.exports.unixTimestampToString = unixTimestampToString;

const jsTimestampToString = timestamp => {
	const date = new Date(timestamp);
	return (
		("" + date.getDate()).padStart(2, 0) +
		"." +
		("" + (date.getMonth() + 1)).padStart(2, 0) +
		"." +
		date.getFullYear()
	);
};
module.exports.jsTimestampToString = jsTimestampToString;

const dateToJsTimestamp = date => {
	return date.getTime();
};
module.exports.dateToJsTimestamp = dateToJsTimestamp;

const dateToUnixTimestamp = date => {
	return dateToJsTimestamp(date) / 1000;
};
module.exports.dateToUnixTimestamp = dateToUnixTimestamp;

const stringToDate = string => {
	return new Date(
		string.substring(6),
		parseInt(string.substring(3, 5)) - 1,
		string.substring(0, 2)
	);
};
module.exports.stringToDate = stringToDate;

const stringToUnixTimestamp = string => {
	return dateToUnixTimestamp(stringToDate(string));
};
module.exports.stringToUnixTimestamp = stringToUnixTimestamp;
