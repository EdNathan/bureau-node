'use strict'

const utils = require( '../utils' )
const validator = require( 'validator' )
const _ = require( 'lodash' )

module.exports = ( Bureau ) => {
	const UnAuthedPages = {
		get: {
			login: {
				'/': ( req, res ) => {
					if ( !!req.session.uid || !!req.cookies.BAC ) {
						res.redirect( '/home' )
						return;
					}
					Bureau.gamegroup.getGamegroups( function( err, gamegroups ) {
						res.render( 'landingpage', _.merge( {
								mode: 'login',
								gamegroup: res.locals.gamegroup,
								loginErrors: [],
								gamegroups: _.map(
									_.sortBy( gamegroups, 'name' ),
									_.partialRight( _.pick, [
										'ggid',
										'academic',
										'whitelabel',
										'name'
									] )
								).filter( gg => gg.whitelabel )
							},
							res.locals ) )
					} )
				},

				':gamegroup': ( req, res ) => {
					Bureau.gamegroup.getGamegroup( req.params.gamegroup.toUpperCase(), ( err, gg ) => {
						if ( err ) {
							console.log( err )
							res.redirect( '/login' )
						} else {
							res.locals = _.merge( {
								gamegroup: gg
							}, res.locals )
							UnAuthedPages.get.login[ '/' ]( req, res )
						}
					} )
				}
			},

			register: ( req, res ) => {
				res.locals.mode = 'register'
				UnAuthedPages.get.login[ '/' ]( req, res )
			},

			'register/:gamegroup': ( req, res ) => {
				res.locals.mode = 'register'
				UnAuthedPages.get.login[ ':gamegroup' ]( req, res )
			},

			goodbye: ( req, res ) => {
				req.session.destroy()
				res.clearCookie( 'connect.sid', {
					path: '/'
				} )
				res.clearCookie( 'BAC', {
					path: '/'
				} )
				res.redirect( '/login' )
			},

			logout: ( req, res ) => {
				//alias for goodbye
				res.redirect( '/goodbye' )
			},

			forgotpassword: ( req, res ) => {
				res.render( 'forgotpassword' )
			},

			confirmemail: ( req, res ) => {
				var email = req.query.e.toLowerCase(),
					token = req.query.t

				Bureau.register.confirmEmail( email, token, ( err, assassin ) => {
					if ( err ) {
						res.locals.pageErrors = [ err ]
					}
					res.redirect( '/login' )
				} )
			},

			'views/mail/:page': ( req, res ) => {
				res.render( '../mail/' + req.params.page, {
					subject: 'Testing Email'
				} )
			}
		},
		post: {

			'login/:gamegroup': ( req, res ) => {
				const ggid = req.params.gamegroup.toUpperCase()
				const email = req.body.email.toLowerCase()
				const password = req.body.password

				let loginErrors = []

				Bureau.register.loginAssassin( email, password, ( err, assassin ) => {
					if ( err || !assassin ) {
						loginErrors.push( 'Incorrect email/password combination' )
						res.locals.loginErrors = loginErrors
						UnAuthedPages.get.login[ ':gamegroup' ]( req, res )
					} else {

						const uid = assassin._id + ''

						res.cookie( 'BAC',
							uid + 'sheepworks' +
							utils.md5( uid + '~' + assassin.joindate ), {
								//Set the cookie for 2 weeks
								expires: new Date( Date.now() + 3600000 * 24 * 14 ),
								httpOnly: true
							} )

						req.session.uid = uid
						req.session.gamegroup = assassin.gamegroup
						req.session.assassin = assassin

						Bureau.assassin.getToken( uid, process.env.BUREAU_APP_TOKEN, ( err, token ) => {
							req.session.token = token
							res.redirect( '/home' )
						} )
					}
				} )
			},

			'register/:gamegroup': ( req, res ) => {
				Bureau.gamegroup.getGamegroup( req.params.gamegroup.toUpperCase(), ( err, gg ) => {
					if ( err ) {
						console.log( err )
						res.redirect( '/register' )
						return
					}

					const isAcademic = gg.academic

					const ggid = gg.ggid

					let email = req.body.email.toLowerCase()
					let password = req.body.password
					let passwordconfirm = req.body.passwordconfirm
					let forename = req.body.forename
					let surname = req.body.surname
					let address = req.body.address
					let liverin = req.body.liverin == 'yes'
					let course = req.body.course
					let college = req.body.college
					let consent = req.body.consent

					let errors = []

					if ( !consent )
						errors.push( 'You must agree to the disclaimer' )

					if ( !validator.isEmail( email ) )
						errors.push( 'Invalid email address' )

					if ( !password || password.length < 6 ) {
						errors.push( 'Password must be longer than 6 characters' )
					} else if ( password !== passwordconfirm ) {
						errors.push( 'Passwords did not match' )
					}

					if ( forename.length < 1 )
						errors.push( 'No forename given' )

					if ( surname.length < 1 )
						errors.push( 'No surname given' )

					if ( isAcademic ) {

						if ( address.length < 1 )
							errors.push( 'No address given' )

						if ( course.length < 1 )
							errors.push( 'No course given, use N/A if not applicable' )

						if ( !college && gamegroup === 'DURHAM' )
							errors.push( 'No college selected' )
					}


					//Check to make sure email is not in use
					Bureau.register.emailExists( email, ( err, yes ) => {
						if ( yes )
							errors.push( 'Email address is already in use' )

						if ( errors.length === 0 ) {
							//Register a new user
							let newAssassin = {
								password,
								email,
								forename,
								surname,
								gamegroup: ggid
							}

							if ( isAcademic ) {
								newAssassin.course = course
								newAssassin.address = address
								newAssassin.liverin = liverin
							}

							if ( ggid === 'DURHAM' ) {
								newAssassin.college = college
							}

							Bureau.register.registerNewAssassin( newAssassin, ( err, assassin ) => {
								res.locals.register_success = true
								UnAuthedPages.get.login[ ':gamegroup' ]( req, res )
							} )
						} else {
							[
								'email',
								'forename',
								'surname',
								'address',
								'course'
							].forEach( field => res.locals[ `refilled_${field}` ] = req.body[ field ] )

							res.locals.loginErrors = errors
							UnAuthedPages.get[ 'register/:gamegroup' ]( req, res )
						}
					} )

				} )
			}
		}
	}

	return UnAuthedPages
}
