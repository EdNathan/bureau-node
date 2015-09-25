var utils = require( '../../utils' ),
	moment = require( 'moment' )

module.exports = function( Bureau ) {

	return {
		':uid': function( data, params, callback ) {
			var initiatingUser = data.USER_ID,
				userToReset = params.uid

			Bureau.assassin.isGuild( initiatingUser, function( err, isGuild ) {
				if ( err ) {
					callback( err )
					return
				}

				if ( !isGuild ) {
					callback( 'Insufficient privileges to reset a user password' )
					return
				}

				Bureau.assassin.createTempPassword( userToReset, function( err, pwd ) {
					if ( err ) {
						callback( err )
						return
					}
					callback( null, {
						temppassword: pwd
					} )

					Bureau.assassin.getAssassin( initiatingUser, function( err, initiatingAssassin ) {
						Bureau.assassin.addNotification( userToReset,
							'Your password was reset by ' + utils.fullname( initiatingAssassin ) +
							' at ' + moment().format( 'MMMM Do YYYY, h:mm:ss a' ) )
					} )
				} )
			} )
		}
	}

}
