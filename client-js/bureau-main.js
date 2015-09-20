var bureau = {
	init: function() {
		if(!!$I('bureau-uid').value) {
			this.user.uid = $I('bureau-uid').value
			this.user.gamegroup = $I('bureau-gamegroup').value
			this.user.token = $I('bureau-token').value
			this.setupToolbar()
			this.setupNotifications()
		}
		setup();

		switch (document.body.id) {
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

	user: {
		uid: 0,
		gamegroup: '',
		token: ''
	},

	notifications: [],

	setupToolbar: function() {
		if($I('toolbar')) {
			var d = $I('grabber');
			d.innerHTML = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="30px" height="23px" viewBox="0 0 30 23" enable-background="new 0 0 30 23" xml:space="preserve"> <rect fill-rule="evenodd" clip-rule="evenodd" fill="#888888" width="30" height="3"/> <rect y="10" fill-rule="evenodd" clip-rule="evenodd" fill="#888888" width="30" height="3"/><rect y="20" fill-rule="evenodd" clip-rule="evenodd" fill="#888888" width="30" height="3"/></svg>';

			//setup notification drawer
			var drawer = $I('toolbar-notifications')
			$('#notifications-btn, #grabber').on('click', function(e) {
				stopEvent(e)
				drawer.classList.toggle('open')
			})
		}

		var m = document.createElement('meta');
		m.setAttribute('name', 'msapplication-tap-highlight');
		m.setAttribute('content', 'no');

		var m2 = document.createElement('meta');
		m2.setAttribute('http-equiv', 'X-UA-Compatible');
		m2.setAttribute('content', 'IE=edge');

		document.head.appendChild(m);
		document.head.appendChild(m2);
	},

	setupNotifications: function() {
		var cachedNotifications = retrieveObj('notifications')
		if(!!cachedNotifications) {
			bureau.notifications = cachedNotifications.map(function(n) {
				n.added = new Date(n.added)
				if(n.seen) {
					n.seen = new Date(n.seen)
				}
				return n
			})
			bureau.displayNotifications()
		}
		//Now go off and get the latest ones
		bureau.api(bureau.user.uid, 'read', 'notifications', {limit: window.innerHeight/60 + 5}, function(err, response) {
			var notifications = response.notifications
			storeObj('notifications', notifications)
			bureau.notifications = notifications.map(function(n) {
				n.added = new Date(n.added)
				if(n.seen) {
					n.seen = new Date(n.seen)
				}
				return n
			})
			bureau.displayNotifications()
		})
	},

	cacheNotifications: function() {
		storeObj('notifications', bureau.notifications)
	},

	displayNotifications: function() {
		try{
		var list = $I('notifications'),
			tpl = $I('notification-template').innerHTML,
			n = bureau.notifications.map(function(x) {
				x.ago = timeSince(x.added)
				return x
			}),
			out = swig.render(tpl, { locals: {
				notifications: n
			}})
		} catch(e) {
			return
		}

		list.innerHTML = out

		var unreadCount = bureau.notifications.reduce(function(previousValue, currentValue, index, array){
			return previousValue + (currentValue.read?0:1);
		}, 0)

		$I('unread-count').innerHTML = unreadCount>0?unreadCount:''

		$(list).children().on('click', function(e) {
			stopEvent(e)
			var link = this.getAttribute('data-link'),
				id = this.id.replace('notification-','')
			if(this.className.indexOf('unread') > -1) {
				//Use api to mark unread
				bureau.api(bureau.user.uid, 'write', 'readNotification', {id: id}, function(err, response) {
					var i = 0,
						l = bureau.notifications.length
					for(i;i<l;i++) {
						if(bureau.notifications[i].id == id) {
							bureau.notifications[i].read = true
							break
						}
					}
					bureau.cacheNotifications()
					bureau.displayNotifications()
					if(!!link) {
						window.location = link
					}
				})
			}
		})
	},


	api: function(uid, method, endpoint, data, callback, debug) {

		//method 	- read/write
		//endpoint 	- the api to be accessed
		//data 		- a JSON object to be sent with the request

		var j = {
			uid: uid,
			token: bureau.user.token,
			data: data
		}
		var req = new XMLHttpRequest()
		req.onload = function() {
			if(this.status === 200) {
				if(debug) {
	 				console.log(this);
	 				console.log(callback?'has callback':'no callback')
	 				console.log(this.responseText);
	 				console.log(req.responseText);
	 				console.log(JSON.parse(req.responseText));
				}

				if(callback) {
					var response = JSON.parse(req.responseText)
					callback(null, response)
				}
			} else {
				console.error(this.status, this.statusText, req.responseText)
				if(callback) {
					callback(req.responseText, null)
				}
			}
		}
		//var apiUrl = window.location.pathname.replace(/\/bureau\/.*/,'/bureau/api/');
		var apiUrl = '/api/'+method+'/'+endpoint
		req.open('POST', apiUrl)
		req.setRequestHeader('Content-type', 'application/json')
		req.send(JSON.stringify(j))
	},

	setup: {
		search: function(important) {
			$('.searchable').each(function() {
				var f = document.createDocumentFragment(),
					i = document.createElement('input'),
					id = this.id,
					searchStyle = document.getElementById('search_style'),
					hint = !!this.getAttribute('data-search')?this.getAttribute('data-search'):'search players',
					searchClass = !!this.getAttribute('data-searchclass')?this.getAttribute('data-searchclass'):'',
					inclusive = !!this.getAttribute('data-searchmethod') && this.getAttribute('data-searchmethod')=='inclusive';
				i.className = 'player-table-search '+searchClass;
				i.setAttribute('placeholder', hint);
				f.appendChild(i);

				$(i).on('input', function() {
					if (!this.value) {
						searchStyle.innerHTML = "";
						return;
					}
					if(inclusive) {
						searchStyle.innerHTML = '#'+id+'.searchable > li[data-index*=\"' + this.value.toLowerCase() + '\"] { display: block'+(!!important?' !important':'')+'; }';
					} else {
						searchStyle.innerHTML = '#'+id+'.searchable > li:not([data-index*=\"' + this.value.toLowerCase() + '\"]) { display: none'+(!!important?' !important':'')+'; }';
					}
				});
				this.parentNode.insertBefore(f, this);
			});
		},

		playerListToggle: function(useHeader, callback) {
			var selector = '.player-table > li' + (!!useHeader ? ' header' : '');
			$(selector).on('click', function(e) {
				if(callback) {
					callback(this)
				}
				$(this).closest('li').toggleClass('expanded');
			})
		},

		home: function() {
			function timeGreeting(name) {
				var h = (new Date()).getHours(),
					s;

				if(h >= 4 && h <= 12) {
					s = 'Good morning, ' + name;
				} else if(h >= 13 && h <= 17) {
					s = 'Good afternoon, ' + name;
				} else {
					s = 'Good evening, ' + name;
				}

				$I('welcome-message').innerHTML = s;
				$I('welcome-message').style.opacity = 1;
			}
			timeGreeting(displayName);


			this.playerListToggle();
			this.search();

			var a = [];
			var infos = document.querySelectorAll('.game-info');
			for(var i=0; i<infos.length; i++) {
				a.push(makeColourItem(infos[i], 'color'));
			}
			colourItems(a);

		},

		guild: function() {
			var a = [],
				membershipRows = document.querySelectorAll('.member-row'),
				commenttextareas = document.querySelectorAll('.killreport textarea')

			a.push(makeColourItem($I('kill-reports'), 'color'))
			a.push(makeColourItem($I('guild-nav'), 'color'))
			a.push(makeColourItem($I('motd-input'), 'outlineColor'))

			for(var i=0; i<commenttextareas.length; i++) {
				a.push(makeColourItem(commenttextareas[i], 'color'))
				a.push(makeColourItem(commenttextareas[i], 'outline-color'))
			}

			for(i=0; i<membershipRows.length; i++) {
				a.unshift(makeColourItem(membershipRows[i].querySelector('.name'), 'color'));
				a.unshift(makeColourItem(membershipRows[i].querySelector('.nickname-rank'), 'borderColor'))
				a.unshift(makeColourItem(membershipRows[i], 'borderColor'))
			}
			colourItems(a)

			if(location.hash !== '') {
				location.hash = '';
			}

			if($I('motd-input')) { //We use this JS on every guild page (oops?) so we should protect against errors
				$I('motd-input').onkeyup = function(e) { //Disable the set MotD button if there's nothing to set it to
					if(!!this.value) {
						$I('set-motd-button').removeAttribute('disabled');
					} else {
						$I('set-motd-button').setAttribute('disabled', true);
					}
				}

				$I('reset-motd-button').onclick = function(e) { //Make sure they want to reset the MotD and aren't doing it by accident
					var reset = confirm('Clear the MotD?');
					if(!reset) {
						stopEvent(e);
					}
				}
			}

			//Make the kill report headers respond to clicks
			$('article.killreport header').on('click', function(e) {
				$(this).closest('.killreport').toggleClass('closed');
			});

			//Autoexpand the comment textarea on kill reports
			$('.killreport textarea').autogrow();

			//Make prettier maps
			google.maps.visualRefresh = true;
			//Populate the map containers with maps
			$('.mapcontainer').each(function() {
				var el = this,
					coords = this.getAttribute('data-coords').split(','),
					latlng = new google.maps.LatLng(parseFloat(coords[0]), parseFloat(coords[1]))
					mapOptions = {
						zoom: 18,
						center: latlng,
						mapTypeId: google.maps.MapTypeId.HYBRID
					},
					map = new google.maps.Map(this, mapOptions),
					marker = new google.maps.Marker({
					    position: latlng,
					    map: map,
					    icon: ((document.title.indexOf('-')!==-1)?'../':'') + 'images/target-small.svg'
					})
			})

			/*
			bureau.api(bureau.user.uid, 'read', 'statistics', ['members'], function(result) {
				//Make the brace headers extend and populate data
				$('.brace-block').each(function() {
					switch(this.id) {
						case 'members-by-type':
							var j = result.members.breakdown,
								t = result.members.total,
								d = document.createDocumentFragment(),
								n = document.createElement('div'),
								max = 1,
								b;
							n.className = 'graph-bar';
							//Find the largest of the group sizes
							for(key in j) {
								max = (j.hasOwnProperty(key) && j[key] > max) ? j[key] : max;
							}

							//Create the bar elements
							for(key in j) {
								if(j.hasOwnProperty(key)) {
//									console.log(key, j[key]);
									b = n.cloneNode();
									b.innerHTML = key;
									b.setAttribute('data-val', j[key]);
									b.style.width = j[key]/max * 100 + '%';
									d.appendChild(b);
								}
							}
							this.appendChild(d);
							break;
						default:
							break;
					}
					var t = $(this),
						h = t.height() + 'px';
					t.children('.caption').css('width', h);
					t.addClass('ready');
				});
			});*/

			//Handle resetting of passwords
			$("input[type=submit][name=resetpassword]").on('click', function(e) {
				var resetuid = this.getAttribute('data-uid')
				if(confirm('Are you sure you want to reset their password?')) {
					bureau.api(bureau.uid, 'write', 'resetPassword', {resetuid:resetuid}, function(err, j) {
						prompt('Copy the password below and securely send it to the player. If either of you lose this code you will need to generate it again.', j.temppassword)
					})
				}
			})

			//Setup player lists and search for guild pages that need it
			this.playerListToggle(true);
			this.search();
		},

		guildAllReports: function() {
			var a = [],
				membershipRows = document.querySelectorAll('.member-row'),
				commenttextareas = document.querySelectorAll('.killreport textarea')

			a.push(makeColourItem($I('kill-reports'), 'color'))
			a.push(makeColourItem($I('guild-nav'), 'color'))
			a.push(makeColourItem($I('motd-input'), 'outlineColor'))

			for(var i=0; i<commenttextareas.length; i++) {
				a.push(makeColourItem(commenttextareas[i], 'color'))
				a.push(makeColourItem(commenttextareas[i], 'outline-color'))
			}
			colourItems(a)

			//Make the kill report headers respond to clicks
			$('article.killreport header').on('click', function(e) {
				$(this).closest('.killreport').toggleClass('closed');
			});

			//Autoexpand the comment textarea on kill reports
			$('.killreport textarea').autogrow();

			//Make prettier maps
			google.maps.visualRefresh = true;
			//Populate the map containers with maps
			$('.mapcontainer').each(function() {
				var el = this,
					coords = this.getAttribute('data-coords').split(','),
					latlng = new google.maps.LatLng(parseFloat(coords[0]), parseFloat(coords[1]))
					mapOptions = {
						zoom: 18,
						center: latlng,
						mapTypeId: google.maps.MapTypeId.HYBRID
					},
					map = new google.maps.Map(this, mapOptions),
					marker = new google.maps.Marker({
					    position: latlng,
					    map: map,
					    icon: ((document.title.indexOf('-')!==-1)?'../':'') + 'images/target-small.svg'
					})
			})

			//Add the confirmation dialog to approving and rejecting reports
			$('.processing-buttons input[type="submit"]').on('click', function(e) {
				stopEvent(e)

				var message = 'Are you sure you want to retroactively ' + this.className + ' this kill report? Please check to make sure that taking this action is in line with the game\'s mechanics!';
				if(confirm(message)) {
					$(this).closest('form').each(function() {
						HTMLFormElement.prototype.submit.call(this);
					});
				}
			});

			this.playerListToggle(true);
		},

		guildMembership: function() {
			var membershipRows = document.querySelectorAll('.membership-row'),
				items = [];

			for(i=0; i<membershipRows.length; i++) {
				items.unshift(makeColourItem(membershipRows[i].querySelector('.name'), 'color'));
				items.unshift(makeColourItem(membershipRows[i].querySelector('.nickname-rank'), 'borderColor'));
				items.unshift(makeColourItem(membershipRows[i], 'borderColor'));
			}
			colourItems(items);

			var addRule = (function (style) {
				var sheet = document.head.appendChild(style).sheet;
				return function (selector, css) {
					var propText = typeof css === "string" ? css : Object.keys(css).map(function (p) {
						return p + ":" + (p === "content" ? "'" + css[p] + "'" : css[p]);
					}).join(";");
					sheet.insertRule(selector + "{" + propText + "}", sheet.cssRules.length);
				};
			})(document.createElement("style"));

			addRule('.membership-row *[title]::after, header figure[class*=\"-icon\"], .membership-row .caption', {
				color: CHOSEN_COLOUR
			});
			addRule('#membership-key li.active', {
				color: CHOSEN_COLOUR
			})


			var searchBox = $('.player-table-search'),
				typeSheet = document.createElement('style');
			document.head.appendChild(typeSheet);

			$('#membership-key li').on('click', function(e) {
				var el = $(this),
					t = this.children[0].title;
				if(el.hasClass('active')) {
					$('#membership-key li').removeClass('active');
					typeSheet.innerHTML = '';
				} else {
					$('#membership-key li').removeClass('active');
					typeSheet.innerHTML = '.membership-row:not([data-membership=\"'+t+'\"]) { display: none; }';
					el.addClass('active');
				}
			});
			$('select[name="membershipType"]').on('change', function(e) {
				this.parentNode.submit();
			});
		},

		guildNewGame: function() {
			var a = [];
			a.push(makeColourItem($I('submit-button'), 'background-color'));
			a.push(makeColourItem(document.querySelectorAll('.new-game-top-decor')[0], 'background-color'));
			a.push(makeColourItem(document.querySelectorAll('.new-game-inner')[0], 'color'));
			colourItems(a);


			//Display correct fragment for game
			function displayGameSetupFragment(e) {
				var gtype = e.target.value,
					el = $I('game-setup-fragment-container');
				if(!!gtype) {
					el.children[0].innerHTML = 'Loading '+gtype+' setup...';
					el.className = 'fragment-loading';

					bureau.api(bureau.user.uid, 'read', 'gamesetupfragment', {gametype:gtype}, function(err, j) {
						if(!err) {
							el.className = ''
							console.log(j)
							el.children[0].innerHTML = j.gamesetupfragment
						} else {
							console.log(err)
						}
					})
				} else {
					el.className = 'empty';
					el.children[0].innerHTML = '';
				}
			}

			$('#gametype-dropdown').on('change', displayGameSetupFragment);

			//Field validtion
			var validate = {
				results:{},
				checks: {
					def: function(){return true},
					title: function(val) {
						return (!!val && val.length > 3);
					},
					start: function(val) {
						var d = bureau.utils.dateFromPrettyTimestamp(val),
							now = new Date();
						return (!!d && !isNaN(d.getMonth()) && d > now && val.length === 19 && bureau.utils.dateRegex.test(val));
					},
					end: function(val) {
						var d = bureau.utils.dateFromPrettyTimestamp(val),
							now = new Date();
						return (!!d && !isNaN(d.getMonth()) && d > now && val.length === 19 && bureau.utils.dateRegex.test(val));
					},
					gametype: function(val) {
						return !!val;
					}
				}
			},
				fields = document.querySelectorAll('input:not([type="checkbox"]), select'),
				i = 0,
				l = fields.length,
				f;

			for(i;i<l;i++) {
				f = fields[i];
				validate.results[f.name] = false;
				switch (f.name) {
					default:
						$(f).on('keyup', function(){updateValidation()});
						break;
					case 'gametype':
						$(f).on('change', function(){updateValidation()});
						break;
				}

			}

			function updateValidation() {
				var f,n,el,canSubmit=true;
				for(i=0;i<l;i++) {
					f = fields[i];
					n = validate.checks.hasOwnProperty(f.name)?f.name:'def';
					validate.results[f.name] = validate.checks[n](f.value);
				}

				for(key in validate.results) {
					el = $('#'+key);
					if(!validate.results[key]) {
						el.addClass('problem')
						canSubmit = false;
					} else {
						el.removeClass('problem')
					}
				}

				$I('submit-button').className = 'fancy-submit ' + (canSubmit ? '' : 'disabled');
			}

			updateValidation();

			$I('submit-button').addEventListener('click', function(e) {
				if(this.className.indexOf('disabled') === -1) {
					document.forms[0].submit();
				}
			}, false);
			this.search()
		},

		guildGameState: function() {
			colourItems([])

			//Field validtion
			var validate = {
					results:{},
					checks: {
						def: function(){return true},
						start: function(val, gameid) {
							var d = bureau.utils.dateFromPrettyTimestamp(val),
								endd = bureau.utils.dateFromPrettyTimestamp($I('end-input-'+gameid).value);
							return (!!d && !!endd && !isNaN(d.getMonth()) && !isNaN(endd.getMonth()) && d < endd && val.length === 19 && bureau.utils.dateRegex.test(val));
						},
						end: function(val, gameid) {
							var d = bureau.utils.dateFromPrettyTimestamp(val),
								startd = bureau.utils.dateFromPrettyTimestamp($I('start-input-'+gameid).value);
							return (!!d && !!startd && !isNaN(d.getMonth()) && !isNaN(startd.getMonth()) && d > startd && val.length === 19 && bureau.utils.dateRegex.test(val));
						},
						submit: function(val, gameid) {
							var startval = $I('start-input-'+gameid).value,
								startd = bureau.utils.dateFromPrettyTimestamp(startval),
								endval = $I('end-input-'+gameid).value,
								endd = bureau.utils.dateFromPrettyTimestamp(endval);
							return (!!startd && !!endd && !isNaN(startd.getMonth()) && !isNaN(endd.getMonth()) && startd < endd && endval.length === 19 && startval.length === 19 && bureau.utils.dateRegex.test(startval) && bureau.utils.dateRegex.test(endval));
						}
					}
				},
				fields = document.querySelectorAll('.gamedate-form input[type="text"], .gamedate-form input[type="submit"]'),
				i = 0,
				l = fields.length,
				f;

			for(i;i<l;i++) {
				f = fields[i];
				validate.results[f.id] = false;
				switch (f.name) {
					default:
						$(f).on('keyup', function(){updateValidation()});
						break;
					case 'gametype':
						$(f).on('change', function(){updateValidation()});
						break;
				}

			}
			console.log(validate);
			function updateValidation() {
				var f,n,el;
				for(i=0;i<l;i++) {
					f = fields[i];
					n = validate.checks.hasOwnProperty(f.name)?f.name:'def';
					validate.results[f.id] = validate.checks[n](f.value, f.getAttribute('data-gameid'));
				}

				for(key in validate.results) {
					console.log(key, key.indexOf('submit'))
					if(key.indexOf('submit') === -1) { //Not the submit button
						el = $('#section-'+key);
						if(!validate.results[key]) {
							el.addClass('problem');
						} else {
							el.removeClass('problem');
						}
					} else {
						el = $I(key);
						console.log(key);
						if(!validate.results[key]) {
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
			$('.archive-form input[type=submit]').on('click', function(e) {
				stopEvent(e)
				var shouldArchive = confirm('Are you sure you want to archive \''+this.getAttribute('data-name')+'\'?');
				if(shouldArchive) {
					HTMLFormElement.prototype.submit.call(this.parentNode);
				}
			})

			//Handle game state loading
			var loadGameState = function(el) {
					var uid = $(el).find('[name=uid]').attr('value'),
						gameid = $(el).find('[name=gameid]').attr('value'),
						k = uid+'-'+gameid

					if(clicked.indexOf(k) < 0) {
						//Need to load in gamestate data
						clicked.push(k)
						console.log(k)
						bureau.api(bureau.user.uid, 'read', 'gamestatefragment', {gameid:gameid, uid:uid}, function(err, j) {
							$(el).parent().find('.gamestate-block').html(j.gamestatefragment)
						})
					}
				},
				clicked = []

			this.playerListToggle(true, loadGameState)
			this.search()
		},

		report: function() {
			var a = [];

			a.push(makeColourItem($I('kill-report-top-decor'), 'background-color'));
			a.push(makeColourItem($I('submit-button'), 'background-color'));
			a.push(makeColourItem($I('killreport-textarea'), 'outline-color'));
			a.push(makeColourItem(document.querySelectorAll('.kill-report-inner')[0], 'color'));
			colourItems(a);

			//Determine whether we should show or hide the kill method extra detail question
			var showHideKillmethodQuestion = function() {
				var d = $I('killmethod-dropdown'),
					question = d.options[d.selectedIndex].getAttribute('data-question');

				//$I('killMethodQuestion').innerHTML = question;
				var input = $I('killMethodQuestionInput');
				input.value = '';
				input.setAttribute('placeholder', question);
				if(!!question) {
					input.className = 'has-question';
				} else {
					input.className = '';
				}
			}
			showHideKillmethodQuestion();

			var reportTextHiddenInput = document.querySelectorAll('#report-text input[name="report-text"]')[0];
			//Switch out contenteditable item from textarea
			$('#contenteditable-report').on('keyup', function() {
				reportTextHiddenInput.value = this.innerText;
			});

			//Autoexpand the textarea
			$('#killreport-textarea').autogrow();

			//Display extra question box as appropriate for different kill methods
			$('#killmethod-dropdown').on('change', showHideKillmethodQuestion);

			//Fill in the client side time to the time box
			$I('time-input').value = bureau.utils.prettyTimestamp();

			//Make the geolocation button work
			if(navigator.geolocation && navigator.geolocation.getCurrentPosition) {
				$('#coords-btn').removeClass('hidden');
				$('#coords-btn').on('click', function(e) {
					var btn = $(this);
					btn.addClass('loading');
					stopEvent(e);
					navigator.geolocation.getCurrentPosition(function(position) {
						var geocoder = new google.maps.Geocoder(),
							latlng = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
						$I('coords-input').value = position.coords.latitude + ', ' + position.coords.longitude;
						geocoder.geocode({
							'latLng': latlng
						},
						function (results, status) {
							if (status == google.maps.GeocoderStatus.OK) {
								if (results[0] && bureau.utils.getRouteFromMapsApiResult(results[0])) {
									console.log(results)
									var placename = bureau.utils.getRouteFromMapsApiResult(results[0]);
									$I('place-input').value = placename;
									updateValidation();
									btn.removeClass('loading');
								} else {
									btn.removeClass('loading');
								}
							} else {
								alert("Geocoder failed due to: " + status);
								btn.removeClass('loading');
							}
						});
					},
					function() {
						btn.removeClass('loading');
					})
				});
			}

			//Field validtion
			var validate = {
				results:{},
				checks: {
					def: function(){return true},

					time: function(val) {
						var d = bureau.utils.dateFromPrettyTimestamp(val),
							now = new Date();
						return (!!d && !isNaN(d.getMonth()) && d < now && val.length === 19 && bureau.utils.dateRegex.test(val));
					},
					place: function(val) {
						return (!!val && val.length > 5);
					},
					'report-text': function(val) {
						return (!!val && val.length > 10);
					}
				}
			},
				fields = document.querySelectorAll('input, select, textarea'),
				i = 0,
				l = fields.length,
				f;

			for(i;i<l;i++) {
				f = fields[i];
				validate.results[f.name] = false;
				switch (f.name) {
					default:
						$(f).on('keyup', function(){updateValidation()});
						break;
				}

			}

			function updateValidation() {
				var f,n,el,canSubmit=true;
				for(i=0;i<l;i++) {
					f = fields[i];
					n = validate.checks.hasOwnProperty(f.name)?f.name:'def';
					validate.results[f.name] = validate.checks[n](f.value);
				}

				for(key in validate.results) {
					el = $('#'+key);
					if(!validate.results[key]) {
						el.addClass('problem')
						canSubmit = false;
					} else {
						el.removeClass('problem')
					}
				}

				$I('submit-button').className = canSubmit ? '' : 'disabled';
			}

			updateValidation();

			//Finally add the listener to the button for submitting the report
			$I('submit-button').addEventListener('click', function(e) {
				if(this.className.indexOf('disabled') === -1) {
					document.forms[0].submit();
				}
			}, false);
		},

		killmethods: function() {
			colourItems([])
			//Autoexpand the textarea
			$('#methodrules').autogrow()
			$('#methoddetailneeded').on('change', function(e) {
				$I('detail-section').className = this.checked?'':'nodetail'
			})

			//Field validtion
			var validate = {
				results:{},
				checks: {
					def: function(){return true},

					methodname: function(val) {
						val = val.trim()
						return (!!val && val.length > 2)
					},
					methoddetailquestion: function(val) {
						val = val.trim()
						if($I('methoddetailneeded').checked) {
							return (!!val && val.length > 5)
						} else {
							return true
						}
					},
					methodverb: function(val) {
						val = val.trim()
						return (!!val && val.length > 5)
					},
					methodrules: function(val) {
						val = val.trim()
						return (!!val && val.length > 10)
					}

				}
			},
				fields = document.querySelectorAll('#new-kill-method input, #new-kill-method textarea'),
				i = 0,
				l = fields.length,
				f;
			for(i;i<l;i++) {
				f = fields[i];
				validate.results[f.name] = false;
				switch (f.name) {
					default:
						$(f).on('keyup', function(){updateValidation()});
						break;
				}

			}

			function updateValidation() {
				var f,n,el,canSubmit=true;
				for(i=0;i<l;i++) {
					f = fields[i];
					n = validate.checks.hasOwnProperty(f.name)?f.name:'def';
					validate.results[f.name] = validate.checks[n](f.value);
				}

				for(key in validate.results) {
					el = $('#'+key);
					if(!validate.results[key]) {
						el.parent().addClass('problem')
						canSubmit = false;
					} else {
						el.parent().removeClass('problem')
					}
				}

				$I('submit-button').className = canSubmit ? '' : 'disabled';
				$I('submit-button').disabled = !canSubmit;
			}

			updateValidation();

			//Finally add the listener to the button for submitting the report
			$I('submit-button').addEventListener('click', function(e) {
				stopEvent(e)
				if(this.className.indexOf('disabled') === -1) {
					document.forms[0].submit();
				}
			}, false);


			//Setup killmethod editing
			$('.killmethod button').on('click', function(e) {
				stopEvent(e)
				$(this.parentNode).find('textarea').autogrow()
				$(this.parentNode).find('input').removeAttr('disabled')
				this.parentNode.classList.add('editing')
			})


			//Setup search
			this.search(true);
		},

		personal: function() {
			var a = [];

			a.push(
				makeColourItem($I('personal-header'), 'borderColor'),
				makeColourItem($I('personal-page'), 'borderColor')
			)


			var d = document.querySelectorAll('#details input'),
				k = d.length,
				j = 0

			for(j; j<k; j++) {
				a.push(makeColourItem(d[j], 'outlineColor'))
			}

			colourItems(a)

			//Prime colour switching area
			$('.colours [data-colour]').each(function(i, el) {
				var colour = $(this).attr('data-colour')
				if(colours.indexOf(colour) > -1) {
					console.log($(this).find('input[type=checkbox]'))
					$(this).find('input[type=checkbox]')[0].checked = true
				}
			})
			$('.colours label').on('click', function(e) {
				var checked = !($(this).siblings('input')[0].checked),
					colour = $(this).siblings('input')[0].value
				console.log(checked, colour)
				if(checked) {
					if(colours.indexOf(colour) < 0) {
						colours.push(colour)
					}
				} else {
					if(colours.length <= 1) {
						alert('You must have at least 1 interface colour!')
						stopEvent(e)
						return
					} else {
						colours = colours.filter(function(el) {
							return el !== colour
						})
					}
				}
				storeObj('bureau-colours', colours)
			})


			//Setup the editable regions with their forms
			var editButtons = document.querySelectorAll('.edit-button'),
				l = editButtons.length,
				i = 0,
				toggleEdit = function(e) {
					var container = e.target.parentNode,
						editing;

					if(container.className.indexOf('edit') === -1) {
						container.className += ' edit';
						sexyInnerHTML(e.target, 'submit request');
						editing = true;
					} else {
						switch (container.id) {
							case "details":
								var r = confirm("Are you sure you want to submit a details change request?");
								if(r) {
									container.querySelector('form').submit();
								}
								return;
								break;
						}
					}

					var inputs = container.querySelectorAll('.editable-row > input'),
						l = inputs.length,
						i = 0

					for(i;i<l && editing;i++) {
						inputs[i].disabled = '';
					}

				};

			for(i;i<l;i++) {
				editButtons[i].addEventListener('click', toggleEdit, false);
			}

			//Setup display picture changer
			$I('picture-form').onchange = function() {
				$I('picture-form').submit();
			}
		},

		updateDetails: function() {
			var a = [];

			a.push(
				makeColourItem($I('personal-header'), 'borderColor'),
				makeColourItem($I('personal-page'), 'borderColor'),
				makeColourItem(document.querySelectorAll('p')[0], 'color')
			)


			var d = document.querySelectorAll('#details input'),
				k = d.length,
				j = 0

			for(j; j<k; j++) {
				a.push(makeColourItem(d[j], 'outlineColor'))
			}

			colourItems(a)
		},

		gamegroup: function() {
			var a = [];
			colourItems(a);

			//Setup player lists and search
			this.playerListToggle(true);
			this.search();
		}
	},

	utils: {
		prettyTimestamp: function() {
			var d = new Date(),
				s = d.getFullYear()+'-'+this.date2Digits(d.getMonth()+1)+'-'+this.date2Digits(d.getDate())+' '+this.date2Digits(d.getHours())+':'+this.date2Digits(d.getMinutes())+':'+this.date2Digits(d.getSeconds());
			return s;
		},
		dateFromPrettyTimestamp: function(d) {
//			2014-01-06 06:00:00
			var parts = d.split(' '),
				dat = parts[0].split('-'),
				tim = parts[1].split(':')
				result = new Date (dat[0], dat[1]-1, dat[2], tim[0], tim[1], tim[2]);
			return result;
		},
		dateRegex: /[0-9]{4}-[0-1][0-9]-[0-3][0-9] [0-2][0-9]:[0-5][0-9]:[0-5][0-9]/,
		date2Digits: function(d) {
			d = d+'';
			return d.length>1?d:'0'+d;
		},
		getRouteFromMapsApiResult: function(r) {
			var a = r.address_components,
				route = false,
				postal_code = false;
			for(var i = 0; i < a.length;i++) {
				if(a[i].types[0] === 'route') {
					route = a[i].long_name;
				}
			}

			for(var i = 0; i < a.length;i++) {
				if(a[i].types[0] === 'postal_code') {
					postal_code = a[i].long_name;
				}
			}

			if(!!route && !!postal_code) {
				return route + ', ' + postal_code;
			} else {
				return false;
			}

		}
	}

}


//Grab saved colours
var colours = retrieveObj('bureau-colours')

//If there aren't any saved then just use the defaults
if(!colours) {
	colours = [
		'#0e83cd', //Bureau Blue
		'#f06060', //Relaxed Red
		//'#fcd04b', //Yi-Fan Yellow  <-  Not used, too light and illegible
		'#2ecc71', //Groves Green
		'#9e54bd'  //Pavan Purple
	]
	storeObj('bureau-colours', colours)
}


CHOSEN_COLOUR = colours[Math.floor(Math.random()*colours.length)];

function makeColourItem(el, p, alpha) {
	return {
		'el': el,
		'property': p,
		'alpha': alpha
	}
}

function colourItems(items) {
	if($I('toolbar')) {
		items.unshift(makeColourItem($I('toolbar'), 'borderColor'));

		//Style grabber
		var r = $I('grabber').querySelectorAll('rect');
		for(var k=0;k<r.length;k++) {
			r[k].setAttribute('fill', CHOSEN_COLOUR);
			r[k].setAttribute('rx', 1);
			r[k].setAttribute('ry', 1);
		}

	}

	var links = document.querySelectorAll('#toolbar > li > a');
	for(var i=0; i<links.length; i++) {
		items.unshift(makeColourItem(links[i], 'color'));
	}

	var notif = document.querySelectorAll('#notification');
	for(var i=0; i<notif.length; i++) {
		items.unshift(makeColourItem(notif[i], 'color'));
	}

	var containers = document.querySelectorAll('.container');
	for(i=0; i<containers.length; i++) {
		items.unshift(makeColourItem(containers[i], 'backgroundColor'));
	}

	var lightcontainers = document.querySelectorAll('.light-container');
	for(i=0; i<lightcontainers.length; i++) {
		items.unshift(makeColourItem(lightcontainers[i], 'color'));
	}

	var dropdownlists = document.querySelectorAll('.dropdown select');
	for(i=0; i<dropdownlists.length; i++) {
		items.unshift(makeColourItem(dropdownlists[i], 'border-color'));
	}

	var playercards = document.querySelectorAll('.player-card');
	for(i=0; i<playercards.length; i++) {
		items.unshift(makeColourItem(playercards[i].querySelector('.name-row'), 'color'));
		items.unshift(makeColourItem(playercards[i].querySelector('.nickname-rank'), 'borderColor'));
		items.unshift(makeColourItem(playercards[i], 'borderColor'));
	}

	var addRule = (function (style) {
	    var sheet = document.head.appendChild(style).sheet;
	    return function (selector, css) {
	        var propText = typeof css === "string" ? css : Object.keys(css).map(function (p) {
	            return p + ":" + (p === "content" ? "'" + css[p] + "'" : css[p]);
	        }).join(";");
	        sheet.insertRule(selector + "{" + propText + "}", sheet.cssRules.length);
	    };
	})(document.createElement("style"));

	addRule(".player-card *[title]::after", {
	    color: CHOSEN_COLOUR
	});


	items.unshift(makeColourItem(document.querySelector('h1'), 'color'));
	items.unshift(makeColourItem(document.querySelector('h1'), 'borderColor'));
	items.unshift(makeColourItem(document.querySelector('#notifications-title'), 'color'));
	items.unshift(makeColourItem(document.querySelector('#unread-count'), 'color'));
	items.unshift(makeColourItem(document.querySelector('#unread-count'), 'borderColor'));

	var i = 0,
		l = items.length,
		rgb = (function() {
					var j = hexToRgb(CHOSEN_COLOUR);
					return (j.r + ',' + j.g + ',' + j.b + ',');
				})();  //We just use a sneaky auto executing function to cache the RGB value. This is a cool pattern. It's a nice way to do more complicated logic in variable assignment without having to devote an entire block of your function. I'm going to nickname this "Inline self executing function variable assignment". Catchy!

	for(i;i<l;i++) {
		if(!!items[i].alpha) {
			items[i].el.style[items[i].property] = 'rgba('+rgb+items[i].alpha+')';
		} else if(!!items[i].el) {
			items[i].el.style[items[i].property] = CHOSEN_COLOUR;
		}
	}
}

// XXX time ago
function timeSince(date) {
    var seconds = Math.floor((new Date() - date) / 1000);

    var interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
        return interval + " years";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return interval + " months";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return interval + " days";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + " hours";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + " minutes";
    }
    return Math.floor(seconds) + " seconds";
}

//Store and retrieve from localStorage

function store(key, s) {
	window.localStorage.setItem(key, s)
}

function storeObj(key, stuff) {
	store(key, JSON.stringify(stuff))
}

function retrieve(key) {
	return window.localStorage.getItem(key)
}

function retrieveObj(key) {
	var item = retrieve(key)
	if(!item) {
		return
	}
	try {
		var o = JSON.parse(item)
		return o
	} catch(e) {
		return
	}
}


//Just in case a particular page doesn't care about colouring anything or have its own applyColours() method then we'll specify a default here which can be overwritten
function applyColours() {
	var a = [];

	colourItems(a);
}

//Declare this empty function to prevent errors, if we actually want to setup we do it in the specific page's .js file
function setup() {};


/* UTILITY METHODS */
function $I(id) {
	return document.getElementById(id);
}

function stopEvent(e) {
	e.preventDefault();
	e.stopPropagation();
}

function unique(arr) {
	//Reduces array to unique values
	var u = arr.reduce(function(last, current) {
		if(last.indexOf(current) < 0) {
			last.push(current)
			return last
		} else {
			return last
		}
	},[])

	return u
}


function empty(o) {
	for(var i in o) {
		if(o.hasOwnProperty(i)) {
			return false;
		}
	}

	return true;

} //courtesy of: http://starikovs.com/2010/03/10/test-for-empty-js-object/

function getTransformProperty(element) {
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
    while (p = properties.shift()) {
        if (typeof element.style[p] != 'undefined') {
            return p;
        }
    }
    return false;
} //courtesy of: http://www.zachstronaut.com/posts/2009/02/17/animate-css-transforms-firefox-webkit.html

/* Colour conversion functions */

function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r, g, b) {

	function componentToHex(c) {
	    var hex = c.toString(16);
	    return hex.length == 1 ? "0" + hex : hex;
	}

    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

/* Sexy innerHTML transition */
function sexyInnerHTML(el, t2) { //only works for letters, spaces and numbers!!!
	var t1 = el.innerHTML,
		t = t1.split(''),
		//d = duration,
		alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789 !.,?:;',
		j = 0,
		k = 0;

	var printer = new ProgressivePrinter(el, t1);

	if(t1.length>t2.length) { // Pad the beginning of t2 with spaces
		t2 = repeatStr(' ', t1.length-t2.length) + t2;
	}

	for(var i = 0; i < t2.length; i++) {
		j = (t1[i])?alphabet.indexOf(t1[i]):0;
		k = alphabet.indexOf(t2[i]);

		if(j<k) {
			for(j;j<=k;j++) {
				t[i] = alphabet[j];
				printText(t.join(''));
			}
		} else {
			for (j;j>=k;j--) {
				t[i] = alphabet[j];
				printText(t.join(''));
			}
		}
	}

	printText(t.join(''));

	function printText(text) {
		printer.queue(text);
	}

	function repeatStr(str, num) {
		return (new Array(num+1).join(str));
	}

}
/* API METHODS */

/*
	Example read: read ui_style and notifications from the settings endpoint
		apiRequest(1, 'read', 'settings', ['ui_style', 'notifications']);
*/

/*
	Example write: set the user's ui style to light
		apiRequest(1, 'write', 'settings', {
			'ui_style' : 'light'
		});
*/


function apiRequest(uid, method, api, data) {
	var j = {
		api: {
			uid: uid,
			api: api,
			method: method
		},

		data: data
	}
	var req = new XMLHttpRequest();
	req.onload = function() {
		if(this.status === 200) {
			console.log(this);
			console.log(this.responseText);
			console.log(req.responseText);
			console.log(JSON.parse(req.responseText));
		} else {
/* 			console.error(this.status, this.statusText); */
		}
	}
	req.open('POST', 'api/');
	req.setRequestHeader('Content-type', 'application/json');
	req.send(JSON.stringify(j));
}

//Setup
$(function() {
	bureau.init();
})
