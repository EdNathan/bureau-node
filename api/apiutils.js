'use strict'

module.exports = ( Bureau ) => ( {

	onlyGuild: ( uid, callback ) => {
		Bureau.assassin.isGuild( uid, ( err, isGuild ) => {

			if ( err ) {
				callback( err )
				return
			}

			if ( !isGuild ) {
				callback( 'Insufficient privileges' )
				return
			}

			callback( null, true )
		} )
	},

	sameGamegroup: ( apiUserId, targetId, callback ) => {
		Bureau.assassin.getGamegroup( apiUserId, function( err, ggid1 ) {

			Bureau.assassin.getAssassin( targetId, function( err, assassin ) {

				if ( !assassin._id ) {
					callback( 'No assassin exists with that id' )
					return
				}

				if ( ggid1 !== assassin.gamegroup ) {
					callback( 'Player is in a different gamegroup to you' )
					return
				}

				callback( null, assassin )
			} )
		} )
	}

} )
