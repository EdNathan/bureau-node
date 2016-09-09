var b = {
	init: function() {
		b.mode = document.body.className.replace( 'mode-', '' ).split( ' ' )[ 0 ]

		BUREAU_GAMEGROUPS.forEach( function( gg ) {
			b.gamegroups[ gg.ggid.toLowerCase() ] = gg
		} )

		if ( !b.mode )
			b.mode = 'landing'

		b.displayWelcome()

		console.log( 'Mode: ' + b.mode )

		b.initModes[ b.mode.split( '/' )[ 0 ] ]()

		window.onpopstate = function( e ) {
			var path = window.location.pathname.replace( '/', '' )
			var mode = path ? path : 'landing'
			b.setMode( mode, true )
		}
	},

	gamegroups: {},

	mode: null,

	initModes: {
		landing: function() {
			b.canvas = document.getElementsByTagName( 'canvas' )[ 0 ]
			b.tempCanvas = document.createElement( 'canvas' )
			b.canvas.width = b.tempCanvas.width = innerWidth
			b.canvas.height = b.tempCanvas.height = innerHeight
			b.ctx = b.canvas.getContext( '2d' )
			b.tempCtx = b.tempCanvas.getContext( '2d' )

			noise.seed( new Date() )
			if ( innerWidth > 860 )
				setTimeout( function() {
					console.log( 'Beginning BG' )
					b.canvas.className = 'showing'
					requestAnimationFrame( b.drawBG )
				}, 2.4 * 1000 )

			qs( '#login-signup a' ).forEach( function( a ) {
				a.addEventListener( 'click', function( e ) {
					e.preventDefault()
					e.stopPropagation()

					b.setMode( a.href.split( '/' ).pop() )
				} )
			} )
		},

		login: function() {

			document.getElementById( 'login' ).style.height = ''

			qs( '.whitelabel' ).forEach( function( el ) {
				var gg = el.href.split( '/' ).pop()
				el.href = '/' + b.mode + '/' + gg

				// Dirty but saves cleaning up event listeners on mode change
				el.onclick = function( e ) {
					e.preventDefault()
					e.stopPropagation()
					b.setMode( b.mode + '/' + gg )
				}
			} )

			var path = location.pathname.split( '/' ).filter( function( x ) {
				return !!x
			} )

			if ( path.length === 2 ) {
				// We have a gamegroup!
				b.gg = path.pop()
				document.body.className += ' mode-form'

				b.initModes.loginForm()
			}
		},

		register: function() {
			b.initModes.login()
		},

		loginForm: function() {
			var gamegroup = b.gamegroups[ b.gg ]

			// Animate #login height to zero
			var height = document.getElementById( 'login' ).getBoundingClientRect().height
			document.getElementById( 'login' ).style.height = height + 'px'
			console.log( height )
			setTimeout( function() {
				document.getElementById( 'login' ).style.height = '0px'
			}, 100 )

			qs( '.whitelabel-name span' )[ 0 ].innerHTML = gamegroup.name
			qs( '.whitelabel-logo' )[ 0 ].style.backgroundImage = 'url(/images/whitelabels/' + b.gg + '/logo.svg)'
		}
	},

	displayWelcome: function() {
		qs( 'h2 span' ).forEach( function( el ) {
			el.style.webkitTransitionDelay = el.style.transitionDelay = (
				0.6 + Math.random() * 0.8 + 's'
			)
		} )

		qs( 'h2 span+span' ).forEach( function( el ) {
			el.style.webkitTransitionDelay = el.style.transitionDelay = (
				parseFloat( $( el ).prev()[ 0 ].style.webkitTransitionDelay
					.replace( 's', '' ) ) + 0.2 + 's'
			)
		} )

		document.querySelector( 'h2' ).className = 'on'

		qs( '#zoom div' ).forEach( function( el, i ) {
			var num = ( i + 1 ) * 0.2
			el.setAttribute(
				'style',
				'-webkit-animation-name: zoom;' +
				'animation-name: zoom;' +
				'-webkit-animation-delay: ' + num + 's;' +
				'animation-delay: ' + num + 's;'
			)
		} )

	},

	drawBG: function() {
		var data = b.data,
			now = new Date(),
			width = 24,
			spacing = 120

		b.tempCtx.clearRect( 0, 0, b.tempCanvas.width, b.tempCanvas.height )
		for ( var x = 0; x < b.tempCanvas.width; x += spacing ) {
			for ( var y = 0; y < b.tempCanvas.height; y += spacing ) {
				var value = noise.perlin3( x / 25, y / 25, now / 5000 );
				value *= 0.2;
				b.tempCtx.globalAlpha = Math.abs( value )
				b.tempCtx.fillColor = 'black'
				b.tempCtx.fillRect( x, y, width, width )
			}
		}

		var d = b.tempCtx.getImageData( 0, 0, b.tempCanvas.width, b.tempCanvas.height )
		b.ctx.putImageData( d, 0, 0 )

		if ( !b.mode || b.mode === 'landing' )
			requestAnimationFrame( b.drawBG )
	},

	setMode: function( mode, nopush ) {

		b.mode = mode.split( '/' )[ 0 ]

		var path = mode.replace( 'landing', '' )

		if ( window.history && window.history.pushState ) {
			document.body.className = 'mode-' + b.mode
			if ( !nopush )
				window.history.pushState( {
					page: mode
				}, null, '/' + path )
			b.initModes[ b.mode ]()
			console.log( 'Mode: ' + b.mode )
		} else {
			window.location.pathname = '/' + path
		}
	}
}

var qs = function( sel ) {
	return Array.prototype.slice.call( document.querySelectorAll( sel ), 0 )
}

window.addEventListener( 'DOMContentLoaded', b.init )
