class BountyList extends React.Component {

	constructor() {
		super();
		this.state = { bounties: [], closed: true };
	}

	componentDidMount() {

		BureauApi( 'bounty/getActiveBounties', ( err, bounties ) => {

			this.setState( {
				bounties
			} );

			bureau.toolbar.setBountyCount( bounties.length )

		});

		makeColourItem(React.findDOMNode(this))
	}

	static getUnclaimedBountyCount(callback) {

		BureauApi( 'bounty/getActiveBounties', ( err, bounties ) => {

			callback( err, bounties.length )

		});

	}

	render() {

		if ( !this.state.bounties.length ) {
			return false
		}

		return (
			<div>
				<ul className={'bounty-list'+(this.state.closed ? ' bounty-list-closed' : '')} style={{color:CHOSEN_COLOUR}}>
					{ this.state.bounties.map( ( bounty, i ) => <BountyListItem bounty={bounty} key={i}></BountyListItem> ) }
				</ul>
			</div>
		)

	}
}
