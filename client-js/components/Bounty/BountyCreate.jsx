window._cachedKillmethods = null

class BountyCreate extends React.Component {

	constructor() {
		super()
		this.state = {
			waiting: false,
			error: null
		}
	}

	getAssassinSuggestions( inputText, callback ) {

		if(!inputText || inputText.length < 3) {
			callback([])
			return
		}

		BureauApi('assassin/searchAssassinsByName', {
			name: inputText
		}, ( err, assassins ) => {

			let suggestions = assassins.map( ( assassin ) => {
				return {
					label: `${assassin.forename} ${assassin.surname}`,
					value: assassin.id
				}
			})
			callback(suggestions)
		})
	}

	getKillMethodSuggestions( inputText, callback ) {

		if ( !window._cachedKillmethods ) {
			BureauApi('killmethods/getKillMethods', ( err, killmethods ) => {

				window._cachedKillmethods = killmethods
				this.getKillMethodSuggestions( inputText, callback )

			})
		} else {
			let fuzzyRegex = new RegExp( _.map( inputText.trim().toLowerCase(), _.escapeRegExp ).join( '.*' ), 'i')

			let suggestions = window._cachedKillmethods.filter( ( killmethod ) => {
				return fuzzyRegex.test(killmethod.name)
			}).map( ( killmethod ) => {
				return {
					label: killmethod.name,
					value: killmethod.id
				}
			})
			callback(suggestions)
		}

	}

	submitBounty() {

		this.setState({
			waiting: true
		})

		let bountyData = {
			title: this.refs.titleInput.value,
			issuers: this.refs.issuersInput.values,
			comment: this.refs.commentInput.value,
			anyPlayer: this.refs.anyPlayerInput.checked,
			players: this.refs.playersInput.values,
			anyKillmethod: this.refs.anyKillMethodInput.checked,
			killmethods: this.refs.killMethodsInput.values
		}

		BureauApi('bounty/createBounty', bountyData, ( err, response ) => {

			this.setState({
				waiting: false
			})

			if ( err ) {

				this.setState({
					error: err
				})

			} else {

				this.props.onCreate()

			}

		} )
	}

	render() {

		var errorDisplay = null

		if ( this.state.error ) {
			let errorStyle = {
				color: 'white',
				background: BUREAU_COLOURS.red,
				padding: '1em',
				textAlign: 'left',
				margin: '0 -1em'
			}
			errorDisplay = (
				<div style={errorStyle}>{this.state.error}</div>
			)
		}

		return (
			<div className="bounty-create">
				<div className="bounty-create-header" style={{color:CHOSEN_COLOUR}}>
					Set a new Bounty
				</div>
				<div style={{color:CHOSEN_COLOUR}}>
					{errorDisplay}
			 		<BureauFancyTextInput ref="titleInput" placeholder="Title" inputClassName="bounty-create-title"/>
					<BureauFancyAutocompleteList
						ref="issuersInput"
						placeholder="Search for issuers (optional)"
						autocomplete={this.getAssassinSuggestions}/>
					<BureauFancyTextInput ref="commentInput" placeholder="Description" multiline={true}/>
					<BureauFancyCheckboxInput ref="anyPlayerInput" label="Any player"/>
					<BureauFancyAutocompleteList
						ref="playersInput"
						placeholder="Search for players"
						autocomplete={this.getAssassinSuggestions}/>
					<BureauFancyCheckboxInput ref="anyKillMethodInput" label="Any kill method"/>
					<BureauFancyAutocompleteList
						ref="killMethodsInput"
						placeholder="Search for kill methods"
						autocomplete={(a,b) => this.getKillMethodSuggestions(a,b)}/>
					<BureauFancyButton label="Create Bounty" onClick={this.submitBounty.bind(this)} disabled={this.state.waiting}/>
				</div>
			</div>
		)
	}
}

BountyCreate.defaultProps = {
	onCreate: function(){}
}
