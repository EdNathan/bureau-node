var utils = require('../utils'),
	moment = require('moment')

//The game automatically has a reference to Bureau shoved on to it
var spiralgame = {
	init: function(Bureau) {

	},
	label: 'Spiral',
	//This should output html/text for displaying when setting up a game. Use form fields for extra parameters when setting up
	getGameSetupFragment: function(callback) {
		this.swig.renderFile('./games/fragments/spiralSetupFragment.html', {}, function(err, output) {
			callback(null, output)
		})
	},
	getParamChangeFragment: function(game, callback) {
		this.swig.renderFile('./games/fragments/spiralParamChangeFragment.html', game, function(err, output) {
			callback(null, output)
		})
	},
	changeGameParams: function(game, data, callback) {
		var deadlineDays = parseInt(data['spiral-deadline-days']),
			gameid = game.gameid,
			self = this

		if(!isNaN(deadlineDays) && deadlineDays > 0) {
			//We're chillin'
			game.custom['spiral-deadline-days'] = deadlineDays
		} else {
			callback('Invalid number of deadline days', game)
			return
		}

		self.Bureau.game.updateGame(gameid, {custom: game.custom}, function(err, gg) {
			if(err) {
				callback(err, game)
			} else {
				callback(null, game)
			}
		})
	},
	//Passed all the form data from game setup, should modify the data and return a 'game' object for insertion into the database
	constructGame: function(data, callback) {
		var game = data,
			playerIds = utils.shuffle(Object.keys(game.players)),
			deadlineDays = parseInt(game.custom['spiral-deadline-days']),
			self = this

		if(!isNaN(deadlineDays) && deadlineDays > 0) {
			//We're chillin'
			game.custom['spiral-deadline-days'] = deadlineDays
		} else {
			callback('Invalid number of deadline days', {})
			return
		}

		var deadline = moment(game.start).add(deadlineDays, 'days').toDate()

		self.Bureau.assassin.getAssassinsFromIds(playerIds, function(err, assassins) {
			assassins = self.Bureau.assassin.objFromAssassins(assassins)
			//Build the first circle
			var i = 0,
				l = playerIds.length
			game.players[playerIds[l-1]].targets = [playerIds[0]]
			for(i;i<l-1;i++) {
				game.players[playerIds[i]].targets = [playerIds[i+1]]
			}

			//Set the deadlines
			for(i=0;i<l;i++) {
				game.players[playerIds[i]].deadlines = [deadline]
				//O for pending
				//1 for success
				//-1 for failure
				game.players[playerIds[i]].targetstatuses = [0]
				//set permaCircle if they're guild
				game.players[playerIds[i]].permaCircle = assassins[playerIds[i]].guild
			}
			callback(null, game)
		})
	},

	//Given a player uid, construct a game state fragment for the player
	getGameStateForUid: function(game, playerid, callback) {
		var self = this,
			gameid = game.gameid

		self.Bureau.game.getAssassinsObj(gameid, function(err, assassinsObj) {
			self.Bureau.game.getPlayer(gameid, playerid, function(err, player) {
				err = !!err ? err : null
				if(err) {
					console.log('ERROR RENDERING GAME STATE',err)
					callback(err, '')
					return
				}
				var state = {
					game: game,
					playerid: playerid,
					player: player,
					history: player.targets.map(function(t, i) {
						return {
							target: assassinsObj[t],
							deadline: player.deadlines[i],
							targetstatus: player.targetstatuses[i]
						}
					}),
				}
				self.swig.renderFile('./games/fragments/spiralGamestateFragment.html', state, function(err, output) {
					if(err) {
						console.log('ERROR RENDERING GAME STATE',err)
						callback(err, '')
						return
					}
					callback(null, output)
				})
			})
		})
	},

	changeGameState: function(game, playerid, data, callback) {
		var permaCircle = !!data.permacircle,
			toSet = {permaCircle: permaCircle},
			gameid = game.gameid
			self = this

		self.Bureau.game.setPlayerData(gameid, playerid, toSet, function(err, game) {
			if(err) {
				callback(err, {})
			} else {
				callback(null, game)
			}
		})
	},

	getInnerCircle: function(game) {
		var innerCircle = Object.keys(game.players).filter(function(playerId) {
			var s = game.players[playerId].targetstatuses
			//They're marked to always be in the inner circle
			if (game.players[playerId].permaCircle) {
				return true
			}
			//The first deadline hasn't passed
			if (s.length === 1) {
				return true
			}
			//The previous deadline was fulfilled
			if (s.slice(-2)[0] === 1 || s.slice(-1)[0] === 1) {
				return true
			}
			return false
		})
		return innerCircle
	},


	//Called every time we need to update the game state
	tick: function(game, callback) {
		var now = moment().toDate(),
			self = this,
			deadlineDays = game.custom['spiral-deadline-days'],
			newDeadline = moment(now).add(deadlineDays, 'days').toDate(),
			last = function(arr) {
				return arr.slice(-1)[0]
			},
			failed = [],
			success = [],
			push = {},
			toSet = {}

		// console.log('Finding players that need updating')
		//Find players that need updating!
		for(var playerId in game.players) {
			var p = game.players[playerId],
				s = last(p.targetstatuses)
			if(last(p.deadlines) < now || s === 1 || s === -1) {
				//They need updating!
				if(s !== 1) {
					//Failed to kill target. Was killed by target or didn't kill their target. Needs a new one.
					failed.push(playerId)
					game.players[playerId].targetstatuses.pop()
					game.players[playerId].targetstatuses.push(-1)
				} else {
					//Succeeded in killing target. Needs a new one.
					success.push(playerId)
				}
			}
		}

		console.log('Finding inner circle')
		var innerCircle = self.getInnerCircle(game)
		console.log(innerCircle)
		console.log('Mapping failed players')
		console.log(failed)
		failed.map(function(pid) {
			//Set the new deadline to incomplete
			toSet['players.'+pid+'.targetstatuses'] = game.players[pid].targetstatuses.concat(0)
			//Set a new deadline
			push['players.'+pid+'.deadlines'] = newDeadline
			//Randomly set a new target
			push['players.'+pid+'.targets'] = utils.choose(innerCircle, [pid, game.players.playerid.targets.slice(-1)[0]])
		})

		console.log('Mapping successful players')
		console.log(success)
		success.map(function(pid) {
			//Set the new deadline to incomplete
			push['players.'+pid+'.targetstatuses'] = 0
			//Set a new deadline
			push['players.'+pid+'.deadlines'] = newDeadline
			//Randomly set a new target
			push['players.'+pid+'.targets'] = utils.choose(innerCircle, [pid, game.players.playerid.targets.slice(-1)[0]])
		})

		if(failed.length > 0 || success.length > 0) {
			toSet['$push'] = push
			// console.log('Updating game state')
			self.Bureau.game.updateGame(game.gameid, toSet, function(err, gg) {
				// console.log('Updated game')
				if(err) {
					console.log('ERROR TICKING GAME',err,game)
					callback(err, false)
				} else {
					callback(null, true)
				}
			})
		} else {
			// console.log('Had to do nothing!')
			callback(null, true)
		}
	},

	renderGame: function(game, assassin, gamegroup, callback) {
		var self = this
		self.tick(game, function(err, success) {
			if(err) {
				console.log('ERROR TICKING GAME INTERRUPTED RENDERING GAME',err)
				callback(err, '')
				return
			}
			var uid = assassin._id+'',
				players = game.players,
				player = game.players[uid],
				deadline = player.deadlines.slice(-1)[0],
				targetid = player.targets.slice(-1)[0],
				nonTargets = game.assassins.filter(function(el) {
					return el._id+'' !== targetid && el._id+'' !== uid
				})

			var pendingReport = assassin.kills.filter(function(kill) {
				return kill.gameid === game.gameid && kill.victimid === targetid && kill.state === 'waiting'
			}).length > 0

			self.Bureau.assassin.getAssassin(targetid, function(err, target) {
				self.swig.renderFile('./games/views/spiral.html',
					{
						game:game,
						assassin:assassin,
						uid:uid,
						gamegroup:gamegroup,
						nonTargets:nonTargets,
						target:target,
						deadline: moment(deadline).format('MMMM Do YYYY, h:mm:ss a'),
						timeremaining: moment(deadline).fromNow(true),
						pendingReport: pendingReport
					},
					function(err, output) {
						if(err) {
							console.log('ERROR RENDERING GAME',err)
							callback(err, '')
							return
						}
						callback(null, output)
					}
				)
			})
		})
	},

	//Given killer, victim, kill method, time and everything else in the report if needed, determine whether the kill is valid
	checkKillValid: function(game, killerid, victimid, killmethod, time, report, callback) {
		//No rules about who can and can't be killed
		callback(null, true)
	},

	//Given killer, victim, kill method and the report, handle the kill
	handleKill: function(game, killerid, victimid, report, callback) {
		var self = this,
			gameid = game.gameid,
			killedCurrentTarget = game.players[killerid].targets.slice(-1)[0] === victimid,
			killedCurrentHunter = game.players[victimid].targets.slice(-1)[0] === killerid,
			addScore = function() {
				self.Bureau.game.changeScore(game.gameid, killerid, 1, callback)
			}
		//Case 1, the target or hunter is the latest one
		if(killedCurrentTarget || killedCurrentHunter) {
			if(killedCurrentTarget) {
				// console.log('Is current target')
				//We need to give them a new target
				var newstatuses = game.players[killerid].targetstatuses
				newstatuses.pop()
				newstatuses.push(1)

				self.Bureau.game.setPlayerData(gameid, killerid, {targetstatuses: newstatuses}, function(err, gamegroup) {
					// console.log('Set new target status')
					self.Bureau.game.getGame(gameid, function(err, game) {
						// console.log('Got game')
						// console.log(game)
						self.tick(game, function() {
							// console.log('Tick completed')
							//Add 1 to the score
							addScore()
						})
					})
				})
			} else if(killedCurrentHunter) {
				// console.log('Is current hunted')
				//The hunter needs a new target
				var newstatuses = game.players[victimid].targetstatuses
				newstatuses.pop()
				newstatuses.push(-1)
				self.Bureau.game.setPlayerData(gameid, victimid, {targetstatuses: newstatuses}, function(err, gamegroup) {
					self.Bureau.game.getGame(gameid, function(err, game) {
						self.tick(game, function(err, success) {
							callback(err, game)
						})
					})
				})
			}
		} else {
			//Case 2, target is a past target but the kill was made at the right time
			var indexOfTarget = game.players[killerid].targets.lastIndexOf(victimid),
				deadlines = game.players[killerid].deadlines,
				indexOfHunter = game.players[victimid].targets.lastIndexOf(killerid),
				huntedDeadlines = game.players[victimid].deadlines

			if(indexOfTarget > -1 && report.time < deadlines[indexOfTarget]) {
				var newstatuses = game.players[killerid].targetstatuses
				newstatuses[indexOfTarget] = 1

				self.Bureau.game.setPlayerData(gameid, killerid, {targetstatuses: newstatuses}, function(err, gamegroup) {
					self.Bureau.game.getGame(gameid, function(err, game) {
						self.tick(game, function() {
							//Add 1 to the score
							addScore()
						})
					})
				})
			} else if(indexOfHunter > -1 && report.time < huntedDeadlines[indexOfHunter]) {
				var newstatuses = game.players[victimid].targetstatuses
				newstatuses[indexOfHunter] = -1

				self.Bureau.game.setPlayerData(gameid, victimid, {targetstatuses: newstatuses}, function(err, gamegroup) {
					self.Bureau.game.getGame(gameid, function(err, game) {
						self.tick(game, function(err, success) {
							callback(err, game)
						})
					})
				})
			} else {
				//Old way of doing nothing
				/* self.tick(game, function(err, success) {
					callback(err, game)
				}) */

				//Now the person who was killed kind of unfairly has to be shifted out of the circle
				var newstatuses = game.players[victimid].targetstatuses
				newstatuses[newstatuses.length-1] = -1

				self.Bureau.game.setPlayerData(gameid, victimid, {targetstatuses: newstatuses}, function(err, gamegroup) {
					self.Bureau.game.getGame(gameid, function(err, game) {
						self.tick(game, function(err, success) {
							callback(err, game)
						})
					})
				})
			}
		}

	},

	//Given killer, victim, kill method and the report, undo the effects of the kill (if possible)
	undoKill: function(game, killerid, victimid, report, callback) {
		var self = this,
			gameid = game.gameid,
			subtractScore = function() {
				self.Bureau.game.changeScore(game.gameid, killerid, -1, callback)
			}

		var indexOfTarget = game.players[killerid].targets.lastIndexOf(victimid),
			deadlines = game.players[killerid].deadlines,
			indexOfHunter = game.players[victimid].targets.lastIndexOf(killerid),
			huntedDeadlines = game.players[victimid].deadlines

		if(indexOfTarget > -1 && report.time < deadlines[indexOfTarget]) {
			var newstatuses = game.players[killerid].targetstatuses
			newstatuses[indexOfTarget] = -1

			self.Bureau.game.setPlayerData(gameid, killerid, {targetstatuses: newstatuses}, function(err, gamegroup) {
				self.Bureau.game.getGame(gameid, function(err, game) {
					self.tick(game, function() {
						//Subtract 1 from score
						subtractScore()
					})
				})
			})
		} else if(indexOfHunter > -1 && report.time < huntedDeadlines[indexOfHunter]) {
			var newstatuses = game.players[victimid].targetstatuses
			newstatuses[indexOfHunter] = 0

			self.Bureau.game.setPlayerData(gameid, victimid, {targetstatuses: newstatuses}, function(err, gamegroup) {
				self.Bureau.game.getGame(gameid, function(err, game) {
					self.tick(game, function(err, success) {
						callback(err, game)
					})
				})
			})
		} else {
			self.tick(game, function(err, success) {
				callback(err, game)
			})
		}
	},

	//Given the uid of a new player added, handle all in game effects
	handlePlayerAdded: function(game, playerid, callback) {
		//Give the player a new deadline and target
		console.log('Adding '+playerid+' to game '+game.name)
		callback(null)
		var now = moment().toDate(),
			self = this,
			deadlineDays = game.custom['spiral-deadline-days'],
			newDeadline = moment(now).add(deadlineDays, 'days').toDate(),
			innerCircle = self.getInnerCircle(game),
			newPlayer = {
				targetstatuses: [0],
				deadlines: [newDeadline],
				targets: [utils.choose(innerCircle, [playerid])]
			}

		self.Bureau.game.setPlayerData(gameid, playerid, newPlayer, function(err, gamegroup) {
			self.Bureau.game.getGame(gameid, function(err, game) {
				self.tick(game, function(err, success) {
					callback(err)
				})
			})
		})

	},

	//Given the uid of a player just removed, handle all in game effects
	handlePlayerRemoved: function(game, playerid, callback) {
		//No effect
		console.log('Removing '+playerid+' from game '+game.name)
		callback(null)
		var now = moment().toDate(),
			self = this,
			deadlineDays = game.custom['spiral-deadline-days'],
			newDeadline = moment(now).add(deadlineDays, 'days').toDate(),
			newTarget = game.players[playerid].slice(-1)[0],
			playersToUpdate = Object.keys(game.players).filter(function(pid) {
				return game.players[pid].targets.slice(-1)[0] === playerid
			}),
			updatedPlayers = {}

		playersToUpdates.forEach(function(pid){
			game.players[pid].targets.pop()
			game.players[pid].targets.push(newTarget)
			game.players[pid].deadlines.pop()
			game.players[pid].deadlines.push(newDeadline)
			game.players[pid].targetstatuses.pop()
			game.players[pid].targetstatuses.push(0)

			updatedPlayers['players.'+pid+'.targets'] = game.players[pid].targets
			updatedPlayers['players.'+pid+'.deadlines'] = game.players[pid].deadlines
			updatedPlayers['players.'+pid+'.targetstatuses'] = game.players[pid].targetstatuses
		})

		self.Bureau.game.updateGame(gameid, updatedPlayers, callback)
	}
}

module.exports = spiralgame
