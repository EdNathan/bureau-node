'use strict'

module.exports = ( Bureau ) => ( {

	createAppToken: ( data, params, callback ) => {

		if ( !Bureau.isAdmin( data.USER_ID ) ) {
			callback( 'Insufficient privileges to create an app token' )
			return
		}

		Bureau.apptoken.createAppToken( data.name, data.owners, callback )
	},

	listAppTokens: ( data, params, callback ) => {

		if ( !Bureau.isAdmin( data.USER_ID ) ) {
			callback( 'Insufficient privileges to create an app token' )
			return
		}

		Bureau.apptoken.listAppTokens( callback )
	}
} )
