class BountyCreate extends React.Component {

	constructor() {
		super()
	}

	componentDidMount() {
		$( React.findDOMNode( this.refs.commentInput ) ).autogrow({
			fixMinHeight: false
		})
	}

	render() {
		return (
			<div className="bounty-create">
				<div className="bounty-create-header" style={{color:CHOSEN_COLOUR}}>
					Set a new Bounty
				</div>
				<div style={{color:CHOSEN_COLOUR}}>
					<BureauFancyTextInput ref="titleInput" placeholder="Title" inputClassName="bounty-create-title"/>
					<BureauFancyTextInput ref="commentInput" placeholder="Description" multiline={true}/>
				</div>
			</div>
		)
	}
}
