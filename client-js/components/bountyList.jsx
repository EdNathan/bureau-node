class BountyList extends React.Component {

	getInitialState() {
		return { bounties: [] }
	}

	componentDidMount() {

		bureau.api('bounty/getActiveBounties', (err, bounties) => {

			this.setState({
				bounties
			})

		})
	}

	render() {

		return (
			<div className="BountyList">
				HELLO
			</div>
		)
		
	}
}
