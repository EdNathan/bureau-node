'use strict'

const _ = require( 'lodash' )
const utils = require( '../../utils' )

module.exports = function( Bureau ) {

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

		'getAssassin/:uid': function( data, params, callback ) {

			var uid = params.uid

			apiutils.sameGamegroup( data.USER_ID, uid, ( err, assassin ) => {
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

		getAssassins: function( data, params, callback ) {

			Bureau.assassin.getGamegroup( data.USER_ID, function( err, ggid ) {

				var filter = _.omit( data, [ 'USER_ID', 'APP_TOKEN' ] )
				filter.gamegroup = ggid

				Bureau.assassin.getAssassins( filter, function( err, assassins ) {

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

		getAssassinsFromAssassinIds: function( data, params, callback ) {

			var assassinIds = data.assassinIds

			if ( !_.isArray( assassinIds ) ) {
				callback( 'Assassin ids must be supplied as an array' )
				return
			}

			Bureau.assassin.getGamegroup( data.USER_ID, function( err, ggid ) {

				Bureau.assassin.getAssassinsFromIds( assassinIds, function( err, assassins ) {

					if ( err ) {
						callback( err )
						return
					}

					assassins = assassins.filter( function( assassin ) {
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
		 *
		 * @apiSuccess {Object[]} assassins Assassin data
		 *
		 */

		searchAssassinsByName: function( data, params, callback ) {

			var query = data.name

			if ( !_.isString( query ) || !query ) {
				callback( 'name must be a string' )
				return
			}

			query = utils.makeFuzzyRegex( query )

			var queryRegex = new RegExp( query, 'i' )

			var projector = _.transform( _.keyBy( assassinProjection ), function( result, n, key ) {
				result[ key ] = 1
			} )

			projector.fullname = {
				$concat: [ "$forename", " ", "$surname" ]
			}

			Bureau.assassin.getGamegroup( data.USER_ID, function( err, ggid ) {

				var aggregationPipeline = [ {
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

				Bureau.db.collection( 'assassins' ).aggregate( aggregationPipeline, function( err, assassins ) {

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
