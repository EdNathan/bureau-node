'use strict'

const _ = require( 'lodash' )

module.exports = ( Bureau ) => {

	const BUREAU_TOKEN_SECRET = process.env.BUREAU_TOKEN_SECRET

	const JWT = require( './lib/jwt' )

	return {

		getJWT: ( uid, payload, callback ) => {

			if ( !payload ) {
				payload = {}
			}

			if ( _.isFunction( payload ) ) {
				callback = payload
				payload = {}
			}

			callback( null, JWT.createJWT( _.merge( {
				USER_ID: uid,
				iat: ( new Date() ).getTime()
			}, payload ), BUREAU_TOKEN_SECRET ) )
		},

		checkJWT: ( uid, token, callback ) => {
			let decodedToken = JWT.decodeJWT( token, BUREAU_TOKEN_SECRET )

			if ( decodedToken === JWT.INCORRECT_SIGNATURE ) {
				callback( 'Token signature incorrect', false )
				return
			} else if ( decodedToken === JWT.INVALID_JWT ) {
				callback( 'Token content invalid', false )
				return
			} else if ( decodedToken.USER_ID !== uid ) {
				console.log( decodedToken )
				console.log( uid )
				callback( 'Token not valid for this user', false )
				return
			} else {
				callback( null, decodedToken )
			}
		}

	}

}
