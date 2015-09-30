class BureauFancyTextInput extends React.Component {

	constructor(props) {
		super(props)
		this.state = {
			value: ''
		}
		this.autogrown = false
	}

	componentWillMount() {
		this.state.value = this.props.defaultValue
	}

	get value() {
		return this.refs.input.value
	}

	render() {

		let multiline = this.props.multiline

		var props = {
			ref: 'input',
			defaultValue: this.props.defaultValue,
			className: `bureau-input-fancy bureau-input-text-fancy ${this.props.inputClassName}`,
			placeholder: this.props.placeholder,
			key: 0
		}

		var bindAutogrow = (e) => {
			if(this.autogrown) return
			$( React.findDOMNode( this.refs.input ) ).autogrow()
			this.autogrown = true
		}

		return (
			<div className="bureau-input-fancy-wrapper bureau-input-text-fancy-wrapper">
				{ multiline ? <textarea {...props} onFocus={bindAutogrow}/> : <input {...props}/> }
				<div className="bureau-input-fancy-highlight-bar bureau-input-text-fancy-highlight-bar" key={1}></div>
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
