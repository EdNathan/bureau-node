'use strict'

module.exports = ( Bureau ) => ( {
	getKillMethods: ( data, params, callback ) => {

		let uid = data.USER_ID

		Bureau.assassin.getGamegroup( uid, ( err, ggid ) => {

			if ( err ) {
				callback( err )
				return
			}

			Bureau.gamegroup.getKillMethods( ggid, callback )
		} )
	}
} )
