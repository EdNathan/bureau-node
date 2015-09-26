const BureauApi = function( endpoint, data, callback=function(){} ) {

	var j = {
		APP_TOKEN: APP_TOKEN,
		USER_ID: BUREAU_USER.uid,
		USER_TOKEN: BUREAU_USER.token
	}

	if ( typeof data === typeof new Function() ) {
		callback = data
		data = {}
	}

	for ( var key in j ) {
		data[ key ] = j[ key ]
	}

	let req = new XMLHttpRequest()
	req.onload = () => {
		if ( req.status === 200 ) {

			let response = JSON.parse( req.responseText )

			callback( null, response )

		} else {
			console.error( req.status, req.statusText, req.responseText )
			callback( req.responseText, null )
		}
	}

	let apiUrl = `//api.${window.location.host}/${endpoint}`

	req.open( 'POST', apiUrl )
	req.setRequestHeader( 'Content-type', 'application/json' )
	req.send( JSON.stringify( data ) )
}
