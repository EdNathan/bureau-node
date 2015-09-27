class BountyPanel extends React.Component {

	render() {
		return (
			<div className="toolbar-panel-wrapper">
				<div className="toolbar-header" style={{color:CHOSEN_COLOUR}}>Bounties</div>
				<div className="toolbar-content">
					<BountyList/>
				</div>
			</div>
		)
	}

}
