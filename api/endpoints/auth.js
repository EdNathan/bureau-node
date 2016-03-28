'use strict'

const _ = require( 'lodash' )

module.exports = ( Bureau ) => ( {

	login: ( data, params, callback ) => {

		let email = _.isString( data.email ) ? data.email : ''
		let password = _.isString( data.password ) ? data.password : ''

		Bureau.register.loginAssassin( email, password, ( err, assassin ) => {

			if ( err ) {
				callback( err )
				return
			} else if ( !assassin ) {
				callback( 'Incorrect email or password' )
				return
			}

			let uid = assassin._id + ''

			Bureau.assassin.getToken( uid, ( err, token ) => {
				if ( err ) {
					callback( err )
					return
				}

				callback( null, {
					USER_ID: uid,
					USER_TOKEN: token
				} )
			} )

		} )
	}

} )
