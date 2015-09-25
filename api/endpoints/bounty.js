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
					callback( 'Insufficient privileges to reset a user password' )
					return
				}

				Bureau.assassin.getGamegroup( uid, function( err, ggid ) {

					data.gamegroup = ggid

					Bureau.bounty.createBounty( data, callback )

				} )
			} )
		},

		'updateBounty/:bountyId': function( data, params, callback ) {

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
