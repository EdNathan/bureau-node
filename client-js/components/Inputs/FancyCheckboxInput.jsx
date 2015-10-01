class BureauFancyCheckboxInput extends React.Component {

	constructor(props) {
		super(props)
		this.state = {
			checked: props.checked
		}
	}

	handleInputChange(e) {

		this.setState({
			checked: e.target.checked
		})

		this.props.onChange(e)
	}

	toggle() {

		this.setState({
			checked: !this.state.checked
		})
	}

	get checked() {
		return this.state.checked
	}

	render() {

		var props = {
			ref: 'input',
			type: 'checkbox',
			className: `bureau-input-fancy bureau-input-checkbox-fancy ${this.props.inputClassName}`,
			placeholder: this.props.placeholder,
			checked: this.state.checked,
			onChange: this.handleInputChange.bind(this)
		}

		return (
			<div className="bureau-input-fancy-wrapper bureau-input-checkbox-fancy-wrapper">
				<input {...props}/>
				<div
					className="bureau-input-checkbox-fancy-decorators"
					onClick={this.toggle.bind(this)}
					style={{color:CHOSEN_COLOUR}}>
					<div className="bureau-input-checkbox-fancy-decorators-box">
						<div></div>
					</div>
					<label
						className="bureau-input-checkbox-fancy-label bureau-input-fancy-label"
						style={this.state.checked ? {color:CHOSEN_COLOUR} : {}}>
							{this.props.label}
					</label>
				</div>

				<div className="bureau-input-fancy-highlight-bar bureau-input-checkbox-fancy-highlight-bar"></div>
			</div>
		)

	}
}

BureauFancyCheckboxInput.defaultProps = {
	checked: false,
	label: 'Label',
	inputClassName: '',
	onChange: function(){}
}
