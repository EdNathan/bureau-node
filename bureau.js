var MongoClient = require('mongodb').MongoClient,
	mongo = require('mongodb'),
	utils = require('./utils')

var Bureau = {
	db: null,
	init: function(callback) {
		MongoClient.connect(utils.mongourl(), function(err, db) {
			if(err) {
				callback(err)
				return
			} else {
				//We have a db reference! Sweet
				Bureau.db = db
				callback(undefined, db)
			}
		})
	},
	
	register: {
		emailExists: function(email, callback) {
			Bureau.db.collection('assassins').find({'email':email}).toArray(function(err, docs) {
				callback(err, docs.length > 0)
			})
		},
		
		registerNewAssassin: function(data, callback) {
			data.joindate = new Date()
			data.guild = false
			Bureau.db.collection('assassins').insert(data, {safe: true}, function(err, docs) {
				console.log(docs)
				callback(err, docs)
			})
		},
		
		loginAssassin: function(email, password, callback) {
			Bureau.db.collection('assassins').find({
				$or: [
					{email:email},
					{nickname: email}
				],
				password: utils.md5(password)
			}).toArray(function(err, docs) {
				callback(err, docs.length > 0 ? docs[0] : false)
			})
		}
	},
	
	assassin: {
		getAssassin: function(uid, callback) {
			var objID = new mongo.ObjectID(uid)
			Bureau.db.collection('assassins').findOne({_id: objID}, function(err, doc) {
				callback(err, doc)
			})
		},
		
		getSalt: function(uid, callback) {
			Bureau.assassin.getAssassin(uid, function(err, doc) {
				callback(err, utils.md5(uid+'~'+doc.joindate))
			})
		},
		
		isGuild: function(uid, callback) {
			Bureau.assassin.getAssassin(uid, function(err, doc) {
				callback(err, doc.guild)
			})
		}
	}
}

module.exports = Bureau