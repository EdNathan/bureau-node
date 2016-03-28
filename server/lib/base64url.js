'use strict'

const padRight = ( str, limit, pad ) => {
	while ( str.len < limit ) {
		str += pad
	}

	return str
}

const charsNormalToUrl = ( base64 ) => base64.replace( /\+/g, '-' ).replace( /\//g, '_' )
const charsUrlToNormal = ( base64url ) => base64url.replace( /\-/g, '+' ).replace( /\_/g, '/' )

const padToNormal = ( base64url ) => padRight( base64url, base64url.length + ( 4 - base64url.length % 4 ) % 4, '=' )
const unpadToUrl = ( base64 ) => base64.replace( /\=/g, '' )

const base64encode = ( str ) => new Buffer( str, 'utf8' ).toString( 'base64' )
const base64decode = ( str ) => new Buffer( str, 'base64' ).toString( 'utf8' )

const base64url = module.exports = {

	encode: ( str ) => unpadToUrl( charsNormalToUrl( base64encode( str ) ) ),

	decode: ( base64 ) => padToNormal( base64decode( charsUrlToNormal( base64 ) ) ),

	base64tourl: ( base64 ) => unpadToUrl( charsNormalToUrl( base64 ) )
}

if ( !module.parent && process.argv.indexOf( '--test' ) > -1 ) {

	const assert = require( 'assert' )

	console.log( base64url.decode( 'qL8R4QIcQ_ZsRqOAbeRfcZhilN_MksRtDaErMA' ) )

	let sources = [ 'hello yes, this is dog' ]
	let targets = [ 'aGVsbG8geWVzLCB0aGlzIGlzIGRvZw' ]

	sources.forEach( ( source, i ) => assert( base64url.encode( sources[ i ] ) === targets[ i ] ) )
	console.log( 'Passed encode tests' )
	targets.forEach( ( target, i ) => assert( base64url.decode( targets[ i ] ) === sources[ i ] ) )
	console.log( 'Passed decode tests' )



}
