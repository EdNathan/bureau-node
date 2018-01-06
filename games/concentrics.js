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
		KILLED_BY: 2
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
					circle: assassins[ playerId ].guild ? CONCENTRICS_GAME.CIRCLES.INNER_CIRCLE : CONCENTRICS_GAME.CIRCLES.MIDDLE_CIRCLE, // Start guild in the inner circle
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

		var player = game.players[ playerId ]

		if ( !player ) {
			return 0
		}

		return _.filter( _.flatten( _.map( player.targets, 'targetStatuses' ) ), {
			status: CONCENTRICS_GAME.TARGET_STATES.KILLED
		} ).length
	},

	//Given a player uid, construct a game state fragment for the player
	getGameStateForUid: function( game, playerId, callback, requester ) {
		var self = this,
			gameid = game.gameid

		self.Bureau.game.getAssassinsObj( gameid, function( err, assassinsObj ) {
			self.Bureau.game.getPlayer( gameid, playerId, function( err, player ) {

				if ( err ) {
					console.log( 'ERROR RENDERING GAME STATE', err )
					callback( err, '' )
					return
				}

				var statusText = {}
				var circleText = {}

				statusText[ CONCENTRICS_GAME.TARGET_STATES.EXPIRED ] = 'Expired'
				statusText[ CONCENTRICS_GAME.TARGET_STATES.IN_PROGRESS ] = 'In Progress'
				statusText[ CONCENTRICS_GAME.TARGET_STATES.KILLED ] = 'Killed'
				statusText[ CONCENTRICS_GAME.TARGET_STATES.KILLED_BY ] = 'Killed By'

				circleText[ CONCENTRICS_GAME.CIRCLES.INNER_CIRCLE ] = 'Inner'
				circleText[ CONCENTRICS_GAME.CIRCLES.MIDDLE_CIRCLE ] = 'Middle'
				circleText[ CONCENTRICS_GAME.CIRCLES.OUTER_CIRCLE ] = 'Outer'

				var state = {
					game: game,
					playerid: playerId,
					player: player,
					playersTargeting: self.getPlayersTargetingPlayer( game, playerId ).map( function( pid ) {
						return utils.fullname( assassinsObj[ pid ] )
					} ).join( ', ' ),
					circleText: circleText[ player.circle ],
					requester: self.Bureau.isAdmin( requester ) ? false : requester,
					targets: player.targets.map( function( target ) {

						var t = _.cloneDeep( target )

						t.targetStatuses = t.targetStatuses.map( function( targetStatus ) {
							var s = _.cloneDeep( targetStatus )
							s.assassin = assassinsObj[ s.id ] ? assassinsObj[ s.id ] : {
								forename: 'Left Game',
								surname: ''
							}
							s.statusText = statusText[ s.status ]
							return s
						} )

						return t
					} )
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

	changeGameState: function( game, playerid, data, callback ) {
		var permaCircle = !!data.permacircle,
			toSet = {
				permaCircle: permaCircle
			},
			gameid = game.gameid,
			self = this

		if ( permaCircle ) {
			toSet.circle = CONCENTRICS_GAME.CIRCLES.INNER_CIRCLE
		}

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
			// console.log( 'No players need new targets' )
			// console.trace()
			callback( null, true )

		} else {
			// console.log( 'assigning targets', playersNeedingTargets )
			self.assignNewTargetsForPlayers( game, playersNeedingTargets, function( err, gg ) {
				// console.log( 'done assigning targets for new players' )
				if ( err ) {
					// console.log( 'ERROR TICKING GAME', err, game )
					callback( err, false )
				} else {
					callback( null, true )
				}
			} )

		}
	},

	getPlayersTargetingPlayer: function( game, playerId ) {
		return _.keys( _.pickBy( game.players, function( targetingPlayer, targetingPlayerId ) {
			var currentTargets = []
			if ( targetingPlayer.targets && targetingPlayer.targets.length > 0 ) {
				currentTargets = _.last( targetingPlayer.targets ).targetStatuses
			}

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
		var lastTargets = []
		if ( player && player.targets && player.targets.length > 0 ) {
			lastTargets = _.map( _.last( player.targets ).targetStatuses, 'id' )
		}

		// Prevent the player from being chosen
		lastTargets = lastTargets.concat( playerId )

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
		newTargets = newTargets.concat( _.sampleSize( innerCircle, 1 ) )
		if ( newTargets.length < 1 ) {
			newTargets = newTargets.concat( _.sampleSize( middleCircle, 1 ) )
			if ( newTargets.length < 1 ) {
				newTargets = newTargets.concat( _.sampleSize( outerCircle, 1 ) )
				outerCircle = _.pull( outerCircle, newTargets[ 0 ] )
			} else {
				middleCircle = _.pull( middleCircle, newTargets[ 0 ] )
			}
		} else {
			innerCircle = _.pull( innerCircle, newTargets[ 0 ] )
		}


		// Sample inner and middle circles for the rest of the targets
		newTargets = newTargets.concat(
			_.sampleSize( _.union( innerCircle, middleCircle ), CONCENTRICS_GAME.TARGET_COUNT - 1 )
		)

		if ( newTargets.length < CONCENTRICS_GAME.TARGET_COUNT ) {
			newTargets = newTargets.concat( _.sampleSize( outerCircle, CONCENTRICS_GAME.TARGET_COUNT - newTargets.length ) )
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
				currentTargets = _.last( player.targets ).targetStatuses.sort( function( a, b ) {
					return a.status - b.status
				} ),
				currentTargetIds = _.map( currentTargets, 'id' ),
				deadline = _.last( player.targets ).deadline,
				targetid = player.targets.slice( -1 )[ 0 ],
				nonTargets = game.assassins.filter( function( el ) {
					return !_.includes( currentTargetIds, el._id + '' ) && el._id + '' !== uid
				} )

			self.Bureau.report.getReports( {
				killerid: uid,
				state: self.Bureau.report.STATES.WAITING,
				gameid: game.gameid
			}, ( err, reports ) => {
				var pendingReports = _.map( reports.filter( function( kill ) {
					var onCurrentTarget = _.includes( currentTargetIds, kill.victimid )
					return onCurrentTarget
				} ), 'victimid' )

				self.Bureau.assassin.getAssassinsFromIds( currentTargetIds, function( err, targetAssassins ) {

					targetAssassins = self.Bureau.assassin.objFromAssassins( targetAssassins )

					self.swig.renderFile( './games/views/concentrics.html', {
							game: game,
							assassin: assassin,
							uid: uid,
							gamegroup: gamegroup,
							score: self.getScoreForUid( game, uid ),
							nonTargets: nonTargets,
							targetsWithPendingReports: _.zipObject( pendingReports ),
							targets: _.cloneDeep( currentTargets ).map( function( target ) {
								target.assassin = targetAssassins[ target.id ]
								return target
							} ),
							TARGET_STATES: CONCENTRICS_GAME.TARGET_STATES,
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
		} )
	},

	//Given killer, victim, kill method, time and everything else in the report if needed, determine whether the kill is valid
	checkKillValid: function( game, killerid, victimid, killmethod, time, report, callback ) {
		//No rules about who can and can't be killed
		callback( null, true )
	},


	//Given killer, victim, kill method and the report, handle the kill
	handleKill: function( game, killerId, victimId, report, callback ) {
		var self = this,
			gameid = game.gameid,
			killerPlayer = game.players[ killerId ],
			victimPlayer = game.players[ victimId ]


		// Find which deadlines it corresponds with
		var killerIndex = -1,
			killerDeadline = null
		if ( killerPlayer && killerPlayer.targets ) {
			killerIndex = _.findIndex( killerPlayer.targets, function( target ) {
				return report.time < target.deadline && _.findIndex( target.targetStatuses, {
					id: victimId
				} ) > -1
			} )
			killerDeadline = killerPlayer.targets[ killerIndex ]
		}

		var victimIndex = -1,
			victimDeadline = null
		if ( victimPlayer && victimPlayer.targets ) {
			victimIndex = _.findIndex( victimPlayer.targets, function( target ) {
				return report.time < target.deadline && _.findIndex( target.targetStatuses, {
					id: killerId
				} ) > -1
			} )
			victimDeadline = victimPlayer.targets[ victimIndex ]
		}

		// console.log( report )
		// console.log( killerIndex, killerDeadline )
		// console.log( victimIndex, victimDeadline )

		// Find which target it corresponds to
		var victimTargetIndex = -1,
			killerVictimTarget = null,
			killerTargetIndex = -1,
			victimKillerTarget = null

		if ( killerDeadline ) {
			victimTargetIndex = _.findIndex( killerDeadline.targetStatuses, {
				id: victimId
			} )
			killerVictimTarget = killerDeadline.targetStatuses[ victimTargetIndex ]
		}

		if ( victimDeadline ) {
			killerTargetIndex = _.findIndex( victimDeadline.targetStatuses, {
				id: killerId
			} )
			victimKillerTarget = victimDeadline.targetStatuses[ killerTargetIndex ]
		}

		// console.log( 'index of victim', victimTargetIndex, killerVictimTarget )
		// console.log( 'index of killer', killerTargetIndex, victimKillerTarget )

		if ( killerVictimTarget ) {
			// The killer successfully killed a victim
			killerVictimTarget.status = CONCENTRICS_GAME.TARGET_STATES.KILLED

			var newCircle = killerPlayer.circle

			//Now compute their circle
			//If they are inner circle then keep them there, otherwise...
			//If the kill happened in the current or last set of targets then move them to the middle circle
			if ( ( newCircle !== CONCENTRICS_GAME.CIRCLES.INNER_CIRCLE ) && ( killerIndex >= killerPlayer.targets
					.length - 2 ) ) {
				//If they have completed all their targets
				var completedAllTargets = _.filter( killerDeadline.targetStatuses, {
					status: CONCENTRICS_GAME.TARGET_STATES.KILLED
				} ).length === killerDeadline.targetStatuses.length

				newCircle = CONCENTRICS_GAME.CIRCLES.MIDDLE_CIRCLE

				if ( completedAllTargets ) {
					// console.log( 'Moving to inner circle' )
					newCircle = CONCENTRICS_GAME.CIRCLES.INNER_CIRCLE
				}
			}

			self.Bureau.game.setPlayerData( gameid, killerId, {
				targets: killerPlayer.targets,
				circle: killerPlayer.permaCircle ? CONCENTRICS_GAME.CIRCLES.INNER_CIRCLE : newCircle,
			}, function( err, gamegroup ) {
				// console.log( 'Set the player data' )
				self.Bureau.game.getGame( gameid, function( err, game ) {
					// console.log( 'got the game' )
					self.tick( game, callback )
				} )
			} )
		}

		if ( victimKillerTarget ) {
			// The killer killed in self defence against the victim
			victimKillerTarget.status = CONCENTRICS_GAME.TARGET_STATES.KILLED_BY

			self.Bureau.game.setPlayerData( gameid, victimId, {
				targets: victimPlayer.targets
			}, function( err, gamegroup ) {
				self.Bureau.game.getGame( gameid, function( err, game ) {
					self.tick( game, callback )
				} )
			} )
		}
	},


	//Given killer, victim, kill method and the report, undo the effects of the kill (if possible)
	undoKill: function( game, killerId, victimId, report, callback ) {
		var self = this,
			gameid = game.gameid,
			killerPlayer = game.players[ killerId ],
			victimPlayer = game.players[ victimId ]


		// Find which deadlines it corresponds with
		var killerIndex = -1,
			killerDeadline = null
		if ( killerPlayer && killerPlayer.targets ) {
			killerIndex = _.findIndex( killerPlayer.targets, function( target ) {
				return report.time < target.deadline && _.findIndex( target.targetStatuses, {
					id: victimId
				} ) > -1
			} )
			killerDeadline = killerPlayer.targets[ killerIndex ]
		}


		var victimIndex = -1,
			victimDeadline = null
		if ( victimPlayer && victimPlayer.targets ) {
			victimIndex = _.findIndex( victimPlayer.targets, function( target ) {
				return report.time < target.deadline && _.findIndex( target.targetStatuses, {
					id: killerId
				} ) > -1
			} )
			victimDeadline = victimPlayer.targets[ victimIndex ]
		}

		// Find which target it corresponds to
		var victimTargetIndex = -1,
			killerVictimTarget = null,
			killerTargetIndex = -1,
			victimKillerTarget = null

		if ( killerDeadline ) {
			victimTargetIndex = _.findIndex( killerDeadline.targetStatuses, {
				id: victimId
			} )
			killerVictimTarget = killerDeadline.targetStatuses[ victimTargetIndex ]
		}

		if ( victimDeadline ) {
			killerTargetIndex = _.findIndex( victimDeadline.targetStatuses, {
				id: killerId
			} )
			victimKillerTarget = victimDeadline.targetStatuses[ killerTargetIndex ]
		}

		if ( killerVictimTarget ) {
			// The killer successfully killed a victim, we should undo it
			// If it's a current target then set it to unfulfilled, otherwise expired
			if ( killerIndex === killerPlayer.targets.length - 1 ) {
				killerVictimTarget.status = CONCENTRICS_GAME.TARGET_STATES.IN_PROGRESS
			} else {
				killerVictimTarget.status = CONCENTRICS_GAME.TARGET_STATES.EXPIRED
			}

			// Now we need to conpute their circle
			var newCircle = killerPlayer.circle
			var numTargets = killerDeadline.targetStatuses.length
			var numCompletedTargets = _.filter( killerDeadline.targetStatuses, {
				status: CONCENTRICS_GAME.TARGET_STATES.KILLED
			} ).length

			var previousCircle = CONCENTRICS_GAME.CIRCLES.INNER_CIRCLE
			if ( killerPlayer.targets[ killerIndex - 1 ] ) {
				// If the previous deadline exists
				var previousTargets = killerPlayer.targets[ killerIndex - 1 ].targetStatuses
				var numPreviousCompletedTargets = _.filter( previousTargets, {
					status: CONCENTRICS_GAME.TARGET_STATES.KILLED
				} ).length

				if ( numPreviousCompletedTargets === previousTargets.length ) {
					previousCircle = CONCENTRICS_GAME.CIRCLES.INNER_CIRCLE
				} else if ( numPreviousCompletedTargets > 0 ) {
					previousCircle = CONCENTRICS_GAME.CIRCLES.MIDDLE_CIRCLE
				} else {
					previousCircle = CONCENTRICS_GAME.CIRCLES.OUTER_CIRCLE
				}

			}



			if ( killerIndex === killerPlayer.targets.length - 1 ) {
				// If the kill was in the current set of targets
				// We need to know previous performance, default to inner circle
				if ( numCompletedTargets === 0 ) {
					// Circle is based on previous performance if past performance exists
					newCircle = previousCircle
				} else if ( previousCircle !== CONCENTRICS_GAME.CIRCLES.INNER_CIRCLE ) {
					// If the previous circle wasn't the inner circle, then they should be middle
					newCircle = CONCENTRICS_GAME.CIRCLES.MIDDLE_CIRCLE
				} else {
					//Otherwise make them inner
					newCircle = CONCENTRICS_GAME.CIRCLES.INNER_CIRCLE
				}

			} else if ( killerIndex === killerPlayer.targets.length - 2 ) {
				// If the kill was in the previous set of targets
				if ( numCompletedTargets === 0 ) {
					// If there are now no completed targets we transitioned to the current targets in the outer circle
					// Work out how many targets we have completed in the current set
					// Find out performance in the next circle

					var currentTargets = killerPlayer.targets[ killerIndex + 1 ].targetStatuses
					var numCurrentCompletedTargets = _.filter( currentTargets, {
						status: CONCENTRICS_GAME.TARGET_STATES.KILLED
					} ).length

					if ( numPreviousCompletedTargets > 0 ) {
						newCircle = CONCENTRICS_GAME.CIRCLES.MIDDLE_CIRCLE
					} else {
						newCircle = CONCENTRICS_GAME.CIRCLES.OUTER_CIRCLE
					}

				} else {
					// Otherwise we must have completed at least 1 target and so will be in the middle
					newCircle = CONCENTRICS_GAME.CIRCLES.MIDDLE_CIRCLE
				}


			}

			self.Bureau.game.setPlayerData( gameid, killerId, {
				targets: killerPlayer.targets,
				circle: killerPlayer.permaCircle ? CONCENTRICS_GAME.CIRCLES.INNER_CIRCLE : newCircle,
			}, function( err, gamegroup ) {
				self.Bureau.game.getGame( gameid, function( err, game ) {
					self.tick( game, callback )
				} )
			} )
		}

		if ( victimKillerTarget ) {
			// The killer killed in self defence against the victim, undo this
			if ( victimIndex === victimPlayer.targets.length - 1 ) {
				victimKillerTarget.status = CONCENTRICS_GAME.TARGET_STATES.IN_PROGRESS
			} else {
				victimKillerTarget.status = CONCENTRICS_GAME.TARGET_STATES.EXPIRED
			}

			self.Bureau.game.setPlayerData( gameid, victimId, {
				targets: victimPlayer.targets
			}, function( err, gamegroup ) {
				self.Bureau.game.getGame( gameid, function( err, game ) {
					self.tick( game, callback )
				} )
			} )
		}

	},


	//Given the uid of a new player added, handle all in game effects
	handlePlayerAdded: function( game, playerId, callback ) {
		//Give the player a new deadline and target
		console.log( 'Adding ' + playerId + ' to game ' + game.name )
		var now = moment().toDate(),
			self = this,
			deadlineDays = game.custom[ 'concentrics-deadline-days' ],
			newDeadline = moment( now ).add( deadlineDays, 'days' ).toDate(),
			newPlayer = {
				targets: [],
				circle: CONCENTRICS_GAME.CIRCLES.INNER_CIRCLE,
				permaCircle: false
			}

		self.Bureau.game.setPlayerData( game.gameid, playerId, newPlayer, function( err, gamegroup ) {
			self.Bureau.game.getGame( game.gameid, function( err, game ) {
				self.assignNewTargetsForPlayers( game, [ playerId ], function( err, success ) {
					if ( err ) {
						callback( err )
						return
					}
					self.tick( game, function( err, success ) {
						callback( err )
					} )
				} )
			} )
		} )

	},

	//Given the uid of a player just removed, handle all in game effects
	handlePlayerRemoved: function( game, playerId, callback ) {
		//No effect
		console.log( 'Removing ' + playerId + ' from game ' + game.name )
		var now = moment().toDate(),
			self = this,
			updatedPlayers = {}

		var playersNeedingUpdates = self.getPlayersTargetingPlayer( game, playerId )

		playersNeedingUpdates.forEach( function( pid ) {
			var player = game.players[ pid ],
				currentTargets = _.last( player.targets )

			// Remove in place any targets matching the player that haven't been scored on
			_.remove( currentTargets.targetStatuses, {
				id: playerId,
				status: CONCENTRICS_GAME.TARGET_STATES.IN_PROGRESS
			} )
			_.remove( currentTargets.targetStatuses, {
				id: playerId,
				status: CONCENTRICS_GAME.TARGET_STATES.KILLED_BY
			} )

			updatedPlayers[ 'players.' + pid + '.targets' ] = player.targets
		} )

		//Send notifications
		self.Bureau.assassin.getAssassin( playerId, function( err, removedAssassin ) {

			var assassinName = utils.fullname( removedAssassin )
			var notificationText = 'Your target ' + assassinName + ' has left the game.' +
				'\n\nYou now have 1 less target, do not disappoint'

			playersNeedingUpdates.map( function( uid ) {
				self.Bureau.notifications.addNotification( uid, notificationText )
			} )

			self.Bureau.game.updateGame( game.gameid, updatedPlayers, callback )
		} )


	}
}

module.exports = concentricsgame
