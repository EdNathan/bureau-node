class BureauFancyTextInput extends React.Component {

	constructor(props) {
		super(props)
		this.state = {
			value: ''
		}
	}

	componentWillMount() {
		this.state.value = this.props.defaultValue
	}

	componentDidMount() {
		if ( this.props.multiline ) {
			$( React.findDOMNode( this.refs.input ) ).autogrow()
		}
	}

	get value() {
		return this.refs.input.value
	}

	render() {

		let multiline = this.props.multiline

		var props = {
			ref: 'input',
			defaultValue: this.props.defaultValue,
			className: `bureau-input-text-fancy ${this.props.inputClassName}`,
			placeholder: this.props.placeholder
		}

		return (
			<div className="bureau-input-text-fancy-wrapper">
				{ multiline ? <textarea {...props}/> : <input {...props}/> }
				<div className="bureau-input-text-fancy-highlight-bar"></div>
			</div>
		)

	}
}

BureauFancyTextInput.defaultProps = {
	multiline: false,
	defaultValue: '',
	placeholder: 'Text',
	inputClassName: ''
}
