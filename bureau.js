var MongoClient = require('mongodb').MongoClient,
	mongo = require('mongodb'),
	utils = require('./utils'),
	lethalities = require('./lethalities')

function id(uid) {
	return new mongo.ObjectID(uid)
}

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
		cachedAssassins: {}, //This object exists to massively speed up page loading
	
		getAssassin: function(uid, callback) {
			if(Bureau.assassin.cachedAssassins.hasOwnProperty(uid)) {
				callback(null, Bureau.assassin.cachedAssassins[uid])
			} else {
				var objID = id(uid)
				Bureau.db.collection('assassins').findOne({_id: objID}, function(err, doc) {
					Bureau.assassin.cachedAssassins[uid] = doc
					callback(err, doc)
				})
			}
		},
		
		updateAssassin: function(uid, stuff, callback) {
			if(Bureau.assassin.cachedAssassins.hasOwnProperty(uid)) {
				delete Bureau.assassin.cachedAssassins[uid]
			}
			var objID = id(uid)
			Bureau.db.collection('assassins').update({_id: objID}, {$set: stuff}, function(err, doc) {
				if(!!doc) {
					Bureau.assassin.getAssassin(uid, function(err, doc) {
						callback(err, doc)
					})
				} else {
					throw err;
					callback(err, {})
				}
			})
		},
		
		getGamegroup: function(uid, callback) {
			Bureau.assassin.getAssassin(uid, function(err, doc) {
				callback(err, doc.gamegroup)
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
		},
		
		totalKills: function(uid, callback) {
			var objID = new mongo.ObjectID(uid)
			Bureau.db.collection('reports').count({killer: objID}, function(err, count) {
				callback(err, count)	
			})
		},
		
		totalDeaths: function(uid, callback) {
			var objID = new mongo.ObjectID(uid)
			Bureau.db.collection('reports').count({victim: objID}, function(err, count) {
				callback(err, count)	
			})
		},
		
		getLethality: function(uid, callback) {
			Bureau.assassin.totalKills(uid, function(err, count) {
				var lethality,
					i = 0
				while(!lethality) {
					lethality = lethalities[i].kills <= count ? lethalities[i].name : false
					i++
				}
				callback(err, lethality)
			})
		},
		
		hasDetailsChangeRequest: function(uid, callback) {
			Bureau.assassin.getAssassin(uid, function(err, doc) {
				var hasReq = doc.hasOwnProperty('detailsChangeRequest')
				callback(err, hasReq)
			})
		},
		
		submitDetailsChangeRequest: function(uid, data, callback) {
			var whitelisted = ['address', 'course', 'liverin'],
				details = {}
			for(var key in data) {
				if(data.hasOwnProperty(key) && whitelisted.indexOf(key) > -1) {
					details[key] = data[key]
				}
			}
			details.submitted = new Date()
			details.state = 'waiting'
			details.liverin = details.liverin == 'Yes'
			Bureau.assassin.updateAssassin(uid, {detailsChangeRequest: details}, function(err, doc) {
				callback(err, doc)
			})
		}
	}
}

module.exports = exports = Bureau