var crypto = require( 'crypto' ),
	bcrypt = require( 'bcrypt' ),
	Autolinker = require( 'autolinker' ),
	fs = require( 'fs' ),
	_ = require( 'lodash' )

var utils = {
	production: process.env.PLATFORM === 'nodejitsu',
	mongourl: function() {
		if ( process.env.VCAP_SERVICES ) {
			var env = JSON.parse( process.env.VCAP_SERVICES );
			var mongo = env[ 'mongodb2-2.4.8' ][ 0 ][ 'credentials' ];
			console.log( mongo )
		} else if ( process.env.OPENSHIFT_NODEJS_IP ) {
			var mongo = {
				hostname: process.env.OPENSHIFT_MONGODB_DB_HOST,
				port: process.env.OPENSHIFT_MONGODB_DB_PORT,
				username: process.env.OPENSHIFT_MONGODB_DB_USERNAME,
				password: process.env.OPENSHIFT_MONGODB_DB_PASSWORD,
				name: '',
				db: process.env.OPENSHIFT_APP_NAME

			}
		} else {
			var mongo = {
				"hostname": "localhost",
				"port": 27017,
				"username": "",
				"password": "",
				"name": "",
				"db": "bureau"
			}
		}
		var generate_mongo_url = function( obj ) {
			obj.hostname = ( obj.hostname || 'localhost' )
			obj.port = ( obj.port || 27017 )
			obj.db = ( obj.db || 'test' )
			if ( obj.username && obj.password ) {
				return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db
			} else {
				return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db
			}
		}
		var mongourl = process.env.PLATFORM === 'nodejitsu' ? passwords.jitsumongo : generate_mongo_url( mongo )
		return mongourl
	},
	md5: function( str ) {
		return crypto.createHash( 'md5' ).update( str ).digest( "hex" )
	},
	hash: function( str ) {
		return bcrypt.hashSync( str, 10 )
	},
	test: function( str, hash ) {
		return bcrypt.compareSync( str, hash )
	},
	prettyTimestamp: function( date ) {
		var d = !!date ? ( date._d ? date.toDate() : date ) : new Date(),
			s = d.getFullYear() + '-' + utils.date2Digits( d.getMonth() + 1 ) + '-' + utils.date2Digits( d.getDate() ) + ' ' +
			utils.date2Digits( d.getHours() ) + ':' + utils.date2Digits( d.getMinutes() ) + ':' + utils.date2Digits( d.getSeconds() );
		return s;
	},
	dateFromPrettyTimestamp: function( d ) {
		//2014-01-06 06:00:00
		var parts = d.split( ' ' ),
			dat = parts[ 0 ].split( '-' ),
			tim = parts[ 1 ].split( ':' )
		result = new Date( dat[ 0 ], dat[ 1 ] - 1, dat[ 2 ], tim[ 0 ], tim[ 1 ], tim[ 2 ] );
		return result;
	},
	dateRegex: /[0-9]{4}-[0-1][0-9]-[0-3][0-9] [0-2][0-9]:[0-5][0-9]:[0-5][0-9]/,
	date2Digits: function( d ) {
		d = d + '';
		return d.length > 1 ? d : '0' + d;
	},

	addressFormat: function( input ) {
		return input.replace( /(\s)*,/g, '<br>' )
	},

	fullname: function( assassin ) {
		return !!assassin.nickname ? assassin.nickname : assassin.forename + ' ' + assassin.surname
	},

	plural: function( num ) {
		if ( typeof num != 'number' ) {
			throw new Error( 'Must pass in a number' )
		}
		return num === 1 ? '' : 's'
	},

	shuffle: function( arr ) {

	},

	merge: function( o1, o2 ) {
		var n = {}
		for ( key in o1 ) {
			if ( o1.hasOwnProperty( key ) ) {
				n[ key ] = o1[ key ]
			}
		}
		for ( key in o2 ) {
			if ( o2.hasOwnProperty( key ) ) {
				n[ key ] = o2[ key ]
			}
		}
		return n
	},

	autolink: function( input ) {
		return Autolinker.link( input )
	},

	shuffle: function( v ) {
		for ( var j, x, i = v.length; i; j = parseInt( Math.random() * i ), x = v[ --i ], v[ i ] = v[ j ], v[ j ] = x );
		return v
	},

	choose: function( arr, excluded ) {
		excluded = excluded || []
		while ( true ) {
			var choice = arr[ Math.floor( Math.random() * arr.length ) ]
			if ( excluded.indexOf( choice ) < 0 ) {
				return choice
			}
		}
	},

	arraysEqual: function( arr1, arr2 ) {
		if ( arr1.length !== arr2.length )
			return false;
		for ( var i = arr1.length; i--; ) {
			if ( arr1[ i ] !== arr2[ i ] )
				return false;
		}

		return true;
	},

	unique: function( arr ) {
		//Reduces array to unique values
		var u = arr.reduce( function( last, current ) {
			if ( last.indexOf( current ) < 0 ) {
				last.push( current )
				return last
			} else {
				return last
			}
		}, [] )

		return u
	},

	walkdir: function( dir, prefix ) {
		var files = fs.readdirSync( dir )

		prefix = prefix ? prefix : ''

		return _.filter( _.flattenDeep( files.map( function( file ) {

			var stats = fs.statSync( dir + '/' + file )

			if ( stats.isFile() ) {
				if ( file[ 0 ] !== '.' ) {
					return dir + '/' + file
				}
			} else {
				return utils.walkdir( dir + '/' + file, file + '/' )
			}
		} ) ) )
	}

}



module.exports = utils;
