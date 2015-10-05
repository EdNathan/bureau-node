class BureauFancyButton extends React.Component {

	constructor(props) {
		super(props)
		this.state = {
			hover: false
		}
	}

	render() {

		let hover = (shouldHover) => this.setState({hover: shouldHover})

		let props = {
			className: 'bureau-input-button-fancy',
			style: this.state.hover ? _.merge( {}, BureauFancyButton.styles.normal, BureauFancyButton.styles.hover ) : BureauFancyButton.styles.normal,
			onMouseOver: (e) => hover(true),
			onMouseOut: (e) => hover(false),
			onClick: this.props.disabled ? function(){} : this.props.onClick
		}

		if ( this.props.disabled ) {
			props.style = _.merge( {}, BureauFancyButton.styles.normal, BureauFancyButton.styles.disabled )
		}

		return (
			<div {...props}>{this.props.label}</div>
		)
	}
}

BureauFancyButton.defaultProps = {
	label: 'Click Me',
	disabled: false,
	onClick: function(){}
}

BureauFancyButton.styles = {
	normal: {
		border: `1px solid ${CHOSEN_COLOUR}`,
		color: CHOSEN_COLOUR,
		background: 'transparent',
		cursor: 'pointer',
		textAlign: 'center',
		padding: '1em',
		transition: '0.1s ease all',
		margin: '2em auto',
	},

	hover: {
		color: 'white',
		background: CHOSEN_COLOUR,
	},

	disabled: {
		borderColor: '#999',
		color: '#999',
		cursor: 'default'
	}
}
