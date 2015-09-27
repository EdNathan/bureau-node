class BountyList extends React.Component {

	constructor() {
		super();
		this.state = { bounties: [] };
	}

	componentDidMount() {

		BureauApi( 'bounty/getActiveBounties', ( err, bounties ) => {

			this.setState( {
				bounties
			} );

		});
	}

	render() {

		return (
			<div className='BountyList' style={ { display:this.state.bounties.length ? 'block' : 'none' } }>
				<div className='bounty-list-header'>{ this.state.bounties.length } Bount{ this.state.bounties.length > 1 ? 'ies' : 'y' } Unclaimed</div>
				{ this.state.bounties.map( ( bounty, i ) => <BountyListItem {...bounty} key={i}></BountyListItem> ) }
			</div>
		)

	}
}
