'use strict'

module.exports = ( Bureau ) => ( {
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

	getNotifications: ( data, params, callback ) => Bureau.notifications.getNotifications(
		data.USER_ID, data.limit ? data.limit : 30, callback ),

	/**
	 * @api {post} /notifications/markRead/:notificationId markRead
	 * @apiDescription Mark a notification as read
	 * @apiName notifications/markRead/:
	 * @apiGroup notifications
	 *
	 * @apiSuccess {Object[]} notifications The last 30 notifications
	 *
	 */

	'markRead/:notificationId': ( data, params, callback ) => Bureau.notifications.markNotificationRead(
		params.notificationId, ( err, stuff ) => Bureau.assassin.getNotifications( data.USER_ID, 30, callback ) ),

	/**
	 * @api {post} /notifications/markAllRead markAllRead
	 * @apiDescription Mark all notifications as read
	 * @apiName notifications/markAllRead
	 * @apiGroup notifications
	 *
	 * @apiSuccess {Object[]} notifications The last 30 notifications
	 *
	 */

	markAllRead: ( data, params, callback ) => {
		let uid = data.USER_ID

		Bureau.notifications.markAllNotificationsRead(
			uid, ( err, notifications ) => Bureau.notifications.getNotifications( uid, 30, callback ) )
	}
} )
