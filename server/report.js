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

	return {

		getReports: ( query, callback ) => Report.find( query, callback ),

		getProcessedReportsByGame: ( ggid, callback ) => {},
		getReport: ( reportid, callback ) => {},
		submitReport: ( uid, report, callback ) => {},
		updateReport: ( reportid, stuff, callback ) => {},
		getPendingReports: ( ggid, callback ) => {},
		getProcessedReports: ( ggid, callback ) => {},
		acceptReport: ( reportid, callback ) => {},
		rejectReport: ( reportid, comment, callback ) => {},
		fullReport: ( report, callback ) => {},
		getKillSentence: ( report ) => {}

	}
}
