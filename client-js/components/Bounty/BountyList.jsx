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

		});

		makeColourItem(React.findDOMNode(this))
	}

	render() {

		if ( !this.state.bounties.length ) {
			return false
		}

		return (
			<div>
				<div className='bounty-list-header'>{ this.state.bounties.length } Bount{ this.state.bounties.length > 1 ? 'ies' : 'y' } Unclaimed</div>
				<ul className={'bounty-list'+(this.state.closed ? ' bounty-list-closed' : '')} style={{color:CHOSEN_COLOUR}}>
					{ this.state.bounties.map( ( bounty, i ) => <BountyListItem bounty={bounty} key={i}></BountyListItem> ) }
				</ul>
			</div>
		)

	}
}
