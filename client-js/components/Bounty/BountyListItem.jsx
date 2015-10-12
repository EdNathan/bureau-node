class BountyListItem extends React.Component {

	constructor() {
		super();
		this.state = {
			bountyTargets: [],
			haveBountyTargets: false,
			bountyIssuers: [],
			haveBountyIssuers: false
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

		if( bounty.issuers.length ) {
			BureauApi( 'assassin/getAssassinsFromAssassinIds', {
				assassinIds: bounty.issuers
			}, (err, assassins) => {

				if ( !err ) {
					this.setState( {
						bountyIssuers: assassins,
						haveBountyIssuers: true
					} );
				}
			} );
		}

	}

	onArchive() {
		BureauApi(`bounty/archiveBounty/${this.props.bounty.id}`, (err, response) => {
			bureau.bountyPanel.refresh()
		})
	}

	render() {

		let bounty = this.props.bounty;

		let comment = bounty.comment ? <div className="bounty-comment">{bounty.comment}</div> : false;

		var targets;
		var issuers;
		var killmethods;

		if ( bounty.anyPlayer ) {
			targets = <div className="bounty-anyplayers">This bounty can be claimed on any player</div>
		} else if ( !this.state.haveBountyTargets ) {
			targets = <div className="bounty-loadingtargets">Getting targets...</div>
		} else {
			targets = <div className="bounty-targets">
				{ this.state.bountyTargets.map( (assassin) => `${assassin.forename} ${assassin.surname}`).join(`, `) }
			</div>
		}

		if( !bounty.issuers.length ) {
			issuers = <div className="bounty-anyplayers">This bounty was issued by the Guild</div>
		} else if ( !this.state.haveBountyIssuers ) {
			issuers = <div className="bounty-loadingtargets">Getting issuers...</div>
		} else {
			issuers = <div className="bounty-issuers">
				{ this.state.bountyIssuers.map( (assassin) => `${assassin.forename} ${assassin.surname}`).join(`, `) }
			</div>
		}

		if ( bounty.anyKillmethod ) {
			killmethods = <div className="bounty-anyplayers">This bounty can be claimed with any kill method</div>
		} else {
			killmethods = <div className="bounty-killmethods">
				{ bounty.killmethods.map( ( killmethodId, i ) => {
					let { id, name, zone, rules } =  _.find( BUREAU_KILLMETHODS, {id: killmethodId})
					let props = {
						key: i,
						className: 'bounty-killmethod',
						'data-rules': rules,
						style: {
							color: BUREAU_COLOURS[zone] ? BUREAU_COLOURS[zone] : zone,
							border: `1px solid ${KillmethodRules.style.body.background}`,
							marginBottom: '1em'
						}
					}

					let titleStyle = {
						background: humanBrightness( stringToRgb( props.style.color ) ) > 0.75 ? 'rgba(0,0,0,0.5)' : '',
						padding: '0.5em 10px'
					}

					return (
						<div {...props}>
							<div style={titleStyle}>{name}</div>
							<KillmethodRules style={{margin:0}} killmethodid={id}/>
						</div>
					)
				} ) }
			</div>
		}

		var editBountyButtons = null;

		if ( BUREAU_ASSASSIN.guild ) {
			editBountyButtons = (
				<div className="bounty-editbuttons">
					<div className="bounty-editbutton" onClick={this.onArchive.bind(this)} style={{color: BUREAU_COLOURS.red}}>Archive</div>
				</div>
			)
		}

		return (
			<li className="bounty-list-item">
				<div className="bounty-title" style={{color:CHOSEN_COLOUR}}>{ bounty.title }</div>
				{comment}
				{issuers}
				{targets}
				{killmethods}
				{editBountyButtons}
			</li>
		)
	}
}
