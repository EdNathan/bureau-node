class BountyListItem extends React.Component {

	constructor() {
		super();
		this.state = {
			bountyTargets: [],
			haveBountyTargets: false
		};
	}

	componentDidMount() {

		let bounty = this.props.bounty

		if ( !bounty.anyPlayer ) {
			BureauApi( 'assassin/getAssassinsFromAssassinIds', {
				assassinIds: bounty.players
			}, (err, assassins) => {

				if ( !err ) {
					this.setState( {
						bountyTargets: assassins,
						haveBountyTargets: true
					} );
				}
			} );
		}

	}

	render() {

		let bounty = this.props.bounty;

		let comment = bounty.comment ? <div className="bounty-comment">{bounty.comment}</div> : false;

		var targets;

		if ( bounty.anyPlayer ) {
			targets = <div className="bounty-anyplayers">This bounty can be claimed on any player</div>
		} else if ( !this.state.haveBountyTargets ) {
			targets = <div className="bounty-loadingtargets">Getting targets...</div>
		} else {
			targets = <div className="bounty-targets">
				{ this.state.bountyTargets.map( (assassin) => `${assassin.forename} ${assassin.surname}`).join(`, `) }
			</div>
		}

		var editBountyButtons = null;

		if ( BUREAU_ASSASSIN.guild ) {
			editBountyButtons = (
				<div className="bounty-editbuttons">
					<div className="bounty-editbutton" style={{color: BUREAU_COLOURS.red}}>Archive</div>
				</div>
			)
		}

		return (
			<li className="bounty-list-item">
				<div className="bounty-title" style={{color:CHOSEN_COLOUR}}>{ bounty.title }</div>
				{comment}
				{targets}
				{editBountyButtons}
			</li>
		)
	}
}
