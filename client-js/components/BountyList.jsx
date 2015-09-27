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
	}

	render() {

		if ( !this.state.bounties.length ) {
			return false
		}

		return (
			<div className={'bounty-list'+(this.state.closed ? ' bounty-list-closed' : '')}>
				<div className='bounty-list-header'>{ this.state.bounties.length } Bount{ this.state.bounties.length > 1 ? 'ies' : 'y' } Unclaimed</div>
				{ this.state.bounties.map( ( bounty, i ) => <BountyListItem bounty={bounty} key={i}></BountyListItem> ) }
			</div>
		)

	}
}
