'use strict'

module.exports = ( Bureau ) => ( {

	':gametype': ( data, params, callback ) => {

		let gametype = params.gametype

		if ( !Bureau.game.isGameType( gametype ) ) {
			callback( '"' + gametype + '" is not a valid game type' )
			return
		}

		Bureau.games[ gametype ].getGameSetupFragment( function( err, fragment ) {

			if ( err ) {
				callback( err )
				return
			}

			callback( null, fragment )
		} )
	}
} )
