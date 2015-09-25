module.exports = function( Bureau ) {

	return {
		createBounty: function( data, params, callback ) {

		},

		'updateBounty/:bountyId': function( data, params, callback ) {

		},

		'getBounty/:bountyId': function( data, params, callback ) {
			Bureau.bounty.getBounty( params.bountyId, callback )
		}
	}
}
