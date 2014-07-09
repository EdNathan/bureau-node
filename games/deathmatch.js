//The game automatically has a reference to Bureau shoved on to it
var deathmatchgame = {
	init: function(Bureau) {
		
	},
	
	//This should output html/text for displaying when setting up a game. Use form fields for extra parameters when setting up
	getGameSetupFragment: function() {
		return 'Standard pair locking deathmatch'
	},
	//Passed all the form data from game setup, should modify the data and return a 'game' object for insertion into the database
	constructGame: function(data) {
		var game = data
		/* modifications if you're a more complicated game */
		return game
	},
	
	//Given a player uid, construct a game state fragment for the player
	getGameStateForUid: function(game, playerid) {
		
	},
	
	//Given killer, victim, kill method, time and everything else in the report if needed, determine whether the kill is valid
	checkKillValid: function(game, killerid, victimid, killmethod, time, report, callback) {
		
	},
	
	//Given killer, victim, kill method and the report, handle the kill
	handleKill: function(game, killerid, victimid, report, callback) {
		
	},
	
	//Given killer, victim, kill method and the report, undo the effects of the kill (if possible)
	undoKill: function(game, killerid, victimid, report, callback) {
		
	},
	
	//Given the uid of a new player added, handle all in game effects
	handlePlayerAdded: function(game, playerid) {
		
	},
	
	//Given the uid of a player just removed, handle all in game effects
	handlePlayerRemoved: function(game, playerid) {
		
	}
}

module.exports = deathmatchgame