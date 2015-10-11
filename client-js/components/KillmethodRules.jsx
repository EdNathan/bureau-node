class KillmethodRules extends React.Component {

	constructor(props) {
		super(props)
	}

	render() {
		let id = this.props.killmethodid
		let killmethod = _.find( BUREAU_KILLMETHODS, { id })

		return (
			<div style={_.merge({}, KillmethodRules.style.body, this.props.style)}>
				<div style={KillmethodRules.style.title}>{killmethod.name} Rules</div>
				{killmethod.rules}
			</div>
		)
	}
}

KillmethodRules.defaultProps = {
	style: {}
}

KillmethodRules.style = {
	body: {
		background: 'rgba(0,0,0,.5)',
		color: 'white',
		padding: '0 10px 10px',
		margin: '10px',
		fontWeight: '300',
		lineHeight: 'normal'
	},
	title: {
		fontVariant: 'small-caps',
		textTransform: 'lowercase',
		fontWeight: 300,
		height: '20px',
		fontSize: '16px',
		display: 'block'
	}
}
