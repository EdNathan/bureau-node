module.exports = function( Bureau ) {

	return {
		getKillMethods: function( data, params, callback ) {

			var uid = data.USER_ID

			Bureau.assassin.getGamegroup( uid, function( err, ggid ) {

				if ( err ) {
					callback( err )
					return
				}

				Bureau.gamegroup.getKillMethods( ggid, callback )
			} )
		}
	}
}
