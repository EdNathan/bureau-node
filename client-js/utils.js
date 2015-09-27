//Grab saved colours
var colours = retrieveObj( 'bureau-colours' )

//If there aren't any saved then just use the defaults
if ( !colours ) {
	colours = [
		'#0e83cd', //Bureau Blue
		'#f06060', //Relaxed Red
		//'#fcd04b', //Yi-Fan Yellow  <-  Not used, too light and illegible
		'#2ecc71', //Groves Green
		'#9e54bd' //Pavan Purple
	]
	storeObj( 'bureau-colours', colours )
}


var CHOSEN_COLOUR = colours[ Math.floor( Math.random() * colours.length ) ];


function makeColourItem( el, p, alpha ) {
	return {
		'el': el,
		'property': p,
		'alpha': alpha
	}
}

function colourItems( items ) {
	if ( $I( 'toolbar' ) ) {
		items.unshift( makeColourItem( $I( 'toolbar-buttons' ), 'borderColor' ) );

		//Style grabber
		var r = $I( 'grabber' ).querySelectorAll( 'rect' );
		for ( var k = 0; k < r.length; k++ ) {
			r[ k ].setAttribute( 'fill', CHOSEN_COLOUR );
			r[ k ].setAttribute( 'rx', 1 );
			r[ k ].setAttribute( 'ry', 1 );
		}

	}

	var links = document.querySelectorAll( '#toolbar li > a' );
	for ( var i = 0; i < links.length; i++ ) {
		items.unshift( makeColourItem( links[ i ], 'color' ) );
	}

	var notif = document.querySelectorAll( '#notification' );
	for ( var i = 0; i < notif.length; i++ ) {
		items.unshift( makeColourItem( notif[ i ], 'color' ) );
	}

	var containers = document.querySelectorAll( '.container' );
	for ( i = 0; i < containers.length; i++ ) {
		items.unshift( makeColourItem( containers[ i ], 'backgroundColor' ) );
	}

	var lightcontainers = document.querySelectorAll( '.light-container' );
	for ( i = 0; i < lightcontainers.length; i++ ) {
		items.unshift( makeColourItem( lightcontainers[ i ], 'color' ) );
	}

	var dropdownlists = document.querySelectorAll( '.dropdown select' );
	for ( i = 0; i < dropdownlists.length; i++ ) {
		items.unshift( makeColourItem( dropdownlists[ i ], 'border-color' ) );
	}

	var playercards = document.querySelectorAll( '.player-card' );
	for ( i = 0; i < playercards.length; i++ ) {
		items.unshift( makeColourItem( playercards[ i ].querySelector( '.name-row' ),
			'color' ) );
		items.unshift( makeColourItem( playercards[ i ].querySelector( '.nickname-rank' ),
			'borderColor' ) );
		items.unshift( makeColourItem( playercards[ i ], 'borderColor' ) );
	}

	var addRule = ( function( style ) {
		var sheet = document.head.appendChild( style ).sheet;
		return function( selector, css ) {
			var propText = typeof css === "string" ? css : Object.keys( css ).map(
				function( p ) {
					return p + ":" + ( p === "content" ? "'" + css[ p ] + "'" : css[ p ] );
				} ).join( ";" );
			sheet.insertRule( selector + "{" + propText + "}", sheet.cssRules.length );
		};
	} )( document.createElement( "style" ) );

	addRule( ".player-card *[title]::after", {
		color: CHOSEN_COLOUR
	} );


	items.unshift( makeColourItem( document.querySelector( 'h1' ), 'color' ) );
	items.unshift( makeColourItem( document.querySelector( 'h1' ), 'borderColor' ) );
	items.unshift( makeColourItem( document.querySelector( '#notifications-title' ),
		'color' ) );
	items.unshift( makeColourItem( document.querySelector( '#unread-count' ), 'color' ) );
	items.unshift( makeColourItem( document.querySelector( '#unread-count' ),
		'borderColor' ) );

	var i = 0,
		l = items.length,
		rgb = ( function() {
			var j = hexToRgb( CHOSEN_COLOUR );
			return ( j.r + ',' + j.g + ',' + j.b + ',' );
		} )(); //We just use a sneaky auto executing function to cache the RGB value. This is a cool pattern. It's a nice way to do more complicated logic in variable assignment without having to devote an entire block of your function. I'm going to nickname this "Inline self executing function variable assignment". Catchy!

	for ( i; i < l; i++ ) {
		if ( !!items[ i ].alpha ) {
			items[ i ].el.style[ items[ i ].property ] = 'rgba(' + rgb + items[ i ].alpha + ')';
		} else if ( !!items[ i ].el ) {
			items[ i ].el.style[ items[ i ].property ] = CHOSEN_COLOUR;
		}
	}
}

// XXX time ago
function timeSince( date ) {
	var seconds = Math.floor( ( new Date() - date ) / 1000 );

	var interval = Math.floor( seconds / 31536000 );

	if ( interval > 1 ) {
		return interval + " years";
	}
	interval = Math.floor( seconds / 2592000 );
	if ( interval > 1 ) {
		return interval + " months";
	}
	interval = Math.floor( seconds / 86400 );
	if ( interval > 1 ) {
		return interval + " days";
	}
	interval = Math.floor( seconds / 3600 );
	if ( interval > 1 ) {
		return interval + " hours";
	}
	interval = Math.floor( seconds / 60 );
	if ( interval > 1 ) {
		return interval + " minutes";
	}
	return Math.floor( seconds ) + " seconds";
}

//Store and retrieve from localStorage

function store( key, s ) {
	window.localStorage.setItem( key, s )
}

function storeObj( key, stuff ) {
	store( key, JSON.stringify( stuff ) )
}

function retrieve( key ) {
	return window.localStorage.getItem( key )
}

function retrieveObj( key ) {
	var item = retrieve( key )
	if ( !item ) {
		return
	}
	try {
		var o = JSON.parse( item )
		return o
	} catch ( e ) {
		return
	}
}


//Just in case a particular page doesn't care about colouring anything or have its own applyColours() method then we'll specify a default here which can be overwritten
function applyColours() {
	var a = [];

	colourItems( a );
}

//Declare this empty function to prevent errors, if we actually want to setup we do it in the specific page's .js file
function setup() {};


/* UTILITY METHODS */
function $I( id ) {
	return document.getElementById( id );
}

function stopEvent( e ) {
	e.preventDefault();
	e.stopPropagation();
}

function unique( arr ) {
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
}


function empty( o ) {
	for ( var i in o ) {
		if ( o.hasOwnProperty( i ) ) {
			return false;
		}
	}

	return true;

} //courtesy of: http://starikovs.com/2010/03/10/test-for-empty-js-object/

function getTransformProperty( element ) {
	// Note that in some versions of IE9 it is critical that
	// msTransform appear in this list before MozTransform
	var properties = [
		'transform',
		'WebkitTransform',
		'msTransform',
		'MozTransform',
		'OTransform'
	];
	var p;
	while ( p = properties.shift() ) {
		if ( typeof element.style[ p ] != 'undefined' ) {
			return p;
		}
	}
	return false;
} //courtesy of: http://www.zachstronaut.com/posts/2009/02/17/animate-css-transforms-firefox-webkit.html

/* Colour conversion functions */

function hexToRgb( hex ) {
	// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
	var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	hex = hex.replace( shorthandRegex, function( m, r, g, b ) {
		return r + r + g + g + b + b;
	} );

	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec( hex );
	return result ? {
		r: parseInt( result[ 1 ], 16 ),
		g: parseInt( result[ 2 ], 16 ),
		b: parseInt( result[ 3 ], 16 )
	} : null;
}

function rgbToHex( r, g, b ) {

	function componentToHex( c ) {
		var hex = c.toString( 16 );
		return hex.length == 1 ? "0" + hex : hex;
	}

	return "#" + componentToHex( r ) + componentToHex( g ) + componentToHex( b );
}

/* Sexy innerHTML transition */
function sexyInnerHTML( el, t2 ) { //only works for letters, spaces and numbers!!!
	var t1 = el.innerHTML,
		t = t1.split( '' ),
		//d = duration,
		alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789 !.,?:;',
		j = 0,
		k = 0;

	var printer = new ProgressivePrinter( el, t1 );

	if ( t1.length > t2.length ) { // Pad the beginning of t2 with spaces
		t2 = repeatStr( ' ', t1.length - t2.length ) + t2;
	}

	for ( var i = 0; i < t2.length; i++ ) {
		j = ( t1[ i ] ) ? alphabet.indexOf( t1[ i ] ) : 0;
		k = alphabet.indexOf( t2[ i ] );

		if ( j < k ) {
			for ( j; j <= k; j++ ) {
				t[ i ] = alphabet[ j ];
				printText( t.join( '' ) );
			}
		} else {
			for ( j; j >= k; j-- ) {
				t[ i ] = alphabet[ j ];
				printText( t.join( '' ) );
			}
		}
	}

	printText( t.join( '' ) );

	function printText( text ) {
		printer.queue( text );
	}

	function repeatStr( str, num ) {
		return ( new Array( num + 1 ).join( str ) );
	}

}
