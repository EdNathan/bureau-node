'use strict'

module.exports = ( Bureau ) => {
	let mongoose = Bureau.mongoose
	let Schema = mongoose.Schema

	let _ = require( 'lodash' )
	let utils = require( '../utils' )

	const REPORT_STATES = {
		APPROVED: 'approved',
		REJECTED: 'rejected',
		WAITING: 'waiting'
	}

	let ReportSchema = {
		victimid: {
			type: String,
			required: true,
			index: true
		},
		killerid: {
			type: String,
			required: true,
			index: true
		},
		gameid: {
			type: String,
			required: true,
			index: true
		},
		submitted: {
			required: true,
			type: Date
		},
		time: {
			required: true,
			type: Date
		},
		text: {
			required: true,
			type: String,
			validate: {
				validator: ( val ) => val && val.trim().split( /[, ]+/g ).filter( s => s ).length >= 10,
				message: 'A report must contain at least 10 words'
			}
		},
		place: {
			required: true,
			type: String,
			validate: {
				validator: ( val ) => val && val.trim().length >= 6,
				message: 'A report must have a place at minimum 6 characters long'
			}
		},
		killmethod: {
			type: String,
			required: true
		},
		methoddetail: {
			type: String,
			default: ''
		},
		coords: {
			type: [ Number ],
			sparse: '2dsphere',
			get: ( val ) => val.reverse().join( ', ' )
		},
		state: {
			required: true,
			type: String,
			default: REPORT_STATES.WAITING,
			index: true
		},
		comment: {
			type: String,
			default: ''
		}
	}

	let Report = mongoose.model( 'Report', ReportSchema )

	let mongooseErrorsToString = err => _.map( err.errors, e => e.message ).join( ' ' )

	let _Report = {

		getReports: ( query, callback ) => Report.find( query, utils.objectifyCallback( callback ) ),

		getReport: ( reportId, callback ) => Report.findById( reportId, ( err, report ) => {

			if ( err || !report ) {
				callback( 'No report exists with that ID' )
				return
			}

			utils.objectifyCallback( callback )( null, report )
		} ),

		getReportsFromGame: ( gameid, callback ) => {
			Bureau.game.getGame( gameid, ( err, game ) => {
				if ( err ) {
					callback( err, {} )
					return
				}
				_Report.getReports( {
					gameid
				}, callback )
			} )
		},

		getProcessedReportsInCurrentGames: ( ggid, callback ) => {

			Bureau.game.getCurrentGames( ggid, ( err, games ) => {

				if ( err ) {
					callback( err, [] )
					return
				}

				const gameids = Object.keys( games )

				_Report.getReports( {
					gameid: {
						$in: gameids
					},
					state: {
						$ne: REPORT_STATES.waiting
					}
				}, ( err, reports ) => {

					let idMap = {},
						numReports = reports.length,
						doneReports = 0,
						reportLoaded = () => {
							if ( ++doneReports === numReports ) {
								callback( null, Bureau.game.toArray( games ) )
							}
						}


					gameids.forEach( ( gid, i ) => {
						games[ gid ].reports = []
					} )

					reports.forEach( r => {
						_Report.makeFullReport( r, ( err, report ) => {
							var game = games[ report.gameid ]
							if ( game ) {
								game.reports.push( report )
							}
							reportLoaded()
						} )
					} )

					if ( numReports < 1 ) {
						callback( null, Bureau.game.toArray( games ) )
					}


				} )
			} )
		},

		submitReport: ( data, callback ) => {

			if ( data.hasOwnProperty( '_id' ) ) {
				delete data._id;
			}

			if ( !data || _.isEmpty( data ) || !_.isPlainObject( data ) ) {
				callback( 'Invalid or no data object supplied to create report' )
				return
			}

			data.submitted = new Date()
			data.state = REPORT_STATES.WAITING

			if ( data.coords && data.coords.split( ',' ).length == 2 ) {
				data.coords = data.coords.split( ',' ).map( ( n ) => Number( n.trim() ) ).reverse()
			}

			Bureau.game.getGame( data.gameid, ( err, game ) => {
				if ( err && _.isEmpty( game ) ) {
					callback( err, {} )
					return
				}
				_Report._createReport( data, callback )
			} )
		},

		_createReport: ( data, callback ) => {
			let report = new Report( data )

			report.save( ( err, report ) => {
				if ( err ) {
					callback( err, {} )
					return
				}
				Bureau.assassin.getAssassin( data.victimid, ( err, victim ) => {
					if ( err ) {
						callback( err, {} )
						return
					}
					Bureau.game.getGame( data.gameid, ( err, game ) => {
						if ( err ) {
							callback( err, {} )
							return
						}
						let notif = `Your report on ${utils.fullname( victim )} in the game ${game.name} has been submitted`
						Bureau.assassin.addNotification( data.killerid, notif )
						callback( null, report )
					} )

				} )
			} )
		},

		updateReport: ( reportId, stuff, callback ) => {
			delete stuff.submitted
			delete stuff.killerid
			delete stuff.victimid

			Report.findByIdAndUpdate( reportId, {
				$set: stuff
			}, ( err, report ) => {

				if ( err ) {
					callback( err )
					return
				}

				Report.findById( reportId, utils.objectifyCallback( callback ) )

			} )
		},

		getPendingReports: ( ggid, callback ) => {
			Bureau.game.getGameIdsInGamegroup( ggid, ( err, gameids ) => {
				if ( err ) {
					callback( err, [] )
					return
				}
				_Report.getReports( {
					gameid: {
						$in: gameids
					},
					state: REPORT_STATES.WAITING
				}, callback )
			} )
		},

		acceptReport: ( reportId, callback ) => {
			_Report.updateReport( reportId, {
				state: REPORT_STATES.APPROVED
			}, callback )
		},

		rejectReport: ( reportId, comment, callback ) => {
			_Report.updateReport( reportId, {
				state: REPORT_STATES.REJECTED,
				comment: comment
			}, callback )
		},

		getFullReport: ( reportId, callback ) => {
			_Report.getReport( reportId, ( err, report ) => {
				if ( err ) {
					callback( err, null )
					return
				}

				_Report.makeFullReport( report, callback )
			} )
		},

		getFullReports: ( query, callback ) => {
			_Report.getReports( query, ( err, reports ) => {
				if ( err ) {
					callback( err, null )
					return
				}

				_Report.makeFullReports( reports, callback )

			} )
		},

		getFullReportsFromGame: ( ggid, callback ) => {
			_Report.getReportsFromGame( ggid, ( err, reports ) => {
				if ( err ) {
					callback( err )
					return
				}
				_Report.makeFullReports( reports, callback )
			} )
		},

		getFullPendingReports: ( ggid, callback ) => {
			_Report.getPendingReports( ggid, ( err, reports ) => {
				if ( err ) {
					callback( err )
					return
				}
				_Report.makeFullReports( reports, callback )
			} )
		},

		makeFullReport: ( report, callback ) => {
			Bureau.assassin.getAssassin( report.killerid, ( err, killer ) => {
				report.killer = killer
				Bureau.assassin.getAssassin( report.victimid, ( err, victim ) => {
					report.victim = victim
					Bureau.gamegroup.getKillMethod( killer.gamegroup, report.killmethod, ( err, killmethod ) => {
						report.killmethod = killmethod
						report.sentence = Bureau.report.makeKillSentenceFromFullReport( report )
						callback( null, report )
					} )
				} )
			} )
		},

		makeFullReports: ( reports, callback ) => {
			let fullReports = []
			let stopped = false

			let done = () => {
				if ( fullReports.length === reports.length ) {
					callback( null, fullReports )
				}
			}

			reports.forEach( ( report ) => {
				_Report.makeFullReport( report, ( err, fullReport ) => {
					if ( stopped ) {
						return
					}
					if ( err ) {
						callback( err, [] )
						stopped = true
						return
					}
					fullReports.push( report )
					done()
				} )
			} )
		},

		getKillSentence: ( reportId, callback ) => {
			_Report.getFullReport( reportId, ( err, fullReport ) => {
				if ( err ) {
					callback( err, null )
				} else {
					callback( err, _Report.makeKillSentenceFromFullReport( fullReport ) )
				}
			} )
		},

		makeKillSentenceFromFullReport: ( report ) => {
			let killmethod = report.killmethod,
				verb = killmethod ? killmethod.verb : '',
				killer = report.killer,
				victim = report.victim

			let sentence = verb
				.replace( '#v', utils.fullname( victim ) )
				.replace( '#k', utils.fullname( killer ) )
				.replace( '#d', report.methoddetail )
			return sentence
		},

		STATES: REPORT_STATES

	}

	return _Report
}
