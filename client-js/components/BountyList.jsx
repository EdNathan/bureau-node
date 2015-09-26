class BountyList extends React.Component {

	constructor() {
		super();
		this.state = { bounties: [] };
	}

	componentDidMount() {

		bureau.api('bounty/getActiveBounties', (err, bounties) => {

			this.setState({
				bounties
			});

		});
	}

	render() {

		return (
			<div className="BountyList" style="{this.state.bounties.length ? '' : 'display:none'}">
				{this.state.bounties.length} Bounties
				{this.props.items.map(function(item, i) {
		          return (
		            <div onClick={this.handleClick.bind(this, i)} key={i}>{item}</div>
		          );
		        }, this)}
			</div>
		)

	}
}
