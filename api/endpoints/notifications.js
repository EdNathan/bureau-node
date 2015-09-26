module.exports = function( Bureau ) {

	return {
		getNotifications: function( data, params, callback ) {
			var uid = data.USER_ID,
				limit = data.limit

			Bureau.assassin.getNotifications( uid, limit, callback )
		},

		'markRead/:notificationId': function( data, params, callback ) {
			var uid = data.USER_ID,
				id = params.notificationId

			Bureau.assassin.markNotificationRead( uid, id, function( err ) {
				Bureau.assassin.getNotifications( uid, 20, callback )
			} )
		}
	}
}