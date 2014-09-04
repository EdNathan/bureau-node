//The game automatically has a reference to Bureau shoved on to it
var deathmatchgame = {
	init: function(Bureau) {
		
	},
	label: 'Deathmatch',
	//This should output html/text for displaying when setting up a game. Use form fields for extra parameters when setting up
	getGameSetupFragment: function(callback) {
		callback(null, 'Standard pair locking deathmatch')
	},
	//Passed all the form data from game setup, should modify the data and return a 'game' object for insertion into the database
	constructGame: function(data, callback) {
		var game = data,
			customData = data.custom
		/* modifications if you're a more complicated game */
		callback(null, game)
	},
	
	//Given a player uid, construct a game state fragment for the player
	getGameStateForUid: function(game, playerid, callback) {
		var err = null
		callback(err, '')
	},
	
	//Given killer, victim, kill method, time and everything else in the report if needed, determine whether the kill is valid
	checkKillValid: function(game, killerid, victimid, killmethod, time, report, callback) {
		console.log('Checking if killer killed victim')
		//We want to check whether the player has already been killed by this person, or has already killed them
		var self = this
		self.Bureau.assassin.hasKilledPlayerInGame(killerid, victimid, game.gameid, true, function(err, hasKilled) {
			if(err) {
				console.log('Error getting if killed victim: ', err)
				callback(err)
			} else {
				console.log('Checking if victim killed killer')
				self.Bureau.assassin.hasKilledPlayerInGame(victimid, killerid, game.gameid, true, function(err, hasBeenKilled) {
					if(err) {
						console.log('Error getting if killed killer: ', err)
						callback(err)
					} else {
						callback(null, !hasKilled && !hasBeenKilled)
					}
				})
			}
		})
	},
	
	//Given killer, victim, kill method and the report, handle the kill
	handleKill: function(game, killerid, victimid, report, callback) {
		//Add 1 to the score
		this.Bureau.game.changeScore(game.gameid, killerid, 1, callback)
	},
	
	//Given killer, victim, kill method and the report, undo the effects of the kill (if possible)
	undoKill: function(game, killerid, victimid, report, callback) {
		//Remove 1 from the score
		this.Bureau.game.changeScore(game.gameid, killerid, -1, callback)
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

module.exports = deathmatchgame