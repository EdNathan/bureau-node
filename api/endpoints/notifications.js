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

			Bureau.assassin.markNotificationRead( uid, id, function( err, shit ) {
				console.log( shit.notifications.filter( function( n ) {
					return n.id === id
				} ) )
				Bureau.assassin.getNotifications( uid, 20, callback )
			} )
		}
	}
}
