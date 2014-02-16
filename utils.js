var crypto = require('crypto');

var utils = {
	md5: function(str) {
		return crypto.createHash('md5').update(str).digest("hex");
	}
}

module.exports = utils;