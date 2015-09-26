var app = module.parent.exports.app
var babel = require( 'babel-core' )
var path = require( 'path' )
var fs = require( 'fs' )
var _ = require( 'lodash' )
var utils = require( './utils' )

var clientDevFiles = utils.walkdir( 'client-js' )

var transformRegex = /.*\.(jsx|es6)$/

app.use('/devstatic/react.js', function(req, res, next) {
	res.sendfile('node_modules/react/dist/react.js')
})

app.use( '/devstatic/js', function( req, res, next ) {

	var filename = req.url

	if ( transformRegex.test( filename ) ) {

		var filePath = path.resolve( 'client-js/' + filename )

		var fileContents = fs.readFileSync( filePath, {
			encoding: 'utf8'
		} )

		res.header( 'Content-Type', 'text/javascript' )
		res.send( babel.transform( fileContents ).code )

	} else {

		res.sendfile( 'client-js' + req.url )

	}
} )

module.exports = clientDevFiles
