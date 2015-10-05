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
				if ( this.state.suggestions.length > 0 ) {
					this.addValue(this.state.suggestions[this.state.highlightedSuggestion])
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

	addValue( value, e ) {
		let values = this.state.values
		values.push(value)
		values = _.unique(values, 'value')
		this.setState({
			values,
			suggestions: [],
			highlightedSuggestion: 0,
			waiting: false
		})
		this.refs.input.value = ''
		if ( e ) {
			React.findDOMNode(this.refs.input.refs.input).focus()
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
				cursor: 'pointer',
				background: CHOSEN_COLOUR
			}
			suggestionsList = (
				<div className="bureau-input-autocompletelist-fancy-suggestions" style={style}>
					{suggestions.map( ( value, i ) => {
						let isHighlighted = i === this.state.highlightedSuggestion
						let className = (isHighlighted ? 'highlighted' : '')
						let props = {
							className,
							key: i,
							style: isHighlighted ? highlightedStyle : style,
							onMouseOver: this.setHighlightedSuggestion.bind(this, i),
							onClick: this.addValue.bind(this, value)
						}
						return (<div {...props}>{value.label}</div>)
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
