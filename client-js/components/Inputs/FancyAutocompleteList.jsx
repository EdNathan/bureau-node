class BureauFancyAutocompleteList extends React.Component {

	constructor(props) {
		super(props)
		this.state = {
			values: [],
			suggestions: [],
			highlightedSuggestion: 0,
			waiting: false
		}
	}

	inputValueChanged(e) {

		let inputText = e.target.value

		this.setState({
			waiting: true
		})

		this.props.autocomplete( inputText, this.populateSuggestions.bind(this) )
	}

	get values() {
		return this.state.values.map( ( value ) => value.value )
	}

	keyPressed(e) {

		switch ( e.key ) {

			case 'Escape':
				this.setState({
					suggestions:[],
					highlightedSuggestion: 0,
					waiting: false
				})
				this.refs.input.value = ''
				break;

			case 'Enter':
				let values = this.state.values
				if ( this.state.suggestions.length > 0 ) {
					values.push(this.state.suggestions[this.state.highlightedSuggestion])
					values = _.unique(values, 'value')
					this.setState({
						values,
						suggestions: [],
						highlightedSuggestion: 0,
						waiting: false
					})
					this.refs.input.value = ''
				}
				break;

			case 'ArrowUp':
				e.stopPropagation()
				e.preventDefault()
				this.setHighlightedSuggestion(this.state.highlightedSuggestion - 1)
				break;

			case 'ArrowDown':
				e.stopPropagation()
				e.preventDefault()
				this.setHighlightedSuggestion(this.state.highlightedSuggestion + 1)
				break;
		}
	}

	setHighlightedSuggestion( index ) {
		let highlightedSuggestion = index

		let maxLimit = Math.min( this.state.suggestions.length-1, this.props.maxSuggestions-1 )

		highlightedSuggestion = Math.max(0, Math.min(highlightedSuggestion, maxLimit) )

		this.setState({
			highlightedSuggestion
		})
	}

	populateSuggestions( suggestions ) {

		let highlightedSuggestion = Math.min(this.state.highlightedSuggestion, Math.min(suggestions.length, this.props.maxSuggestions))

		this.setState({
			suggestions,
			highlightedSuggestion,
			waiting: false
		})
	}

	removeValue( valueToRemove ) {

		let values = _.remove(this.state.values, ( value ) => value.value !== valueToRemove)

		this.setState({
			values
		})
	}

	render() {

		let suggestions = this.state.suggestions.slice( 0, this.props.maxSuggestions + 1 )

		var suggestionsList = null

		if( suggestions && suggestions.length > 0 ) {
			let style = {
				borderColor: CHOSEN_COLOUR,
				color: CHOSEN_COLOUR
			}
			let highlightedStyle = {
				color: 'white',
				background: CHOSEN_COLOUR
			}
			suggestionsList = (
				<div className="bureau-input-autocompletelist-fancy-suggestions" style={style}>
					{suggestions.map( ( value, i ) => {
						let isHighlighted = i === this.state.highlightedSuggestion
						let className = (isHighlighted ? 'highlighted' : '')
						return (<div className={className} key={i} style={isHighlighted ? highlightedStyle : style}>{value.label}</div>)
					} )}
				</div>
			)
		}

		let valuesList = (
			<div className="bureau-input-autocompletelist-fancy-values">
				{this.state.values.map( ( value, i ) => {
					return (
						<div key={i} onClick={this.removeValue.bind(this, value.value)}>{value.label}</div>
					)
				} )}
			</div>
		)

		return (
			<div className="bureau-input-fancy-wrapper bureau-input-autocompletelist-fancy-wrapper">
				<BureauFancyTextInput
					ref="input"
					placeholder={this.props.placeholder}
					onChange={this.inputValueChanged.bind(this)}
					onKeyDown={this.keyPressed.bind(this)}/>
				{this.state.waiting ? 'Waiting...' : suggestionsList}
				{valuesList}
			</div>
		)
	}
}


BureauFancyAutocompleteList.defaultProps = {
	placeholder: '',
	maxSuggestions: 5,
	autocomplete: function( inputText, callback ) {
		callback({
			label: 'Default Label',
			value: 'Default value'
		})
	}
}
