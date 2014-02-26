var Bureau = require('./bureau'),
	utils = require('./utils'),
	password = require('./passwords'),
	express = require('express'),
	cons = require('consolidate'),
	swig = require('swig'),
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
				res.render('login', {
					loginErrors: []
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
								
								res.render('login', {
									success: true
								})
							})
						} else {
							res.render('login', {
								loginErrors: errors
							})
						}
						
					})
				
				} else if(!!email || !!password) {
					Bureau.register.loginAssassin(email, password, function(err, assassin) {
						if(!assassin) {
							errors.push('Incorrect email/password combination')
							res.render('login', {
								loginErrors: errors
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
				res.render('template')
			},
			echo: {
				':id': function (req, res) {
					res.send(req.params.id+'<br>'+req.subdomains.toString())
				}
			}
		},
		post: {
		
		}
	},
	authURLS = []



//Setup middleware
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
	if(!!req.cookies.BAC && (!req.session.uid || !req.session.gamegroup)) {
		var parts = req.cookies.BAC.split('sheepworks'),
			cUID = parts[0],
			cTOK = parts[1]
		
		Bureau.assassin.getSalt(cUID, function(err, salt) {
			if(cTOK === salt) {
				Bureau.assassin.getAssassin(cUID, function(err, assassin) {
					req.session.uid = assassin._id
					req.session.gamegroup = assassin.gamegroup
					res.locals.isGuild = assassin.guild
					next()
				})
			} else {
				res.redirect('/goodbye')
			}
		})
	} else if(!req.session.uid || !req.session.gamegroup) {
		res.redirect('/goodbye')
	} else {
		Bureau.assassin.isGuild(req.session.uid, function(err, guild) {
			res.locals.isGuild = guild
			next()
		})
	}
//	next()
}

app.get('/', function (req, res) {
	res.send('Hello yes, this is dog');
})

app.map = function (a, route, method, auth) { //Returns an array of mapped urls
	route = route || ''
	for (var key in a) {
		switch (typeof a[key]) {
		case 'object':
			app.map(a[key], route + '/' + key, method)
			break
		case 'function':
			if(auth) {
				app[method](route+'/'+key, checkAuth, a[key])
			} else {
				app[method](route+'/'+key, a[key])
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