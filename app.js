var Bureau = require( './bureau' ),
	utils = require( './utils' ),
	express = require( 'express' ),
	swig = require( 'swig' ),
	gm = require( 'gm' ),
	AWS = require( 'aws-sdk' ),
	fs = require( 'fs' ),
	validator = require( 'validator' ),
	session = require( 'express-session' ),
	MongoStore = require( 'connect-mongo' )( session ),
	moment = require( 'moment' ),
	_ = require( 'lodash' )


var app = express()
var READY = false
var DONE_READY_HANDLER = null
var DONE_READY_HANDLER_CALLED = false

module.exports = {
	Bureau: Bureau,
	app: app,
	swig: swig,
	onLoad: ( callback ) => {
		DONE_READY_HANDLER = callback
		if ( READY && !DONE_READY_HANDLER_CALLED ) {
			DONE_READY_HANDLER()
		}
	}
}

var pages = {
	get: {
		login: function( req, res ) {
			if ( !!req.session.uid || !!req.cookies.BAC ) {
				res.redirect( '/home' )
				return;
			}
			Bureau.gamegroup.getGamegroups( function( err, gamegroups ) {
				res.render( 'login', {
					loginErrors: [],
					gamegroups: gamegroups
				} )
			} )

		},
		goodbye: function( req, res ) {
			req.session.destroy()
			res.clearCookie( 'connect.sid', {
				path: '/'
			} )
			res.clearCookie( 'BAC', {
				path: '/'
			} )
			res.redirect( '/login' )
		},
		logout: function( req, res ) {
			//alias for goodbye
			pages.get.goodbye( req, res )
		},
		forgotpassword: function( req, res ) {
			res.render( 'forgotpassword' )
		},
		confirmemail: function( req, res ) {
			var email = req.query.e.toLowerCase(),
				token = req.query.t

			Bureau.register.confirmEmail( email, token, function( err, assassin ) {
				if ( err ) {
					res.locals.pageErrors = [ err ]
				}
				res.redirect( '/login' )
			} )
		},
		'views/mail/:page': function( req, res ) {
			res.render( '../mail/' + req.params.page, {
				subject: 'Testing Email'
			} )
		}
	},
	post: {
		login: function( req, res ) {
			var email = req.body.email.toLowerCase().replace( '@dur.ac.uk', '@durham.ac.uk' ),
				password = req.body.password,
				passwordconfirm = req.body.passwordconfirm,
				forename = req.body.forename,
				surname = req.body.surname,
				address = req.body.address,
				liverin = req.body.liverin == 'yes',
				course = req.body.course,
				college = req.body.college,
				gamegroup = req.body.gamegroup,
				consent = ( req.body.consent.toLowerCase() === 'i agree' ),
				rememberme = req.body.rememberme == 'yes',
				errors = []

			//Check if registering or logging in
			if ( !!passwordconfirm || !!forename || !!surname || !!address || !!course ||
				!!gamegroup || !!college || !!consent ) {
				//Registering!
				if ( !consent ) {
					errors.push( 'You must agree to the disclaimer' )
				}
				if ( !validator.isEmail( email ) ) {
					//Check to make sure they give a valid email
					errors.push( 'Invalid email address' )
				}
				if ( !password || password.length < 6 ) {
					//Check if they've entered a password
					errors.push( 'Password must be longer than 6 characters' )
				} else if ( password !== passwordconfirm ) {
					//Check if the passwords match
					errors.push( 'Passwords did not match' )
				}
				if ( forename.length < 1 ) {
					//Check to make sure they give a forename
					errors.push( 'No forename given' )
				}
				if ( surname.length < 1 ) {
					//Check to make sure they give a surname
					errors.push( 'No surname given' )
				}
				if ( address.length < 1 ) {
					//Check to make sure they give an address
					errors.push( 'No address given' )
				}
				if ( course.length < 1 ) {
					//Check to make sure they give a course
					errors.push( 'No course given, use N/A if not applicable' )
				}
				if ( !gamegroup ) {
					//Check to make sure they choose a gamegroup
					errors.push( 'No game group selected' )
				}
				if ( !college && gamegroup === 'DURHAM' ) {
					errors.push( 'No college selected' )
				}

				//Check to make sure email is not in use
				Bureau.register.emailExists( email, function( err, yes ) {
					if ( yes ) {
						errors.push( 'Email address is already in use' )
					}

					if ( errors.length === 0 ) {
						//Register a new user
						var newAssassin = {
							password: password,
							email: email,
							forename: forename,
							surname: surname,
							course: course,
							address: address,
							liverin: liverin,
							gamegroup: gamegroup
						}
						if ( gamegroup === 'DURHAM' ) {
							newAssassin.college = college
						}
						Bureau.register.registerNewAssassin( newAssassin, function( err,
							assassin ) {
							Bureau.gamegroup.getGamegroups( function( err, gamegroups ) {
								res.render( 'login', {
									success: true,
									gamegroups: gamegroups
								} )
							} )
						} )
					} else {
						Bureau.gamegroup.getGamegroups( function( err, gamegroups ) {
							res.render( 'login', {
								loginErrors: errors,
								gamegroups: gamegroups
							} )
						} )
					}

				} )
			} else if ( !!email || !!password ) {
				Bureau.register.loginAssassin( email, password, function( err, assassin ) {
					if ( !assassin ) {
						errors.push( 'Incorrect email/password combination' )
						Bureau.gamegroup.getGamegroups( function( err, gamegroups ) {
							res.render( 'login', {
								loginErrors: errors,
								gamegroups: gamegroups
							} )
						} )

					} else {
						var uid = assassin._id + ''
						if ( true ) {
							res.cookie( 'BAC', uid + 'sheepworks' + utils.md5( uid + '~' +
								assassin.joindate ), {
								//Set the cookie for 2 weeks
								expires: new Date( Date.now() + 3600000 * 24 * 14 ),
								httpOnly: true
							} )
						}
						req.session.uid = uid
						req.session.gamegroup = assassin.gamegroup
						req.session.assassin = assassin
						req.session.token = utils.md5( assassin.joindate + process.env.BUREAU_TOKEN_SECRET )
						res.redirect( '/home' )
					}
				} )
			}
		}
	}

}

var authPages = {
	get: {
		home: function( req, res ) {
			var uid = res.locals.uid,
				ggid = res.locals.gamegroup.ggid
				//Display the current games with the player in
			Bureau.game.getCurrentGamesWithPlayer( uid, function( err, games ) {
				var games = Bureau.game.toArray( games ),
					numGames = games.length,
					gamesComplete = 0

				if ( numGames < 1 ) {
					res.render( 'home' )
					return
				}

				var gameLoaded = function() {

					gamesComplete++

					if ( gamesComplete === numGames ) {
						res.render( 'home', {
							games: games
						} )
					}
				}

				games.forEach( function( g ) {
					var gameid = g.gameid
					Bureau.game.render( gameid, g, uid, res.locals.gamegroup, function(
						err, gameRendered ) {
						g = gameRendered
						gameLoaded()
					} )

				} )


			} )

		},

		personal: function( req, res ) {
			var uid = req.session.uid,
				assassin = res.locals.assassin
			Bureau.assassin.stats( uid, function( err, stats ) {
				Bureau.assassin.getLethality( uid, function( err, lethality ) {
					Bureau.assassin.hasDetailsChangeRequest( uid, function( err,
						hasRequest ) {
						if ( hasRequest ) {
							for ( var key in assassin.detailsChangeRequest ) {
								assassin[ key ] = assassin.detailsChangeRequest[ key ]
							}
						}
						res.render( 'personal', {
							lethality: lethality,
							detailspending: hasRequest,
							stats: stats
						} )
					} )
				} )
			} )
		},

		updatedetails: function( req, res ) {
			res.render( 'updatedetails' )
		},

		changepassword: function( req, res ) {
			res.render( 'changepassword' )
		},

		admin: {
			'/': function( req, res ) {
				if ( !res.locals.isAdmin ) {
					res.redirect( '/home' )
					return
				}
				Bureau.gamegroup.getGamegroups( function( err, ggs ) {
					res.render( 'admin', {
						ggs: ggs
					} )
				} )
			},

			':gamegroup': function( req, res ) {
				if ( !res.locals.isAdmin ) {
					res.redirect( '/home' )
					return
				}
				var ggid = req.params.gamegroup.toUpperCase()
				Bureau.gamegroup.getGamegroup( ggid, function( err, gg ) {

					if ( err ) {
						res.write( 'No such gamegroup!' )
						return;
					}
					Bureau.gamegroup.getAssassins( ggid, function( err, assassins ) {
						res.render( 'gamegroup', {
							gg: gg,
							assassins: assassins
						} )
					} )
				} )

			}

		},

		report: function( req, res ) {
			var uid = res.locals.uid,
				victimid = res.fromPost ? req.body.victimid : req.query.victimid,
				gameid = res.fromPost ? req.body.gameid : req.query.gameid,
				ggid = res.locals.gamegroup.ggid

			Bureau.game.isPlayerInGame( victimid, gameid, function( err, isInGame ) {
				if ( err || !isInGame ) {
					req.session.pageErrors = [ 'That player isn\'t in the game!' ]
					res.redirect( 'home' )
					return
				}

				Bureau.game.isPlayerInGame( uid, gameid, function( err, isInGame ) {
					if ( err || !isInGame ) {
						req.session.pageErrors = [ 'You\'re not in that game!' ]
						res.redirect( 'home' )
						return
					}

					Bureau.assassin.getAssassin( victimid, function( err, victim ) {
						if ( victim.gamegroup !== res.locals.assassin.gamegroup ) {
							req.session.pageErrors = [
								'You can\'t kill someone from another gamegroup!'
							]
							res.redirect( 'home' )
							return
						}

						Bureau.gamegroup.getKillMethods( ggid, function( err, killmethods ) {

							var unavailableKillMethods = {};
							var renderReportPage = function() {
								res.render( 'report', {
									killmethods: killmethods,
									unavailablekillmethods: unavailableKillMethods,
									victim: victim,
									gameid: gameid
								} )
							}

							Bureau.game.getGame( gameid, function( err, game ) {
								if ( Bureau.games[ game.type ].getUnavailableKillMethods ) {

									Bureau.games[ game.type ].getUnavailableKillMethods( game,
										uid,
										function( err, killmethods ) {
											killmethods.map( function( killmethod ) {
												unavailableKillMethods[ killmethod ] = true
											} )
											renderReportPage()
										} )

								} else {
									renderReportPage()
								}
							} )
						} )
					} )
				} )
			} )
		},

		guild: {
			'/': function( req, res ) {
				if ( !res.locals.isGuild ) {
					res.redirect( '/home' )
					return
				}

				var ggid = res.locals.gamegroup.ggid,
					resumeLoading = function( reports ) {
						Bureau.assassin.getAssassins( {
							'detailsChangeRequest.state': 'waiting',
							gamegroup: ggid
						}, function( err, addressChangeRequests ) {
							Bureau.gamegroup.getAssassins( ggid, function( err, members ) {
								res.render( 'guild', {
									addressChangeRequests: addressChangeRequests,
									members: members,
									reports: reports,
								} )
							} )
						} )
					}

				Bureau.report.getPendingReports( ggid, function( err, reports ) {
					var numReportsDone = 0,
						reports = reports,
						reportDone = function() {
							if ( ++numReportsDone === reports.length ) {
								resumeLoading( reports )
							}
						}

					if ( !reports || err || reports.length < 1 ) {
						resumeLoading( [] )
					}

					reports.forEach( function( report ) {
						Bureau.report.makeFullReport( report, function( err, fullReport ) {
							report = fullReport
							reportDone()
						} )
					} )

				} )
			},

			killmethods: function( req, res ) {
				if ( !res.locals.isGuild ) {
					res.redirect( '/home' )
					return
				}
				res.render( 'killmethods', {

				} )
			},

			newgame: function( req, res ) {
				if ( !res.locals.isGuild ) {
					res.redirect( '/home' )
					return
				}
				Bureau.game.getPlayersForNewGame( res.locals.gamegroup.ggid, function(
					err,
					possiblePlayers ) {
					if ( err ) {
						res.locals.pageErrors.push( err )
					}
					res.render( 'newgame', {
						gameTypes: Bureau.games,
						possiblePlayers: possiblePlayers,
						startdate: utils.prettyTimestamp( moment( 6, 'H' ).add( 1, 'days' ) ),
						enddate: utils.prettyTimestamp( moment( 6, 'H' ).add( 15, 'days' ) )
					} )
				} )

			},

			gamestate: function( req, res ) {
				if ( !res.locals.isGuild ) {
					res.redirect( '/home' )
					return
				}

				var ggid = res.locals.gamegroup.ggid,
					displayPage = function( games ) {
						res.render( 'gamestate', {
							games: games.sort( function( a, b ) {
								return b.end - a.end
							} )
						} )
					}

				Bureau.game.getGamesInGamegroupAsArray( ggid, function( err, games ) {
					if ( err ) {
						res.locals.pageErrors.push( err )
					}

					//Remove archived games
					games = games.filter( function( g ) {
						return !g.archived
					} )

					var i = 0,
						l = games.length,
						loaded = 0,
						g = null

					//If we don't have any games...
					if ( l === 0 ) {
						displayPage( [] )
					}


					for ( i; i < l; i++ ) {
						g = games[ i ]

						Bureau.game.getAssassins( g.gameid, ( function( j ) {
							return function( err, assassins ) {
								loaded++

								if ( Bureau.games[ games[ j ].type ].hasOwnProperty( 'getScoreForUid' ) ) {
									var gameController = Bureau.games[ games[ j ].type ]

									assassins.map( function( assassin ) {
										var uid = assassin._id + ''
										games[ j ].players[ uid ].score = gameController.getScoreForUid( games[ j ], uid )
									} )
								}

								games[ j ].assassins = assassins.sort( function( a, b ) {
									return games[ j ].players[ b._id + '' ].score - games[ j ].players[
										a._id + '' ].score
								} )
								if ( loaded === l * 3 ) {
									displayPage( games )
								}
							}
						} )( i ) )

						Bureau.game.getPossibleAssassins( g.gameid, ggid, ( function( j ) {
							return function( err, assassins ) {
								loaded++
								games[ j ].possibleAssassins = assassins
								if ( loaded === l * 3 ) {
									displayPage( games )
								}
							}
						} )( i ) )

						if ( Bureau.games[ g.type ].getParamChangeFragment ) {
							Bureau.games[ g.type ].getParamChangeFragment( g, ( function( j ) {
								return function( err, frag ) {
									loaded++
									games[ j ].paramChangeFragment = frag
									if ( loaded === l * 3 ) {
										displayPage( games )
									}
								}
							} )( i ) )
						} else {
							loaded++
							if ( loaded === l * 3 ) {
								displayPage( games )
							}
						}

					}

				} )
			},

			allreports: function( req, res ) {
				var ggid = res.locals.gamegroup.ggid,
					start = new Date()
				Bureau.report.getProcessedReportsByGame( ggid, function( err, games ) {
					res.render( 'allreports', {
						reportsByGame: games
					} )
				} )
			}
		},

		data: {
			players: {
				':gameid.csv': function( req, res ) {
					Bureau.game.getAssassins( req.params.gameid, function( err, assassins ) {
						assassins.unshift( {
							forename: 'Forename',
							surname: 'Surname',
							college: 'College',
							course: 'Course',
							address: 'Address',
							liverin: 'Living In'
						} )
						var out = assassins.map( function( a ) {
							return '"' + [ a.forename, a.surname, a.college, a.course, a.address,
								a.liverin
							].join( '","' ) + '"'
						} )
						res.set( 'Content-Type', 'text/csv' )
						res.end( out.join( '\n' ) )
					} )
				}
			}
		}
	},
	post: {
		admin: {
			'/': function( req, res ) {
				if ( !res.locals.isAdmin ) {
					res.redirect( '/home' )
					return
				}
				switch ( req.body.action ) {
					case 'newgamegroup':
						var ggname = req.body.name
						if ( !!ggname ) {
							Bureau.gamegroup.addGamegroup( {
								name: ggname,
								ggid: ggname.replace( /[^\w\s]|_/g, "" ).replace( /\s+/g, "" ).toUpperCase()
							}, function( err, gg ) {
								authPages.get.admin[ '/' ]( req, res )
							} )
						} else {
							authPages.get.admin[ '/' ]( req, res )
						}
						break;
				}
			},

			':gamegroup': function( req, res ) {
				switch ( req.body.action ) {
					case 'changeguild':
						var uid = req.body.assassinuid,
							shouldBeGuild = req.body.shouldBeGuild === 'yes'
						Bureau.assassin.setGuild( uid, shouldBeGuild, function( err, doc ) {
							authPages.get.admin[ ':gamegroup' ]( req, res )
						} )
						break;
					case 'changeemail':
						var email = req.body.email,
							ggid = req.params.gamegroup.toUpperCase()

						Bureau.gamegroup.setEmail( ggid, email, function( err, gg ) {
							authPages.get.admin[ ':gamegroup' ]( req, res )
						} )

						break;
					default:
						authPages.get.admin[ ':gamegroup' ]( req, res )
						break;
				}
			}
		},

		report: function( req, res ) {
			var uid = res.locals.uid,
				victimid = req.body.victimid,
				gameid = req.body.gameid,
				killmethod = req.body.killmethod,
				methoddetail = req.body[ 'killmethod-detail' ],
				place = req.body.place,
				coords = req.body.coords,
				text = req.body[ 'report-text' ],
				time = !!req.body.time ? utils.dateFromPrettyTimestamp( req.body.time ) :
				false,
				ggid = res.locals.gamegroup.ggid,
				now = new Date(),
				errs = [],
				report = {
					killerid: uid,
					victimid: victimid,
					gameid: gameid,
					time: req.body.time,
					place: place,
					killmethod: killmethod,
					methoddetail: methoddetail,
					text: text,
					coords: coords,
					state: 'waiting'
				}
			console.log( 'Loading report page' )
			console.log( req.body, report )

			res.locals = _.merge( res.locals, report )

			res.fromPost = true
				//Let's validate some shiii
			if ( !text || text.length < 11 ) {
				errs.push( 'Please specify a longer kill report!' )
			}
			if ( !place || place.length < 6 ) {
				errs.push( 'Please specify a longer place name!' )
			}
			if ( !killmethod ) {
				errs.push( 'Please specify a kill method!' )
			}
			if ( !victimid ) {
				errs.push( 'Your kill has no victim' )
			}
			if ( !( !!time && !isNaN( time.getMonth() ) && time < now && req.body.time
					.length ===
					19 && utils.dateRegex.test( req.body.time ) ) ) {
				errs.push( 'Invalid time of kill!' )
			}

			if ( errs.length > 0 ) {
				res.locals.pageErrors = errs
				authPages.get.report( req, res )
				return
			}
			console.log( 'Getting game' )
			Bureau.game.getGame( gameid, function( err, game ) {
				console.log( 'Got game' )
				if ( err ) {
					req.session.pageErrors = [ err ]
					res.redirect( 'home' )
					return
				}
				console.log( 'Checking if victim is in game' )
				Bureau.game.isPlayerInGame( victimid, gameid, function( err, isInGame ) {
					if ( err || !isInGame ) {
						console.log( 'Error getting if victim is in game: ', err )
						req.session.pageErrors = [ 'That player isn\'t in the game!' ]
						res.redirect( 'home' )
						return
					}
					console.log( 'Got victim in game' )
					console.log( 'Checking if player is in game' )
					Bureau.game.isPlayerInGame( uid, gameid, function( err, isInGame ) {
						if ( err || !isInGame ) {
							req.session.pageErrors = [ 'You\'re not in that game!' ]
							res.redirect( 'home' )
							return
						}
						console.log( 'Got player in game' )
						console.log( 'Getting victim' )
						Bureau.assassin.getAssassin( victimid, function( err, victim ) {
							if ( victim.gamegroup !== res.locals.assassin.gamegroup ) {
								console.log( 'Assassin is not in same gamegroup' )
								req.session.pageErrors = [
									'You can\'t kill someone from another gamegroup!'
								]
								res.redirect( 'home' )
								return
							}
							if ( err || !victim._id ) {
								console.log( 'Victim has invalid id' )
								req.session.pageErrors = [ 'That isn\'t a valid assassin id!' ]
								res.redirect( 'home' )
								return
							}
							console.log( 'Got victim' )
							console.log( 'Checking kill valid' )
							report.time = time
							Bureau.games[ game.type ].checkKillValid( game, uid, victimid,
								killmethod, time, report,
								function( err, valid ) {
									if ( err || !valid ) {
										console.log( err ? ( 'Error checking if kill valid: ' +
												err ) :
											'Kill invalid' )
										req.session.pageErrors = [ !!err ?
											'There was an error submitting the report' :
											'The kill was invalid!'
										]
										res.redirect( 'home' )
										return
									}
									console.log( 'Kill id valid' )
									console.log( 'Submitting report' )
									Bureau.report.submitReport( report, function( err, a ) {
										console.log( 'Report submitted' )
										console.log( err )
										res.redirect( 'home' )
									} )
								} )
						} )
					} )
				} )
			} )
		},

		personal: function( req, res ) {

			switch ( req.body.action ) {
				case 'picturechange':
					var imgPath = req.files.picture.path,
						uid = req.session.uid
					gm( imgPath ).size( function( err, size ) {
						if ( !err && !!size ) {
							var w = size.width > size.height ? Math.floor( size.width * 128 /
									size.height ) : 128,
								tempName = __dirname + '/temp/' + utils.md5( new Date().toString() +
									Math.random().toString() ) + '.jpg'
							this
								.resize( w )
								.gravity( 'Center' )
								.extent( 128, 128 )
								.quality( 70 )
								.write( tempName, function( err ) {
									if ( err ) throw err;
									fs.readFile( tempName, function( err, data ) {
										if ( err ) {
											res.locals.pageErrors.push(
												'There was an error uploading the picture' )
											authPages.get.personal( req, res )
										} else {
											var s3 = new AWS.S3(),
												bucket = 'bureau-engine',
												imgKey = 'pictures/' + uid + '.jpg'
											s3.putObject( {
												ACL: 'public-read', // by default private access
												Bucket: bucket,
												Key: imgKey,
												Body: data
											}, function( err, data ) {
												if ( err ) {
													console.log( err )
													res.locals.pageErrors.push( 'Image uploading failed :(' )
													authPages.get.personal( req, res )
												} else {
													Bureau.assassin.setPicture( uid, process.env.AWS_PATH +
														imgKey,
														function( err, doc ) {
															if ( err ) console.log( err );
															Bureau.assassin.getAssassin( uid, function( err,
																assassin ) {
																//Force update of page to prevent having to reload
																res.locals.assassin = assassin
																authPages.get.personal( req, res )
															} )
														} )

												}
											} )
										}
									} )
								} )
						} else {
							authPages.get.personal( req, res )
						}
					} )
					break;
				case 'detailschange':
					Bureau.assassin.hasDetailsChangeRequest( req.session.uid, function( err,
						hasRequest ) {
						if ( !hasRequest ) {
							Bureau.assassin.submitDetailsChangeRequest( req.session.uid, req.body,
								function( err, doc ) {
									authPages.get.personal( req, res )
								} )
						} else {
							res.send( 'Error! You already have a pending address request' )
						}
					} )
					break;
				default:
					authPages.get.personal( req, res )
					break;
			}

		},

		updatedetails: function( req, res ) {
			var loadPage = function() {
				Bureau.assassin.markDetailsUpdated( req.session.uid, function( err,
					assassin ) {
					res.redirect( '/home' )
				} )
			}
			switch ( req.body.action ) {
				case 'detailschange':
					Bureau.assassin.submitDetailsChangeRequest( req.session.uid, req.body,
						function( err, doc ) {
							loadPage()
						} )
					break;
				default:
					loadPage()
					break;
			}

		},

		changepassword: function( req, res ) {
			var oldpassword = req.body.oldpassword,
				newpassword = req.body.newpassword,
				verifypassword = req.body.verifypassword,
				uid = req.session.uid,
				errs = []

			if ( !oldpassword ) {
				errs.push( 'You must enter your old password' )
			}
			Bureau.assassin.checkPassword( uid, oldpassword, function( err, correct ) {
				if ( !correct ) {
					errs.push( 'The old password was incorrect' )
				}

				if ( !newpassword || newpassword.length < 6 ) {
					errs.push( 'Your new password must be at least 6 characters long' )
				} else if ( newpassword !== verifypassword ) {
					errs.push(
						'Your new password didn\'t match! You might have typed it incorrectly'
					)
				}

				if ( errs.length < 1 ) {
					Bureau.assassin.setPassword( uid, newpassword, function( err, success ) {
						if ( err ) {
							req.session.pageErrors.push( err )

						} else {
							Bureau.assassin.addNotification( uid,
								'Your password was successfully changed' )
						}
						res.redirect( '/personal' )
					} )
				} else {

					if ( !res.locals.assassin.temppassword ) {
						req.session.pageErrors = errs
						res.redirect( '/personal' )
					} else {
						res.locals.pageErrors = errs
						authPages.get.changepassword( req, res )
					}
				}

			} )
		},

		guild: {
			'/': function( req, res ) {
				if ( !res.locals.isGuild ) {
					res.redirect( '/home' )
					return
				}
				switch ( req.body.action ) {

					case 'forcedetailsupdate':
						var ggid = res.locals.gamegroup.ggid
						Bureau.gamegroup.forceDetailsUpdate( ggid, function( err, misery ) {
							if ( err ) {
								res.locals.pageErrors.push( err )
								authPages.get.guild[ '/' ]( req, res )
							} else {
								Bureau.gamegroup.notifyGuild( res.locals.gamegroup.ggid, utils.fullname(
										res.locals.assassin ) +
									' forced a details update on the whole gamegroup and everyone is sad :(',
									'', false,
									function( err, assassins ) {
										authPages.get.guild[ '/' ]( req, res )
									} )
							}
						} )
						break;

					case 'killreportprocess':
						var approved = req.body.state == '✓',
							state = approved ? 'approved' : 'rejected',
							reportid = req.body.reportid,
							comment = req.body.guildcomment,
							killerid = req.body.killerid,
							gameid = req.body.gameid,
							loadPage = function() {
								authPages.get.guild[ '/' ]( req, res )
							}

						if ( approved ) {
							Bureau.report.acceptReport( reportid, function( err, report ) {
								Bureau.game.getGame( gameid, function( err, game ) {
									var gametype = game.type
									Bureau.games[ gametype ].handleKill( game, report.killerid,
										report.victimid,
										report, loadPage )
								} )
							} )
						} else {
							Bureau.report.rejectReport( reportid, comment, function( err, report ) {
								Bureau.assassin.getAssassin( report.victimid, function( err, victim ) {

									var killerNotification = 'Your kill on ' + utils.fullname( victim ) +
										' was rejected by ' + utils.fullname( res.locals.assassin ) +
										' with reason "' + comment + '"'
									Bureau.assassin.addNotification( killerid, killerNotification )

									Bureau.assassin.getAssassin( report.killerid, function( err, killer ) {

										var victimNotification = utils.fullname( killer ) +
											'\'s kill on you was rejected by ' + utils.fullname( res.locals.assassin ) +
											' with reason "' + comment + '"'

										Bureau.assassin.addNotification( victim._id + '', victimNotification )
									} )

									loadPage()
								} )
							} )
						}

						break;

					case 'setmotd':
						var motd = req.body.motd
						Bureau.gamegroup.setMotd( res.locals.gamegroup.ggid, motd, function(
							err,
							doc ) {
							if ( !err ) {
								var notif = res.locals.assassin.forename + ' ' + res.locals.assassin
									.surname + ' has set the MotD to :"' + motd.trim() + '"'
								Bureau.gamegroup.notifyGuild( res.locals.gamegroup.ggid, notif,
										false,
										function( err, assassins ) {
											authPages.get.guild[ '/' ]( req, res )
										} )
									//Manually update the locals, otherwise they'll have the previous value
								res.locals.gamegroup = doc
							}
							authPages.get.guild[ '/' ]( req, res )
						} )
						break;
					case 'addresschange':
						var uid = req.body.requester,
							state = req.body.state,
							message = req.body.message

						if ( !state ) {
							authPages.get.guild[ '/' ]( req, res )
							return
						}
						Bureau.assassin.getAssassin( uid, function( err, assassin ) {
							if ( state == 'Approved' ) {
								//Change the details around
								Bureau.assassin.getAssassin( uid, function( err, assassin ) {
									var d = assassin.detailsChangeRequest
									delete d.state
									delete d.submitted
									d.detailsChangeRequest = {}
									d.detailsUpdated = true
									d.detailsLastUpdated = new Date()

									Bureau.assassin.updateAssassin( uid, d, function( err, assassin ) {
										Bureau.assassin.addNotification( uid,
											'Your details change request was approved.' )
										authPages.get.guild[ '/' ]( req, res )
									} )
								} )
							} else {
								//Delete the request
								Bureau.assassin.updateAssassin( uid, {
									detailsChangeRequest: {}
								}, function( err, doc ) {
									var notificationString =
										'Your details change request was rejected'
									if ( !!message ) {
										notificationString += ' with reason: ' + message
									}
									Bureau.assassin.addNotification( uid, notificationString )
									authPages.get.guild[ '/' ]( req, res )
								} )
							}
						} )

						break;
					case 'notifymembers':
						var msg = req.body.notifytext
						if ( !msg || msg.trim().length < 10 ) {
							res.locals.pageErrors.push(
								'Your message was too short! (less than 10 chars)' )
							authPages.get.guild[ '/' ]( req, res )
							return
						}
						Bureau.gamegroup.notifyGamegroup( res.locals.gamegroup.ggid, msg.trim(),
							'from ' + res.locals.gamegroup.name + ' Guild', false,
							function( err, assassins ) {
								authPages.get.guild[ '/' ]( req, res )
							} )


						break;
					default:
						authPages.get.guild[ '/' ]( req, res )
						break;

				}
			},

			killmethods: function( req, res ) {
				if ( !res.locals.isGuild ) {
					res.redirect( '/home' )
					return
				}
				switch ( req.body.action ) {
					case 'newkillmethod':
						var name = req.body.methodname,
							zone = req.body.methodzone,
							hasDetail = req.body.methoddetailneeded,
							detail = req.body.methoddetailquestion,
							verb = req.body.methodverb,
							rules = req.body.methodrules,
							errs = []

						if ( !name || name.trim().length < 3 ) {
							errs.push( 'Invalid name specified' )
						}
						if ( !zone ) {
							errs.push( 'No zone specified' )
						}
						if ( hasDetail && ( !detail || detail.trim().length < 6 ) ) {
							errs.push( 'No detail question specified!' )
						}
						if ( !verb || verb.trim().length < 6 ) {
							errs.push( 'Invalid kill sentence!' )
						} else if ( verb.indexOf( '#k' ) < 0 ) {
							errs.push( 'Add #k to your kill sentence so the killer shows up!' )
						} else if ( verb.indexOf( '#v' ) < 0 ) {
							errs.push( 'Add #v to your kill sentence so the victim shows up!' )
						} else if ( hasDetail && verb.indexOf( '#d' ) < 0 ) {
							errs.push( 'Add #d to your kill sentence so the detail shows up!' )
						}
						if ( !rules || rules.trim().length < 11 ) {
							errs.push( 'Please specify rules' )
						}

						res.locals.pageErrors = errs

						if ( errs.length > 0 ) {
							authPages.get.guild.killmethods( req, res )
							return
						}

						var method = {
							id: name.toLowerCase().replace( /\s+/, '' ),
							name: name.trim(),
							zone: zone.trim(),
							verb: verb.trim(),
							rules: rules.trim()
						}
						if ( hasDetail ) {
							method.detailquestion = detail.trim()
						}

						Bureau.gamegroup.addKillMethod( res.locals.gamegroup.ggid, method,
							function( err, methods ) {
								if ( err ) {
									res.locals.pageErrors.push( 'Error adding the new killmethod "' +
										name + '": ' + err )
								} else {
									res.locals.gamegroup.killmethods = methods
								}
								authPages.get.guild.killmethods( req, res )
							} )

						break;
					case 'editkillmethod':
						var id = req.body.methodid,
							detail = req.body.methoddetailquestion,
							verb = req.body.methodverb,
							rules = req.body.methodrules,
							retired = !req.body.enabled,
							errs = []

						Bureau.gamegroup.getKillMethod( res.locals.gamegroup.ggid, id, function(
							err, method ) {
							if ( err ) {
								res.locals.pageErrors.push( 'Invalid kill method id' )
								authPages.get.guild.killmethods( req, res )
								return
							} else {
								var hasDetail = !!method.detailquestion

								if ( hasDetail && ( !detail || detail.trim().length < 6 ) ) {
									errs.push( 'No detail question specified!' )
								}
								if ( !verb || verb.trim().length < 6 ) {
									errs.push( 'Invalid kill sentence!' )
								} else if ( verb.indexOf( '#k' ) < 0 ) {
									errs.push( 'Add #k to your kill sentence so the killer shows up!' )
								} else if ( verb.indexOf( '#v' ) < 0 ) {
									errs.push( 'Add #v to your kill sentence so the victim shows up!' )
								} else if ( hasDetail && verb.indexOf( '#d' ) < 0 ) {
									errs.push( 'Add #d to your kill sentence so the detail shows up!' )
								}
								if ( !rules || rules.trim().length < 11 ) {
									errs.push( 'Please specify rules' )
								}
								res.locals.pageErrors = errs

								if ( errs.length > 0 ) {
									authPages.get.guild.killmethods( req, res )
									return
								}


								var m = {
									verb: verb,
									retired: retired,
									rules: rules
								}

								if ( hasDetail ) {
									m.detailquestion = detail
								}

								Bureau.gamegroup.updateKillMethod( res.locals.gamegroup.ggid, id, m,
									function( err, methods ) {
										if ( err ) {
											res.locals.pageErrors.push( 'Error editing the killmethod "' +
												method.name + '": ' + err )
										} else {
											res.locals.gamegroup.killmethods = methods
										}
										authPages.get.guild.killmethods( req, res )
									} )
							}

						} )

						break;

					default:
						authPages.get.guild.killmethods( req, res )
						break;
				}
			},

			newgame: function( req, res ) {
				if ( !res.locals.isGuild ) {
					res.redirect( '/home' )
					return
				}
				switch ( req.body.action ) {
					case 'newgame':
						var title = req.body.title,
							playerIds = req.body.uids,
							gametype = req.body.gametype,
							start = utils.dateFromPrettyTimestamp( req.body.start ),
							end = utils.dateFromPrettyTimestamp( req.body.end ),
							now = new Date(),
							ggid = res.locals.gamegroup.ggid,
							errs = []

						if ( !Bureau.game.isGameType( gametype ) ) {
							errs.push( '"' + gametype + '" is not a valid game type' )
						}
						if ( !title || title.length < 4 ) {
							errs.push( 'Please specify a longer game title!' )
						}
						if ( !playerIds || !Array.isArray( playerIds ) || playerIds.length < 2 ) {
							errs.push( 'Please add some players to your game' )
						}
						if ( !( !!start && !isNaN( start.getMonth() ) && start > now && req.body
								.start
								.length === 19 && utils.dateRegex.test( req.body.start ) ) ) {
							errs.push( 'Invalid game start date' )
						}
						if ( !( !!end && !isNaN( end.getMonth() ) && end > now && req.body.end.length ===
								19 && utils.dateRegex.test( req.body.end ) ) ) {
							errs.push( 'Invalid game end date' )
						}


						res.locals.pageErrors = errs

						if ( errs.length > 0 ) {
							authPages.get.guild.newgame( req, res )
							return
						}

						var gameData = {
								name: title,
								players: playerIds,
								type: gametype,
								start: start,
								end: end,
								custom: {}
							},
							game = Bureau.games[ gametype ],
							notificationString = res.locals.assassin.forename + ' ' + res.locals.assassin
							.surname + ' created a new ' + game.label + ' game starting on ' +
							moment( start ).format( 'MMMM Do YYYY, h:mm:ss a' )

						//Attach all the extraneous form data that might be related to the new game. This is filthy dirty bad bad and possibly a vulnerability.
						var exclude = [ 'title', 'uids', 'gametype', 'start', 'end', 'action',
							'token', ''
						]
						for ( var key in req.body ) {
							if ( req.body.hasOwnProperty( key ) && exclude.indexOf( key ) < 0 ) {
								gameData.custom[ key ] = req.body[ key ]
							}
						}

						Bureau.game.newGame( ggid, gameData, function( err, game ) {
							if ( !err ) {
								Bureau.gamegroup.notifyGuild( ggid, notificationString, '', false,
									function( err ) {
										if ( err ) {
											//Don't fail completely if we only fail to send a notification
											res.locals.pageErrors.push(
												'Failed to send notification to guild about the new game' )
										}

										authPages.get.home( req, res )

									} )
							} else {
								res.locals.pageErrors.push( err )
								authPages.get.guild.newgame( req, res )
							}
						} )

						break;

					default:
						authPages.get.guild.newgame( req, res )
						break;

				}
			},

			gamestate: function( req, res ) {
				if ( !res.locals.isGuild ) {
					res.redirect( '/home' )
					return
				}
				switch ( req.body.action ) {
					case 'removeplayer':
						var gameid = req.body.gameid,
							uid = req.body.uid,
							errs = []

						Bureau.game.getGame( gameid, function( err, game ) {
							if ( err ) {
								res.locals.pageErrors.push( err )
								authPages.get.guild.gamestate( req, res )
								return
							}

							var gametype = game.type

							console.log( utils.fullname( res.locals.assassin ) + ' is removing player ' + uid + 'from game ' + game.name )

							Bureau.games[ gametype ].handlePlayerRemoved( game, uid, function(
								err ) {
								if ( err ) {
									res.locals.pageErrors.push(
										'There was an error removing the player from the game' )
									authPages.get.guild.gamestate( req, res )
									return
								}

								Bureau.game.removePlayer( gameid, uid, function( err ) {
									if ( err ) {
										res.locals.pageErrors.push(
											'There was an error removing the player from the game' )
									}


									Bureau.assassin.getAssassin( uid, function( err, removedAssassin ) {
										var assassinName = utils.fullname( removedAssassin )
										var notificationText = assassinName + ' was removed from the game "' +
											game.name + '" by ' + utils.fullname( res.locals.assassin )
										Bureau.gamegroup.notifyGuild( res.locals.gamegroup.ggid, notificationText )
									} )

									authPages.get.guild.gamestate( req, res )
								} )
							} )

						} )

						break;

					case 'addplayer':
						var gameid = req.body.gameid,
							uid = req.body.uid,
							errs = []

						Bureau.game.getGame( gameid, function( err, game ) {
							if ( err ) {
								res.locals.pageErrors.push( err )
								authPages.get.guild.gamestate( req, res )
								return
							}

							var gametype = game.type



							Bureau.game.addPlayer( gameid, uid, function( err ) {
								if ( err ) {
									res.locals.pageErrors.push(
										'There was an error adding the player to the game' )
									authPages.get.guild.gamestate( req, res )
									return
								}

								Bureau.games[ gametype ].handlePlayerAdded( game, uid, function(
									err ) {
									if ( err ) {
										res.locals.pageErrors.push(
											'There was an error adding the player to the game' )
										authPages.get.guild.gamestate( req, res )
										return
									}
									authPages.get.guild.gamestate( req, res )
								} )
							} )

						} )
						break;

					case 'changegametime':
						var gameid = req.body.gameid,
							start = utils.dateFromPrettyTimestamp( req.body.start ),
							end = utils.dateFromPrettyTimestamp( req.body.end ),
							ggid = res.locals.gamegroup.ggid,
							errs = []

						if ( !( !!start && !isNaN( start.getMonth() ) && req.body.start.length ===
								19 && utils.dateRegex.test( req.body.start ) ) ) {
							errs.push( 'Invalid game start date' )
						}
						if ( !( !!end && !isNaN( end.getMonth() ) && req.body.end.length === 19 &&
								utils.dateRegex.test( req.body.end ) ) ) {
							errs.push( 'Invalid game end date' )
						}


						res.locals.pageErrors = errs

						if ( errs.length > 0 ) {
							authPages.get.guild.newgame( req, res )
							return
						}

						Bureau.game.changeGameTimes( gameid, start, end, function( err, game ) {
							if ( err ) {
								res.locals.pageErrors.push( err )
							}

							var notificationString = res.locals.assassin.forename + ' ' + res.locals
								.assassin.surname + ' changed the start+end dates of game "' + game
								.name + '" to run from ' + moment( start ).format(
									'MMMM Do YYYY, h:mm:ss a' ) + ' to ' + moment( end ).format(
									'MMMM Do YYYY, h:mm:ss a' )

							if ( !err ) {
								Bureau.gamegroup.notifyGuild( ggid, notificationString, '', false,
									function( err ) {
										if ( err ) {
											res.locals.pageErrors.push(
												'Failed to send notification to guild about changing the game dates'
											)
										}
										authPages.get.guild.gamestate( req, res )

									} )
							} else {
								res.locals.pageErrors.push( err )
								authPages.get.guild.gamestate( req, res )
							}
						} )

						break;

					case 'archivegame':
						var gameid = req.body.gameid,
							ggid = res.locals.gamegroup.ggid

						Bureau.game.archiveGame( gameid, function( err, game ) {
							if ( err ) {
								res.locals.pageErrors.push( err )
								authPages.get.guild.gamestate( req, res )
								return
							}

							var notificationString = res.locals.assassin.forename + ' ' + res.locals
								.assassin.surname + ' archived the game "' + game.name + '"'

							if ( !err ) {
								Bureau.gamegroup.notifyGuild( ggid, notificationString, '', false,
									function( err ) {
										if ( err ) {
											res.locals.pageErrors.push(
												'Failed to send notification to guild about archiving the game'
											)
										}

										authPages.get.guild.gamestate( req, res )

									} )
							} else {
								res.locals.pageErrors.push( err )
								authPages.get.guild.gamestate( req, res )
							}

						} )
						break;

					case 'changegamestate':
						var gameid = req.body.gameid,
							playerid = req.body.playerid,
							data = req.body

						delete req.body.token

						console.log( req.body )
						Bureau.game.changeGameState( gameid, playerid, data, function( err,
							game ) {
							if ( err ) {
								res.locals.pageErrors.push( err )
							}
							authPages.get.guild.gamestate( req, res )
						} )
						break;

					case 'changegameparams':
						var gameid = req.body.gameid,
							data = req.body

						delete data.token
						delete data.action
						delete data.submit
						delete data.gameid

						Bureau.game.getGame( gameid, function( err, g ) {
							Bureau.games[ g.type ].changeGameParams( g, data, function( err,
								game ) {
								if ( err ) {
									res.locals.pageErrors.push( err )
								}
								authPages.get.guild.gamestate( req, res )
							} )
						} )
						break;

					default:
						authPages.get.guild.gamestate( res, res )
						break;
				}
			},

			allreports: function( req, res ) {
				if ( !res.locals.isGuild ) {
					res.redirect( '/home' )
					return
				}
				switch ( req.body.action ) {
					case 'killreportchange':
						var gameid = req.body.gameid,
							reportid = req.body.reportid,
							state = req.body.state,
							approved = ( state === 'approved' ),
							comment = req.body.guildcomment,
							loadPage = function( err, report ) {
								if ( err ) {
									res.locals.pageErrors.push( err )
								}
								authPages.get.guild.allreports( res, res )
							}

						Bureau.game.getGame( gameid, function( err, game ) {
							if ( err ) {
								res.locals.pageErrors.push( err )
								authPages.get.guild.allreports( res, res )
								return
							}
							Bureau.report.getReport( reportid, function( err, report ) {
								if ( err ) {
									res.locals.pageErrors.push( err )
									authPages.get.guild.allreports( res, res )
									return
								}
								var ria = ( report.state === 'approved' )

								console.log( approved, ria, report )

								if ( ria !== approved ) {
									//An already approved report can't be reapproved by cheaty form editing
									res.locals.pageErrors.push( 'That report has already been ' + ( !
										ria ? 'rejected' : 'approved' ) )
									authPages.get.guild.allreports( res, res )
									return
								}

								if ( approved ) {
									//Retroactively reject the kill
									Bureau.games[ game.type ].undoKill( game, report.killerid,
										report.victimid,
										report,
										function( err, game ) {
											Bureau.report.rejectReport( reportid, comment, loadPage )
										} )
								} else {
									//Retroactively approve the kill
									Bureau.games[ game.type ].handleKill( game, report.killerid,
										report
										.victimid, report,
										function( err, game ) {
											Bureau.report.acceptReport( reportid, loadPage )
										} )
								}
							} )
						} )
						break;

					default:
						authPages.get.guild.allreports( res, res )
						break;

				}
			}
		},

		api: {

			write: {

				setOptout: function( req, res ) {
					var uid = req.body.uid,
						optout = req.body.data.optout

					Bureau.assassin.setOptout( uid, optout, function( err ) {

						if ( err ) {
							res.status( 500 ).send( err )
							return
						}

						res.json( {
							optout: optout
						} )

						Bureau.assassin.addNotification( uid, 'You will now ' + ( optout ? 'no longer ' : '' ) +
							'be automatically added to a new game if you played in the previous one.'
						)

					} );
				}
			}
		}
	}
}

var authURLS = []

var isProduction = process.env.NODE_ENV === 'production'

var bodyParser = require( 'body-parser' )

//Setup middleware
app.use( require( 'compression' )() )
app.use( '/js/libs/:lib', require( './serve-js-libs' ) )
app.use( require( 'serve-static' )( isProduction ? 'build/static' : 'static' ) )
app.use( bodyParser.json() )
app.use( bodyParser.urlencoded( {
	extended: true
} ) )
app.use( '/personal', require( 'multer' )().any() )
app.use( require( 'cookie-parser' )( process.env.BUREAU_COOKIE_SECRET ) )
app.use( session( {
	store: new MongoStore( {
		url: utils.mongourl()
	} ),
	resave: true,
	saveUninitialized: false,
	secret: process.env.BUREAU_COOKIE_SECRET,
	cookie: {
		expires: new Date( Date.now() + 60 * 60 * 24 * 60 )
	}
} ) )

app.engine( 'html', swig.renderFile );
app.set( 'view engine', 'html' );
app.set( 'views', __dirname + '/views' );
// app.set('view cache', false);
if ( !isProduction ) {
	swig.setDefaults( {
		cache: false
	} )

	var clientDevFiles = require( './devStatic' )
}


app.use( function( req, res, next ) {

	if ( req.subdomains[ 0 ] === 'api' ) {

		req.url = '/api' + req.url

	}

	next()
} )

var apiHandler = require( './api/api' )

//For authed pages
var checkAuth = function( req, res, next ) {
	if ( !!req.cookies.BAC && ( !req.session.uid || !req.session.gamegroup || !
			req
			.session
			.token ) ) {
		var parts = req.cookies.BAC.split( 'sheepworks' ),
			cUID = parts[ 0 ],
			cTOK = parts[ 1 ]

		Bureau.assassin.getSalt( cUID, function( err, salt ) {
			if ( cTOK === salt ) {
				Bureau.assassin.getAssassin( cUID, function( err, assassin ) {
					if ( err ) {
						res.redirect( '/goodbye' )
						return
					}
					req.session.uid = assassin._id + '' //Force it to be a string so we don't get crashes...
					req.session.gamegroup = assassin.gamegroup
					req.session.assassin = assassin
					req.session.token = utils.md5( assassin.joindate + process.env.BUREAU_TOKEN_SECRET )
					next()
				} )
			} else {
				res.redirect( '/goodbye' )
			}
		} )
	} else if ( !req.session.uid || !req.session.gamegroup || !req.session.token ) {
		res.redirect( '/goodbye' )
	} else {
		next()
	}
	//	next()
}

//For checking if details updated/password needs resetting etc
var checkForceRedirect = function( req, res, next ) {
	if ( !res.locals.assassin.detailsUpdated ) {
		if ( req.route.path === '/updatedetails' ) {
			next()
		} else {
			res.redirect( '/updatedetails' )
		}
	} else if ( res.locals.assassin.temppassword ) {
		if ( req.route.path === '/changepassword' ) {
			next()
		} else {
			res.redirect( '/changepassword' )
		}
	} else {
		next()
	}
}

var addLocals = function( req, res, next ) {
	Bureau.assassin.getAssassin( req.session.uid, function( err, assassin ) {
		Bureau.gamegroup.getGamegroup( req.session.gamegroup, function( err,
			gamegroup ) {
			//Update when we last saw them
			Bureau.assassin.updateLastHere( req.session.uid )

			var isAdmin = process.env.BUREAU_ADMIN_EMAILS.split( ',' ).indexOf( assassin.email ) > -1

			res.locals.projectedAssassin = {
				id: assassin._id,
				forename: assassin.forename,
				surname: assassin.surname,
				nickname: assassin.nickname,
				imgname: assassin.imgname,
				course: assassin.course,
				address: assassin.address,
				liverin: assassin.liverin,
				gamegroup: assassin.gamegroup,
				college: assassin.college,
				guild: assassin.guild,
				admin: isAdmin
			}

			res.locals.now = new Date()
			res.locals.PRODUCTION_ENV = isProduction
			res.locals.isGuild = assassin.guild
			res.locals.isAdmin = isAdmin
			res.locals.uid = req.session.uid
			res.locals.gamegroup = gamegroup
			res.locals.token = req.session.token
			res.locals.assassin = assassin
			res.locals.APP_TOKEN = process.env.BUREAU_APP_TOKEN
			res.locals.pageErrors = !!req.session.pageErrors ? req.session.pageErrors : []
			req.session.pageErrors = null

			if ( !isProduction ) {
				res.locals.CLIENT_DEV_FILES = clientDevFiles
			}
			next()
		} )
	} )
}

//For post requests
var checkToken = function( req, res, next ) {
	var seshtoken = req.session.token,
		formtoken = req.body.token

	if ( !seshtoken ) {
		res.send(
			'Error! No session token :( Try <a href="/goodbye">logging in again</a>.' )
	} else if ( !formtoken ) {
		res.send( 'Error! No authentication. Nice hax bro.' )
	} else if ( seshtoken !== formtoken ) {
		res.send( 'Error! Invalid authentication.' )
	} else {
		next()
	}
}

app.use( '/health', ( req, res ) => res.status( 200 ).end() )

app.use( '/env', ( req, res ) => res.send( `Version: ${process.version}` ) )

app.get( '/', function( req, res ) {
	if ( !req.session.uid || !req.session.gamegroup || !req.session.token ) {
		res.render( 'landingpage' )
	} else {
		res.redirect( '/home' )
	}
} )

app.map = function( a, route, method, auth ) { //Returns an array of mapped urls
	route = route || ''
	for ( var key in a ) {
		switch ( typeof a[ key ] ) {
			case 'object':
				app.map( a[ key ], route + '/' + key, method, auth )
				break
			case 'function':
				var glue = '/'
				if ( key === '/' ) {
					key = glue = ''
				}
				if ( auth && method == 'post' ) {
					app[ method ]( route + glue + key, checkAuth, addLocals, checkToken,
						checkForceRedirect, a[ !key ? '/' : key ] )
				} else if ( auth ) {
					app[ method ]( route + glue + key, checkAuth, addLocals,
						checkForceRedirect,
						a[ !key ? '/' : key ] )
				} else {
					app[ method ]( route + glue + key, ( req, res, next ) => {
						res.locals.PRODUCTION_ENV = isProduction
						next()
					}, a[ !key ? '/' : key ] )
				}
				break
		}
	}
}

for ( var method in pages ) {
	if ( pages.hasOwnProperty( method ) ) {
		app.map( pages[ method ], '', method )
	}
}

for ( var method in authPages ) {
	if ( authPages.hasOwnProperty( method ) ) {
		app.map( authPages[ method ], '', method, true )
	}
}

//Handle 404
app.use( function( req, res, next ) {
	res.status( 404 ).send( 'Hello yes this is dog.<br><br>Dog cannot find your page :(' )
	console.log( 404, req.url )
} )

Bureau.init( function( err, db ) {
	if ( err ) throw err;

	//Set some filters
	swig.setFilter( 'prettyTimestamp', utils.prettyTimestamp )
	utils.addressFormat.safe = true
	swig.setFilter( 'address', utils.addressFormat )
	swig.setFilter( 'plural', utils.plural )
	utils.autolink.safe = true
	swig.setFilter( 'autolink', utils.autolink )
	swig.setFilter( 'fullname', utils.fullname )
	swig.setFilter( 'search', function( a ) {
		return [
			a.forename,
			a.surname,
			a.college
		].filter( function( el ) {
			return !!el && el.toLowerCase() !== 'none'
		} ).map( function( el ) {
			return el.toLowerCase()
		} ).join( ' ' )
	} )

	var port = ( process.env.VMC_APP_PORT || process.env.OPENSHIFT_NODEJS_PORT || 3000 )
	var host = ( process.env.VCAP_APP_HOST || process.env.OPENSHIFT_NODEJS_IP || 'localhost' )
	app.listen( port, host )

	READY = true

	if ( DONE_READY_HANDLER && !DONE_READY_HANDLER_CALLED ) {
		DONE_READY_HANDLER_CALLED = true
		DONE_READY_HANDLER()
	}
} )
