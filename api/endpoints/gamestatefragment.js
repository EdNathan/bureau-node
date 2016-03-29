'use strict'

module.exports = ( Bureau ) => ( {

	':gameId/:playerId': ( data, params, callback ) => {
		let playerId = params.playerId
		let gameid = params.gameId
		let uid = data.USER_ID

		Bureau.assassin.isGuild( uid, ( err, isGuild ) => {

			if ( err ) {
				callback( err )
				return
			}

			if ( !isGuild ) {
				callback( 'Insufficient privileges to read gamestate' )
				return
			}

			Bureau.game.getGame( gameid, ( err, game ) => {
				if ( err ) {
					callback( err )
					return
				}
				Bureau.games[ game.type ].getGameStateForUid( game, playerId, ( err, gamestate ) => {
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
} )
