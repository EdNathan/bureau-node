'use strict'

const app = module.parent.exports.app
const babel = require( 'babel-core' )
const path = require( 'path' )
const fs = require( 'fs' )
const _ = require( 'lodash' )
const utils = require( './utils' )

let clientDevFiles = utils.walkdir( 'client-js' )

const clientDevMap = {}

const transformRegex = /.*\.(jsx|es6)$/

clientDevFiles = clientDevFiles.map( filename => {

	filename = filename.replace( 'client-js/', '' )

	if ( transformRegex.test( filename ) ) {

		let transformedFile = filename.slice( 0, filename.lastIndexOf( '.' ) ) + '.js'

		clientDevMap[ transformedFile ] = filename

		return transformedFile

	} else {

		return filename

	}
} )

app.use( '/devstatic/react-with-addons.js', ( req, res, next ) => {
	res.sendFile( path.resolve( 'node_modules/react/dist/react-with-addons.js' ) )
} )
app.use( '/devstatic/react-dom.js', ( req, res, next ) => {
	res.sendFile( path.resolve( 'node_modules/react-dom/dist/react-dom.js' ) )
} )

app.use( '/devstatic/js', ( req, res, next ) => {

	let filename = req.url.replace( /^\//, '' )

	if ( clientDevMap[ filename ] ) {

		let filePath = path.resolve( 'client-js/' + clientDevMap[ filename ] )

		let fileContents = fs.readFileSync( filePath, {
			encoding: 'utf8'
		} )

		let transformedContents = babel.transform( fileContents, {
			sourceMaps: 'inline',
			sourceFileName: clientDevMap[ filename ].split( '/' ).pop()
		} )

		res.header( 'Content-Type', 'text/javascript' )
		res.send( transformedContents.code )

	} else {

		let filePath = path.resolve( 'client-js/' + filename )

		let fileContents = fs.readFileSync( filePath, {
			encoding: 'utf8'
		} )

		res.header( 'Content-Type', 'text/javascript' )
		res.send( fileContents )

	}
} )

app.use( '/devstatic/less', ( req, res, next ) => {

	let filename = req.url.replace( /^\//, '' )

	let filePath = path.resolve( 'less/' + filename )

	let fileContents = fs.readFileSync( filePath, {
		encoding: 'utf8'
	} )

	res.header( 'Content-Type', 'text/less' )
	res.send( fileContents )
} )

module.exports = clientDevFiles
