var bureau = {
	init: function() {
		if ( !!$I( 'bureau-uid' ).value ) {
			this.setupToolbar()
		}
		setup();

		switch ( document.body.id ) {
			case 'page-home':
				this.setup.home();
				break;
			case 'page-report':
				this.setup.report();
				break;
			case 'page-me':
				this.setup.personal();
				break;
			case 'page-guild':
				this.setup.guild();
				break;
			case 'page-gamegroup':
				this.setup.gamegroup();
				break;
			case 'page-killmethods':
				this.setup.killmethods();
				break;
			case 'page-newgame':
				this.setup.guildNewGame();
				break;
			case 'page-gamestate':
				this.setup.guildGameState();
				break;
			case 'page-killreports':
				this.setup.guildAllReports();
				break;
			case 'page-updatedetails':
				this.setup.updateDetails();
				break;
			default:
				applyColours()
				break;
		}
	},

	setupToolbar: function() {
		React.render( React.createElement( Toolbar ), $I( 'navbar-container' ) )
	},

	setup: {
		search: function( important ) {
			$( '.searchable' ).each( function() {
				var f = document.createDocumentFragment(),
					i = document.createElement( 'input' ),
					id = this.id,
					searchStyle = document.getElementById( 'search_style' ),
					hint = !!this.getAttribute( 'data-search' ) ? this.getAttribute(
						'data-search' ) : 'search players',
					searchClass = !!this.getAttribute( 'data-searchclass' ) ? this.getAttribute(
						'data-searchclass' ) : '',
					inclusive = !!this.getAttribute( 'data-searchmethod' ) && this.getAttribute(
						'data-searchmethod' ) == 'inclusive';
				i.className = 'player-table-search ' + searchClass;
				i.setAttribute( 'placeholder', hint );
				f.appendChild( i );

				$( i ).on( 'input', function() {
					if ( !this.value ) {
						searchStyle.innerHTML = "";
						return;
					}
					if ( inclusive ) {
						searchStyle.innerHTML = '#' + id +
							'.searchable > li[data-index*=\"' + this.value.toLowerCase() +
							'\"] { display: block' + ( !!important ? ' !important' : '' ) +
							'; }';
					} else {
						searchStyle.innerHTML = '#' + id +
							'.searchable > li:not([data-index*=\"' + this.value.toLowerCase() +
							'\"]) { display: none' + ( !!important ? ' !important' : '' ) +
							'; }';
					}
				} );
				this.parentNode.insertBefore( f, this );
			} );
		},

		playerListToggle: function( useHeader, callback ) {
			var selector = '.player-table > li' + ( !!useHeader ? ' header' : '' );
			$( selector ).on( 'click', function( e ) {
				if ( callback ) {
					callback( this )
				}
				$( this ).closest( 'li' ).toggleClass( 'expanded' );
			} )
		},

		home: function() {
			function timeGreeting( name ) {
				var h = ( new Date() ).getHours(),
					s;

				if ( h >= 4 && h <= 12 ) {
					s = 'Good morning, ' + name;
				} else if ( h >= 13 && h <= 17 ) {
					s = 'Good afternoon, ' + name;
				} else {
					s = 'Good evening, ' + name;
				}

				$I( 'welcome-message' ).innerHTML = s;
				$I( 'welcome-message' ).style.opacity = 1;
			}
			timeGreeting( displayName );


			this.playerListToggle();
			this.search();

			var a = [];
			var infos = document.querySelectorAll( '.game-info' );
			for ( var i = 0; i < infos.length; i++ ) {
				a.push( makeColourItem( infos[ i ], 'color' ) );
			}
			colourItems( a );
		},

		guild: function() {
			var a = [],
				membershipRows = document.querySelectorAll( '.member-row' ),
				commenttextareas = document.querySelectorAll( '.killreport textarea' )

			a.push( makeColourItem( $I( 'kill-reports' ), 'color' ) )
			a.push( makeColourItem( $I( 'guild-nav' ), 'color' ) )
			a.push( makeColourItem( $I( 'motd-input' ), 'outlineColor' ) )

			for ( var i = 0; i < commenttextareas.length; i++ ) {
				a.push( makeColourItem( commenttextareas[ i ], 'color' ) )
				a.push( makeColourItem( commenttextareas[ i ], 'outline-color' ) )
			}

			for ( i = 0; i < membershipRows.length; i++ ) {
				a.unshift( makeColourItem( membershipRows[ i ].querySelector( '.name' ),
					'color' ) );
				a.unshift( makeColourItem( membershipRows[ i ].querySelector( '.nickname-rank' ),
					'borderColor' ) )
				a.unshift( makeColourItem( membershipRows[ i ], 'borderColor' ) )
			}
			colourItems( a )

			if ( location.hash !== '' ) {
				location.hash = '';
			}

			if ( $I( 'motd-input' ) ) { //We use this JS on every guild page (oops?) so we should protect against errors
				$I( 'motd-input' ).onkeyup = function( e ) { //Disable the set MotD button if there's nothing to set it to
					if ( !!this.value ) {
						$I( 'set-motd-button' ).removeAttribute( 'disabled' );
					} else {
						$I( 'set-motd-button' ).setAttribute( 'disabled', true );
					}
				}

				$I( 'reset-motd-button' ).onclick = function( e ) { //Make sure they want to reset the MotD and aren't doing it by accident
					var reset = confirm( 'Clear the MotD?' );
					if ( !reset ) {
						stopEvent( e );
					}
				}
			}

			//Make the kill report headers respond to clicks
			$( 'article.killreport header' ).on( 'click', function( e ) {
				$( this ).closest( '.killreport' ).toggleClass( 'closed' );
			} );

			//Autoexpand the comment textarea on kill reports
			$( '.killreport textarea' ).autogrow();

			//Make prettier maps
			google.maps.visualRefresh = true;
			//Populate the map containers with maps
			$( '.mapcontainer' ).each( function() {
				var el = this,
					coords = this.getAttribute( 'data-coords' ).split( ',' ),
					latlng = new google.maps.LatLng( parseFloat( coords[ 0 ] ), parseFloat(
						coords[ 1 ] ) )
				mapOptions = {
						zoom: 18,
						center: latlng,
						mapTypeId: google.maps.MapTypeId.HYBRID
					},
					map = new google.maps.Map( this, mapOptions ),
					marker = new google.maps.Marker( {
						position: latlng,
						map: map,
						icon: ( ( document.title.indexOf( '-' ) !== -1 ) ? '../' : '' ) +
							'images/target-small.svg'
					} )
			} )

			//Handle resetting of passwords
			$( 'input[type=submit][name=resetpassword]' ).on( 'click', function( e ) {
				var resetuid = this.getAttribute( 'data-uid' )
				if ( confirm( 'Are you sure you want to reset their password?' ) ) {
					BureauApi( 'resetPassword/' + resetuid, function( err, j ) {
						prompt(
							'Copy the password below and securely send it to the player. If either of you lose this code you will need to generate it again.',
							j.temppassword )
					} )
				}
			} )

			//Prevent accidental resetting of the addresses
			$( 'input[type=submit][name=forceupdatebutton]' ).on( 'click', function( e ) {

				if ( !confirm( 'Are you absolutely sure you want to do this?' ) ) {
					stopEvent( e )
				}
			} )

			//Setup player lists and search for guild pages that need it
			this.playerListToggle( true );
			this.search();
		},

		guildAllReports: function() {
			var a = [],
				membershipRows = document.querySelectorAll( '.member-row' ),
				commenttextareas = document.querySelectorAll( '.killreport textarea' )

			a.push( makeColourItem( $I( 'kill-reports' ), 'color' ) )
			a.push( makeColourItem( $I( 'guild-nav' ), 'color' ) )
			a.push( makeColourItem( $I( 'motd-input' ), 'outlineColor' ) )

			for ( var i = 0; i < commenttextareas.length; i++ ) {
				a.push( makeColourItem( commenttextareas[ i ], 'color' ) )
				a.push( makeColourItem( commenttextareas[ i ], 'outline-color' ) )
			}
			colourItems( a )

			//Make the kill report headers respond to clicks
			$( 'article.killreport header' ).on( 'click', function( e ) {
				$( this ).closest( '.killreport' ).toggleClass( 'closed' );
			} );

			//Autoexpand the comment textarea on kill reports
			$( '.killreport textarea' ).autogrow();

			//Make prettier maps
			google.maps.visualRefresh = true;
			//Populate the map containers with maps
			$( '.mapcontainer' ).each( function() {
				var el = this,
					coords = this.getAttribute( 'data-coords' ).split( ',' ),
					latlng = new google.maps.LatLng( parseFloat( coords[ 0 ] ), parseFloat(
						coords[ 1 ] ) )
				mapOptions = {
						zoom: 18,
						center: latlng,
						mapTypeId: google.maps.MapTypeId.HYBRID
					},
					map = new google.maps.Map( this, mapOptions ),
					marker = new google.maps.Marker( {
						position: latlng,
						map: map,
						icon: ( ( document.title.indexOf( '-' ) !== -1 ) ? '../' : '' ) +
							'images/target-small.svg'
					} )
			} )

			//Add the confirmation dialog to approving and rejecting reports
			$( '.processing-buttons input[type="submit"]' ).on( 'click', function( e ) {
				stopEvent( e )

				var message = 'Are you sure you want to retroactively ' + this.className +
					' this kill report? Please check to make sure that taking this action is in line with the game\'s mechanics!';
				if ( confirm( message ) ) {
					$( this ).closest( 'form' ).each( function() {
						HTMLFormElement.prototype.submit.call( this );
					} );
				}
			} );

			this.playerListToggle( true );
		},

		guildMembership: function() {
			var membershipRows = document.querySelectorAll( '.membership-row' ),
				items = [];

			for ( i = 0; i < membershipRows.length; i++ ) {
				items.unshift( makeColourItem( membershipRows[ i ].querySelector( '.name' ),
					'color' ) );
				items.unshift( makeColourItem( membershipRows[ i ].querySelector(
					'.nickname-rank' ), 'borderColor' ) );
				items.unshift( makeColourItem( membershipRows[ i ], 'borderColor' ) );
			}
			colourItems( items );

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

			addRule(
				'.membership-row *[title]::after, header figure[class*=\"-icon\"], .membership-row .caption', {
					color: CHOSEN_COLOUR
				} );
			addRule( '#membership-key li.active', {
				color: CHOSEN_COLOUR
			} )


			var searchBox = $( '.player-table-search' ),
				typeSheet = document.createElement( 'style' );
			document.head.appendChild( typeSheet );

			$( '#membership-key li' ).on( 'click', function( e ) {
				var el = $( this ),
					t = this.children[ 0 ].title;
				if ( el.hasClass( 'active' ) ) {
					$( '#membership-key li' ).removeClass( 'active' );
					typeSheet.innerHTML = '';
				} else {
					$( '#membership-key li' ).removeClass( 'active' );
					typeSheet.innerHTML = '.membership-row:not([data-membership=\"' + t +
						'\"]) { display: none; }';
					el.addClass( 'active' );
				}
			} );
			$( 'select[name="membershipType"]' ).on( 'change', function( e ) {
				this.parentNode.submit();
			} );
		},

		guildNewGame: function() {
			var a = [];
			a.push( makeColourItem( $I( 'submit-button' ), 'background-color' ) );
			a.push( makeColourItem( document.querySelectorAll( '.new-game-top-decor' )[ 0 ],
				'background-color' ) );
			a.push( makeColourItem( document.querySelectorAll( '.new-game-inner' )[ 0 ],
				'color' ) );
			colourItems( a );


			//Display correct fragment for game
			function displayGameSetupFragment( e ) {
				var gametype = e.target.value,
					el = $I( 'game-setup-fragment-container' );
				if ( !!gametype ) {
					el.children[ 0 ].innerHTML = 'Loading ' + gametype + ' setup...';
					el.className = 'fragment-loading';

					BureauApi( 'gamesetupfragment/' + gametype, function( err, fragment ) {
						if ( !err ) {
							el.className = ''
							el.children[ 0 ].innerHTML = fragment
						} else {
							console.log( err )
						}
					} )
				} else {
					el.className = 'empty';
					el.children[ 0 ].innerHTML = '';
				}
			}

			$( '#gametype-dropdown' ).on( 'change', displayGameSetupFragment );

			//Field validtion
			var validate = {
					results: {},
					checks: {
						def: function() {
							return true
						},
						title: function( val ) {
							return ( !!val && val.length > 3 );
						},
						start: function( val ) {
							var d = bureau.utils.dateFromPrettyTimestamp( val ),
								now = new Date();
							return ( !!d && !isNaN( d.getMonth() ) && d > now && val.length === 19 &&
								bureau.utils.dateRegex.test( val ) );
						},
						end: function( val ) {
							var d = bureau.utils.dateFromPrettyTimestamp( val ),
								now = new Date();
							return ( !!d && !isNaN( d.getMonth() ) && d > now && val.length === 19 &&
								bureau.utils.dateRegex.test( val ) );
						},
						gametype: function( val ) {
							return !!val;
						}
					}
				},
				fields = document.querySelectorAll( 'input:not([type="checkbox"]), select' ),
				i = 0,
				l = fields.length,
				f;

			for ( i; i < l; i++ ) {
				f = fields[ i ];
				validate.results[ f.name ] = false;
				switch ( f.name ) {
					default: $( f ).on( 'keyup', function() {
						updateValidation()
					} );
					break;
					case 'gametype':
							$( f ).on( 'change', function() {
							updateValidation()
						} );
						break;
				}

			}

			function updateValidation() {
				var f, n, el, canSubmit = true;
				for ( i = 0; i < l; i++ ) {
					f = fields[ i ];
					n = validate.checks.hasOwnProperty( f.name ) ? f.name : 'def';
					validate.results[ f.name ] = validate.checks[ n ]( f.value );
				}

				for ( var key in validate.results ) {
					el = $( '#' + key );
					if ( !validate.results[ key ] ) {
						el.addClass( 'problem' )
						canSubmit = false;
					} else {
						el.removeClass( 'problem' )
					}
				}

				$I( 'submit-button' ).className = 'fancy-submit ' + ( canSubmit ? '' :
					'disabled' );
			}

			updateValidation();

			$I( 'submit-button' ).addEventListener( 'click', function( e ) {
				if ( this.className.indexOf( 'disabled' ) === -1 ) {
					document.forms[ 0 ].submit();
				}
			}, false );
			this.search()
		},

		guildGameState: function() {
			colourItems( [] )

			//Field validtion
			var validate = {
					results: {},
					checks: {
						def: function() {
							return true
						},
						start: function( val, gameid ) {
							var d = bureau.utils.dateFromPrettyTimestamp( val ),
								endd = bureau.utils.dateFromPrettyTimestamp( $I( 'end-input-' + gameid )
									.value );
							return ( !!d && !!endd && !isNaN( d.getMonth() ) && !isNaN( endd.getMonth() ) &&
								d < endd && val.length === 19 && bureau.utils.dateRegex.test( val ) );
						},
						end: function( val, gameid ) {
							var d = bureau.utils.dateFromPrettyTimestamp( val ),
								startd = bureau.utils.dateFromPrettyTimestamp( $I( 'start-input-' +
									gameid ).value );
							return ( !!d && !!startd && !isNaN( d.getMonth() ) && !isNaN( startd.getMonth() ) &&
								d > startd && val.length === 19 && bureau.utils.dateRegex.test( val )
							);
						},
						submit: function( val, gameid ) {
							var startval = $I( 'start-input-' + gameid ).value,
								startd = bureau.utils.dateFromPrettyTimestamp( startval ),
								endval = $I( 'end-input-' + gameid ).value,
								endd = bureau.utils.dateFromPrettyTimestamp( endval );
							return ( !!startd && !!endd && !isNaN( startd.getMonth() ) && !isNaN(
									endd.getMonth() ) && startd < endd && endval.length === 19 &&
								startval.length === 19 && bureau.utils.dateRegex.test( startval ) &&
								bureau.utils.dateRegex.test( endval ) );
						}
					}
				},
				fields = document.querySelectorAll(
					'.gamedate-form input[type="text"], .gamedate-form input[type="submit"]'
				),
				i = 0,
				l = fields.length,
				f;

			for ( i; i < l; i++ ) {
				f = fields[ i ];
				validate.results[ f.id ] = false;
				switch ( f.name ) {
					default: $( f ).on( 'keyup', function() {
						updateValidation()
					} );
					break;
					case 'gametype':
							$( f ).on( 'change', function() {
							updateValidation()
						} );
						break;
				}

			}
			console.log( validate );

			function updateValidation() {
				var f, n, el;
				for ( i = 0; i < l; i++ ) {
					f = fields[ i ];
					n = validate.checks.hasOwnProperty( f.name ) ? f.name : 'def';
					validate.results[ f.id ] = validate.checks[ n ]( f.value, f.getAttribute(
						'data-gameid' ) );
				}

				for ( var key in validate.results ) {
					if ( key.indexOf( 'submit' ) === -1 ) { //Not the submit button
						el = $( '#section-' + key );
						if ( !validate.results[ key ] ) {
							el.addClass( 'problem' );
						} else {
							el.removeClass( 'problem' );
						}
					} else {
						el = $I( key );
						if ( !validate.results[ key ] ) {
							el.classname = 'disabled';
							el.disabled = true;
						} else {
							el.classname = '';
							el.disabled = false;
						}
					}
				}
			}

			//Attach confirmation dialogs to the archive buttons
			$( '.archive-form input[type=submit]' ).on( 'click', function( e ) {
				stopEvent( e )
				var shouldArchive = confirm( 'Are you sure you want to archive \'' +
					this.getAttribute( 'data-name' ) + '\'?' );
				if ( shouldArchive ) {
					HTMLFormElement.prototype.submit.call( this.parentNode );
				}
			} )

			//Handle game state loading
			var loadGameState = function( el ) {
					var uid = $( el ).find( '[name=uid]' ).attr( 'value' ),
						gameid = $( el ).find( '[name=gameid]' ).attr( 'value' ),
						k = uid + '-' + gameid

					if ( clicked.indexOf( k ) < 0 ) {
						//Need to load in gamestate data
						clicked.push( k )
						console.log( k )
						BureauApi( 'gamestatefragment/' + gameid + '/' + uid, function( err, j ) {
							$( el ).parent().find( '.gamestate-block' ).html( j.gamestatefragment )
						} )
					}
				},
				clicked = []

			this.playerListToggle( true, loadGameState )
			this.search()
		},

		report: function() {
			var a = [];

			a.push( makeColourItem( $I( 'kill-report-top-decor' ), 'background-color' ) );
			a.push( makeColourItem( $I( 'submit-button' ), 'background-color' ) );
			a.push( makeColourItem( $I( 'killreport-textarea' ), 'outline-color' ) );
			a.push( makeColourItem( document.querySelectorAll( '.kill-report-inner' )[ 0 ],
				'color' ) );
			colourItems( a );

			//Determine whether we should show or hide the kill method extra detail question
			var showHideKillmethodQuestion = function() {
				var d = $I( 'killmethod-dropdown' ),
					question = d.options[ d.selectedIndex ].getAttribute( 'data-question' );

				//$I('killMethodQuestion').innerHTML = question;
				var input = $I( 'killMethodQuestionInput' );
				input.value = '';
				input.setAttribute( 'placeholder', question );
				if ( !!question ) {
					input.className = 'has-question';
				} else {
					input.className = '';
				}
			}
			showHideKillmethodQuestion();

			var reportTextHiddenInput = document.querySelectorAll(
				'#report-text input[name="report-text"]' )[ 0 ];
			//Switch out contenteditable item from textarea
			$( '#contenteditable-report' ).on( 'keyup', function() {
				reportTextHiddenInput.value = this.innerText;
			} );

			//Autoexpand the textarea
			$( '#killreport-textarea' ).autogrow();

			//Display extra question box as appropriate for different kill methods
			$( '#killmethod-dropdown' ).on( 'change', showHideKillmethodQuestion );

			//Fill in the client side time to the time box
			$I( 'time-input' ).value = bureau.utils.prettyTimestamp();

			//Make the geolocation button work
			if ( navigator.geolocation && navigator.geolocation.getCurrentPosition ) {
				$( '#coords-btn' ).removeClass( 'hidden' );
				$( '#coords-btn' ).on( 'click', function( e ) {
					var btn = $( this );
					btn.addClass( 'loading' );
					stopEvent( e );
					navigator.geolocation.getCurrentPosition( function( position ) {
							var geocoder = new google.maps.Geocoder(),
								latlng = new google.maps.LatLng( position.coords.latitude, position
									.coords.longitude );
							$I( 'coords-input' ).value = position.coords.latitude + ', ' +
								position.coords.longitude;
							geocoder.geocode( {
									'latLng': latlng
								},
								function( results, status ) {
									if ( status == google.maps.GeocoderStatus.OK ) {
										if ( results[ 0 ] && bureau.utils.getRouteFromMapsApiResult(
												results[ 0 ] ) ) {
											console.log( results )
											var placename = bureau.utils.getRouteFromMapsApiResult( results[
												0 ] );
											$I( 'place-input' ).value = placename;
											updateValidation();
											btn.removeClass( 'loading' );
										} else {
											btn.removeClass( 'loading' );
										}
									} else {
										alert( "Geocoder failed due to: " + status );
										btn.removeClass( 'loading' );
									}
								} );
						},
						function() {
							btn.removeClass( 'loading' );
						} )
				} );
			}

			//Field validtion
			var validate = {
					results: {},
					checks: {
						def: function() {
							return true
						},

						time: function( val ) {
							var d = bureau.utils.dateFromPrettyTimestamp( val ),
								now = new Date();
							return ( !!d && !isNaN( d.getMonth() ) && d < now && val.length === 19 &&
								bureau.utils.dateRegex.test( val ) );
						},
						place: function( val ) {
							return ( !!val && val.length > 5 );
						},
						'report-text': function( val ) {
							return ( !!val && val.length > 10 );
						}
					}
				},
				fields = document.querySelectorAll( 'input, select, textarea' ),
				i = 0,
				l = fields.length,
				f;

			for ( i; i < l; i++ ) {
				f = fields[ i ];
				validate.results[ f.name ] = false;
				switch ( f.name ) {
					default: $( f ).on( 'keyup', function() {
						updateValidation()
					} );
					break;
				}

			}

			function updateValidation() {
				var f, n, el, canSubmit = true;
				for ( i = 0; i < l; i++ ) {
					f = fields[ i ];
					n = validate.checks.hasOwnProperty( f.name ) ? f.name : 'def';
					validate.results[ f.name ] = validate.checks[ n ]( f.value );
				}

				for ( var key in validate.results ) {
					el = $( '#' + key );
					if ( !validate.results[ key ] ) {
						el.addClass( 'problem' )
						canSubmit = false;
					} else {
						el.removeClass( 'problem' )
					}
				}

				$I( 'submit-button' ).className = canSubmit ? '' : 'disabled';
			}

			updateValidation();

			//Finally add the listener to the button for submitting the report
			$I( 'submit-button' ).addEventListener( 'click', function( e ) {
				if ( this.className.indexOf( 'disabled' ) === -1 ) {
					document.forms[ 0 ].submit();
				}
			}, false );
		},

		killmethods: function() {
			colourItems( [] )
				//Autoexpand the textarea
			$( '#methodrules' ).autogrow()
			$( '#methoddetailneeded' ).on( 'change', function( e ) {
				$I( 'detail-section' ).className = this.checked ? '' : 'nodetail'
			} )

			//Field validtion
			var validate = {
					results: {},
					checks: {
						def: function() {
							return true
						},

						methodname: function( val ) {
							val = val.trim()
							return ( !!val && val.length > 2 )
						},
						methoddetailquestion: function( val ) {
							val = val.trim()
							if ( $I( 'methoddetailneeded' ).checked ) {
								return ( !!val && val.length > 5 )
							} else {
								return true
							}
						},
						methodverb: function( val ) {
							val = val.trim()
							return ( !!val && val.length > 5 )
						},
						methodrules: function( val ) {
							val = val.trim()
							return ( !!val && val.length > 10 )
						}

					}
				},
				fields = document.querySelectorAll(
					'#new-kill-method input, #new-kill-method textarea' ),
				i = 0,
				l = fields.length,
				f;
			for ( i; i < l; i++ ) {
				f = fields[ i ];
				validate.results[ f.name ] = false;
				switch ( f.name ) {
					default: $( f ).on( 'keyup', function() {
						updateValidation()
					} );
					break;
				}

			}

			function updateValidation() {
				var f, n, el, canSubmit = true;
				for ( i = 0; i < l; i++ ) {
					f = fields[ i ];
					n = validate.checks.hasOwnProperty( f.name ) ? f.name : 'def';
					validate.results[ f.name ] = validate.checks[ n ]( f.value );
				}

				for ( var key in validate.results ) {
					el = $( '#' + key );
					if ( !validate.results[ key ] ) {
						el.parent().addClass( 'problem' )
						canSubmit = false;
					} else {
						el.parent().removeClass( 'problem' )
					}
				}

				$I( 'submit-button' ).className = canSubmit ? '' : 'disabled';
				$I( 'submit-button' ).disabled = !canSubmit;
			}

			updateValidation();

			//Finally add the listener to the button for submitting the report
			$I( 'submit-button' ).addEventListener( 'click', function( e ) {
				stopEvent( e )
				if ( this.className.indexOf( 'disabled' ) === -1 ) {
					document.forms[ 0 ].submit();
				}
			}, false );


			//Setup killmethod editing
			$( '.killmethod button' ).on( 'click', function( e ) {
				stopEvent( e )
				$( this.parentNode ).find( 'textarea' ).autogrow()
				$( this.parentNode ).find( 'input' ).removeAttr( 'disabled' )
				this.parentNode.classList.add( 'editing' )
			} )


			//Setup search
			this.search( true );
		},

		personal: function() {
			var a = [];

			a.push(
				makeColourItem( $I( 'personal-header' ), 'borderColor' ),
				makeColourItem( $I( 'personal-page' ), 'borderColor' )
			)


			var d = document.querySelectorAll( '#details input' ),
				k = d.length,
				j = 0

			for ( j; j < k; j++ ) {
				a.push( makeColourItem( d[ j ], 'outlineColor' ) )
			}

			colourItems( a )

			//Prime colour switching area
			$( '.colours [data-colour]' ).each( function( i, el ) {
				var colour = $( this ).attr( 'data-colour' )
				if ( colours.indexOf( colour ) > -1 ) {
					$( this ).find( 'input[type=checkbox]' )[ 0 ].checked = true
				}
			} )
			$( '.colours label' ).on( 'click', function( e ) {
				var checked = !( $( this ).siblings( 'input' )[ 0 ].checked ),
					colour = $( this ).siblings( 'input' )[ 0 ].value
				if ( checked ) {
					if ( colours.indexOf( colour ) < 0 ) {
						colours.push( colour )
					}
				} else {
					if ( colours.length <= 1 ) {
						alert( 'You must have at least 1 interface colour!' )
						stopEvent( e )
						return
					} else {
						colours = colours.filter( function( el ) {
							return el !== colour
						} )
					}
				}
				storeObj( 'bureau-colours', colours )
			} )


			//Setup the editable regions with their forms
			var editButtons = document.querySelectorAll( '.edit-button' ),
				l = editButtons.length,
				i = 0,
				toggleEdit = function( e ) {
					var container = e.target.parentNode,
						editing;

					if ( container.className.indexOf( 'edit' ) === -1 ) {
						container.className += ' edit';
						sexyInnerHTML( e.target, 'submit request' );
						editing = true;
					} else {
						switch ( container.id ) {
							case "details":
								var r = confirm(
									"Are you sure you want to submit a details change request?" );
								if ( r ) {
									container.querySelector( 'form' ).submit();
								}
								return;
								break;
						}
					}

					var inputs = container.querySelectorAll( '.editable-row > input' ),
						l = inputs.length,
						i = 0

					for ( i; i < l && editing; i++ ) {
						inputs[ i ].disabled = '';
					}

				};

			for ( i; i < l; i++ ) {
				editButtons[ i ].addEventListener( 'click', toggleEdit, false );
			}

			//Setup display picture changer
			$I( 'picture-form' ).onchange = function() {
				$I( 'picture-form' ).submit();
			}

			$I( 'opt-in-input' ).addEventListener( 'click', function( e ) {
				var optout = !this.checked;

				BureauApi( 'setoptout', {
					optout: optout
				}, function( err, response ) {
					bureau.notificationsPanel.refresh()
				} )
			} )
		},

		updateDetails: function() {
			var a = [];

			a.push(
				makeColourItem( $I( 'personal-header' ), 'borderColor' ),
				makeColourItem( $I( 'personal-page' ), 'borderColor' ),
				makeColourItem( document.querySelectorAll( 'p' )[ 0 ], 'color' )
			)


			var d = document.querySelectorAll( '#details input' ),
				k = d.length,
				j = 0

			for ( j; j < k; j++ ) {
				a.push( makeColourItem( d[ j ], 'outlineColor' ) )
			}

			colourItems( a )
		},

		gamegroup: function() {
			var a = [];
			colourItems( a );

			//Setup player lists and search
			this.playerListToggle( true );
			this.search();
		}
	},

	utils: {
		prettyTimestamp: function() {
			var d = new Date(),
				s = d.getFullYear() + '-' + this.date2Digits( d.getMonth() + 1 ) + '-' +
				this.date2Digits( d.getDate() ) + ' ' + this.date2Digits( d.getHours() ) +
				':' + this.date2Digits( d.getMinutes() ) + ':' + this.date2Digits( d.getSeconds() );
			return s;
		},
		dateFromPrettyTimestamp: function( d ) {
			//			2014-01-06 06:00:00
			var parts = d.split( ' ' ),
				dat = parts[ 0 ].split( '-' ),
				tim = parts[ 1 ].split( ':' )
			return new Date( dat[ 0 ], dat[ 1 ] - 1, dat[ 2 ], tim[ 0 ], tim[ 1 ], tim[ 2 ] );
		},
		dateRegex: /[0-9]{4}-[0-1][0-9]-[0-3][0-9] [0-2][0-9]:[0-5][0-9]:[0-5][0-9]/,
		date2Digits: function( d ) {
			d = d + '';
			return d.length > 1 ? d : '0' + d;
		},
		getRouteFromMapsApiResult: function( r ) {
			var a = r.address_components,
				route = false,
				postal_code = false;
			for ( var i = 0; i < a.length; i++ ) {
				if ( a[ i ].types[ 0 ] === 'route' ) {
					route = a[ i ].long_name;
				}
			}

			for ( var i = 0; i < a.length; i++ ) {
				if ( a[ i ].types[ 0 ] === 'postal_code' ) {
					postal_code = a[ i ].long_name;
				}
			}

			if ( !!route && !!postal_code ) {
				return route + ', ' + postal_code;
			} else {
				return false;
			}

		}
	}

}

//Setup
$( function() {
	bureau.init();
} )
