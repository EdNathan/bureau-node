module.exports = function( Bureau ) {

	return {
		createBounty: function( data, params, callback ) {

			var uid = data.USER_ID

			Bureau.assassin.isGuild( uid, function( err, isGuild ) {

				if ( err ) {
					callback( err )
					return
				}

				if ( !isGuild ) {
					callback( 'Insufficient privileges to create a bounty' )
					return
				}

				Bureau.assassin.getGamegroup( uid, function( err, ggid ) {

					data.gamegroup = ggid

					Bureau.bounty.createBounty( data, callback )

				} )
			} )
		},

		'updateBounty/:bountyId': function( data, params, callback ) {

			Bureau.bounty.getBounty( params.bountyId, function( err, bounty ) {

				if ( err ) {
					callback( err )
					return
				}

				Bureau.assassin.isGuild( data.USER_ID, function( err, isGuild ) {

					if ( err ) {
						callback( err )
						return
					}

					if ( !isGuild ) {
						callback( 'Insufficient privileges to update a bounty' )
						return
					}

					Bureau.assassin.getGamegroup( data.USER_ID, function( err, ggid ) {

						if ( bounty.gamegroup !== ggid ) {
							callback( 'Bounty with id ' + params.bountyId + ' does not exist' )
							return
						}

						Bureau.bounty.updateBounty( params.bountyId, data, callback )

					} )
				} )
			} )
		},

		'getBounty/:bountyId': function( data, params, callback ) {
			Bureau.bounty.getBounty( params.bountyId, callback )
		},

		getActiveBounties: function( data, params, callback ) {

			var uid = data.USER_ID

			Bureau.assassin.getGamegroup( uid, function( err, ggid ) {

				Bureau.bounty.getActiveBounties( ggid, callback )

			} )
		}
	}
}
