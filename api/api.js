'use strict'

const Bureau = module.parent.exports.Bureau
const app = module.parent.exports.app
const _ = require( 'lodash' )

let logApiRequest = ( req, res, next ) => {
	console.log( 'host:', req.get( 'host' ) )
	console.log( 'origin:', req.get( 'Origin' ) )
	console.log( req.body )
	next()
}

let sendError = ( err, req, res ) => {
	res.header( 'Access-Control-Allow-Origin', '*' )
	res.header( 'Access-Control-Allow-Credentials', 'true' )
	res.header( 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept' )
	res.status( 400 ).json( {
		error: err
	} )
}

let checkAppToken = ( req, res, next ) => {

	if ( req.body.APP_TOKEN === process.env.BUREAU_APP_TOKEN ) {
		next()
	} else {
		sendError( 'Invalid APP_TOKEN', req, res )
	}

}

let checkUserToken = ( req, res, next ) => {
	let uid = req.body.USER_ID,
		suppliedToken = req.body.USER_TOKEN

	Bureau.assassin.checkToken( uid, suppliedToken, ( err, payload ) => {
		if ( !err ) {
			next()
		} else {
			sendError( `Invalid USER_TOKEN and USER_ID pair: ${err}`, req, res )
		}
	} )
}

let sendHeaders = ( req, res, next ) => {
	res.header( 'Access-Control-Allow-Origin', '*' )
	res.header( 'Access-Control-Allow-Credentials', 'true' )
	res.header( 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept' )
	if ( next ) next()
}

let sendHeadersForOptions = ( req, res, next ) => {
	if ( req.method === 'OPTIONS' ) {
		res.header( 'Access-Control-Allow-Origin', '*' )
		res.header( 'Access-Control-Allow-Methods', 'POST' )
		res.header( 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Custom-Header' )
		res.status( 200 )
		res.end()
	} else {
		next()
	}
}

let testValidMethod = ( req, res, next ) => {
	if ( req.method === 'OPTIONS' || req.method === 'POST' ) {
		next()
	} else {
		sendError( `API Requests are made over POST, method "${req.method}" not accepted`, req, res )
	}
}

// Handle auth
app.use( '/api/auth/*', testValidMethod, sendHeadersForOptions, checkAppToken )

let authPipeline = [ testValidMethod, sendHeadersForOptions, checkAppToken, checkUserToken ]

// Handle everything but auth
authPipeline.map( ( fn ) => app.use( /\/api\/(?!auth.*).*/, fn ) )

let handleApiRequest = ( handler, req, res ) => {

	let data = _.omit( req.body, 'USER_TOKEN' )
	let params = req.params

	handler( data, params, sendResponse.bind( this, req, res ) )

}

let _filter_id = ( obj ) => {

	if ( obj.toObject ) {
		obj = obj.toObject()
	}

	if ( _.isPlainObject( obj ) && obj._id ) {
		obj = _.clone( obj )
		obj.id = obj._id
		delete obj._id
		delete obj.__v
	} else if ( _.isArray( obj ) ) {
		obj = _.map( obj, _filter_id )
	}

	return obj
}

let sendResponse = ( req, res, err, data ) => {

	if ( err ) {
		sendError( err, req, res )
		return
	}

	sendHeaders( req, res )
	res.json( _filter_id( data ) )
}

let mapApiRoutes = ( routeHandler, route ) => {
	route = route ? route : ''

	if ( _.isFunction( routeHandler ) ) {

		app.post( '/api/' + route, handleApiRequest.bind( this, routeHandler ) )

	} else if ( _.isPlainObject( routeHandler ) ) {

		_.each( routeHandler, function( subRouteHandler, subRoute ) {

			let glue = subRoute === '/' ? '' : '/';

			mapApiRoutes( subRouteHandler, route + glue + subRoute );

		} );
	}
}

let mappedEndpoints = {}

let createApiEndpoint = ( endpoint ) => {
	let endpointHandler = require( './endpoints/' + endpoint )( Bureau )
	mapApiRoutes( endpointHandler, endpoint )
	mappedEndpoints[ endpoint ] = endpoint
}

let endpoints = require( './endpoints.js' )

endpoints.map( createApiEndpoint )

module.exports = mappedEndpoints
