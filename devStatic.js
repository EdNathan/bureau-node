var app = module.parent.exports.app
var babel = require( 'babel-core' )
var path = require( 'path' )
var fs = require( 'fs' )
var _ = require( 'lodash' )
var utils = require( './utils' )

var clientDevFiles = utils.walkdir( 'client-js' )

var clientDevMap = {}

var transformRegex = /.*\.(jsx|es6)$/

clientDevFiles = clientDevFiles.map( function( filename ) {
	if ( transformRegex.test( filename ) ) {
		var transformedFile = filename.slice( 0, filename.lastIndexOf( '.' ) ) + '.js'
		clientDevMap[ transformedFile ] = filename
		return transformedFile
	} else {
		return filename
	}
} )


app.use( '/devstatic/react-with-addons.js', function( req, res, next ) {
	res.sendfile( 'node_modules/react/dist/react-with-addons.js' )
} )

app.use( '/devstatic/js', function( req, res, next ) {

	var filename = req.url.replace( /^\//, '' )

	if ( clientDevMap[ filename ] ) {

		var filePath = path.resolve( 'client-js/' + clientDevMap[ filename ] )

		var fileContents = fs.readFileSync( filePath, {
			encoding: 'utf8'
		} )

		var transformedContents = babel.transform( fileContents, {
			sourceMaps: 'inline',
			sourceFileName: clientDevMap[ filename ].split( '/' ).pop()
		} )

		res.header( 'Content-Type', 'text/javascript' )
		res.send( transformedContents.code )

	} else {

		var filePath = path.resolve( 'client-js/' + filename )

		var fileContents = fs.readFileSync( filePath, {
			encoding: 'utf8'
		} )

		res.header( 'Content-Type', 'text/javascript' )
		res.send( fileContents )

	}
} )

module.exports = clientDevFiles
