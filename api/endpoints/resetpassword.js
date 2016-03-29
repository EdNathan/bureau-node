'use strict'

const utils = require( '../../utils' )
const moment = require( 'moment' )

module.exports = ( Bureau ) => ( {

	':uid': ( data, params, callback ) => {

		let initiatingUser = data.USER_ID
		let userToReset = params.uid

		Bureau.assassin.isGuild( initiatingUser, ( err, isGuild ) => {

			if ( err ) {
				callback( err )
				return
			}

			if ( !isGuild ) {
				callback( 'Insufficient privileges to reset a user password' )
				return
			}

			Bureau.assassin.createTempPassword( userToReset, ( err, temppassword ) => {

				if ( err ) {
					callback( err )
					return
				}

				callback( null, {
					temppassword
				} )

				Bureau.assassin.getAssassin( initiatingUser, ( err, initiatingAssassin ) => {
					Bureau.assassin.addNotification( userToReset,
						'Your password was reset by ' + utils.fullname( initiatingAssassin ) +
						' at ' + moment().format( 'MMMM Do YYYY, h:mm:ss a' ) )
				} )
			} )
		} )
	}
} )
