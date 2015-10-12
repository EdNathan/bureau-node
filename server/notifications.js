module.exports = function( Bureau ) {

	var mongoose = Bureau.mongoose
	var Schema = mongoose.Schema

	var _ = require( 'lodash' )

	var NotificationSchema = {
		text: {
			type: String,
			required: true
		},
		player: {
			type: String,
			index: true,
			required: true
		},
		read: {
			type: Boolean,
			index: true,
			default: false
		},
		priority: {
			type: Boolean,
			default: false
		},
		added: {
			type: Date,
			required: true
		},
		link: {
			type: String
		},
		source: {
			type: String
		}
	}

	var Notification = mongoose.model( 'Notification', NotificationSchema )

	var mongooseErrorsToString = function( err ) {
		return _.map( err.errors, function( e ) {
			return e.message
		} ).join( ' ' )
	}

	return {

		getNotifications: function( uid, callback ) {

			Notification.find( {
				player: uid
			}, function( err, notifications ) {

				if ( err ) {
					callback( err )
					return;
				}

				callback( err, notifications )
			} )
		},

		markNotificationRead: function( notificationId, callback ) {

			Notification.findByIdAndUpdate( notificationId, {
				$set: {
					read: true
				}
			}, function( err, notification ) {

				if ( err ) {
					callback( err )
					return;
				}

				Notification.findById( notificationId, function( err, notification ) {

					callback( null, notification )

				} )

			} )
		},

		markAllNotificationsRead: function( uid, callback ) {

			Notification.update( {
				player: uid,
				read: false
			}, {
				$set: {
					read: true
				}
			}, {
				multi: true
			}, function( err, numUpdated ) {
				Bureau.notifications.getNotifications( uid, callback )
			} )
		},

		addNotification: function( uid, data, callback ) {

			if ( data.hasOwnProperty( '_id' ) ) {
				delete data._id;
			}

			data.added = new Date()

			var notification = new Notification( data )

			notification.save( function( err, notification ) {

				if ( err ) {
					callback( mongooseErrorsToString( err ) )
					return
				}

				Bureau.notifications.getNotifications( uid, callback )
			} )

		}
	}
}
