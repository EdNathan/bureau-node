module.exports = function( Bureau ) {

	return {
		getNotifications: function( data, params, callback ) {
			var uid = data.USER_ID,
				limit = data.limit ? data.limit : 30

			Bureau.assassin.getNotifications( uid, limit, callback )
		},

		'markRead/:notificationId': function( data, params, callback ) {
			var uid = data.USER_ID,
				id = params.notificationId

			Bureau.assassin.markNotificationRead( uid, id, function( err, stuff ) {
				Bureau.assassin.getNotifications( uid, 20, callback )
			} )
		},

		markAllRead: function( data, params, callback ) {
			var uid = data.USER_ID

			Bureau.assassin.markAllNotificationsRead( uid, function( err, stuff ) {
				Bureau.assassin.getNotifications( uid, 20, callback )
			} )
		}
	}
}
