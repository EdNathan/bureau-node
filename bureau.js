var MongoClient = require( 'mongodb' ).MongoClient,
	mongo = require( 'mongodb' ),
	mongoose = require( 'mongoose' ),
	utils = require( './utils' ),
	lethalities = require( './lethalities' ),
	moment = require( 'moment' ),
	Mail = require( './mail' ),
	swig = require( 'swig' ),
	_ = require( 'lodash' )

function id( uid ) {
	try {
		return new mongo.ObjectID( uid )
	} catch ( e ) {
		return false
	}
}

function empty( obj ) {
	return _.isEmpty( obj )
}

function unique( arr ) {
	//Reduces array to unique values
	var u = arr.reduce( function( last, current ) {
		if ( last.indexOf( current ) < 0 ) {
			last.push( current )
			return last
		} else {
			return last
		}
	}, [] )

	return u
}

function merge( o1, o2 ) {
	var n = {}
	for ( key in o1 ) {
		if ( o1.hasOwnProperty( key ) ) {
			n[ key ] = o1[ key ]
		}
	}
	for ( key in o2 ) {
		if ( o2.hasOwnProperty( key ) ) {
			n[ key ] = o2[ key ]
		}
	}
	return n
}

function strcopy( str, times ) {
	return new Array( times + 1 ).join( str )
}

function log( msg, indent ) {
	indent = indent != undefined ? indent : 1
	if ( !msg ) {
		console.log()
	} else {
		console.log( strcopy( '        ', indent ) + msg )
	}
}

function line( indent ) {
	indent = indent != undefined ? indent : 0
	console.log( strcopy( '        ', indent ) + '----' )
}

var Bureau = {
	db: null,
	mongoose: null,
	_initted: false,
	init: function( callback ) {
		var start = new Date(),
			pkg = require( './package.json' ),
			art = require( 'fs' ).readFileSync( './startup-art.txt' ).toString()
		log()
		log( art, 0 )
		log()
		log( 'v' + pkg.version )
		line()
		log( 'Connecting to database' )
		MongoClient.connect( utils.mongourl(), function( err, db ) {
			if ( err ) {
				callback( err )
				return
			} else {
				log( 'Conencted to MongoDB' )
				line()
					//We have a db reference! Sweet
				Bureau.db = db
					//Compile the list of admins
				log( 'Fetching list of admin ids' )
				Bureau.assassin.getAssassins( {
					email: {
						$in: process.env.BUREAU_ADMIN_EMAILS.split( ',' )
					}
				}, function( err, admins ) {
					Bureau.admins = admins.map( function( x ) {
						return x._id + ''
					} )
					if ( utils.production ) {
						Bureau.admins.forEach( function( el ) {
							Bureau.assassin.addNotification( el, 'restarted at v' + pkg.version )
						} )
					}
					log( 'Admin ids saved' )

					//Load Games
					line()
					log( 'Loading games' )
					Bureau.loadGames()
					log( 'Finished loading games' )

					//Fetch and cache gamegroups
					Bureau.gamegroup.getGamegroups( function( err, ggs ) {
						var end = new Date()
						line()
						log( 'Started up in ' + ( end - start ) / 1000 + 's' )
						log( 'Ready to go!' )
						log( strcopy( '-', 50 ), 0 )
						Bureau._initted = true
						callback( undefined, db )
					} )
				} )


			}

			mongoose.connect( utils.mongourl() )

			mongoose.connection.on( 'error', console.error.bind( console, 'mongoose connection error:' ) );

			mongoose.connection.once( 'open', function() {
				Bureau.mongoose = mongoose
				Bureau.loadModule( 'bounty' )
				Bureau.loadModule( 'notifications' )
			} );

		} )



	},

	loadModule: function( moduleName ) {
		console.log( 'Loading module: ' + moduleName )
		Bureau[ moduleName ] = require( './server/' + moduleName )( Bureau )
	},

	loadGames: function() {
		var fs = require( 'fs' ),
			gameFiles = fs.readdirSync( './games' ).filter( function( x ) {
				return /(\w+)\.js\b/.test( x )
			} )
		log( 'Found ' + gameFiles.length + ' game file' + ( gameFiles.length != 1 ?
			's' : '' ) )
		gameFiles.forEach( function( x ) {
			var title = x.replace( '.js', '' )
			line( 1 )
			log( 'Found game ' + title, 2 )
			var g = Bureau.games[ title ] = require( './games/' + x )
			g.Bureau = Bureau
			g.swig = swig
			g.title = title
			g.init()
			log( 'Finished loading game ' + title, 2 )
		} )
		line( 1 )
	},

	admins: [],

	register: {
		emailExists: function( email, callback ) {
			Bureau.db.collection( 'assassins' ).find( {
				'email': email
			} ).toArray( function( err, docs ) {
				callback( err, docs.length > 0 )
			} )
		},

		registerNewAssassin: function( data, callback ) {
			data.joindate = new Date()
			data.guild = false

			var now = new Date()

			//Hash the password
			data.password = utils.hash( data.password )

			//Add an empty array of kills
			data.kills = []

			//Mark details up to date
			data.detailsUpdated = true
			data.detailsLastUpdated = new Date()

			//Add some welcome notifications
			data.notifications = [ {
					added: now,
					text: 'Welcome to Bureau! Have a look around!',
					id: utils.md5( now + 'bacon' ),
					priority: false
				}, {
					added: now,
					text: 'Try heading to the personal page and changing your profile picture!',
					link: '/personal',
					id: utils.md5( now + 'cheese' ),
					priority: false
				} ]
				//Add the email confirmation token
			data.token = utils.md5( data.email + data.password )

			Bureau.db.collection( 'unconfirmed-assassins' ).insert( data, {
				safe: true
			}, function( err, docs ) {
				//Send an email to gamegroup master email
				Bureau.gamegroup.getGamegroup( data.gamegroup, function( err, gg ) {

					Mail.sendText( gg.email, 'New Bureau User', utils.fullname( data ) +
						' has joined Bureau',
						function( err, res ) {
							console.log( err, res )
						} )

					Mail.sendWelcome( data, function( err, res ) {
						console.log( err, res )
					} )

					//Notify guild of them joining
					var notif = data.forename + ' ' + data.surname +
						' has joined Bureau'
					Bureau.gamegroup.getGuild( data.gamegroup, function( err, guild ) {
						guild.forEach( function( el ) {
							Bureau.assassin.addNotification( el._id + '', notif )
						} )
					} )
					callback( err, docs )
				} )
			} )
		},

		confirmEmail: function( email, token, callback ) {
			var query = {
				email: email,
				token: token
			}

			Bureau.db.collection( 'unconfirmed-assassins' ).findOne( query, {
				_id: 0,
				token: 0
			}, function( err, doc ) {
				if ( !doc || empty( doc ) ) {
					callback( 'Invalid token or email', {} )
					return
				}
				var assassin = doc
				Bureau.db.collection( 'unconfirmed-assassins' ).remove( query, function(
					err, doc ) {
					if ( err ) {
						callback( 'Error dropping unconfirmed assassin from db', {} )
						return
					}
					Bureau.db.collection( 'assassins' ).insert( assassin, {
						safe: true
					}, function( err, doc ) {
						if ( err ) {
							callback( 'Error registering assassin as confirmed', {} )
							return
						}
						callback( null, doc )
					} )
				} )
			} )
		},

		loginAssassin: function( email, password, callback ) {
			Bureau.db.collection( 'assassins' ).find( {
				$or: [ {
					email: email
				}, {
					nickname: email
				} ]
			} ).toArray( function( err, doc ) {
				var assassin = doc[ 0 ],
					correctDetails = !!assassin && utils.test( password, assassin.password )

				if ( correctDetails ) {
					log( utils.fullname( assassin ) + ' logged in' )
				}

				callback( err, correctDetails ? assassin : false )
			} )
		}
	},

	assassin: {
		cachedAssassins: {}, //This object exists to massively speed up page loading

		getAssassin: function( uid, callback ) {
			if ( Bureau.assassin.cachedAssassins.hasOwnProperty( uid ) ) {
				callback( null, Bureau.assassin.cachedAssassins[ uid ] )
			} else {
				var objID = id( uid + '' )
				Bureau.db.collection( 'assassins' ).findOne( {
					_id: objID
				}, function( err, doc ) {
					if ( !doc || empty( doc ) ) {
						callback( err, {} )
						return
					}
					Bureau.assassin.cachedAssassins[ uid ] = doc
					callback( err, doc )
				} )
			}
		},

		getAssassins: function( filter, callback ) {
			if ( empty( filter ) ) {
				callback( null, [] )
				return
			}
			//Sadly this one always has to go to the db. Fuck.
			Bureau.db.collection( 'assassins' ).find( filter, function( err, cursor ) {
				cursor.toArray( function( err, docs ) {
					if ( err ) {
						callback( err, null )
						return
					}
					var i = 0,
						l = docs.length,
						a,
						arr = []
					for ( i; i < l; i++ ) {
						a = docs[ i ]
							//Cache them!
						Bureau.assassin.cachedAssassins[ a._id ] = a
						arr.push( a )
					}
					callback( null, arr )
				} )
			} )
		},

		getAssassinsFromIds: function( ids, callback ) {
			Bureau.assassin.getAssassins( {
				_id: {
					$in: ids.map( id )
				}
			}, callback )
		},

		objFromAssassins: function( assassins ) {
			var o = {}
			assassins.forEach( function( a ) {
				o[ a._id ] = a
			} )
			return o
		},

		updateAssassin: function( uid, stuff, callback ) {
			if ( Bureau.assassin.cachedAssassins.hasOwnProperty( uid ) ) {
				delete Bureau.assassin.cachedAssassins[ uid ]
			}
			var objID = id( uid ),
				toUpdate = {
					$set: {}
				},
				filters = {
					_id: objID
				}

			//Check if we have any special things
			for ( key in stuff ) {
				if ( key !== 'filter' ) {
					if ( stuff.hasOwnProperty( key ) && key[ 0 ] === '$' ) {
						//Special $key, we have to move it outside!
						toUpdate[ key ] = stuff[ key ]
					} else if ( stuff.hasOwnProperty( key ) ) {
						toUpdate.$set[ key ] = stuff[ key ]
					}
				} else {
					//We want to apply some extra filters
					filters = merge( filters, stuff.filter )
				}
			}

			//Prune empty $set
			if ( empty( toUpdate.$set ) ) {
				delete toUpdate.$set
			}

			Bureau.db.collection( 'assassins' ).update( filters, toUpdate, function(
				err,
				doc ) {
				if ( !!doc ) {
					Bureau.assassin.getAssassin( uid, function( err, doc ) {
						callback( err, doc )
					} )
				} else {
					throw err;
					callback( err, {} )
				}
			} )
		},

		updateAssassins: function( filter, stuff, callback ) {
			//We don't need to invalidate the whole cache, we'll refetch the assassins after we update them

			var toUpdate = {
				$set: {}
			}

			//Check if we have any special things
			for ( key in stuff ) {
				if ( key !== 'filter' ) {
					if ( stuff.hasOwnProperty( key ) && key[ 0 ] === '$' ) {
						//Special $key, we have to move it outside!
						toUpdate[ key ] = stuff[ key ]
					} else if ( stuff.hasOwnProperty( key ) ) {
						toUpdate.$set[ key ] = stuff[ key ]
					}
				} else {
					//We want to apply some extra filters
					filter = merge( filter, stuff.filter )
				}
			}

			//Prune empty $set
			if ( empty( toUpdate.$set ) ) {
				delete toUpdate.$set
			}

			Bureau.db.collection( 'assassins' ).update( filter, toUpdate, {
				multi: true
			}, function( err, docs ) {
				Bureau.assassin.getAssassins( filter, function( err, assassins ) {
					if ( err ) {
						callback( err, [] )
					} else {
						callback( null, assassins )
					}
				} )
			} )
		},

		updateLastHere: function( uid ) {
			var now = new Date()
			Bureau.assassin.updateAssassin( uid, {
				lastonline: now
			}, function() {} )
		},

		checkPassword: function( uid, password, callback ) {
			Bureau.assassin.getAssassin( uid, function( err, assassin ) {
				if ( err ) {
					callback( err, false )
					return
				}
				callback( null, utils.test( password, assassin.password ) )
			} )
		},

		setPassword: function( uid, password, callback ) {
			if ( !password || password.length < 6 ) {
				callback( 'Password must be 6 chars or longer', false )
				return
			}
			Bureau.assassin.updateAssassin( uid, {
				password: utils.hash( password ),
				$unset: {
					temppassword: ''
				}
			}, function( err, assassin ) {
				if ( err ) {
					callback( err, false )
					return
				}
				callback( null, true )
			} )
		},

		createTempPassword: function( uid, callback ) {
			var pwd = utils.hash( utils.md5( ( new Date() ) + '' ) )

			Bureau.assassin.updateAssassin( uid, {
				password: utils.hash( pwd ),
				temppassword: true
			}, function( err, assassin ) {
				if ( err ) {
					callback( err, false )
					return
				}
				callback( null, pwd )
			} )
		},

		submitReport: function( uid, report, callback ) {
			var now = new Date()
			report.submitted = now
			report.id = utils.md5( now + uid )
			Bureau.assassin.updateAssassin( uid, {
				$push: {
					kills: report
				}
			}, function( err, a ) {
				if ( err ) {
					callback( err, {} )
					return
				}
				Bureau.assassin.getAssassin( report.victimid, function( err, victim ) {
					if ( err ) {
						callback( err, {} )
						return
					}
					Bureau.game.getGame( report.gameid, function( err, game ) {
						if ( err ) {
							callback( err, {} )
							return
						}
						var notif = 'Your report on ' + utils.fullname( victim ) +
							' in the game ' + game.name + ' has been submitted'
						Bureau.assassin.addNotification( uid, notif )
						callback( null, a )
					} )

				} )
			} )
		},

		getNotifications: function( uid, limit, callback ) {
			Bureau.assassin.getAssassin( uid, function( err, a ) {
				if ( a.notifications && a.notifications.length > 0 ) {
					callback( err, a.notifications.sort( function( a, b ) {
						return b.added - a.added
					} ).slice( 0, limit ) )
				} else {
					callback( err, [] )
				}
			} )
		},

		addNotification: function( uid, notification, source, priority ) {
			var now = new Date(),
				n = {
					added: now,
					text: notification,
					id: utils.md5( now + '' + Math.random() + '' + uid ),
					priority: !!priority,
					read: false
				}
			if ( !!source ) {
				n.source = source
			}
			Bureau.assassin.updateAssassin( uid, {
				$push: {
					notifications: n
				}
			}, function() {} )
		},

		markNotificationRead: function( uid, notificationid, callback ) {
			Bureau.assassin.updateAssassin( uid, {
				'notifications.$.read': true,
				filter: {
					'notifications.id': notificationid
				}
			}, callback )
		},

		getGamegroup: function( uid, callback ) {
			Bureau.assassin.getAssassin( uid, function( err, doc ) {
				callback( err, doc.gamegroup )
			} )
		},

		getSalt: function( uid, callback ) {
			Bureau.assassin.getAssassin( uid, function( err, assassin ) {
				callback( err, utils.md5( uid + '~' + assassin.joindate ) )
			} )
		},

		getToken: function( uid, callback ) {
			Bureau.assassin.getAssassin( uid, function( err, assassin ) {
				callback( err, utils.md5( assassin.joindate + process.env.BUREAU_TOKEN_SECRET ) )
			} )
		},

		isGuild: function( uid, callback ) {
			Bureau.assassin.getAssassin( uid, function( err, doc ) {
				callback( err, doc.guild )
			} )
		},

		hasDetailsChangeRequest: function( uid, callback ) {
			Bureau.assassin.getAssassin( uid, function( err, doc ) {
				var hasReq = doc.hasOwnProperty( 'detailsChangeRequest' ) && !empty(
					doc.detailsChangeRequest )
				callback( err, hasReq )
			} )
		},

		submitDetailsChangeRequest: function( uid, data, callback ) {
			var whitelisted = [ 'address', 'course', 'liverin' ],
				details = {}
			for ( var key in data ) {
				if ( data.hasOwnProperty( key ) && whitelisted.indexOf( key ) > -1 ) {
					details[ key ] = data[ key ]
				}
			}
			details.submitted = new Date()
			details.state = 'waiting'
			details.liverin = details.liverin == 'Yes'
			Bureau.assassin.updateAssassin( uid, {
				detailsChangeRequest: details
			}, function( err, doc ) {
				callback( err, doc )
			} )
		},

		setPicture: function( uid, picture, callback ) {
			Bureau.assassin.updateAssassin( uid, {
				imgname: picture
			}, function( err, doc ) {
				callback( err, doc )
			} )
		},

		markDetailsUpdated: function( uid, callback ) {
			var now = new Date()
			Bureau.assassin.updateAssassin( uid, {
				detailsUpdated: true,
				detailsLastUpdated: now
			}, function( err, doc ) {
				callback( err, doc )
			} )
		},

		setNickname: function( uid, nickname, callback ) {
			Bureau.assassin.updateAssassin( uid, {
				nickname: nickname
			}, function( err, doc ) {
				callback( err, doc )
			} )
		},

		setGuild: function( uid, shouldBeGuild, callback ) {
			Bureau.assassin.updateAssassin( uid, {
				guild: shouldBeGuild
			}, function( err, doc ) {
				callback( err, doc )
			} )
		},

		getKills: function( uid, includePending, callback ) {
			Bureau.assassin.getAssassin( uid, function( err, assassin ) {
				if ( err ) {
					callback( err, [] )
				} else {
					if ( !assassin.kills ) {
						callback( null, [] )
					} else {
						var kills = assassin.kills.filter( function( x ) {
							if ( includePending ) {
								return x.state !== 'rejected'
							} else {
								return x.state === 'approved'
							}
						} )
						callback( null, kills )
					}
				}
			} )
		},

		getDeaths: function( uid, includePending, callback ) {
			var filter = {
					'kills.victimid': uid
				},
				statequery = includePending ? {
					$ne: 'rejected'
				} : 'approved',
				map = function() {
					var id = this._id.valueOf(),
						ggid = this.gamegroup

					this.kills.forEach( function( k ) {
						k.killerid = id
						k.gamegroup = ggid
						emit( k.id, k )
					} )
				},
				reduce = function( key, values ) {
					return values[ 0 ]
				},
				getVal = function( o ) {
					return o.value
				}

			Bureau.db.collection( 'assassins' ).mapReduce(
				map,
				reduce, {
					out: {
						merge: 'kills'
					},
					query: filter
				},
				function( err, collection ) {
					if ( err ) {
						callback( 'There was an error finding the deaths', null )
						return
					}
					collection.find( {
						'value.victimid': uid,
						'value.state': statequery
					}, function( err, cursor ) {
						cursor.toArray( function( err, docs ) {
							if ( err ) {
								callback( err, [] )
								return;
							}
							callback( null, docs.map( getVal ) )
						} )
					} )
				}
			)
		},

		getKillsFromGame: function( uid, gameid, includePending, callback ) {
			Bureau.assassin.getKills( uid, includePending, function( err, kills ) {
				if ( err ) {
					callback( err, [] )
				} else {
					var fromGame = kills.filter( function( x ) {
						return x.gameid + '' === gameid + ''
					} )
					callback( null, fromGame )
				}
			} )
		},

		getDeathsFromGame: function( uid, gameid, includePending, callback ) {
			var filter = {
					'kills.victimid': uid,
					'kills.gameid': gameid
				},
				statequery = includePending ? {
					$ne: 'rejected'
				} : 'approved',
				map = function() {
					var id = this._id.valueOf(),
						ggid = this.gamegroup

					this.kills.forEach( function( k ) {
						k.killerid = id
						k.gamegroup = ggid
						emit( k.id, k )
					} )
				},
				reduce = function( key, values ) {
					return values[ 0 ]
				},
				getVal = function( o ) {
					return o.value
				}

			Bureau.db.collection( 'assassins' ).mapReduce(
				map,
				reduce, {
					out: {
						merge: 'kills'
					},
					query: filter
				},
				function( err, collection ) {
					if ( err ) {
						callback( 'There was an error finding the deaths', null )
						return
					}
					collection.find( {
						'value.victimid': uid,
						'value.gameid': gameid,
						'value.state': statequery
					}, function( err, cursor ) {
						cursor.toArray( function( err, docs ) {
							if ( err ) {
								callback( err, [] )
								return;
							}
							callback( null, docs.map( getVal ) )
						} )
					} )
				}
			)
		},

		hasKilledInGame: function( uid, gameid, includePending, callback ) {
			Bureau.assassin.getKillsFromGame( uid, gameid, includePending, function(
				err,
				kills ) {
				if ( err ) {
					callback( err, false )
					return
				}
				callback( null, kills.length > 0 )
			} )
		},

		hasDiedInGame: function( uid, gameid, includePending, callback ) {
			Bureau.assassin.getDeathsFromGame( uid, gameid, includePending, function(
				err, deaths ) {
				if ( err ) {
					callback( err, false )
					return
				}
				callback( null, deaths.length > 0 )
			} )
		},

		getPlayersKilled: function( uid, includePending, callback ) {
			Bureau.assassin.getKills( uid, includePending, function( err, kills ) {
				if ( err ) {
					callback( err, [] )
				} else {
					var playersKilled = unique( kills.map( function( x ) {
						return x.victimid
					} ) )
					callback( null, playersKilled )
				}
			} )
		},

		getPlayersKilledFromGame: function( uid, gameid, includePending, callback ) {
			Bureau.assassin.getKillsFromGame( uid, gameid, includePending, function(
				err,
				kills ) {
				if ( err ) {
					callback( err, [] )
				} else {
					var playersKilled = unique( kills.map( function( x ) {
						return x.victimid
					} ) )
					callback( null, playersKilled )
				}
			} )
		},

		hasKilledPlayerInGame: function( uid, victimid, gameid, includePending,
			callback ) {
			Bureau.assassin.getPlayersKilledFromGame( uid, gameid, includePending,
				function( err, playersKilled ) {
					if ( err ) {
						callback( err, false )
					} else {
						callback( null, playersKilled.indexOf( victimid ) > -1 )
					}
				} )
		},

		totalKills: function( uid, callback ) {
			Bureau.assassin.getKills( uid, true, function( err, kills ) {
				if ( err ) {
					callback( err, 0 )
				} else {
					callback( null, kills.length )
				}
			} )
		},

		totalDeaths: function( uid, callback ) {
			Bureau.assassin.getDeaths( uid, true, function( err, deaths ) {
				if ( err ) {
					callback( err, 0 )
				} else {
					callback( null, deaths.length )
				}
			} )
		},

		stats: function( uid, callback ) {
			Bureau.assassin.totalKills( uid, function( err, k ) {
				Bureau.assassin.totalDeaths( uid, function( err, d ) {
					var s = {
						kills: k,
						deaths: d,
						ratio: isNaN( k / d ) ? 0 : k / d
					}
					callback( err, s )
				} )
			} )
		},

		getLethality: function( uid, callback ) {
			Bureau.assassin.totalKills( uid, function( err, count ) {
				var lethality,
					i = 0
				while ( !lethality ) {
					lethality = lethalities[ i ].kills <= count ? lethalities[ i ].name :
						false
					i++
				}
				callback( err, lethality )
			} )
		},

		setOptout: function( uid, optout, callback ) {
			var now = new Date()
			Bureau.assassin.updateAssassin( uid, {
				optout: optout
			}, callback )
		},

	},

	gamegroup: {
		cachedGamegroups: {},

		getGamegroups: function( callback ) {
			if ( !empty( Bureau.gamegroup.cachedGamegroups ) ) {
				callback( null, Bureau.gamegroup.cachedGamegroups )
			} else {
				line()
				log( 'Gamegroup cache empty - rebuilding cache' )
				Bureau.db.collection( 'gamegroups' ).find( {}, function( err, cursor ) {
					cursor.toArray( function( err, ggs ) {
						var i = 0,
							l = ggs.length,
							o = Bureau.gamegroup.cachedGamegroups
						for ( i; i < l; i++ ) {
							o[ ggs[ i ].ggid ] = ggs[ i ]
						}
						callback( err, Bureau.gamegroup.cachedGamegroups )
					} )
				} )
				log( 'Gamegroup cache rebuilt' )
			}
		},

		getGamegroup: function( ggid, callback ) {
			if ( Bureau.gamegroup.cachedGamegroups.hasOwnProperty( ggid ) ) {
				callback( null, Bureau.gamegroup.cachedGamegroups[ ggid ] )
			} else {
				Bureau.db.collection( 'gamegroups' ).findOne( {
					ggid: ggid
				}, function( err, doc ) {
					if ( err ) {
						callback( err, null )
					} else if ( !doc || empty( doc ) ) {
						callback( 'The gamegroup ' + ggid + ' does not exist', null )
					} else {
						Bureau.gamegroup.cachedGamegroups[ ggid ] = doc
						callback( null, doc )
					}
				} )
			}
		},

		updateGamegroup: function( ggid, stuff, callback ) {
			if ( Bureau.gamegroup.cachedGamegroups.hasOwnProperty( ggid ) ) {
				delete Bureau.gamegroup.cachedGamegroups[ ggid ]
			}

			var toUpdate = {
					$set: {}
				},
				filters = {
					ggid: ggid
				}

			//Check if we have any special things
			for ( key in stuff ) {
				if ( key !== 'filter' ) {
					if ( stuff.hasOwnProperty( key ) && key[ 0 ] === '$' ) {
						//Special $key, we have to move it outside!
						toUpdate[ key ] = stuff[ key ]
					} else if ( stuff.hasOwnProperty( key ) ) {
						toUpdate.$set[ key ] = stuff[ key ]
					}
				} else {
					//We want to apply some extra filters
					filters = merge( filters, stuff.filter )
				}
			}

			//Prune empty $set
			if ( empty( toUpdate.$set ) ) {
				delete toUpdate.$set
			}

			Bureau.db.collection( 'gamegroups' ).update( filters, toUpdate, function(
				err,
				doc ) {
				if ( !!doc ) {
					Bureau.gamegroup.getGamegroup( ggid, function( err, doc ) {
						callback( err, doc )
					} )
				} else {
					throw err;
					callback( err, {} )
				}
			} )
		},

		getKillMethods: function( ggid, callback ) {
			Bureau.gamegroup.getGamegroup( ggid, function( err, gg ) {
				if ( err || !gg.killmethods ) {
					callback( err, [] )
				} else {
					callback( null, gg.killmethods )
				}
			} )
		},

		getKillMethod: function( ggid, methodid, callback ) {
			Bureau.gamegroup.getKillMethods( ggid, function( err, killmethods ) {
				var m = killmethods.filter( function( el ) {
					return el.id === methodid
				} )

				if ( m[ 0 ] ) {
					callback( null, m[ 0 ] )
				} else {
					callback( 'Kill method ' + methodid + ' does not exist', null )
				}
			} )
		},

		addKillMethod: function( ggid, method, callback ) {
			//Check if method exists before adding it
			Bureau.gamegroup.getKillMethods( ggid, function( err, methods ) {

				var methodExistsAlready = methods.filter( function( el ) {
					return el.id === method.id
				} ).length > 0;

				if ( methodExistsAlready ) {
					callback( 'The kill method already exists' )
				} else {
					Bureau.gamegroup.updateGamegroup( ggid, {
						$push: {
							killmethods: method
						}
					}, function( err, gg ) {
						callback( err, gg.killmethods )
					} )
				}
			} )

		},

		updateKillMethod: function( ggid, methodid, stuff, callback ) {
			var o = {
				filter: {
					'killmethods.id': methodid
				}
			}

			//'killmethods.$.read': true

			for ( key in stuff ) {
				if ( stuff.hasOwnProperty( key ) ) {
					o[ 'killmethods.$.' + key ] = stuff[ key ]
				}
			}

			Bureau.gamegroup.updateGamegroup( ggid, o, function( err, gg ) {
				Bureau.gamegroup.getKillMethods( ggid, function( err, killmethods ) {
					callback( err, killmethods )
				} )
			} )
		},

		notifyGamegroup: function( ggid, notification, source, priority, callback ) {
			var now = new Date(),
				n = {
					added: now,
					text: notification,
					id: utils.md5( now + '' + ggid ),
					priority: !!priority
				}
			if ( !!source ) {
				n.source = source
			}
			line()
			log( 'Sending Notification: "' + notification + '" to all ' + ggid )

			Bureau.assassin.updateAssassins( {
				gamegroup: ggid
			}, {
				$push: {
					notifications: n
				}
			}, function( err, assassins ) {
				if ( callback ) {
					log( 'Notification: "' + notification + '" sent to all ' + ggid )
					callback( err, assassins )
				}
			} )
		},

		notifyGuild: function( ggid, notification, source, priority, callback ) {
			var now = new Date(),
				n = {
					added: now,
					text: notification,
					id: utils.md5( now + '' + ggid ),
					priority: !!priority
				}
			if ( !!source ) {
				n.source = source
			}
			line()
			log( 'Sending Notification: "' + notification + '" to guild for ' + ggid )

			Bureau.assassin.updateAssassins( {
				gamegroup: ggid,
				guild: true
			}, {
				$push: {
					notifications: n
				}
			}, function( err, assassins ) {
				if ( callback ) {
					log( 'Notification: "' + notification + '" sent to guild for ' + ggid )
					callback( err, assassins )
				}
			} )
		},

		forceDetailsUpdate: function( ggid, callback ) {
			Bureau.assassin.updateAssassins( {
				gamegroup: ggid
			}, {
				detailsUpdated: false
			}, function( err, assassins ) {
				if ( callback ) {
					log( 'Details update forced for ' + ggid )
					callback( err, assassins )
				}
			} )
		},

		setMotd: function( ggid, motd, callback ) {
			log( 'setting motd for ' + ggid + ' to ' + motd )
			Bureau.gamegroup.updateGamegroup( ggid, {
				motd: motd
			}, callback )
		},

		setEmail: function( ggid, email, callback ) {
			log( 'setting email for ' + ggid + ' to ' + email )
			Bureau.gamegroup.updateGamegroup( ggid, {
				email: email
			}, callback )
		},

		getAssassins: function( ggid, callback ) {
			Bureau.assassin.getAssassins( {
				gamegroup: ggid
			}, function( err, assassins ) {
				callback( err, assassins )
			} )
		},

		getGuild: function( ggid, callback ) {
			Bureau.assassin.getAssassins( {
				guild: true,
				gamegroup: ggid
			}, function( err, guild ) {
				callback( err, guild )
			} )
		},

		getAssassinsCount: function( ggid, callback ) {
			Bureau.db.collection( 'assassins' ).count( {
				gamegroup: ggid
			}, function( err, callback ) {
				callback( err, count )
			} )
		},

		addGamegroup: function( data, callback ) {
			if ( !Bureau.gamegroup.cachedGamegroups.hasOwnProperty( data.ggid ) ) {
				Bureau.db.collection( 'gamegroups' ).insert( data, {
					safe: true
				}, function( err, docs ) {
					Bureau.gamegroup.cachedGamegroups = {}
					callback( err, docs )
				} )
			} else {
				callback( new Error( 'Gamegroup already exists' ), {} )
			}
		},

	},

	report: {
		getReports: function( query, filter, callback ) {
			var f = query,
				map = function() {
					var id = this._id.valueOf(),
						ggid = this.gamegroup

					this.kills.forEach( function( k ) {
						k.killerid = id
						k.gamegroup = ggid
						emit( k.id, k )
					} )
				},
				reduce = function( key, values ) {
					return values[ 0 ]
				},
				getVal = function( o ) {
					return o.value
				}

			Bureau.db.collection( 'assassins' ).mapReduce(
				map,
				reduce, {
					out: {
						merge: 'kills'
					},
					query: f
				},
				function( err, collection ) {
					if ( err ) {
						callback( 'There was an error finding the reports', null )
						return
					}
					collection.find( filter, function( err, cursor ) {
						cursor.toArray( function( err, docs ) {
							if ( err ) {
								callback( err, [] )
								return;
							}
							callback( null, docs.map( getVal ) )
						} )
					} )
				}
			)
		},

		getProcessedReportsByGame: function( ggid, callback ) {
			//Get reports
			Bureau.report.getReports( {
				gamegroup: ggid
			}, {
				$or: [ {
					'value.state': 'approved'
				}, {
					'value.state': 'rejected'
				} ],
				'value.gamegroup': ggid
			}, function( err, reports ) {
				Bureau.game.getGamesInGamegroupAsArray( ggid, function( err, games ) {
					var idMap = {},
						numReports = reports.length,
						doneReports = 0,
						reportLoaded = function() {
							if ( ++doneReports === numReports ) {
								callback( null, games )
							}
						}


					games.forEach( function( g, i ) {
						g.reports = []
						idMap[ g.gameid ] = i
					} )
					reports.forEach( function( r ) {
						Bureau.report.fullReport( r, function( err, report ) {
							var game = games[ idMap[ report.gameid ] ]
							if ( game ) {
								game.reports.push( report )
							}
							reportLoaded()
						} )
					} )
					if ( numReports < 1 ) {
						callback( null, games )
					}
				} )
			} )
		},

		getReport: function( reportid, callback ) {
			Bureau.report.getReports( {
				'kills.id': reportid
			}, {
				'value.id': reportid
			}, function( err, reports ) {
				if ( reports.length < 1 ) {
					callback( 'There is no report with that id', {} )
					return
				}
				callback( null, reports[ 0 ] )
			} )
		},

		updateReport: function( reportid, stuff, callback ) {
			var toUpdate = {
					$set: {}
				},
				filters = {
					'kills.id': reportid
				}

			//Check if we have any special things
			for ( key in stuff ) {
				if ( key !== 'filter' ) {
					if ( stuff.hasOwnProperty( key ) && key[ 0 ] === '$' ) {
						//Special $key, we have to move it outside!
						toUpdate[ key ] = {}
							//Loop through subkey of stuff and modify things...
						for ( subkey in stuff[ key ] ) {
							if ( stuff[ key ].hasOwnProperty( subkey ) ) {
								toUpdate[ key ][ 'kills.$.' + subkey ] = stuff[ key ][ subkey ]
							}
						}
					} else if ( stuff.hasOwnProperty( key ) ) {
						toUpdate.$set[ 'kills.$.' + key ] = stuff[ key ]
					}
				} else {
					//We want to apply some extra filters
					filters = merge( filters, stuff.filter )
				}
			}

			//Prune empty $set
			if ( empty( toUpdate.$set ) ) {
				delete toUpdate.$set
			}


			Bureau.db.collection( 'assassins' ).update( filters, toUpdate, function(
				err,
				count ) {
				if ( !!count ) {
					Bureau.db.collection( 'assassins' ).findOne( filters, function( err,
						doc ) {
						var uid = doc._id + ''
						if ( Bureau.assassin.cachedAssassins.hasOwnProperty( uid ) ) {
							delete Bureau.assassin.cachedAssassins[ uid ]
						}
						Bureau.assassin.getAssassin( uid, function( err, doc ) { //Force recaching of the assassin
							Bureau.report.getReport( reportid, callback )
						} )
					} )
				} else {
					callback( err, {} )
				}
			} )
		},

		getPendingReports: function( ggid, callback ) {
			Bureau.report.getReports( {
				gamegroup: ggid
			}, {
				'value.state': 'waiting',
				'value.gamegroup': ggid
			}, callback )
		},

		getProcessedReports: function( ggid, callback ) {
			Bureau.report.getReports( {
				gamegroup: ggid
			}, {
				$or: [ {
					'value.state': 'approved'
				}, {
					'value.state': 'rejected'
				} ],
				'value.gamegroup': ggid
			}, callback )
		},

		acceptReport: function( reportid, callback ) {
			Bureau.report.updateReport( reportid, {
				state: 'approved'
			}, callback )
		},

		rejectReport: function( reportid, comment, callback ) {
			Bureau.report.updateReport( reportid, {
				state: 'rejected',
				comment: comment
			}, callback )
		},

		fullReport: function( report, callback ) {
			//We need killer, victim, killmethod and sentence
			Bureau.assassin.getAssassin( report.killerid, function( err, killer ) {
				report.killer = killer
				Bureau.assassin.getAssassin( report.victimid, function( err, victim ) {
					report.victim = victim
					Bureau.gamegroup.getKillMethod( report.gamegroup, report.killmethod,
						function( err, killmethod ) {
							report.killmethod = killmethod
							report.sentence = Bureau.report.getKillSentence( report )
							callback( null, report )
						} )
				} )
			} )
		},

		getKillSentence: function( report ) {
			var killmethod = report.killmethod,
				verb = killmethod.verb,
				killer = report.killer,
				victim = report.victim
			return verb.replace( '#v', utils.fullname( victim ) ).replace( '#k', utils
				.fullname(
					killer ) ).replace( '#d', report.methoddetail )
		}
	},

	games: {},

	game: {
		isGameType: function( gtype ) {
			return Bureau.games.hasOwnProperty( gtype )
		},

		getGamesInGamegroupAsArray: function( ggid, callback ) {
			Bureau.gamegroup.getGamegroup( ggid, function( err, gamegroup ) {
				var games = {}
				if ( err ) {
					callback( err, [] )
				} else if ( !gamegroup.games ) {
					callback( null, [] )
				} else {
					callback( err, gamegroup.games )
				}

			} )
		},

		toArray: function( games ) {
			var arr = []

			for ( var key in games ) {
				arr.push( games[ key ] )
			}

			return arr.sort( function( a, b ) {
				return b.start - a.start
			} )
		},

		getGamesInGamegroup: function( ggid, callback ) {
			Bureau.gamegroup.getGamegroup( ggid, function( err, gamegroup ) {
				var games = {}
				if ( err ) {
					callback( err, {} )
				} else if ( !gamegroup.games ) {
					callback( null, {} )
				} else {
					gamegroup.games.forEach( function( x ) {
						games[ x.gameid ] = x
					} )
					callback( err, games )
				}

			} )
		},

		getLastGameInGamegroup: function( ggid, callback ) {
			Bureau.gamegroup.getGamegroup( ggid, function( err, gamegroup ) {
				var games = {}
				if ( err ) {
					callback( err, {} )
				} else if ( !gamegroup.games ) {
					callback( null, {} )
				} else {
					callback( err, gamegroup.games.sort( function( a, b ) {
						return b.start - a.start
					} )[ 0 ] )
				}

			} )
		},

		getLastNonTestGameInGamegroup: function( ggid, callback ) {
			Bureau.gamegroup.getGamegroup( ggid, function( err, gamegroup ) {
				var games = {}
				if ( err ) {
					callback( err, {} )
				} else if ( !gamegroup.games ) {
					callback( null, {} )
				} else {
					callback( err, gamegroup.games.sort( function( a, b ) {
						return b.start - a.start
					} ).filter( function( game ) {
						game.name.toLowerCase().indexOf( 'test' ) === -1
					} )[ 0 ] )
				}

			} )
		},

		getPlayersForNewGame: function( ggid, callback ) {
			//Fetch the details of the last game
			Bureau.game.getLastNonTestGameInGamegroup( ggid, function( err, game ) {
				//Flag people who have logged in since the start of the last game to be auto included
				var autoIncludeDate = empty( game ) ? new Date( 0 ) : game.start,
					//Don't include people in the list who haven't logged in in the past 2 years
					cutoffDate = moment().subtract( 2, 'years' ).toDate()
				if ( err ) {
					callback( err, [] )
					return
				}
				Bureau.gamegroup.getAssassins( ggid, function( err, assassins ) {
					if ( err ) {
						callback( err, [] )
						return
					}
					var potentialPlayers = assassins.filter( function( player ) {
						return player.lastonline > cutoffDate
					} ).map( function( player ) {
						player.autoinclude = player.lastonline > autoIncludeDate
						return player
					} )

					callback( null, potentialPlayers )
				} )
			} )
		},

		getPossibleAssassins: function( gameid, ggid, callback ) {
			Bureau.game.getPlayerIds( gameid, function( err, playerIds ) {
				if ( err ) {
					callback( err, [] )
				} else if ( !!playerIds ) {
					Bureau.assassin.getAssassins( {
						_id: {
							$nin: playerIds.map( id )
						},
						gamegroup: ggid
					}, function( err, assassins ) {
						if ( err ) {
							callback( err, [] )
						} else {
							callback( null, assassins )
						}
					} )
				} else {
					callback( null, [] )
				}
			} )
		},

		getGames: function( callback ) {
			Bureau.gamegroup.getGamegroups( function( err, gamegroups ) {
				var games = {}
				for ( var gg in gamegroups ) {
					if ( gamegroups.hasOwnProperty( gg ) ) {
						if ( gamegroups[ gg ].games ) {
							gamegroups[ gg ].games.forEach( function( x ) {
								games[ x.gameid ] = x
							} )
						}
					}
				}

				callback( null, games )
			} )
		},

		getGamesWithPlayer: function( id, callback ) {
			//Note: error not thrown if players does not exist
			Bureau.game.getGames( function( err, games ) {
				var gamesWithPlayer = {}
				for ( var gid in games ) {
					if ( games.hasOwnProperty( gid ) ) {
						if ( games[ gid ].players[ id ] ) {
							gamesWithPlayer[ gid ] = games[ gid ]
						}
					}
				}
				callback( null, gamesWithPlayer )
			} )
		},

		isPlayerInGame: function( id, gameid, callback ) {
			Bureau.game.getGamesWithPlayer( id, function( err, gamesWithPlayer ) {
				if ( err ) {
					callback( err, {} )
				} else {
					callback( null, gamesWithPlayer.hasOwnProperty( gameid ) )
				}
			} )
		},

		getCurrentGamesWithPlayer: function( id, callback ) {
			Bureau.game.getGamesWithPlayer( id, function( err, games ) {
				var currentGamesWithPlayer = {},
					now = new Date()
				for ( var gid in games ) {
					if ( games.hasOwnProperty( gid ) ) {
						if ( games[ gid ].start <= now && games[ gid ].end > now ) {
							currentGamesWithPlayer[ gid ] = games[ gid ]
						}
					}
				}
				callback( null, currentGamesWithPlayer )
			} )
		},

		getGame: function( gameid, callback ) {
			Bureau.game.getGames( function( err, games ) {
				if ( !err && games[ gameid ] ) {
					callback( err, games[ gameid ] )
				} else if ( err ) {
					callback( err, {} )
				} else {
					callback( 'Invalid game id', {} )
				}
			} )
		},

		newGame: function( ggid, gameData, callback ) {
			if ( !Bureau.game.isGameType( gameData.type ) ) {
				callback( 'Invalid game type' )
				return
			}
			if ( gameData.start > gameData.end ) {
				callback(
					'Invalid game start date: game start date is after game end date' )
				return
			}
			gameData.gameid = utils.md5( new Date() + '' )

			//Map the player array to an object
			var playersArray = gameData.players,
				playersObj = {}

			playersArray.forEach( function( player ) {
				playersObj[ player ] = {
					score: 0
				}
			} )
			gameData.players = playersObj

			Bureau.games[ gameData.type ].constructGame( gameData, function( err,
				gameObj ) {
				if ( err ) {
					callback( err )
					return
				}

				Bureau.gamegroup.updateGamegroup( ggid, {
					$push: {
						games: gameObj
					}
				}, function( err, gg ) {
					callback( err, gameObj.id )
				} )
			} )

		},

		updateGame: function( gameid, stuff, callback ) {
			var toUpdate = {
					$set: {}
				},
				filters = {
					'games.gameid': gameid
				}

			//Check if we have any special things
			for ( key in stuff ) {
				if ( key !== 'filter' ) {
					if ( stuff.hasOwnProperty( key ) && key[ 0 ] === '$' ) {
						//Special $key, we have to move it outside!
						toUpdate[ key ] = {}
							//Loop through subkey of stuff and modify things...
						for ( subkey in stuff[ key ] ) {
							if ( stuff[ key ].hasOwnProperty( subkey ) ) {
								toUpdate[ key ][ 'games.$.' + subkey ] = stuff[ key ][ subkey ]
							}
						}
					} else if ( stuff.hasOwnProperty( key ) ) {
						toUpdate.$set[ 'games.$.' + key ] = stuff[ key ]
					}
				} else {
					//We want to apply some extra filters
					filters = merge( filters, stuff.filter )
				}
			}

			//Prune empty $set
			if ( empty( toUpdate.$set ) ) {
				delete toUpdate.$set
			}

			Bureau.db.collection( 'gamegroups' ).update( filters, toUpdate, function(
				err,
				count ) {
				if ( !!count ) {
					Bureau.db.collection( 'gamegroups' ).findOne( filters, function( err,
						doc ) {
						if ( Bureau.gamegroup.cachedGamegroups.hasOwnProperty( doc.ggid ) ) {
							delete Bureau.gamegroup.cachedGamegroups[ doc.ggid ]
						}
						Bureau.gamegroup.getGamegroup( doc.ggid, function( err, doc ) {
							callback( err, doc )
						} )
					} )
				} else {
					callback( err, {} )
				}
			} )
		},

		archiveGame: function( gameid, callback ) {
			Bureau.game.getGame( gameid, function( err, game ) {
				if ( err ) {
					callback( err, {} )
					return
				}

				var now = new Date()
				if ( game.end > now ) {
					callback( 'Cannot archive a game before it has finished', {} )
					return
				}

				Bureau.game.updateGame( gameid, {
					archived: true
				}, function( err, gg ) {
					if ( err ) {
						callback( 'There was an error archiving the game', {} )
					} else {
						Bureau.game.getGame( gameid, function( err, game ) {
							if ( err ) {
								callback( err, {} )
							} else {
								callback( null, game )
							}
						} )
					}
				} )
			} )
		},

		changeGameTimes: function( gameid, start, end, callback ) {
			if ( start > end ) {
				callback(
					'Invalid game start date: game start date is after game end date' )
				return
			}
			Bureau.game.updateGame( gameid, {
				start: start,
				end: end
			}, function( err, gg ) {
				if ( err ) {
					callback( 'There was an error setting the game start and end times', {} )
				} else {
					Bureau.game.getGame( gameid, function( err, game ) {
						if ( err ) {
							callback( err, {} )
						} else {
							callback( null, game )
						}
					} )
				}
			} )
		},

		getPlayers: function( gameid, callback ) {
			Bureau.game.getGame( gameid, function( err, game ) {
				if ( err ) {
					callback( err, {} )
				} else if ( game.players ) {
					callback( null, game.players )
				} else {
					callback( null, {} )
				}
			} )
		},

		getPlayerIds: function( gameid, callback ) {
			Bureau.game.getPlayers( gameid, function( err, players ) {
				if ( err ) {
					callback( err, [] )
				} else if ( !empty( players ) ) {
					callback( null, Object.keys( players ) )
				} else {
					callback( null, [] )
				}
			} )
		},

		getAssassins: function( gameid, callback ) {
			Bureau.game.getPlayerIds( gameid, function( err, playerIds ) {
				if ( err ) {
					callback( err, [] )
				} else if ( !!playerIds && playerIds.length > 0 ) {
					Bureau.assassin.getAssassins( {
						_id: {
							$in: playerIds.map( id )
						}
					}, function( err, assassins ) {
						if ( err ) {
							callback( err, [] )
						} else {
							callback( null, assassins )
						}
					} )
				} else {
					callback( null, [] )
				}
			} )
		},

		getAssassinsObj: function( gameid, callback ) {
			Bureau.game.getAssassins( gameid, function( err, assassins ) {
				if ( err ) {
					callback( err, [] )
				} else {
					var o = {}
					assassins.forEach( function( a ) {
						o[ a._id ] = a
					} )
					callback( null, o )
				}
			} )
		},

		addPlayer: function( gameid, playerid, callback ) {
			var o = {}
			o[ 'players.' + playerid ] = {
				score: 0
			}
			Bureau.game.updateGame( gameid, o, function( err, gg ) {
				if ( err ) {
					callback( err )
				} else {
					callback( null )
				}
			} )
		},

		removePlayer: function( gameid, playerid, callback ) {
			var o = {}
			o[ 'players.' + playerid ] = 1
			Bureau.game.updateGame( gameid, {
				$unset: o
			}, function( err, gg ) {
				if ( err ) {
					callback( err )
				} else {
					callback( null )
				}
			} )
		},

		getPlayer: function( gameid, playerid, callback ) {
			Bureau.game.getPlayers( gameid, function( err, players ) {
				if ( err ) {
					callback( err, {} )
				} else if ( players.hasOwnProperty( playerid ) ) {
					callback( null, players[ playerid ] )
				} else {
					callback( 'The player ' + playerid + ' is not in the game ' + gameid, {} )
				}
			} )
		},

		getScore: function( gameid, playerid, callback ) {
			Bureau.game.getPlayer( gameid, playerid, function( err, player ) {
				if ( err ) {
					callback( err, {} )
				} else if ( player.hasOwnProperty( score ) ) {
					callback( null, player.score )
				} else {
					callback( null, 0 )
				}
			} )
		},

		setScore: function( gameid, playerid, score, callback ) {
			var o = {}
			o[ 'players.' + playerid + '.score' ] = score
			Bureau.game.updateGame( gameid, o, callback )
		},

		changeScore: function( gameid, playerid, delta, callback ) {
			var o = {}
			o[ 'players.' + playerid + '.score' ] = delta
			Bureau.game.updateGame( gameid, {
				$inc: o
			}, callback )
		},

		setPlayerData: function( gameid, playerid, toSet, callback ) {
			var o = {}
			for ( var key in toSet ) {
				if ( toSet.hasOwnProperty( key ) ) {
					o[ 'players.' + playerid + '.' + key ] = toSet[ key ]
				}
			}
			Bureau.game.updateGame( gameid, o, callback )
		},

		render: function( gameid, g, uid, gamegroup, callback ) {
			Bureau.assassin.getDeathsFromGame( uid, gameid, true, function( err,
				deaths ) {
				g.deaths = deaths
				var deathIds = deaths.map( function( d ) {
					return d.killerid
				} )

				Bureau.assassin.getKillsFromGame( uid, gameid, true, function( err,
					kills ) {

					g.kills = kills
					var killedIds = kills.map( function( k ) {
						return k.victimid
					} )

					Bureau.game.getAssassins( gameid, function( err, assassins ) {

						g.assassins = assassins
						g.assassins.forEach( function( a ) {
							a.hasKilled = killedIds.indexOf( a._id + '' ) > -1
							a.hasBeenKilledBy = deathIds.indexOf( a._id + '' ) > -1
						} )

						Bureau.assassin.getAssassin( uid, function( err, assassin ) {

							Bureau.games[ g.type ].renderGame( g, assassin, gamegroup,
								function( err, output ) {

									g.output = output
									callback( null, g )
								} )
						} )
					} )
				} )
			} )
		},

		changeGameState: function( gameid, playerid, data, callback ) {
			Bureau.game.getGame( gameid, function( err, game ) {
				Bureau.games[ game.type ].changeGameState( game, playerid, data,
					callback )
			} )
		}
	}

}

module.exports = exports = Bureau
