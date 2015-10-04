class BountyCreate extends React.Component {

	constructor() {
		super()
		this._killMethods = false
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

		if ( !this._killMethods ) {
			BureauApi('killmethods/getKillMethods', ( err, killmethods ) => {

				this._killMethods = killmethods
				this.getKillMethodSuggestions( inputText, callback )

			})
		} else {
			let fuzzyRegex = new RegExp( _.map( inputText.trim().toLowerCase(), _.escapeRegExp ).join( '.*' ), 'i')

			let suggestions = this._killMethods.filter( ( killmethod ) => {
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

	render() {
		return (
			<div className="bounty-create">
				<div className="bounty-create-header" style={{color:CHOSEN_COLOUR}}>
					Set a new Bounty
				</div>
				<div style={{color:CHOSEN_COLOUR}}>
			 		<BureauFancyTextInput ref="titleInput" placeholder="Title" inputClassName="bounty-create-title"/>
					<BureauFancyTextInput ref="commentInput" placeholder="Description" multiline={true}/>
					<BureauFancyCheckboxInput ref="anyPlayerInput" label="Any player"/>
					<BureauFancyAutocompleteList
						ref="playerInput"
						placeholder="Search for players"
						autocomplete={this.getAssassinSuggestions}/>
					<BureauFancyCheckboxInput ref="anyKillMethodInput" label="Any kill method"/>
					<BureauFancyAutocompleteList
						ref="killMethodInput"
						placeholder="Search for kill methods"
						autocomplete={this.getKillMethodSuggestions}/>
				</div>
			</div>
		)
	}
}
