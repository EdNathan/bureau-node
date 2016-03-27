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

		let uid = data.USER_ID

		Bureau.assassin.getGamegroup( uid, ( err, ggid ) => {

			if ( err ) {
				callback( err )
				return
			}

			Bureau.gamegroup.getKillMethods( ggid, callback )
		} )
	}
} )
