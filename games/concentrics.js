var utils = require( '../utils' ),
	_ = require( 'lodash' ),
	moment = require( 'moment' )


var CONCENTRICS_GAME = {
	TARGET_COUNT: 3,
	CIRCLES: {
		INNER_CIRCLE: 0,
		MIDDLE_CIRCLE: 1,
		OUTER_CIRCLE: 2
	},
	TARGET_STATES: {
		EXPIRED: -1,
		IN_PROGRESS: 0,
		KILLED: 1,
		KILLED_BY: 3
	}
}

//The game automatically has a reference to Bureau shoved on to it
var concentricsgame = {
	init: function( Bureau ) {

	},
	label: 'Concentric',
	//This should output html/text for displaying when setting up a game. Use form fields for extra parameters when setting up
	getGameSetupFragment: function( callback ) {
		this.swig.renderFile( './games/fragments/concentricsSetupFragment.html', {}, function( err, output ) {
			callback( null, output )
		} )
	},

	getParamChangeFragment: function( game, callback ) {
		this.swig.renderFile( './games/fragments/concentricsParamChangeFragment.html', game, function( err, output ) {
			callback( null, output )
		} )
	},

	changeGameParams: function( game, data, callback ) {
		var deadlineDays = parseInt( data[ 'concentrics-deadline-days' ] ),
			gameid = game.gameid,
			self = this

		if ( !isNaN( deadlineDays ) && deadlineDays > 0 ) {
			//We're chillin'
			game.custom[ 'concentrics-deadline-days' ] = deadlineDays
		} else {
			callback( 'Invalid number of deadline days', game )
			return
		}

		self.Bureau.game.updateGame( gameid, {
			custom: game.custom
		}, function( err, gg ) {
			if ( err ) {
				callback( err, game )
			} else {
				callback( null, game )
			}
		} )
	},

	//Passed all the form data from game setup, should modify the data and return a 'game' object for insertion into the database
	constructGame: function( data, callback ) {
		var game = data,
			playerIds = utils.shuffle( Object.keys( game.players ) ),
			deadlineDays = parseInt( game.custom[ 'concentrics-deadline-days' ] ),
			self = this

		if ( !isNaN( deadlineDays ) && deadlineDays > 0 ) {
			//We're chillin'
			game.custom[ 'concentrics-deadline-days' ] = deadlineDays
		} else {
			callback( 'Invalid number of deadline days', {} )
			return
		}

		var firstDeadline = moment( game.start ).add( deadlineDays, 'days' ).toDate()

		self.Bureau.assassin.getAssassinsFromIds( playerIds, function( err, assassins ) {
			assassins = self.Bureau.assassin.objFromAssassins( assassins )
				//Build the inner circle

			var l = playerIds.length

			game.players = {}

			playerIds.map( function( playerId, i ) {

				//The player object
				var player = {
					targets: [ { // Array of target sets
						deadline: firstDeadline,
						targetStatuses: []
					} ],
					circle: CONCENTRICS_GAME.CIRCLES.INNER_CIRCLE, // Start everyone in the inner circle
					permaCircle: assassins[ playerId ].guild // Guild always in inner circle
				}

				// Give them the next 3 targets in the list
				player.targets[ 0 ].targetStatuses = [
					playerIds[ ( i + 1 ) % l ],
					playerIds[ ( i + 2 ) % l ],
					playerIds[ ( i + 3 ) % l ]
				].map( function( targetId ) {
					return {
						id: targetId,
						status: CONCENTRICS_GAME.TARGET_STATES.IN_PROGRESS
					}
				} )

				game.players[ playerId ] = player
			} )

			callback( null, game )

		} )
	},

	getScoreForUid: function( game, playerId ) {
		return _.filter( _.flatten( _.pluck( game.players[ playerId ].targets, 'targetStatuses' ) ), {
			status: CONCENTRICS_GAME.TARGET_STATES.KILLED
		} ).length
	},

	// TODO
	//Given a player uid, construct a game state fragment for the player
	getGameStateForUid: function( game, playerid, callback ) {
		var self = this,
			gameid = game.gameid

		self.Bureau.game.getAssassinsObj( gameid, function( err, assassinsObj ) {
			self.Bureau.game.getPlayer( gameid, playerid, function( err, player ) {
				err = !!err ? err : null
				if ( err ) {
					console.log( 'ERROR RENDERING GAME STATE', err )
					callback( err, '' )
					return
				}
				var state = {
					game: game,
					playerid: playerid,
					player: player,
					history: player.targets.map( function( t, i ) {
						return {
							target: assassinsObj[ t ],
							deadline: player.deadlines[ i ],
							targetstatus: player.targetstatuses[ i ]
						}
					} ),
				}
				self.swig.renderFile( './games/fragments/concentricsGamestateFragment.html', state, function( err, output ) {
					if ( err ) {
						console.log( 'ERROR RENDERING GAME STATE', err )
						callback( err, '' )
						return
					}
					callback( null, output )
				} )
			} )
		} )
	},


	// TODO
	changeGameState: function( game, playerid, data, callback ) {
		var permaCircle = !!data.permacircle,
			toSet = {
				permaCircle: permaCircle
			},
			gameid = game.gameid
		self = this

		self.Bureau.game.setPlayerData( gameid, playerid, toSet, function( err, game ) {
			if ( err ) {
				callback( err, {} )
			} else {
				callback( null, game )
			}
		} )
	},

	getPlayersInCircle: function( game, circle ) {
		return Object.keys( game.players ).filter( function( playerId ) {
			return game.players[ playerId ].circle === circle
		} )
	},

	//Called every time we need to update the game state
	tick: function( game, callback ) {
		var now = moment().toDate(),
			self = this,
			playersNeedingTargets = [];


		// Find which players need new circles and targets
		_.each( game.players, function( player, playerId ) {

			var lastTargets = _.last( player.targets )

			// See if deadline has expired
			if ( lastTargets.deadline < now ) {
				// Expire any remaining targets
				lastTargets.targetStatuses = lastTargets.targetStatuses.map( function( targetStatus ) {
					if ( targetStatus.status === CONCENTRICS_GAME.TARGET_STATES.IN_PROGRESS ) {
						targetStatus.status = CONCENTRICS_GAME.TARGET_STATES.EXPIRED
					}

					return targetStatus
				} )
			}


			// Count the successes and failures
			var targetStateCounts = {
				incomplete: 0,
				success: 0,
				failure: 0
			}

			lastTargets.targetStatuses.forEach( function( targetStatus ) {
				switch ( targetStatus.status ) {
					case CONCENTRICS_GAME.TARGET_STATES.IN_PROGRESS:
						targetStateCounts.incomplete++;
						break;

					case CONCENTRICS_GAME.TARGET_STATES.KILLED:
						targetStateCounts.success++;
						break;

					default:
						targetStateCounts.failure++;
						break;
				}
			} )

			if ( targetStateCounts.incomplete > 0 ) {
				// Still some targets left to go
				return
			} else {
				// We require some new targets
				playersNeedingTargets.push( playerId )

				// Now compute the new circle
				if ( player.permaCircle ) {
					// Keep them in the inner circle
					player.circle = CONCENTRICS_GAME.CIRCLES.INNER_CIRCLE
				} else if ( targetStateCounts.failure === 0 && targetStateCounts.success > 0 ) {
					// They haven't failed any targets
					player.circle = CONCENTRICS_GAME.CIRCLES.INNER_CIRCLE
				} else if ( targetStateCounts.success > 0 ) {
					// They've killed at least 1 target
					player.circle = CONCENTRICS_GAME.CIRCLES.MIDDLE_CIRCLE
				} else {
					// They haven't killed a single target
					player.circle = CONCENTRICS_GAME.CIRCLES.OUTER_CIRCLE
				}
			}

		} )

		if ( !playersNeedingTargets.length ) {

			callback( null, true )

		} else {

			self.assignNewTargetsForPlayers( game, playersNeedingTargets, function( err, gg ) {
				if ( err ) {
					console.log( 'ERROR TICKING GAME', err, game )
					callback( err, false )
				} else {
					callback( null, true )
				}
			} )

		}
	},

	getPlayersTargetingPlayer: function( game, playerId ) {
		return _.keys( _.pick( game.players, function( targetingPlayer, targetingPlayerId ) {
			var currentTargets = _.last( targetingPlayer.targets ).targetStatuses

			// Find out if another player has this player as an in progress target
			return currentTargets.filter( function( target ) {
				return target.id === playerId && target.status === CONCENTRICS_GAME.TARGET_STATES.IN_PROGRESS
			} ).length > 0
		} ) )
	},

	// Algorithm for picking new targets
	// Returns an array of target ids
	pickNewTargetsForPlayer: function( game, playerId ) {
		/*
			Target 1 is randomly selected from the Inner Circle.
			If there is no valid target in the Inner circle, one is selected from the Middle Circle, or finally the Outer circle.

			Targets 2 & 3 are randomly selected from the Inner and Middle circles.
			If there is no valid target in these circles, one is selected from the Outer circle.

			When targets are reset, all three of the new targets should be different from the last three.

			No player can target a player who is targeting them.

			No player may have two targets as the same person.
		*/
		var self = this

		var newTargets = []

		// console.log( 'player', playerId )
		// console.log( 'inner', self.getPlayersInCircle( game, CONCENTRICS_GAME.CIRCLES.INNER_CIRCLE ) )
		// console.log( 'middle', self.getPlayersInCircle( game, CONCENTRICS_GAME.CIRCLES.MIDDLE_CIRCLE ) )
		// console.log( 'outer', self.getPlayersInCircle( game, CONCENTRICS_GAME.CIRCLES.OUTER_CIRCLE ) )

		var player = game.players[ playerId ]
			// The ids of the last targets
		var lastTargets = _.pluck( _.last( player.targets ).targetStatuses, 'id' )

		// Prevent the player from being chosen
		lastTargets.concat( playerId )

		// Find out which players are targeting the current player
		var playersTargeting = self.getPlayersTargetingPlayer( game, playerId )

		// console.log( 'last targets', lastTargets )
		// console.log( 'players targeting', playersTargeting )

		// Get the circles with the other targets removed
		var innerCircle = _.difference(
			self.getPlayersInCircle( game, CONCENTRICS_GAME.CIRCLES.INNER_CIRCLE ),
			lastTargets,
			playersTargeting
		)

		var middleCircle = _.difference(
			self.getPlayersInCircle( game, CONCENTRICS_GAME.CIRCLES.MIDDLE_CIRCLE ),
			lastTargets,
			playersTargeting
		)

		var outerCircle = _.difference(
			self.getPlayersInCircle( game, CONCENTRICS_GAME.CIRCLES.OUTER_CIRCLE ),
			lastTargets,
			playersTargeting
		)

		// console.log( 'evaluated inner', innerCircle )
		// console.log( 'evaluated middle', middleCircle )
		// console.log( 'evaluated outer', outerCircle )

		// Select from inner circle for first. Keep sampling wider circles until we get a target
		newTargets = newTargets.concat( _.sample( innerCircle, 1 ) )
		if ( newTargets.length < 1 ) {
			newTargets = newTargets.concat( _.sample( middleCircle, 1 ) )
			if ( newTargets.length < 1 ) {
				newTargets = newTargets.concat( _.sample( outerCircle, 1 ) )
				outerCircle = _.pull( outerCircle, newTargets[ 0 ] )
			} else {
				middleCircle = _.pull( middleCircle, newTargets[ 0 ] )
			}
		} else {
			innerCircle = _.pull( innerCircle, newTargets[ 0 ] )
		}


		// Sample inner and middle circles for the rest of the targets
		newTargets = newTargets.concat( _.sample( _.union( innerCircle, middleCircle ), CONCENTRICS_GAME.TARGET_COUNT - 1 ) )

		if ( newTargets.length < CONCENTRICS_GAME.TARGET_COUNT ) {
			newTargets = newTargets.concat( _.sample( outerCircle, CONCENTRICS_GAME.TARGET_COUNT - newTargets.length ) )
		}

		return newTargets

	},

	// Pick new targets and assign them (save in db in batch)
	assignNewTargetsForPlayers: function( game, playerIds, callback ) {
		var toSet = {},
			self = this,
			now = moment(),
			deadlineDays = game.custom[ 'concentrics-deadline-days' ],
			newDeadline = moment( now ).add( deadlineDays, 'days' ).toDate()

		playerIds.map( function( playerId ) {

			var player = game.players[ playerId ]
			var newTargets = self.pickNewTargetsForPlayer( game, playerId )

			player.targets.push( {
				deadline: newDeadline,
				targetStatuses: newTargets.map( function( targetId ) {
					return {
						id: targetId,
						status: CONCENTRICS_GAME.TARGET_STATES.IN_PROGRESS
					}
				} )
			} )

			toSet[ 'players.' + playerId + '.circle' ] = player.circle
			toSet[ 'players.' + playerId + '.targets' ] = player.targets
		} )

		self.Bureau.game.updateGame( game.gameid, toSet, function( err, gg ) {
			// console.log('Updated game')
			if ( err ) {
				callback( err, false )
			} else {
				callback( null, true )
			}
		} )

	},

	renderGame: function( game, assassin, gamegroup, callback ) {
		var self = this
		self.tick( game, function( err, success ) {
			if ( err ) {
				console.log( 'ERROR TICKING GAME INTERRUPTED RENDERING GAME', err )
				callback( err, '' )
				return
			}
			var uid = assassin._id + '',
				players = game.players,
				player = game.players[ uid ],
				currentTargets = _.last( player.targets ).targetStatuses,
				currentTargetIds = _.pluck( currentTargets, 'id' ),
				deadline = _.last( player.targets ).deadline,
				targetid = player.targets.slice( -1 )[ 0 ],
				nonTargets = game.assassins.filter( function( el ) {
					return !_.contains( currentTargetIds, el._id + '' ) && el._id + '' !== uid
				} )

			var pendingReports = _.pluck( assassin.kills.filter( function( kill ) {
				var sameGame = kill.gameid === game.gameid,
					onCurrentTarget = _.contains( currentTargetIds, kill.victimid )
				return sameGame && onCurrentTarget && kill.state === 'waiting'
			} ), 'victimid' )

			self.Bureau.assassin.getAssassinsFromIds( currentTargetIds, function( err, targetAssassins ) {

				self.swig.renderFile( './games/views/concentrics.html', {
						game: game,
						assassin: assassin,
						uid: uid,
						gamegroup: gamegroup,
						nonTargets: nonTargets,
						targetsWithPendingReports: pendingReports,
						targets: targetAssassins,
						deadline: moment( deadline ).format( 'MMMM Do YYYY, h:mm:ss a' ),
						timeremaining: moment( deadline ).fromNow( true )
					},
					function( err, output ) {
						if ( err ) {
							console.log( 'ERROR RENDERING GAME', err )
							callback( err, '' )
							return
						}
						callback( null, output )
					}
				)
			} )
		} )
	},


	// TODO
	//Given killer, victim, kill method, time and everything else in the report if needed, determine whether the kill is valid
	checkKillValid: function( game, killerid, victimid, killmethod, time, report, callback ) {
		//No rules about who can and can't be killed
		callback( null, true )
	},


	// TODO
	//Given killer, victim, kill method and the report, handle the kill
	handleKill: function( game, killerid, victimid, report, callback ) {
		var self = this,
			gameid = game.gameid,
			killedCurrentTarget = game.players[ killerid ].targets.slice( -1 )[ 0 ] === victimid,
			killedCurrentHunter = game.players[ victimid ].targets.slice( -1 )[ 0 ] === killerid,
			addScore = function() {
				self.Bureau.game.changeScore( game.gameid, killerid, 1, callback )
			}
			//Case 1, the target or hunter is the latest one
		if ( killedCurrentTarget || killedCurrentHunter ) {
			if ( killedCurrentTarget ) {
				// console.log('Is current target')
				//We need to give them a new target
				var newstatuses = game.players[ killerid ].targetstatuses
				newstatuses.pop()
				newstatuses.push( 1 )

				self.Bureau.game.setPlayerData( gameid, killerid, {
					targetstatuses: newstatuses
				}, function( err, gamegroup ) {
					// console.log('Set new target status')
					self.Bureau.game.getGame( gameid, function( err, game ) {
						// console.log('Got game')
						// console.log(game)
						self.tick( game, function() {
							// console.log('Tick completed')
							//Add 1 to the score
							addScore()
						} )
					} )
				} )
			} else if ( killedCurrentHunter ) {
				// console.log('Is current hunted')
				//The hunter needs a new target
				var newstatuses = game.players[ victimid ].targetstatuses
				newstatuses.pop()
				newstatuses.push( -1 )
				self.Bureau.game.setPlayerData( gameid, victimid, {
					targetstatuses: newstatuses
				}, function( err, gamegroup ) {
					self.Bureau.game.getGame( gameid, function( err, game ) {
						self.tick( game, function( err, success ) {
							callback( err, game )
						} )
					} )
				} )
			}
		} else {
			//Case 2, target is a past target but the kill was made at the right time
			var indexOfTarget = game.players[ killerid ].targets.lastIndexOf( victimid ),
				deadlines = game.players[ killerid ].deadlines,
				indexOfHunter = game.players[ victimid ].targets.lastIndexOf( killerid ),
				huntedDeadlines = game.players[ victimid ].deadlines

			if ( indexOfTarget > -1 && report.time < deadlines[ indexOfTarget ] ) {
				var newstatuses = game.players[ killerid ].targetstatuses
				newstatuses[ indexOfTarget ] = 1

				self.Bureau.game.setPlayerData( gameid, killerid, {
					targetstatuses: newstatuses
				}, function( err, gamegroup ) {
					self.Bureau.game.getGame( gameid, function( err, game ) {
						self.tick( game, function() {
							//Add 1 to the score
							addScore()
						} )
					} )
				} )
			} else if ( indexOfHunter > -1 && report.time < huntedDeadlines[ indexOfHunter ] ) {
				var newstatuses = game.players[ victimid ].targetstatuses
				newstatuses[ indexOfHunter ] = -1

				self.Bureau.game.setPlayerData( gameid, victimid, {
					targetstatuses: newstatuses
				}, function( err, gamegroup ) {
					self.Bureau.game.getGame( gameid, function( err, game ) {
						self.tick( game, function( err, success ) {
							callback( err, game )
						} )
					} )
				} )
			} else {
				//Old way of doing nothing
				/* self.tick(game, function(err, success) {
					callback(err, game)
				}) */

				//Now the person who was killed kind of unfairly has to be shifted out of the circle
				var newstatuses = game.players[ victimid ].targetstatuses
				newstatuses[ newstatuses.length - 1 ] = -1

				self.Bureau.game.setPlayerData( gameid, victimid, {
					targetstatuses: newstatuses
				}, function( err, gamegroup ) {
					self.Bureau.game.getGame( gameid, function( err, game ) {
						self.tick( game, function( err, success ) {
							callback( err, game )
						} )
					} )
				} )
			}
		}

	},


	// TODO
	//Given killer, victim, kill method and the report, undo the effects of the kill (if possible)
	undoKill: function( game, killerid, victimid, report, callback ) {
		var self = this,
			gameid = game.gameid,
			subtractScore = function() {
				self.Bureau.game.changeScore( game.gameid, killerid, -1, callback )
			}

		var indexOfTarget = game.players[ killerid ].targets.lastIndexOf( victimid ),
			deadlines = game.players[ killerid ].deadlines,
			indexOfHunter = game.players[ victimid ].targets.lastIndexOf( killerid ),
			huntedDeadlines = game.players[ victimid ].deadlines

		if ( indexOfTarget > -1 && report.time < deadlines[ indexOfTarget ] ) {
			var newstatuses = game.players[ killerid ].targetstatuses
			newstatuses[ indexOfTarget ] = -1

			self.Bureau.game.setPlayerData( gameid, killerid, {
				targetstatuses: newstatuses
			}, function( err, gamegroup ) {
				self.Bureau.game.getGame( gameid, function( err, game ) {
					self.tick( game, function() {
						//Subtract 1 from score
						subtractScore()
					} )
				} )
			} )
		} else if ( indexOfHunter > -1 && report.time < huntedDeadlines[ indexOfHunter ] ) {
			var newstatuses = game.players[ victimid ].targetstatuses
			newstatuses[ indexOfHunter ] = 0

			self.Bureau.game.setPlayerData( gameid, victimid, {
				targetstatuses: newstatuses
			}, function( err, gamegroup ) {
				self.Bureau.game.getGame( gameid, function( err, game ) {
					self.tick( game, function( err, success ) {
						callback( err, game )
					} )
				} )
			} )
		} else {
			self.tick( game, function( err, success ) {
				callback( err, game )
			} )
		}
	},


	// TODO
	//Given the uid of a new player added, handle all in game effects
	handlePlayerAdded: function( game, playerid, callback ) {
		//Give the player a new deadline and target
		console.log( 'Adding ' + playerid + ' to game ' + game.name )
		callback( null )
		var now = moment().toDate(),
			self = this,
			deadlineDays = game.custom[ 'spiral-deadline-days' ],
			newDeadline = moment( now ).add( deadlineDays, 'days' ).toDate(),
			innerCircle = self.getInnerCircle( game ),
			newPlayer = {
				targetstatuses: [ 0 ],
				deadlines: [ newDeadline ],
				targets: [ utils.choose( innerCircle, [ playerid ] ) ]
			}

		self.Bureau.game.setPlayerData( gameid, playerid, newPlayer, function( err, gamegroup ) {
			self.Bureau.game.getGame( gameid, function( err, game ) {
				self.tick( game, function( err, success ) {
					callback( err )
				} )
			} )
		} )

	},


	// TODO
	//Given the uid of a player just removed, handle all in game effects
	handlePlayerRemoved: function( game, playerid, callback ) {
		//No effect
		console.log( 'Removing ' + playerid + ' from game ' + game.name )
		callback( null )
		var now = moment().toDate(),
			self = this,
			deadlineDays = game.custom[ 'spiral-deadline-days' ],
			newDeadline = moment( now ).add( deadlineDays, 'days' ).toDate(),
			newTarget = game.players[ playerid ].slice( -1 )[ 0 ],
			playersToUpdate = Object.keys( game.players ).filter( function( pid ) {
				return game.players[ pid ].targets.slice( -1 )[ 0 ] === playerid
			} ),
			updatedPlayers = {}

		playersToUpdates.forEach( function( pid ) {
			game.players[ pid ].targets.pop()
			game.players[ pid ].targets.push( newTarget )
			game.players[ pid ].deadlines.pop()
			game.players[ pid ].deadlines.push( newDeadline )
			game.players[ pid ].targetstatuses.pop()
			game.players[ pid ].targetstatuses.push( 0 )

			updatedPlayers[ 'players.' + pid + '.targets' ] = game.players[ pid ].targets
			updatedPlayers[ 'players.' + pid + '.deadlines' ] = game.players[ pid ].deadlines
			updatedPlayers[ 'players.' + pid + '.targetstatuses' ] = game.players[ pid ].targetstatuses
		} )

		self.Bureau.game.updateGame( gameid, updatedPlayers, callback )
	}
}

module.exports = concentricsgame
