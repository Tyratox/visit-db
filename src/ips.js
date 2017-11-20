const os = require("os");
const ifaces = os.networkInterfaces();

const arrayOfArrays = Object.keys(ifaces).map(ifname => {
	return ifaces[ifname]
		.map(iface => {
			if ("IPv4" !== iface.family || iface.internal !== false) {
				// skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
				return null;
			}

			return iface.address;
		})
		.filter(e => e);
});

module.exports = [].concat.apply([], arrayOfArrays);
