module.exports = function( Bureau ) {

	return function( data, params, callback ) {

		var uid = data.USER_ID,
			optout = data.optout

		Bureau.assassin.setOptout( uid, optout, function( err ) {

			if ( err ) {
				callback( err )
				return
			}

			callback( null, {
				optout: optout
			} )

			Bureau.assassin.addNotification( uid, 'You will now ' + ( optout ? 'no longer ' : '' ) +
				'be automatically added to a new game if you played in the previous one.'
			)

		} )
	}

}
