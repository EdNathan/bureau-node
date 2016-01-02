module.exports = function( Bureau ) {

	return {
		':gameId/:playerId': function( data, params, callback ) {
			var playerId = params.playerId,
				gameid = params.gameId,
				uid = data.USER_ID

			Bureau.assassin.isGuild( uid, function( err, isGuild ) {

				if ( err ) {
					callback( err )
					return
				}

				if ( !isGuild ) {
					callback( 'Insufficient privileges to read gamestate' )
					return
				}

				Bureau.game.getGame( gameid, function( err, game ) {
					if ( err ) {
						callback( err )
						return
					}
					Bureau.games[ game.type ].getGameStateForUid( game, playerId, function( err, gamestate ) {
						if ( err ) {
							callback( err )
							return
						}

						callback( null, {
							gameid: gameid,
							uid: playerId,
							gametype: game.type,
							gamestatefragment: gamestate
						} )
					}, uid )
				} )
			} )
		}
	}

}
