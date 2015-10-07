class NotificationsPanel extends React.Component {

	constructor(props) {
		super(props)
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

	markRead(notification) {
		return (e) => {
			BureauApi( `notifications/markRead/${notification.id}`, ( err, notifications ) => {
				this.refresh()
			} )
		}
	}

	render() {

		let notifications = this.state.notifications

		var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup

		return (
			<div className="toolbar-panel-wrapper">
				<div className="toolbar-header" style={{color:CHOSEN_COLOUR}}>Notifcations</div>
				<ReactCSSTransitionGroup transitionName="toolbar-content-slideleft" className="toolbar-content notification-list" component='ul'>
					{this.state.notifications.map( ( notification, i ) => <NotificationListItem onClick={this.markRead(notification)} notification={notification} key={this.state.notifications.length - i} /> )}
				</ReactCSSTransitionGroup>
			</div>
		)
	}
}
