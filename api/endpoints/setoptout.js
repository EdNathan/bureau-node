'use strict'

module.exports = ( Bureau ) => ( data, params, callback ) => {

	let uid = data.USER_ID
	let optout = data.optout

	Bureau.assassin.setOptout( uid, optout, ( err ) => {

		if ( err ) {
			callback( err )
			return
		}

		callback( null, {
			optout
		} )

		Bureau.assassin.addNotification( uid,
			`You will now ${( optout ? 'no longer ' : '' )} be automatically added to a new game if you played in the previous one.`
		)

	} )
}
