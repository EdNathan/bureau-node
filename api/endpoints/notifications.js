module.exports = function( Bureau ) {

	return {
		/**
		 * @api {post} /notifications/getNotifications getNotifications
		 * @apiDescription Get your notifications
		 * @apiName notifications/getNotifications
		 * @apiGroup notifications
		 *
		 * @apiParam {Number} [limit=30] The maximum number of notifications to retrieve
		 *
		 * @apiSuccess {Object[]} notifications The most recent [limit] notifications
		 *
		 */

		getNotifications: function( data, params, callback ) {
			var uid = data.USER_ID,
				limit = data.limit ? data.limit : 30

			Bureau.notifications.getNotifications( uid, limit, callback )
		},

		/**
		 * @api {post} /notifications/markRead/:notificationId markRead
		 * @apiDescription Mark a notification as read
		 * @apiName notifications/markRead/:
		 * @apiGroup notifications
		 *
		 * @apiSuccess {Object[]} notifications The last 30 notifications
		 *
		 */

		'markRead/:notificationId': function( data, params, callback ) {
			var uid = data.USER_ID,
				id = params.notificationId

			Bureau.notifications.markNotificationRead( id, function( err, stuff ) {
				Bureau.assassin.getNotifications( uid, 30, callback )
			} )
		},

		/**
		 * @api {post} /notifications/markAllRead markAllRead
		 * @apiDescription Mark all notifications as read
		 * @apiName notifications/markAllRead
		 * @apiGroup notifications
		 *
		 * @apiSuccess {Object[]} notifications The last 30 notifications
		 *
		 */

		markAllRead: function( data, params, callback ) {
			var uid = data.USER_ID

			Bureau.notifications.markAllNotificationsRead( uid, function( err, notifications ) {
				Bureau.notifications.getNotifications( uid, 30, callback )
			} )
		}
	}
}
