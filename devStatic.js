var app = module.parent.exports.app
var swig = module.parent.exports.swig
var _ = require( 'lodash' )
var utils = require( './utils' )

var clientDevFiles = utils.walkdir( 'client-js' )

app.use( '/devstatic/js', function( req, res, next ) {
	console.log( req.url )
	res.sendfile( 'client-js' + req.url )
} )

module.exports = clientDevFiles
