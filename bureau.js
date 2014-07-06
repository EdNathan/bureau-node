var MongoClient = require('mongodb').MongoClient,
	mongo = require('mongodb'),
	utils = require('./utils'),
	lethalities = require('./lethalities')

function id(uid) {
	return new mongo.ObjectID(uid)
}


function empty(obj) {
	var hasOwnProperty = Object.prototype.hasOwnProperty;
    // null and undefined are "empty"
    if (obj == null) return true;

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0)    return false;
    if (obj.length === 0)  return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
}

function merge(o1, o2) {
	var n = {}
	for(key in o1) {
		if(o1.hasOwnProperty(key)) {
			n[key] = o1[key]
		}
	}
	for(key in o2) {
		if(o2.hasOwnProperty(key)) {
			n[key] = o2[key]
		}
	}
	return n
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
				//Fetch and cache gamegroups
				Bureau.gamegroup.getGamegroups(function(err, ggs) {
					callback(undefined, db)
				})
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
			
			var now = new Date()
			
			//Add some welcome notifications
			data.notifications = [{
					added: now,
					text: 'Welcome to Bureau! Have a look around!',
					id: utils.md5(now+'bacon'),
					priority: false
				},
				{
					added: now,
					text: 'Try heading to the personal page and changing your profile picture!',
					link: '/personal',
					id: utils.md5(now+'cheese'),
					priority: false
				}]
			
			Bureau.db.collection('assassins').insert(data, {safe: true}, function(err, docs) {
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
				var objID = id(uid+'')
				Bureau.db.collection('assassins').findOne({_id: objID}, function(err, doc) {
					Bureau.assassin.getLethality(uid, function(err, lethality) {
						doc.lethality = lethality
						Bureau.assassin.cachedAssassins[uid] = doc
						callback(err, doc)
					})
				})
			}
		},
		
		getAssassins: function(filter, callback) {
			if(empty(filter)) {
				callback(null, [])
				return
			}
			//Sadly this one always has to go to the db. Fuck.
			Bureau.db.collection('assassins').find(filter, function(err, cursor) {
				cursor.toArray(function(err, docs) {
					if(err) {
						callback(err, null)
					}
					var i = 0,
						l = docs.length,
						a,
						arr = []
					for(i;i<l;i++) {
						a = docs[i]
						//Cache them if we haven't already
						if(!Bureau.assassin.cachedAssassins.hasOwnProperty(a._id)) {
							Bureau.assassin.cachedAssassins[a._id] = a
						}
						arr.push(a)
					}
					callback(null, arr)
				})
			})
		},
		
		updateAssassin: function(uid, stuff, callback) {
			if(Bureau.assassin.cachedAssassins.hasOwnProperty(uid)) {
				delete Bureau.assassin.cachedAssassins[uid]
			}
			var objID = id(uid),
				toUpdate = {$set: {}},
				filters = {_id: objID}
			
			//Check if we have any special things	
			for(key in stuff) {
				if(key !== 'filter') {
					if(stuff.hasOwnProperty(key) && key[0] === '$') {
						//Special $key, we have to move it outside!
						toUpdate[key] = stuff[key]
					} else if(stuff.hasOwnProperty(key)) {
						toUpdate.$set[key] = stuff[key]
					}
				} else {
					//We want to apply some extra filters
					filters = merge(filters, stuff.filter)
				}
			}
			
			Bureau.db.collection('assassins').update(filters, toUpdate, function(err, doc) {
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
		
		updateLastHere: function(uid) {
			var now = new Date()
			Bureau.assassin.updateAssassin(uid, {lastonline: now}, function(){})
		},
		
		getNotifications: function(uid, limit, callback) {
			Bureau.assassin.getAssassin(uid, function(err, a) {
				if(a.notifications && a.notifications.length > 0) {
					callback(err, a.notifications.reverse().slice(0,limit))
				} else {
					callback(err, [])
				}
			})
		},
		
		addNotification: function(uid, notification, priority) {
			var now = new Date(),
				n = {
					added: now,
					text: notification,
					id: utils.md5(now+''+uid),
					priority: !!priority
				}
			Bureau.assassin.updateAssassin(uid, {$push: {notifications: n}}, function(){})
		},
		
		markNotificationRead: function(uid, notificationid, callback) {
			Bureau.assassin.updateAssassin(uid, {
				'notifications.$.read': true,
				filter: {
					'notifications.id': notificationid
				}
			}, callback)
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
			Bureau.db.collection('reports').count({killer: uid}, function(err, count) {
				callback(err, count)	
			})
		},
		
		totalDeaths: function(uid, callback) {
			Bureau.db.collection('reports').count({victim: uid}, function(err, count) {
				callback(err, count)	
			})
		},
		
		stats: function(uid, callback) {
			Bureau.assassin.totalKills(uid, function(err, k) {
				Bureau.assassin.totalDeaths(uid, function(err, d) {
					var s = {
						kills: k,
						deaths: d,
						ratio: isNaN(k/d) ? 0 : k/d
					}
					callback(err, s)
				})
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
				var hasReq = doc.hasOwnProperty('detailsChangeRequest') && !empty(doc.detailsChangeRequest)
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
		},
		
		setPicture: function(uid, picture, callback) {
			Bureau.assassin.updateAssassin(uid, {imgname: picture}, function(err, doc) {
				callback(err, doc)
			})
		},
		
		setNickname: function(uid, nickname, callback) {
			Bureau.assassin.updateAssassin(uid, {nickname: nickname}, function(err, doc) {
				callback(err, doc)
			})
		},
		
		setGuild: function(uid, shouldBeGuild, callback) {
			Bureau.assassin.updateAssassin(uid, {guild: shouldBeGuild}, function(err, doc) {
				callback(err, doc)
			})
		}
	},
	
	gamegroup: {
		cachedGamegroups: {},
		
		getGamegroups: function(callback) {
			if(!empty(Bureau.gamegroup.cachedGamegroups)) {
				callback(null, Bureau.gamegroup.cachedGamegroups)
			} else {
				console.log('Gamegroup cache empty - rebuilding cache')
				Bureau.db.collection('gamegroups').find({}, function(err, cursor) {
					cursor.toArray(function(err, ggs) {
						var i = 0,
							l = ggs.length,
							o = Bureau.gamegroup.cachedGamegroups
						for(i;i<l;i++) {
							o[ggs[i].ggid] = ggs[i]
						}
						callback(err, Bureau.gamegroup.cachedGamegroups)
					})
				})
				console.log('Gamegroup cache rebuilt')
			}
		},
		
		getGamegroup: function(ggid, callback) {
			if(Bureau.gamegroup.cachedGamegroups.hasOwnProperty(ggid)) {
				callback(null, Bureau.gamegroup.cachedGamegroups[ggid])
			} else {
				Bureau.db.collection('gamegroups').findOne({ggid: ggid}, function(err, doc) {
					Bureau.gamegroup.cachedGamegroups[ggid] = doc
					callback(err, doc)
				})
			}
		},
		
		updateGamegroup: function(ggid, stuff, callback) {
			if(Bureau.gamegroup.cachedGamegroups.hasOwnProperty(ggid)) {
				delete Bureau.gamegroup.cachedGamegroups[ggid]
			}
			
			var toUpdate = {$set: {}},
				filters = {ggid: ggid}
			
			//Check if we have any special things	
			for(key in stuff) {
				if(key !== 'filter') {
					if(stuff.hasOwnProperty(key) && key[0] === '$') {
						//Special $key, we have to move it outside!
						toUpdate[key] = stuff[key]
					} else if(stuff.hasOwnProperty(key)) {
						toUpdate.$set[key] = stuff[key]
					}
				} else {
					//We want to apply some extra filters
					filters = merge(filters, stuff.filter)
				}
			}

			
			Bureau.db.collection('gamegroups').update(filters, toUpdate, function(err, doc) {
				if(!!doc) {
					Bureau.gamegroup.getGamegroup(ggid, function(err, doc) {
						callback(err, doc)
					})
				} else {
					throw err;
					callback(err, {})
				}
			})
		},
		
		getKillMethods: function(ggid, callback) {
			Bureau.gamegroup.getGamegroup(ggid, function(err, gg) {
				if(!gg.killmethods) {
					callback(err, [])
				} else {
					callback(err, gg.killmethods)
				}
			})
		},
		
		getKillMethod: function(ggid, methodid, callback) {
			Bureau.gamegroup.getKillMethods(ggid, function(err, killmethods) {
				var m = killmethods.filter(function(el) {
					return el.id === methodid
				})
				
				if(m[0]) {
					callback(null, m[0])
				} else {
					callback('Kill method ' + methodid + ' does not exist', null)
				}
			})
		},
		
		addKillMethod: function(ggid, method, callback) {
			//Check if method exists before adding it
			Bureau.gamegroup.getKillMethods(ggid, function(err, methods) {
			
				var methodExistsAlready = methods.filter(function(el) {
					return el.id === method.id
				}).length > 0;
				
				if(methodExistsAlready) {
					callback('The kill method already exists')
				} else {
					Bureau.gamegroup.updateGamegroup(ggid, {$push: {killmethods: method}}, function(err, gg){
						callback(err, gg.killmethods)
					})
				}
			})
			
		},
		
		updateKillMethod: function(ggid, methodid, stuff, callback) {
			var o = {
				filter: {
					'killmethods.id': methodid
				}
			}
			
			//'killmethods.$.read': true
			
			for(key in stuff) {
				if(stuff.hasOwnProperty(key)) {
					o['killmethods.$.'+key] = stuff[key]
				}
			}
			
			Bureau.gamegroup.updateGamegroup(ggid, o, function(err, gg) {
				Bureau.gamegroup.getKillMethods(ggid, function(err, killmethods) {
					callback(err, killmethods)
				})
			})
		},
		
		setMotd: function(ggid, motd, callback) {
			Bureau.gamegroup.updateGamegroup(ggid, {motd: motd}, callback)
		},
		
		getAssassins: function(ggid, callback) {
			Bureau.assassin.getAssassins({gamegroup: ggid}, function(err, assassins) {
				callback(err, assassins)
			})
		},
		
		getGuild: function(ggid, callback) {
			Bureau.assassin.getAssassins({guild: true, gamegroup: ggid}, function(err, guild) {
				callback(err, guild)
			})
		},
		
		getAssassinsCount: function(ggid, callback) {
			Bureau.db.collection('assassins').count({gamegroup: ggid}, function(err, callback) {
				callback(err, count)
			})
		},
		
		addGamegroup: function(data, callback) {
			if(!Bureau.gamegroup.cachedGamegroups.hasOwnProperty(data.ggid)) {
				Bureau.db.collection('gamegroups').insert(data, {safe: true}, function(err, docs) {
					Bureau.gamegroup.cachedGamegroups = {}
					callback(err, docs)
				})
			} else {
				callback(new Error('Gamegroup already exists'), {})
			}
		}
	}
}

module.exports = exports = Bureau