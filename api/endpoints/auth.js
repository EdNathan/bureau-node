'use strict'

module.exports = ( Bureau ) => ( {

	login: ( data, params, callback ) => {
		console.log( data )

		callback( null, data )
	}

} )
