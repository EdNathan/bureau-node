'use strict'

module.exports = ( Bureau ) => {

	const apiutils = require( '../apiutils' )( Bureau )

	return {

		/**
		 * @api {post} /bounty/createBounty createBounty
		 * @apiDescription Create a bounty
		 * @apiName bounty/createBounty
		 * @apiGroup bounty
		 *
		 * @apiPermission guild
		 *
		 * @apiParam {String} title Title of the bounty
		 * @apiParam {String} [comment] A description of the bounty. May be verbose and lyrical
		 * @apiParam {Boolean} anyPlayer True if the bounty can be claimed on any player
		 * @apiParam {String[]} players An array of player ids on which the bounty can be claimed. Leave empty if anyPlayer
		 * @apiParam {String[]} issuers An array of player ids that issued the bounty. Leave blank to default to "The Guild"
		 * @apiParam {Boolean} anyKillmethod True if any kill method can be used to claim the bounty
		 * @apiParam {String[]} killmethods An array of kill method ids (see killmethods API) with which the bounty can be claimed. Leave blank if anyKillmethod
		 *
		 * @apiSuccess {Object} bounty The submitted bounty
		 *
		 */
		createBounty: ( data, params, callback ) => {

			apiutils.onlyGuild( data.USER_ID, callback, ( err, isGuild ) => {

				Bureau.assassin.getGamegroup( data.USER_ID, ( err, ggid ) => {

					data.gamegroup = ggid

					Bureau.bounty.createBounty( data, callback )

				} )
			} )
		},

		/**
		 * @api {post} /bounty/updateBounty/:bountyId updateBounty
		 * @apiDescription Update a bounty
		 * @apiName bounty/updateBounty
		 * @apiGroup bounty
		 *
		 * @apiPermission guild
		 *
		 * @apiParam {String} title Title of the bounty
		 * @apiParam {String} [comment] A description of the bounty. May be verbose and lyrical
		 * @apiParam {Boolean} anyPlayer True if the bounty can be claimed on any player
		 * @apiParam {String[]} players An array of player ids on which the bounty can be claimed. Leave empty if anyPlayer
		 * @apiParam {String[]} issuers An array of player ids that issued the bounty. Leave blank to default to "The Guild"
		 * @apiParam {Boolean} anyKillmethod True if any kill method can be used to claim the bounty
		 * @apiParam {String[]} killmethods An array of kill method ids (see killmethods API) with which the bounty can be claimed. Leave blank if anyKillmethod
		 *
		 * @apiSuccess {Object} bounty The updated bounty
		 *
		 */
		'updateBounty/:bountyId': ( data, params, callback ) => {


			apiutils.onlyGuild( data.USER_ID, callback, ( err, isGuild ) => {

				Bureau.bounty.getBounty( params.bountyId, ( err, bounty ) => {

					if ( err ) {
						callback( err )
						return
					}

					Bureau.assassin.getGamegroup( data.USER_ID, ( err, ggid ) => {

						if ( bounty.gamegroup !== ggid ) {
							callback( 'Bounty with id ' + params.bountyId + ' does not exist' )
							return
						}

						delete data.state

						Bureau.bounty.updateBounty( params.bountyId, data, callback )

					} )
				} )
			} )
		},

		/**
		 * @api {post} /bounty/archiveBounty/:bountyId archiveBounty
		 * @apiDescription Archive a bounty
		 * @apiName bounty/archiveBounty
		 * @apiGroup bounty
		 *
		 * @apiPermission guild
		 *
		 * @apiSuccess {Object} bounty The archived bounty
		 *
		 */

		'archiveBounty/:bountyId': ( data, params, callback ) => {

			apiutils.onlyGuild( data.USER_ID, callback, ( err, isGuild ) => {

				Bureau.bounty.getBounty( params.bountyId, ( err, bounty ) => {

					if ( err ) {
						callback( err )
						return
					}

					Bureau.assassin.getGamegroup( data.USER_ID, ( err, ggid ) => {

						if ( bounty.gamegroup !== ggid ) {
							callback( 'Bounty with id ' + params.bountyId + ' does not exist' )
							return
						}

						Bureau.bounty.archiveBounty( params.bountyId, callback )

					} )

				} )

			} )
		},

		/**
		 * @api {post} /bounty/getBounty/:bountyId getBounty
		 * @apiDescription Get a bounty
		 * @apiName bounty/getBounty
		 * @apiGroup bounty
		 *
		 * @apiSuccess {Object} bounty The requested bounty
		 *
		 */

		'getBounty/:bountyId': ( data, params, callback ) => Bureau.bounty.getBounty( params.bountyId, callback ),


		/**
		 * @api {post} /bounty/getActiveBounties/ getActiveBounties
		 * @apiDescription Get active bounties
		 * @apiName bounty/getActiveBounties
		 * @apiGroup bounty
		 *
		 * @apiSuccess {Object[]} bounties An array of active bounties
		 *
		 */

		getActiveBounties: ( data, params, callback ) => Bureau.assassin.getGamegroup(
			data.USER_ID, ( err, ggid ) => Bureau.bounty.getActiveBounties( ggid, callback ) )

	}
}
