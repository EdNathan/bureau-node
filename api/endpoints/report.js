'use strict'

const _ = require( 'lodash' )
const utils = require( '../../utils' )



module.exports = ( Bureau ) => {

	const gamegroupFromUid = ( uid, callback ) => {
		Bureau.assassin.getAssassin( uid, ( err, assassin ) => {
			if ( err ) {
				callback( err, null )
			} else {
				callback( null, assassin.gamegroup )
			}
		} )
	}

	const gamegroupFromReportId = ( reportId, callback ) => {

		Bureau.report.getReport( reportId, ( err, report ) => {
			if ( err ) {
				callback( err )
				return
			}
			gamegroupFromUid( report.killerid, callback )
		} )
	}

	const checkReportPermission = ( reportId, uid, callback ) => {

		gamegroupFromReportId( reportId, ( err, reportGroup ) => {
			if ( err ) {
				callback( err )
				return
			}
			gamegroupFromUid( uid, ( err, userGroup ) => {
				if ( err ) {
					callback( err )
					return
				}
				if ( reportGroup !== userGroup ) {
					callback( 'You do not have permission to view that report' )
				} else {
					callback( null )
				}
			} )
		} )

	}

	const filterReportsByUid = ( uid, reports, callback ) => {
		gamegroupFromUid( uid, ( err, ggid ) => {
			if ( err ) {
				callback( err )
				return
			}
			filterReportsInGamegroup( ggid, reports, callback )
		} )
	}

	const filterReportsInGamegroup = ( ggid, reports, callback ) => {
		Bureau.game.getGameIdsInGamegroup( ggid, ( err, gameids ) => {
			if ( err ) {
				callback( err, null )
			} else {
				callback( null, reports.filter( ( r ) => _.includes( gameids, r.gameid ) ) )
			}
		} )
	}

	const transformFullReport = ( fullReport ) => {
		fullReport.killer = utils.projectAssassin( fullReport.killer )
		fullReport.victim = utils.projectAssassin( fullReport.victim )
		return fullReport
	}

	return {

		'getReport/:reportId': ( data, params, callback ) => {
			let reportId = params.reportId

			checkReportPermission( reportId, data.USER_ID, ( err ) => {
				if ( err ) {
					callback( err )
					return
				}
				Bureau.report.getReport( reportId, callback )
			} )
		},

		'getFullReport/:reportId': ( data, params, callback ) => {
			let reportId = params.reportId

			checkReportPermission( reportId, data.USER_ID, ( err ) => {
				if ( err ) {
					callback( err )
					return
				}
				Bureau.report.getFullReport( reportId, ( err, fullReport ) => {
					if ( err ) {
						callback( err )
						return
					}

					callback( null, transformFullReport( fullReport ) )
				} )
			} )
		},

		getReports: ( data, params, callback ) => {

			Bureau.report.getReports( data.query, ( err, reports ) => {
				if ( err ) {
					callback( err )
					return
				}

				filterReportsByUid( data.USER_ID, reports, callback )

			} )
		},

		getFullReports: ( data, params, callback ) => {

			Bureau.report.getFullReports( data.query, ( err, fullReports ) => {
				if ( err ) {
					callback( err )
					return
				}

				filterReportsByUid( data.USER_ID, fullReports.map( transformFullReport ), callback )

			} )
		},

		'getReportsFromGame/:gameid': ( data, params, callback ) => {

			Bureau.report.getReportsFromGame( params.gameid, ( err, reports ) => {
				if ( err ) {
					callback( err )
					return
				}

				filterReportsByUid( data.USER_ID, reports, callback )

			} )
		},

		'getFullReportsFromGame/:gameid': ( data, params, callback ) => {

			Bureau.report.getFullReportsFromGame( params.gameid, ( err, fullReports ) => {
				if ( err ) {
					callback( err )
					return
				}

				filterReportsByUid( data.USER_ID, fullReports.map( transformFullReport ), callback )

			} )
		},

		getPendingReports: ( data, params, callback ) => {
			gamegroupFromUid( data.USER_ID, ( err, ggid ) => {
				if ( err ) {
					callback( err )
					return
				}
				Bureau.report.getPendingReports( ggid, callback )
			} )
		},

		getFullPendingReports: ( data, params, callback ) => {
			gamegroupFromUid( data.USER_ID, ( err, ggid ) => {
				if ( err ) {
					callback( err )
					return
				}
				Bureau.report.getFullPendingReports( ggid, ( err, fullReports ) => {
					if ( err ) {
						callback( err )
						return
					}
					callback( null, fullReports.map( transformFullReport ) )
				} )
			} )
		}
	}
}
