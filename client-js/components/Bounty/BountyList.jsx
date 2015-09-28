class BountyList extends React.Component {

	constructor() {
		super()
		this.state = { bounties: [] }
	}

	componentDidMount() {

		BureauApi( 'bounty/getActiveBounties', ( err, bounties ) => {

			this.setState( {
				bounties
			} )

			bureau.toolbar.setBountyCount( bounties.length )

		})

		makeColourItem(React.findDOMNode(this))
	}

	static getUnclaimedBountyCount(callback) {

		BureauApi( 'bounty/getActiveBounties', ( err, bounties ) => {

			callback( err, bounties.length )

		})

	}

	render() {

		let empty = !this.state.bounties.length

		var emptyMessage = null

		if ( empty ) {
			emptyMessage = <div>
					<div className='bounty-list-empty-header'>No bounties</div>
					<div className='bounty-list-empty-message'>Why not ask your guild to set one?</div>
				</div>
		}

		return (
			<div>
				<ul className='bounty-list'>
					{ this.state.bounties.map( ( bounty, i ) => <BountyListItem bounty={bounty} key={i}></BountyListItem> ) }
					{ emptyMessage }
				</ul>
			</div>
		)

	}
}
