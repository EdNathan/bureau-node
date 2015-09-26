var app = module.parent.exports.app
var _ = require( 'lodash' )

var libFiles = {
	react: 'node_modules/react/dist/react.min.js'
}

var filehandlers = {
	'library/:lib': function( req, res ) {
		res.sendfile( libFiles[ req.params.lib ] )
	}
}

var mapStaticRoutes = function( routeHandler, route ) {
	route = route ? route : ''

	if ( _.isFunction( routeHandler ) ) {

		app.get( '/devstatic' + route, routeHandler )

	} else if ( _.isPlainObject( routeHandler ) ) {

		_.each( routeHandler, function( subRouteHandler, subRoute ) {

			var glue = subRoute === '/' ? '' : '/';

			mapStaticRoutes( subRouteHandler, route + glue + subRoute );

		} );
	}
}

mapStaticRoutes( filehandlers )
console.log( app.routes )
