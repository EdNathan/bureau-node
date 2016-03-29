const utils = require( '../utils' )

module.exports = ( Bureau ) => ( {
	get: {
		login: function( req, res ) {
			if ( !!req.session.uid || !!req.cookies.BAC ) {
				res.redirect( '/home' )
				return;
			}
			Bureau.gamegroup.getGamegroups( function( err, gamegroups ) {
				res.render( 'login', {
					loginErrors: [],
					gamegroups: gamegroups
				} )
			} )

		},
		goodbye: function( req, res ) {
			req.session.destroy()
			res.clearCookie( 'connect.sid', {
				path: '/'
			} )
			res.clearCookie( 'BAC', {
				path: '/'
			} )
			res.redirect( '/login' )
		},
		logout: function( req, res ) {
			//alias for goodbye
			res.redirect( '/goodbye' )
		},
		forgotpassword: function( req, res ) {
			res.render( 'forgotpassword' )
		},
		confirmemail: function( req, res ) {
			var email = req.query.e.toLowerCase(),
				token = req.query.t

			Bureau.register.confirmEmail( email, token, function( err, assassin ) {
				if ( err ) {
					res.locals.pageErrors = [ err ]
				}
				res.redirect( '/login' )
			} )
		},
		'views/mail/:page': function( req, res ) {
			res.render( '../mail/' + req.params.page, {
				subject: 'Testing Email'
			} )
		}
	},
	post: {
		login: function( req, res ) {
			var email = req.body.email.toLowerCase().replace( '@dur.ac.uk', '@durham.ac.uk' ),
				password = req.body.password,
				passwordconfirm = req.body.passwordconfirm,
				forename = req.body.forename,
				surname = req.body.surname,
				address = req.body.address,
				liverin = req.body.liverin == 'yes',
				course = req.body.course,
				college = req.body.college,
				gamegroup = req.body.gamegroup,
				consent = ( req.body.consent.toLowerCase() === 'i agree' ),
				rememberme = req.body.rememberme == 'yes',
				errors = []

			//Check if registering or logging in
			if ( !!passwordconfirm || !!forename || !!surname || !!address || !!course ||
				!!gamegroup || !!college || !!consent ) {
				//Registering!
				if ( !consent ) {
					errors.push( 'You must agree to the disclaimer' )
				}
				if ( !validator.isEmail( email ) ) {
					//Check to make sure they give a valid email
					errors.push( 'Invalid email address' )
				}
				if ( !password || password.length < 6 ) {
					//Check if they've entered a password
					errors.push( 'Password must be longer than 6 characters' )
				} else if ( password !== passwordconfirm ) {
					//Check if the passwords match
					errors.push( 'Passwords did not match' )
				}
				if ( forename.length < 1 ) {
					//Check to make sure they give a forename
					errors.push( 'No forename given' )
				}
				if ( surname.length < 1 ) {
					//Check to make sure they give a surname
					errors.push( 'No surname given' )
				}
				if ( address.length < 1 ) {
					//Check to make sure they give an address
					errors.push( 'No address given' )
				}
				if ( course.length < 1 ) {
					//Check to make sure they give a course
					errors.push( 'No course given, use N/A if not applicable' )
				}
				if ( !gamegroup ) {
					//Check to make sure they choose a gamegroup
					errors.push( 'No game group selected' )
				}
				if ( !college && gamegroup === 'DURHAM' ) {
					errors.push( 'No college selected' )
				}

				//Check to make sure email is not in use
				Bureau.register.emailExists( email, function( err, yes ) {
					if ( yes ) {
						errors.push( 'Email address is already in use' )
					}

					if ( errors.length === 0 ) {
						//Register a new user
						var newAssassin = {
							password: password,
							email: email,
							forename: forename,
							surname: surname,
							course: course,
							address: address,
							liverin: liverin,
							gamegroup: gamegroup
						}
						if ( gamegroup === 'DURHAM' ) {
							newAssassin.college = college
						}
						Bureau.register.registerNewAssassin( newAssassin, function( err,
							assassin ) {
							Bureau.gamegroup.getGamegroups( function( err, gamegroups ) {
								res.render( 'login', {
									success: true,
									gamegroups: gamegroups
								} )
							} )
						} )
					} else {
						Bureau.gamegroup.getGamegroups( function( err, gamegroups ) {
							res.render( 'login', {
								loginErrors: errors,
								gamegroups: gamegroups
							} )
						} )
					}

				} )
			} else if ( !!email || !!password ) {
				Bureau.register.loginAssassin( email, password, function( err, assassin ) {
					if ( !assassin ) {
						errors.push( 'Incorrect email/password combination' )
						Bureau.gamegroup.getGamegroups( function( err, gamegroups ) {
							res.render( 'login', {
								loginErrors: errors,
								gamegroups: gamegroups
							} )
						} )

					} else {
						var uid = assassin._id + ''
						if ( true ) {
							res.cookie( 'BAC', uid + 'sheepworks' + utils.md5( uid + '~' + assassin.joindate ), {
								//Set the cookie for 2 weeks
								expires: new Date( Date.now() + 3600000 * 24 * 14 ),
								httpOnly: true
							} )
						}
						req.session.uid = uid
						req.session.gamegroup = assassin.gamegroup
						req.session.assassin = assassin

						Bureau.assassin.getToken( uid, process.env.BUREAU_APP_TOKEN, ( err, token ) => {
							req.session.token = token
							res.redirect( '/home' )
						} )
					}
				} )
			}
		}
	}
} )
