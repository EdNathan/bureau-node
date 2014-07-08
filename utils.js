var crypto = require('crypto'),
	passwords = require('./passwords')

var utils = {
	production: process.env.PLATFORM === 'nodejitsu',
	mongourl: function() {
		if(process.env.VCAP_SERVICES){
		    var env = JSON.parse(process.env.VCAP_SERVICES);
		    var mongo = env['mongodb2-2.4.8'][0]['credentials'];
		    console.log(mongo)
		} else {
		    var mongo = {
				"hostname":"localhost",
				"port":27017,
				"username":"",
				"password":"",
				"name":"",
				"db":"bureau"
		    }
		}
		var generate_mongo_url = function(obj){
		    obj.hostname = (obj.hostname || 'localhost')
		    obj.port = (obj.port || 27017)
		    obj.db = (obj.db || 'test')
		    if(obj.username && obj.password){
		        return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db
		    }
		    else{
		        return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db
		    }
		}
		var mongourl = process.env.PLATFORM === 'nodejitsu' ? passwords.jitsumongo : generate_mongo_url(mongo)
		return mongourl
	},
	md5: function(str) {
		return crypto.createHash('md5').update(str).digest("hex")
	}
}




module.exports = utils;