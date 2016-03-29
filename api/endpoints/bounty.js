'use strict'

module.exports = ( Bureau ) => {

	const apiutils = require( '../apiutils' )( Bureau )

	return {
		createBounty: ( data, params, callback ) => {

			apiutils.onlyGuild( data.USER_ID, callback, ( err, isGuild ) => {

				Bureau.assassin.getGamegroup( data.USER_ID, ( err, ggid ) => {

					data.gamegroup = ggid

					Bureau.bounty.createBounty( data, callback )

				} )
			} )
		},

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

						Bureau.bounty.updateBounty( params.bountyId, data, callback )

					} )
				} )
			} )
		},

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

		'getBounty/:bountyId': ( data, params, callback ) => Bureau.bounty.getBounty( params.bountyId, callback ),

		getActiveBounties: ( data, params, callback ) => Bureau.assassin.getGamegroup(
			data.USER_ID, ( err, ggid ) => Bureau.bounty.getActiveBounties( ggid, callback ) )

	}
}
