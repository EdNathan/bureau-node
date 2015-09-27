class NotificationsPanel extends React.Component {

	constructor() {
		super()
		this.state = {
			notifications: []
		}
		bureau.notificationsPanel = this;
	}

	componentDidMount() {
		this.refresh()
	}

	refresh() {
		BureauApi( 'notifications/getNotifications', ( err, notifications ) => {

			this.setState( {
				notifications
			} )

			var unreadCount = notifications.reduce( ( previousValue, currentValue ) => {
				return previousValue + ( currentValue.read ? 0 : 1 );
			}, 0 )

			bureau.toolbar.setUnreadCount( unreadCount > 0 ? unreadCount : '' )

		} )
	}

	render() {

		let notifications = this.state.notifications

		return (
			<div className="toolbar-panel-wrapper">
				<div className="toolbar-header" style={{color:CHOSEN_COLOUR}}>Notifcations</div>
				<ul className="toolbar-content">
					{this.state.notifications.map( ( notification, i ) => <NotificationListItem notification={notification} key={i} /> )}
				</ul>
			</div>
		)
	}
}
