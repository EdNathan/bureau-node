var MongoClient = require('mongodb').MongoClient,
	passwords = require('./passwords.js');

if(process.env.VCAP_SERVICES){
    var env = JSON.parse(process.env.VCAP_SERVICES);
    var mongo = env['mongodb2-2.4.8'][0]['credentials'];
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
    obj.hostname = (obj.hostname || 'localhost');
    obj.port = (obj.port || 27017);
    obj.db = (obj.db || 'test');
    if(obj.username && obj.password){
        return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
    }
    else{
        return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
    }
}
var mongourl = process.env.PLATFORM === 'nodejitsu' ? passwords.jitsumongo : generate_mongo_url(mongo);

var Bureau = {
	db: null,
	init: function(callback) {
		MongoClient.connect(mongourl, function(err, db) {
			if(err) {
				callback(err);
				return;
			} else {
				//We have a db reference! Sweet
				Bureau.db = db;
				callback(undefined, db);
			}
		})
	}
}

module.exports = Bureau;