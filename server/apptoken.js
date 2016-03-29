'use strict'

const utils = require( '../utils' )
const _ = require( 'lodash' )

module.exports = ( Bureau ) => {

	const mongoose = Bureau.mongoose
	const Schema = mongoose.Schema

	const AppTokenSchema = {
		name: {
			type: String,
			required: true
		},
		owners: {
			type: [ String ],
			required: true
		},
		granted: {
			type: Date,
			required: true
		}
	}

	const AppToken = mongoose.model( 'AppToken', AppTokenSchema )

	const mongooseErrorsToString = function( err ) {
		return _.map( err.errors, function( e ) {
			return e.message
		} ).join( ' ' )
	}

	let _AppToken = {

		createAppToken: ( name, owners, callback ) => {

			if ( !_.isString( name ) || name.length < 5 ) {
				callback( 'App name must be at least 5 chars long' )
				return
			}

			Bureau.assassin.getAssassinsFromIds( owners, ( err, assassins ) => {
				if ( err ) {
					callback( err )
					return
				}

				if ( owners.length !== assassins.length ) {
					callback( 'Not all owners are valid assassin ids' )
					return
				}

				let granted = new Date()

				let appToken = new AppToken( {
					name, owners, granted
				} )

				appToken.save( ( err, appToken ) => {
					if ( err ) {
						callback( err )
					} else {
						callback( null, appToken )
					}
				} )
			} )
		},

		listAppTokens: ( callback ) => AppToken.find( {}, utils.objectifyCallback( callback ) ),

		getAppTokenDetail: ( appTokenId, callback ) => AppToken.findById( appTokenId, ( err, appToken ) => {

			if ( err || !appToken ) {
				callback( 'No app token exists with that ID' )
				return
			}

			utils.objectifyCallback( callback )( null, appToken )
		} ),

		checkAppToken: ( appTokenId, callback ) => {

			if ( appTokenId === process.env.BUREAU_APP_TOKEN ) {
				callback( null, true )
				return
			}

			_AppToken.getAppTokenDetail( appTokenId, ( err, appToken ) => {
				if ( err ) {
					callback( err, false )
					return
				}

				callback( null, true )
			} )

		}

	}

	return _AppToken
}
