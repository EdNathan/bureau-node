class BureauFancyTextInput extends React.Component {

	constructor(props) {
		super(props)
		this.state = {
			value: props.defaultValue
		}
		this.autogrown = false
	}

	componentWillMount() {
		this.state.value = this.props.defaultValue
	}

	handleInputChange(e) {

		this.setState({
			value: e.target.value
		})

		this.props.onChange(e)
	}

	handleKeyPressed(e) {
		this.props.onKeyPress(e)
	}

	get value() {
		return this.state.value
	}

	set value(val) {
		this.setState({
			value: val
		})
	}

	render() {

		let multiline = this.props.multiline

		var props = {
			ref: 'input',
			className: `bureau-input-fancy bureau-input-text-fancy ${this.props.inputClassName}`,
			placeholder: this.props.placeholder,
			value: this.state.value,
			onChange: this.handleInputChange.bind(this),
			onKeyPress: this.props.onKeyPress,
			onKeyDown: this.props.onKeyDown,
			onKeyUp: this.props.onKeyUp
		}

		var bindAutogrow = (e) => {
			if(this.autogrown) return
			$( React.findDOMNode( this.refs.input ) ).autogrow()
			this.autogrown = true
		}

		return (
			<div className="bureau-input-fancy-wrapper bureau-input-text-fancy-wrapper">
				{ multiline ? <textarea {...props} onFocus={bindAutogrow}/> : <input {...props}/> }
				<div className="bureau-input-fancy-highlight-bar bureau-input-text-fancy-highlight-bar"></div>
			</div>
		)

	}
}

BureauFancyTextInput.defaultProps = {
	multiline: false,
	defaultValue: '',
	placeholder: 'Text',
	inputClassName: '',
	onChange: function(){},
	onKeyPress: function(){},
	onKeyDown: function(){},
	onKeyUp: function(){}
}
