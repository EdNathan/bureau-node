//The game automatically has a reference to Bureau shoved on to it
var zombiesgame = {
	init: function(Bureau) {

	},
	label: 'Zombies',
	//This should output html/text for displaying when setting up a game. Use form fields for extra parameters when setting up
	getGameSetupFragment: function(callback) {
		this.swig.renderFile('./games/fragments/zombiesSetupFragment.html', {}, function(err, output) {
			callback(null, output)
		})
	},
	//Passed all the form data from game setup, should modify the data and return a 'game' object for insertion into the database
	constructGame: function(data, callback) {
		var game = data,
			customData = game.custom,
			maxKills = parseInt(game.custom['zombies-kill-limit'])

		if(!isNaN(maxKills) && maxKills > 0) {
			customData['zombies-show-count'] = !!customData['zombies-show-count']
			customData['zombies-kill-limit'] = maxKills
			callback(null, game)
		} else {
			callback('Invalid number of max kills', {})
		}
	},

	//Given a player uid, construct a game state fragment for the player
	getGameStateForUid: function(game, playerid, callback) {
		var err = null
		callback(err, !!game.players[playerid].zombie ? 'Zombie' : 'Survivor')
	},

	renderGame: function(game, assassin, gamegroup, callback) {
		var self = this,
			uid = assassin._id+'',
			players = game.players,
			isZombie = !!game.players[uid].zombie,
			survivors = game.assassins.filter(function(el) {
				return !game.players[el._id+''].zombie
			})

		self.swig.renderFile('./games/views/zombies.html',
			{
				game:game,
				assassin:assassin,
				uid:uid,
				gamegroup:gamegroup,
				survivors:survivors,
				isZombie: isZombie
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
	},

	//Given killer, victim, kill method, time and everything else in the report if needed, determine whether the kill is valid
	checkKillValid: function(game, killerid, victimid, killmethod, time, report, callback) {
		console.log('Checking if victim is zombie')
		//The only rule is that zombies cannot be killed
		callback(null, !game.players[victimid].zombie)
	},

	//Given killer, victim, kill method and the report, handle the kill
	handleKill: function(game, killerid, victimid, report, callback) {
		var self = this,
			gameid = game.gameid,
			maxDeathCount = game.custom['zombies-kill-limit'],
			addScore = function() {
				self.Bureau.game.changeScore(game.gameid, killerid, 1, callback)
			}

		self.Bureau.assassin.getDeathsFromGame(victimid, gameid, false, function(err, deaths) {
			var deathCount = deaths.length

			if(deathCount >= maxDeathCount) {
				//We need to make the person a zombie!
				self.Bureau.game.setPlayerData(gameid, victimid, {zombie: true}, function(err, game) {
					//Add 1 to the score
					addScore()
				})
			} else {
				//Add 1 to the score
				addScore()
			}
		})

	},

	//Given killer, victim, kill method and the report, undo the effects of the kill (if possible)
	undoKill: function(game, killerid, victimid, report, callback) {
		var self = this,
			gameid = game.gameid,
			maxDeathCount = game.custom['zombies-kill-limit'],
			subtractScore = function() {
				self.Bureau.game.changeScore(game.gameid, killerid, -1, callback)
			}

		self.Bureau.game.getPlayer(gameid, victimid, function(err, player) {

			self.Bureau.assassin.getDeathsFromGame(victimid, gameid, false, function(err, deaths) {
				var deathCount = deaths.length

				if(deathCount == maxDeathCount && !player.permaZombie) {
					//We need to make the person alive again!
					self.Bureau.game.setPlayerData(gameid, victimid, {zombie: false}, function(err, game) {
						//Add 1 to the score
						subtractScore()
					})
				} else {
					//Add 1 to the score
					subtractScore()
				}
			})
		})
	},

	//Given the uid of a new player added, handle all in game effects
	handlePlayerAdded: function(game, playerid, callback) {
		//No effect
		console.log('Adding '+playerid+' to game '+game.name)
		callback(null)
	},

	//Given the uid of a player just removed, handle all in game effects
	handlePlayerRemoved: function(game, playerid, callback) {
		//No effect
		console.log('Removing '+playerid+' from game '+game.name)
		callback(null)
	}
}

module.exports = zombiesgame
