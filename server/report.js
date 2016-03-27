module.exports = ( Bureau ) => {
	let mongoose = Bureau.mongoose
	let Schema = mongoose.Schema

	let _ = require( 'lodash' )

	let ReportSchema = {
		victimid: {
			type: String,
			required: true
		},
		killerid: {
			type: String,
			required: true
		},
		gameid: {
			type: String,
			required: true
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
				validator: function( val ) {
					return val && val.trim().length >= 11
				},
				message: 'A report must have text at minimum 11 characters long'
			}
		},
		place: {
			required: true,
			type: String,
			validate: {
				validator: function( val ) {
					return val && val.trim().length >= 6
				},
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
		coords: String,
		state: {
			required: true,
			type: String,
			default: 'waiting'
		},
		comment: {
			type: String,
			default: ''
		}
	}

	let Report = mongoose.model( 'Report', ReportSchema )

	let mongooseErrorsToString = function( err ) {
		return _.map( err.errors, function( e ) {
			return e.message
		} ).join( ' ' )
	}

	let _Report = {

		getReports: ( query, callback ) => Report.find( query, callback ),

		getReport: ( reportId, callback ) => Report.findById( reportId, callback ),


		getProcessedReportsByGame: ( ggid, callback ) => {},
		submitReport: ( uid, report, callback ) => {},
		updateReport: ( reportId, stuff, callback ) => {},
		getPendingReports: ( ggid, callback ) => {
			Bureau.game.getGameIdsInGamegroup( ggid, ( err, gameids ) => {
				if ( err ) {
					callback( err, [] )
					return
				}
				Report.find( {
					gameid: {
						$in: gameids
					},
					state: 'waiting'
				}, callback )
			} )
		},
		acceptReport: ( reportId, callback ) => {},
		rejectReport: ( reportId, comment, callback ) => {},

		getFullReport: ( reportId, callback ) => {
			_Report.getReport( reportId, ( err, report ) => {
				if ( err ) {
					callback( err, null )
					return
				}

				_Report.makeFullReport( report, callback )
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
			return ( verb
				.replace( '#v', utils.fullname( victim ) )
				.replace( '#k', utils.fullname( killer ) )
				.replace( '#d', report.methoddetail ) )
		}

	}

	return _Report
}
