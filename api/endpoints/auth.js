'use strict'

const _ = require( 'lodash' )

module.exports = ( Bureau ) => ( {

	/**
	 * @api {post} /auth/login login
	 * @apiDescription Acquire a USER_TOKEN and USER_ID from email and password.
	 *
	 * **Note you DO NOT need to send USER_ID or USER_TOKEN to this endpoint**
	 *
	 * @apiName auth/login
	 * @apiGroup auth
	 *
	 * @apiParam {String} email Email
	 * @apiParam {String} password Password
	 *
	 * @apiSuccess {String} USER_ID Assassin user id
	 * @apiSuccess {String} USER_TOKEN API authentication token
	 *
	 */

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
