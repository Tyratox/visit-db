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
	const parts = string.split(".");
	const d = new Date(), f = d.getFullYear().toString(), f1 = f.substr(0,2), f2 = f.substr(2);
	return new Date(
		parts[2].length === 2 ? (parseInt(parts[2]) <= parseInt(f2) ? f1 : parseInt(f1) - 1) + parts[2] : parts[2],
		parseInt(parts[1]) - 1,
		parts[0]
	);
};
module.exports.stringToDate = stringToDate;

const stringToUnixTimestamp = string => {
	return dateToUnixTimestamp(stringToDate(string));
};
module.exports.stringToUnixTimestamp = stringToUnixTimestamp;

const formatMinutes = minutes => {
	let days = 0,
		hours = 0,
		mins = minutes % 60;

	if (minutes < 60) {
	} else{
		hours = Math.floor(minutes / 60);
	}

	return (
		(hours ? hours + " Stunde" + (hours > 1 ? "n" : "") + " " : "") +
		(mins ? mins + " Minute" + (mins > 1 ? "n" : "") : "")
	);
};
module.exports.formatMinutes = formatMinutes;
