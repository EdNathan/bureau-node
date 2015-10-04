class Toolbar extends React.Component {

	constructor() {
		super()

		bureau.toolbar = this

		this.state = {
			unreadCount: 0,
			open: true,
			panel: 'bounty'
		}

		var m = document.createElement( 'meta' );
		m.setAttribute( 'name', 'msapplication-tap-highlight' );
		m.setAttribute( 'content', 'no' );

		var m2 = document.createElement( 'meta' );
		m2.setAttribute( 'http-equiv', 'X-UA-Compatible' );
		m2.setAttribute( 'content', 'IE=edge' );

		document.head.appendChild( m );
		document.head.appendChild( m2 );

		this.contentPanel = {
			notifications: <NotificationsPanel/>,
			bounty: <BountyPanel/>
		}
	}

	setUnreadCount( unreadCount ) {

		this.setState( {
			unreadCount
		} )

	}

	setBountyCount( bountyCount ) {

		this.setState( {
			bountyCount
		} )

	}

	static grabber() {

		return (
			<svg version="1.1" id="Layer_1" x="0px" y="0px" width="30px" height="23px" viewBox="0 0 30 23">
				<rect fill="{CHOSEN_COLOUR}" width="30" height="3"/>
				<rect y="10" fill="{CHOSEN_COLOUR}" width="30" height="3"/>
				<rect y="20" fill="{CHOSEN_COLOUR}" width="30" height="3"/>
			</svg>
		)
	}

	toggleOpen() {

		this.setState( {
			open: !this.state.open
		} )

	}

	setOpen(panel) {

		let self = this

		return (e) => {

			if ( self.state.panel === panel ) {

				self.setState( {
					open: !self.state.open
				} )

			} else {

				self.setState( {
					open: true,
					panel: panel
				} )

			}

		}
	}

	render() {

		let assassin = BUREAU_ASSASSIN

		var personal = null;

		if ( assassin.imgname && assassin.imgname.length > 0 ) {
			personal = <li id="personal-toolbar-pic"><a href="/personal" style={{backgroundImage: `url(${assassin.imgname})`}} title="Me"></a></li>
		} else {
			personal = <li><a href="/personal" title="Me">&#xe001;</a></li>
		}

		return (
			<div id="toolbar" className={ this.state.open ? 'open' : '' }>
				<div id="toolbar-panel">
					{this.contentPanel[this.state.panel]}
				</div>
				<ul id="toolbar-buttons">
					<li id="grabber" onClick={this.toggleOpen.bind(this)}>{Toolbar.grabber()}</li>
					<li><a href="/home" title="Home">&#xe006;</a></li>
					<li><a id="notifications-btn" href="#" onClick={this.setOpen('notifications')}>&#xe004;<span className="unread-count">{this.state.unreadCount > 0 ? this.state.unreadCount : null}</span></a></li>
					<li><a id="bounties-btn" href="#" title="Bounties" onClick={this.setOpen('bounty')}>$<span className="unread-count">{this.state.bountyCount > 0 ? this.state.bountyCount : null}</span></a></li>
					{personal}
					{assassin.guild ? <li><a href="/guild" title="Guild">&#xe005;</a></li> : null}
					{assassin.admin ? <li><a href="/admin" title="Admin">&#10083;</a></li> : null}
					<li><a href="/goodbye" title="Goodbye">&#xe002;</a></li>
				</ul>
			</div>

		)
	}
}
