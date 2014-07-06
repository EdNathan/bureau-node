var Bureau = require('./bureau'),
	utils = require('./utils'),
	passwords = password = require('./passwords'),
	express = require('express'),
	cons = require('consolidate'),
	swig = require('swig'),
	gm = require('gm'),
	AWS = require('aws-sdk'),
	fs = require('fs'),
	app = express(),
	validator = require('validator'),
	MongoStore = require('connect-mongo')(express)

var pages = {
		get: {
			login: function (req, res) {
				if(!!req.session.uid || !!req.cookies.BAC) {
					res.redirect('/home')
					return;
				}
				Bureau.gamegroup.getGamegroups(function(err, gamegroups) {
					res.render('login', {
						loginErrors: [],
						gamegroups: gamegroups
					})
				})
				
			},
			goodbye: function(req, res) {
				req.session.destroy()
				res.clearCookie('connect.sid', { path: '/' })
				res.clearCookie('BAC', { path: '/' })
				res.redirect('/login')
			},
			logout: function(req, res) {
				//alias for goodbye
				pages.get.goodbye(req, res)
			}
		},
		post: {
			login: function (req, res) {
				var email = req.body.email.replace('@dur.ac.uk', '@durham.ac.uk'),
					password = req.body.password,
					passwordconfirm = req.body.passwordconfirm,
					forename = req.body.forename,
					surname = req.body.surname,
					address = req.body.address,
					liverin = req.body.liverin == 'yes',
					course = req.body.course,
					college = req.body.college,
					gamegroup = req.body.gamegroup,
					consent = (req.body.consent.toLowerCase() === 'i agree'),
					rememberme = req.body.rememberme == 'yes',
					errors = []
					
				//Check if registering or logging in
				if(!!passwordconfirm || !!forename || !!surname || !!address || !!course || !!gamegroup || !!college || !!consent) {
					//Registering!
					if(!consent) {
						errors.push('You must agree to the disclaimer')
					}
					if(!validator.isEmail(email)) {
					//Check to make sure they give a valid email
						errors.push('Invalid email address')
					}
					if(!password || password.length < 6) {
					//Check if they've entered a password
						errors.push('Password must be longer than 6 characters')
					} else if(password !== passwordconfirm) {
					//Check if the passwords match
						errors.push('Passwords did not match')
					}
					if(forename.length < 1) {
					//Check to make sure they give a forename
						errors.push('No forename given')
					}
					if(surname.length < 1) {
					//Check to make sure they give a surname
						errors.push('No surname given')
					}
					if(address.length < 1) {
					//Check to make sure they give an address
						errors.push('No address given')
					}
					if(course.length < 1) {
					//Check to make sure they give a course
						errors.push('No course given, use N/A if not applicable')
					}
					if(!gamegroup) {
					//Check to make sure they choose a gamegroup
						errors.push('No game group selected')
					}
					if(!college && gamegroup === 'DURHAM') {
						errors.push('No college selected')
					}
					
					//Check to make sure email is not in use
					Bureau.register.emailExists(email, function(err, yes) {
						if(yes) {
							errors.push('Email address is already in use')
						}
						
						if(errors.length === 0) {
						//Register a new user
							var newAssassin = {
								password: utils.md5(password),
								email: email,
								forename: forename,
								surname: surname,
								course: course,
								address: address,
								liverin: liverin,
								gamegroup: gamegroup
							}
							if(gamegroup === 'DURHAM') {
								newAssassin.college = college
							}
							Bureau.register.registerNewAssassin(newAssassin, function(err, assassin) {
								
								/*
								
									TODO:
									Send email on successful signup
									
								*/
								Bureau.gamegroup.getGamegroups(function(err, gamegroups) {
									res.render('login', {
										success: true,
										gamegroups: gamegroups
									})
								})
							})
						} else {
							Bureau.gamegroup.getGamegroups(function(err, gamegroups) {
								res.render('login', {
									loginErrors: errors,
									gamegroups: gamegroups
								})
							})
						}
						
					})
				
				} else if(!!email || !!password) {
					Bureau.register.loginAssassin(email, password, function(err, assassin) {
						if(!assassin) {
							errors.push('Incorrect email/password combination')
							Bureau.gamegroup.getGamegroups(function(err, gamegroups) {
								res.render('login', {
									loginErrors: errors,
									gamegroups: gamegroups
								})
							})
							
						} else {
							var uid = assassin._id
							if(rememberme) {
								res.cookie('BAC', uid+'sheepworks'+utils.md5(uid+'~'+assassin.joindate), {
									//Set the cookie for 2 weeks
									expires: new Date(Date.now() + 3600000*24*14),
									httpOnly: true
								})
							}
							req.session.uid = uid
							req.session.gamegroup = assassin.gamegroup
							req.session.assassin = assassin
							req.session.token = utils.md5(assassin.joindate + password.tokenSecret)
							res.redirect('/home')
						}
					})
				}
			}
		}
	
	},

	authPages = {
		get: {
			home: function (req, res) {
				res.render('home')
			},
			personal: function(req, res) {
				var uid = req.session.uid
				Bureau.assassin.getAssassin(uid, function(err, assassin) {
					Bureau.assassin.stats(uid, function(err, stats) {
						Bureau.assassin.getLethality(uid, function(err, lethality) {
							Bureau.assassin.hasDetailsChangeRequest(uid, function(err, hasRequest) {
								if(hasRequest) {
									for(var key in assassin.detailsChangeRequest) {
										assassin[key] = assassin.detailsChangeRequest[key]
									}
								}
								res.render('personal', {
									assassin: assassin,
									lethality: lethality,
									detailspending: hasRequest,
									stats: stats
								})
							})
						})
					})
				})
				
			},
			admin: {
				'/': function(req, res) {
					if(!res.locals.isAdmin) {
						res.redirect('/home')
						return
					}
					Bureau.gamegroup.getGamegroups(function(err, ggs) {
						res.render('admin', {
							ggs: ggs
						})
					})
				},
				
				':gamegroup': function(req, res) {
					if(!res.locals.isAdmin) {
						res.redirect('/home')
						return
					}
					var ggid = req.params.gamegroup.toUpperCase()
					Bureau.gamegroup.getGamegroup(ggid, function(err, gg) {
						
						if(err) {
							res.write('No such gamegroup!')
							return;
						}
						Bureau.gamegroup.getAssassins(ggid, function(err, assassins) {
							res.render('gamegroup', {
								gg: gg,
								assassins: assassins
							})
						})
					})
					
				}
				
			},
			
			guild: {
				'/': function(req, res) {
					if(!res.locals.isGuild) {
						res.redirect('/home')
						return
					}
					Bureau.assassin.getAssassins({'detailsChangeRequest.state':'waiting'}, function(err, addressChangeRequests) {
						Bureau.gamegroup.getAssassins(res.locals.gamegroup.ggid, function(err, members) {
							res.render('guild', {
								addressChangeRequests: addressChangeRequests,
								members: members
							})
						})
					})
				},
				
				killmethods: function(req, res) {
					if(!res.locals.isGuild) {
						res.redirect('/home')
						return
					}
					res.render('killmethods', {
						
					})
				}
			}
		},
		post: {
			admin: {
				'/': function(req, res) {
					if(!res.locals.isAdmin) {
						res.redirect('/home')
						return
					}
					switch(req.body.action) {
						case 'newgamegroup':
							var ggname = req.body.name
							if(!!ggname) {
								Bureau.gamegroup.addGamegroup({
									name: ggname,
									ggid: ggname.replace(/[^\w\s]|_/g, "").replace(/\s+/g, "").toUpperCase()
								}, function(err, gg) {
									authPages.get.admin['/'](req,res)	
								})
							} else {
								authPages.get.admin['/'](req,res)
							}
							break;
					}
				},
				
				':gamegroup': function(req, res) {
					switch(req.body.action) {
						case 'changeguild':
							var uid = req.body.assassinuid,
								shouldBeGuild = req.body.shouldBeGuild === 'yes'
							Bureau.assassin.setGuild(uid, shouldBeGuild, function(err, doc) {
								authPages.get.admin[':gamegroup'](req, res)
							})
					}
				}
			},
			
			personal: function(req, res) {
				switch(req.body.action) {
					case 'picturechange':
						var imgPath = req.files.picture.path,
							uid = req.session.uid
						gm(imgPath).size(function(err, size) {
							if(!err && !!size) {
								var w = size.width > size.height ? Math.floor(size.width*128/size.height) : 128,
									tempName = __dirname + '/temp/'+utils.md5(new Date().toString() + Math.random().toString())+'.jpg'
								this								
								.resize(w)
								.gravity('Center')
								.extent(128, 128)
								.quality(70)
								.write(tempName, function (err) {
									if(err) throw err;
									fs.readFile(tempName, function (err, data) {
										if(err) {
											throw err
										} else {
											var s3 = new AWS.S3(),
												bucket = 'bureau-engine',
												imgKey = 'pictures/'+uid+'.jpg'
											s3.putObject({
												ACL: 'public-read', // by default private access
												Bucket: bucket,
												Key: imgKey,
												Body: data
											}, function (err, data) {
												if (err) {
													console.log(err)
													res.send(500, 'Image uploading failed :(')
												} else {
													Bureau.assassin.setPicture(uid, passwords.awsPath+imgKey, function(err, doc) {
														if(err) console.log(err);
														authPages.get.personal(req, res)
													})
													
												}
											})
										}
									})
								})
							} else {
								authPages.get.personal(req, res)
							}
						})
						break;
					case 'detailschange':
						Bureau.assassin.hasDetailsChangeRequest(req.session.uid, function(err, hasRequest) {
							if(!hasRequest) {
								Bureau.assassin.submitDetailsChangeRequest(req.session.uid, req.body, function(err, doc) {
									authPages.get.personal(req, res)
								})
							} else {
								res.send('Error! You already have a pending address request')
							}
						})
						break;
					default:
						authPages.get.personal(req, res)
						break;
				}
				
			},
			
			guild: {
				'/': function(req, res) {
					if(!res.locals.isGuild) {
						res.redirect('/home')
						return
					}
					switch(req.body.action) {
						case 'setmotd':
							var motd = req.body.motd
							console.log('setting motd for '+res.locals.gamegroup.ggid+' to ' + motd)
							Bureau.gamegroup.setMotd(res.locals.gamegroup.ggid, motd, function(err, doc) {
								if(!err) {
									//Manually update the locals, otherwise they'll have the previous value
									res.locals.gamegroup = doc
								}
								authPages.get.guild['/'](req, res)
							})
							break;
						case 'addresschange':
							var uid = req.body.requester,
								state = req.body.state,
								message = req.body.message
							
							if(!state) {
								authPages.get.guild['/'](req, res)
								return
							}
							Bureau.assassin.getAssassin(uid, function(err, assassin) {
								if(state == 'Approved') {
									//Change the details around
									Bureau.assassin.getAssassin(uid, function(err, assassin) {
										var d = assassin.detailsChangeRequest
										delete d.state
										delete d.submitted
										d.detailsChangeRequest = {}
										Bureau.assassin.updateAssassin(uid, d, function(err, assassin) {
											Bureau.assassin.addNotification(uid, 'Your details change request was approved.')
											authPages.get.guild['/'](req, res)
										})
									})
								} else {
									//Delete the request
									Bureau.assassin.updateAssassin(uid, {detailsChangeRequest:{}}, function(err, doc) {
										var notificationString = 'Your details change request was rejected'
										if(!!message) {
											notificationString += ' with reason: '+message
										}
										Bureau.assassin.addNotification(uid, notificationString)
										authPages.get.guild['/'](req, res)
									})
								}
							})
							
							break;
						default:
							authPages.get.guild['/'](req, res)
							break;
							
					}
				},
				
				killmethods: function(req, res) {
					if(!res.locals.isGuild) {
						res.redirect('/home')
						return
					}
					switch(req.body.action) {
						case 'newkillmethod':
							var name = req.body.methodname,
								zone = req.body.methodzone,
								hasDetail = req.body.methoddetailneeded,
								detail = req.body.methoddetailquestion,
								verb = req.body.methodverb,
								rules = req.body.methodrules,
								errs = []								
							
							if(!name || name.trim().length < 3) {
								errs.push('Invalid name specified')
							}
							if(!zone) {
								errs.push('No zone specified')
							}
							if(hasDetail && (!detail || detail.trim().length < 6)) {
								errs.push('No detail question specified!')
							}
							if(!verb || verb.trim().length < 6) {
								errs.push('Invalid kill sentence!')
							} else if(verb.indexOf('#k') < 0) {
								errs.push('Add #k to your kill sentence so the killer shows up!')
							} else if(verb.indexOf('#v') < 0) {
								errs.push('Add #v to your kill sentence so the victim shows up!')
							} else if(hasDetail && verb.indexOf('#d') < 0) {
								errs.push('Add #d to your kill sentence so the detail shows up!')
							}
							if(!rules || rules.trim().length < 11) {
								errs.push('Please specify rules')
							}
							
							res.locals.pageErrors = errs
							
							if(errs.length > 0) {
								authPages.get.guild.killmethods(req, res)
								return
							}
							
							var method = {
									id: name.toLowerCase().replace(/\s+/, ''),
									name: name.trim(),
									zone: zone.trim(),
									verb: verb.trim(),
									rules: rules.trim()
								}
							if(hasDetail) {
								method.detailquestion = detail.trim()
							}
							
							Bureau.gamegroup.addKillMethod(res.locals.gamegroup.ggid, method, function(err, methods) {
								if(err) {
									res.locals.pageErrors.push('Error adding the new killmethod "'+name+'": '+err)
								} else {
									res.locals.gamegroup.killmethods = methods
								}
								authPages.get.guild.killmethods(req, res)
							})
							
							break;
						case 'editkillmethod':
							var id = req.body.methodid,
								detail = req.body.methoddetailquestion,
								verb = req.body.methodverb,
								rules = req.body.methodrules,
								errs = []
							
							Bureau.gamegroup.getKillMethod(res.locals.gamegroup.ggid, id, function(err, method) {
								if(err) {
									res.locals.pageErrors.push('Invalid kill method id')
									authPages.get.guild.killmethods(req, res)
									return
								} else {
									var hasDetail = !!method.detailquestion
									
									if(hasDetail && (!detail || detail.trim().length < 6)) {
										errs.push('No detail question specified!')
									}
									if(!verb || verb.trim().length < 6) {
										errs.push('Invalid kill sentence!')
									} else if(verb.indexOf('#k') < 0) {
										errs.push('Add #k to your kill sentence so the killer shows up!')
									} else if(verb.indexOf('#v') < 0) {
										errs.push('Add #v to your kill sentence so the victim shows up!')
									} else if(hasDetail && verb.indexOf('#d') < 0) {
										errs.push('Add #d to your kill sentence so the detail shows up!')
									}
									if(!rules || rules.trim().length < 11) {
										errs.push('Please specify rules')
									}
									res.locals.pageErrors = errs
									
									if(errs.length > 0) {
										authPages.get.guild.killmethods(req, res)
										return
									}
									
									
									var m = {
										verb: verb,
										rules: rules
									}
									
									if(hasDetail) {
										m.detailquestion = detail
									}
									
									console.log(m)
									
									Bureau.gamegroup.updateKillMethod(res.locals.gamegroup.ggid, id, m, function(err, methods) {
										if(err) {
											res.locals.pageErrors.push('Error editing the killmethod "'+method.name+'": '+err)
										} else {
											res.locals.gamegroup.killmethods = methods
										}
										authPages.get.guild.killmethods(req, res)
									})
								}
								
							})
							
							break;
							
						default:
							authPages.get.guild.killmethods(req, res)
							break;
					}
				}
			},
			
			api: {
				read: {
					notifications: function(req, res) {
						var uid = req.body.uid,
							limit = req.body.data.limit
						Bureau.assassin.getNotifications(uid, limit, function(err, notifications) {
							res.json({
								notifications: notifications
							})
						})
					}
				},
				write: {
					readNotification: function(req, res) {
						var uid = req.body.uid,
							id = req.body.data.id

						Bureau.assassin.markNotificationRead(uid, id, function(err) {
							Bureau.assassin.getNotifications(uid, 20, function(err, notifications) {
								res.json({
									notifications: notifications
								})
							})
						})
					}
				}
			}
		}
	},
	authURLS = []



//Setup middleware
app.use(express.compress())
app.use(express.static('static'))
app.use(express.bodyParser())
app.use(express.cookieParser(password.cookieSecret))
app.use(express.session({
	store: new MongoStore({
		url: utils.mongourl()
	}),
	secret: password.cookieSecret,
	cookie: {
		expires: new Date(Date.now() + 60*60*24*60)
	}
}))

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
//app.set('view cache', false);
swig.setDefaults({
	cache: false
});

//For authed pages
function checkAuth(req, res, next) {
	if(!!req.cookies.BAC && (!req.session.uid || !req.session.gamegroup || !req.session.token)) {
		var parts = req.cookies.BAC.split('sheepworks'),
			cUID = parts[0],
			cTOK = parts[1]
		
		Bureau.assassin.getSalt(cUID, function(err, salt) {
			if(cTOK === salt) {
				Bureau.assassin.getAssassin(cUID, function(err, assassin) {
					req.session.uid = assassin._id+'' //Force it to be a string so we don't get crashes...
					req.session.gamegroup = assassin.gamegroup
					req.session.assassin = assassin
					req.session.token = utils.md5(assassin.joindate + password.tokenSecret)
					next()
				})
			} else {
				res.redirect('/goodbye')
			}
		})
	} else if(!req.session.uid || !req.session.gamegroup || !req.session.token) {
		res.redirect('/goodbye')
	} else {
		next()
	}
//	next()
}

function addLocals(req, res, next) {
	Bureau.assassin.getAssassin(req.session.uid, function(err, assassin) {
		Bureau.gamegroup.getGamegroup(req.session.gamegroup, function(err, gamegroup) {
			//Update when we last saw them
			Bureau.assassin.updateLastHere(req.session.uid)
		
			res.locals.isGuild = assassin.guild
			res.locals.isAdmin = password.adminEmails.indexOf(assassin.email) > -1
			res.locals.uid = req.session.uid
			res.locals.gamegroup = gamegroup
			res.locals.token = req.session.token
			res.locals.assassin = assassin
			res.locals.pageErrors = []
			next()
		})
	})
}

//For post requests
function checkToken(req, res, next) {
	var seshtoken = req.session.token,
		formtoken = req.body.token

	if(!seshtoken) { 
		res.send('Error! No session token :( Try <a href="/goodbye">logging in again</a>.')
    } else if(!formtoken) {
		res.send('Error! No authentication. Nice hax bro.')
    } else if (seshtoken !== formtoken) {
		res.send('Error! Invalid authentication.')
    } else {
		next()
	}
}

app.get('/', checkAuth, function (req, res) {
	res.redirect('/home')
})

app.map = function (a, route, method, auth) { //Returns an array of mapped urls
	route = route || ''
	for (var key in a) {
		switch (typeof a[key]) {
		case 'object':
			app.map(a[key], route + '/' + key, method, auth)
			break
		case 'function':
			var glue = '/'
			if(key === '/') {
				key = glue = ''
			}
			if(auth && method == 'post') {
				app[method](route+glue+key, checkAuth, addLocals, checkToken, a[!key?'/':key])
			} else if(auth) {
				app[method](route+glue+key, checkAuth, addLocals, a[!key?'/':key])
			} else {
				app[method](route+glue+key, a[!key?'/':key])
			}
			break
		}
	}
}

for(var method in pages) {
	if(pages.hasOwnProperty(method)) {
		app.map(pages[method], '', method)
	}
}

for(var method in authPages) {
	if(authPages.hasOwnProperty(method)) {
		app.map(authPages[method], '', method, true)
	}
}

//Handle 404
app.use(function (req, res, next) {
	res.send(404, 'Hello yes this is dog.<br><br>Dog cannot find your page :(')
})

Bureau.init(function (err, db) {
	if (err) throw err;

	var port = (process.env.VMC_APP_PORT || 3000);
	var host = (process.env.VCAP_APP_HOST || 'localhost');
	app.listen(port, host)
})