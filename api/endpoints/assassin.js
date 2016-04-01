'use strict'

const _ = require( 'lodash' )
const utils = require( '../../utils' )

module.exports = ( Bureau ) => {

	const projectAssassin = utils.projectAssassin
	const assassinProjection = utils.assassinProjection

	const apiutils = require( '../apiutils' )( Bureau )

	return {
		/**
		 * @api {post} /assassin/getAssassin/:uid getAssassin
		 * @apiDescription Get data for an assassin
		 * @apiName assassin/getAssassin
		 * @apiGroup assassin
		 *
		 * @apiSuccess {Object} assassin Assassin data
		 *
		 */

		'getAssassin/:uid': ( data, params, callback ) => {

			apiutils.sameGamegroup( data.USER_ID, params.uid, ( err, assassin ) => {

				if ( err ) {
					callback( err )
					return
				}

				callback( null, projectAssassin( assassin ) )
			} )
		},

		/**
		 * @api {post} /assassin/getAssassins getAssassins
		 * @apiDescription Get data for assassins
		 * @apiName assassin/getAssassins
		 * @apiGroup assassin
		 *
		 * @apiParam {Object} query Query data for matching assassins
		 *
		 * @apiSuccess {Object[]} assassins Assassin data
		 *
		 */

		getAssassins: ( data, params, callback ) => {

			Bureau.assassin.getGamegroup( data.USER_ID, ( err, ggid ) => {

				let filtered = _.omit( data, [ 'USER_ID', 'APP_TOKEN' ] )
				filtered.gamegroup = ggid

				Bureau.assassin.getAssassins( filtered, ( err, assassins ) => {

					if ( err ) {
						callback( err )
						return
					}

					callback( null, assassins.map( projectAssassin ) )

				} )

			} )

		},

		/**
		 * @api {post} /assassin/getAssassinsFromAssassinIds getAssassinsFromAssassinIds
		 * @apiDescription Get data for assassins from their ids
		 * @apiName assassin/getAssassinsFromAssassinIds
		 * @apiGroup assassin
		 *
		 * @apiParam {String[]} assassinIds An array of assassin ids
		 *
		 * @apiSuccess {Object[]} assassins Assassin data
		 *
		 */

		getAssassinsFromAssassinIds: ( data, params, callback ) => {

			if ( !_.isArray( data.assassinIds ) ) {
				callback( 'Assassin ids must be supplied as an array' )
				return
			}

			let assassinIds = data.assassinIds.filter( _.isString )

			Bureau.assassin.getGamegroup( data.USER_ID, ( err, ggid ) => {

				Bureau.assassin.getAssassinsFromIds( assassinIds, ( err, assassins ) => {

					if ( err ) {
						callback( err )
						return
					}

					assassins = assassins.filter( ( assassin ) => {
						return assassin.gamegroup === ggid
					} )

					callback( null, assassins.map( projectAssassin ) )

				} )
			} )
		},

		/**
		 * @api {post} /assassin/searchAssassinsByName searchAssassinsByName
		 * @apiDescription Search for assassin data by name
		 * @apiName assassin/searchAssassinsByName
		 * @apiGroup assassin
		 *
		 * @apiParam {String} name A search string on assassin names
		 * @apiParam {Boolean} strict If true search for exact case insensitive match
		 *
		 * @apiSuccess {Object[]} assassins Assassin data
		 *
		 */

		searchAssassinsByName: ( data, params, callback ) => {

			let query = data.name

			if ( !_.isString( query ) || !query ) {
				callback( 'name must be a string' )
				return
			}

			if ( data.hasOwnProperty( 'strict' ) && !_.isBoolean( data.strict ) ) {
				callback( 'strict must be a boolean' )
				return
			}

			query = data.strict ? query : utils.makeFuzzyRegex( query )

			let queryRegex = new RegExp( query, 'i' )

			let projector = _.transform( _.keyBy( assassinProjection ), ( result, n, key ) => {
				result[ key ] = 1
			} )

			projector.fullname = {
				$concat: [ "$forename", " ", "$surname" ]
			}

			Bureau.assassin.getGamegroup( data.USER_ID, ( err, ggid ) => {

				let aggregationPipeline = [ {
					$match: {
						gamegroup: ggid
					}
				}, {
					$project: projector
				}, {
					$match: {
						fullname: queryRegex
					}
				} ]

				Bureau.db.collection( 'assassins' ).aggregate( aggregationPipeline, ( err, assassins ) => {

					if ( err ) {
						callback( err )
						return
					}

					callback( null, assassins.map( projectAssassin ) )

				} )

			} )
		}
	}

}
