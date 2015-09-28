class NotificationListItem extends React.Component {

	render() {

		let notification = this.props.notification

		return (
			<li className={`notification-list-item ${notification.read ? '' : 'notification-unread'}`} onClick={this.props.onClick}>
				<span className="notification-message">{notification.text}</span>
				<span className="notification-ago">{timeSince(notification.added)} ago {notification.source && notification.source.length > 0 ? '- '+notification.source : ''}</span>
			</li>
		)
	}
}
