class NotificationListItem extends React.Component {

	constructor() {
		super();
		this.state = {
			notification: {
				id: null,
				read: null,
				text: null,
				source: null,
				ago: null
			}
		}
	}

	handleClick( e ) {

		if ( this.props.notification.read ) return;

		BureauApi( `notifications/markRead/${this.props.notification.id}`, ( err, notifications ) => {
			this.setState( {
				notification: {
					read: true
				}
			} )
		} )
	}

	componentWillRecieveProps( nextProps ) {

		this.setState( {
			notification: nextProps.notification
		} )

	}

	componentDidMount() {
		this.componentWillRecieveProps( this.props )
	}

	render() {

		let notification = this.state.notification

		return (
			<li id={`notification-${notification.id}`} className={`${notification.read ? '' : 'notification-unread'}`} onClick={this.handleClick.bind(this)}>
				<span className="notification-message">{notification.text}</span>
				<span className="notification-ago">{notification.ago} ago {notification.source && notification.source.length > 0 ? '- '+notification.source : ''}</span>
			</li>
		)
	}

}
