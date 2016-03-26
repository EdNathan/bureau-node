'use strict'

const getFile = ( filename ) => require( 'fs' ).readFileSync( filename )

const getLib = {
	'lodash.min.js': getFile( 'node_modules/lodash/lodash.min.js' ),
	'react-with-addons.min.js': getFile( 'node_modules/react/dist/react-with-addons.min.js' )
}


module.exports = ( req, res, next ) => {
	let lib = req.params.lib

	if ( getLib.hasOwnProperty( lib ) ) {
		res.send( getLib[ lib ] )
	} else {
		next()
	}
}
