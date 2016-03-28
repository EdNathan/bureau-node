'use strict'

const crypto = require( 'crypto' )

const base64url = require( './base64url' )

const JWT_HEADER = base64url.encode( JSON.stringify( {
	alg: 'HS256',
	typ: 'JWT'
} ) )

const HS256 = ( str, secret ) => crypto.createHmac( 'SHA256', secret ).update( str ).digest( 'base64' )

const JWT = module.exports = {

	INVALID_JWT: Symbol( 'Invalid JSON Web Token' ),

	INCORRECT_SIGNATURE: Symbol( 'Incorrect JSON Web Token Signature' ),

	_makeSignature: ( token, secret ) => base64url.base64tourl( HS256( token, secret ) ),

	createJSONWebToken: ( payload, secret ) => {
		let token = `${JWT_HEADER}.${base64url.encode( JSON.stringify( payload ) )}`

		let signature = JWT._makeSignature( token, secret )

		return `${token}.${signature}`
	},

	decodeJSONWebToken: ( token, secret ) => {

		if ( !token || !token.split ) {
			return JWT.INVALID_JWT
		}

		let parts = token.split( '.' )

		if ( parts.length !== 3 ) {
			return JWT.INVALID_JWT
		}

		let headerStr = base64url.decode( parts[ 0 ] )
		let payloadStr = base64url.decode( parts[ 1 ] )
		let signature = parts[ 2 ]

		let testSignature = JWT._makeSignature( `${parts[0]}.${parts[1]}`, secret )

		if ( testSignature !== signature ) {
			return JWT.INCORRECT_SIGNATURE
		}

		let header
		let payload

		try {
			header = JSON.parse( headerStr )
			payload = JSON.parse( payloadStr )
		} catch ( e ) {
			return JWT.INVALID_JWT
		}

		return payload

	}

}

JWT.createJWT = JWT.createJSONWebToken
JWT.decodeJWT = JWT.decodeJSONWebToken

if ( !module.parent && process.argv.indexOf( '--test' ) > -1 ) {

	const assert = require( 'assert' )

	let payload = {
		sub: '1234567890',
		name: 'John Doe',
		admin: true
	}

	let secret = 'secret'

	let result = [
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
		'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9',
		'TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ'
	].join( '.' )

	assert( JWT.createJWT( payload, secret ) === result )
	console.log( 'Passed create token tests' )

	assert( JSON.stringify( JWT.decodeJWT( result, secret ) ) === JSON.stringify( payload ) )
	assert( JWT.decodeJWT( result, 'not the secret' ) === JWT.INCORRECT_SIGNATURE )
	console.log( 'Passed decode token tests' )

}
