'use strict'

module.exports = ( Bureau ) => ( {
	/**
	 * @api {post} /killmethods/getKillMethods getKillMethods
	 * @apiDescription Get all kill methods available in a gamegroup
	 * @apiName killmethods/getKillMethods
	 * @apiGroup killMethods
	 *
	 * @apiSuccess {Object[]} killmethods Kill Methods available for your gamegroup
	 *
	 */
	getKillMethods: ( data, params, callback ) => {

		Bureau.assassin.getGamegroup( data.USER_ID, ( err, ggid ) => {

			if ( err ) {
				callback( err )
				return
			}

			Bureau.gamegroup.getKillMethods( ggid, callback )
		} )
	}
} )
