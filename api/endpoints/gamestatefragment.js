module.exports = function( Bureau ) {

	return {
		':gameId/:playerId': function( data, params, callback ) {
			var uid = params.playerId,
				gameid = params.gameId

			Bureau.game.getGame( gameid, function( err, game ) {
				if ( err ) {
					callback( err )
					return
				}
				Bureau.games[ game.type ].getGameStateForUid( game, uid, function( err, gamestate ) {
					if ( err ) {
						callback( err )
						return
					}
					console.log( gamestate )
					callback( null, {
						gameid: gameid,
						uid: uid,
						gametype: game.type,
						gamestatefragment: gamestate
					} )
				} )
			} )
		}
	}

}
