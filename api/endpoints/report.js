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
		/**
		 * @api {post} /report/getReport/:reportId getReport
		 * @apiDescription Get report
		 * @apiName report/getReport
		 * @apiGroup report
		 *
		 * @apiSuccess {Object} report Report data
		 *
		 */
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

		/**
		 * @api {post} /report/getFullReport/:reportId getFullReport
		 * @apiDescription Get report with assassin and killmethod data
		 * @apiName report/getFullReport
		 * @apiGroup report
		 *
		 * @apiSuccess {Object} report Report data with extra fields
		 *
		 */

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

		/**
		 * @api {post} /report/getReports getReports
		 * @apiDescription Get multiple reports
		 * @apiName report/getReports
		 * @apiGroup report
		 *
		 * @apiParam {Object} query Query data for matching reports
		 *
		 * @apiSuccess {Object[]} reports Report data
		 *
		 */

		getReports: ( data, params, callback ) => {

			Bureau.report.getReports( data.query, ( err, reports ) => {
				if ( err ) {
					callback( err )
					return
				}

				filterReportsByUid( data.USER_ID, reports, callback )

			} )
		},

		/**
		 * @api {post} /report/getFullReports getFullReports
		 * @apiDescription Get multiple reports with assassin and killmethod data
		 * @apiName report/getFullReports
		 * @apiGroup report
		 *
		 * @apiParam {Object} query Query data for matching reports
		 *
		 * @apiSuccess {Object[]} reports Report data with extra fields
		 *
		 */

		getFullReports: ( data, params, callback ) => {

			Bureau.report.getFullReports( data.query, ( err, fullReports ) => {
				if ( err ) {
					callback( err )
					return
				}

				filterReportsByUid( data.USER_ID, fullReports.map( transformFullReport ), callback )

			} )
		},

		/**
		 * @api {post} /report/getReportsFromGame/:gameid getReportsFromGame
		 * @apiDescription Get all reports associated with a game
		 * @apiName report/getReportsFromGame/:gameid
		 * @apiGroup report
		 *
		 * @apiSuccess {Object[]} reports Report data
		 *
		 */

		'getReportsFromGame/:gameid': ( data, params, callback ) => {

			Bureau.report.getReportsFromGame( params.gameid, ( err, reports ) => {
				if ( err ) {
					callback( err )
					return
				}

				filterReportsByUid( data.USER_ID, reports, callback )

			} )
		},

		/**
		 * @api {post} /report/getFullReportsFromGame/:gameid getFullReportsFromGame
		 * @apiDescription Get all reports associated with a game with assassin and killmethod data
		 * @apiName report/getFullReportsFromGame
		 * @apiGroup report
		 *
		 * @apiSuccess {Object[]} reports Report data with extra fields
		 *
		 */

		'getFullReportsFromGame/:gameid': ( data, params, callback ) => {

			Bureau.report.getFullReportsFromGame( params.gameid, ( err, fullReports ) => {
				if ( err ) {
					callback( err )
					return
				}

				filterReportsByUid( data.USER_ID, fullReports.map( transformFullReport ), callback )

			} )
		},

		/**
		 * @api {post} /report/getPendingReports getPendingReports
		 * @apiDescription Get all pending reports from your gamegroup
		 * @apiName report/getPendingReports
		 * @apiGroup report
		 *
		 * @apiSuccess {Object[]} reports Report data
		 *
		 */

		getPendingReports: ( data, params, callback ) => {
			gamegroupFromUid( data.USER_ID, ( err, ggid ) => {
				if ( err ) {
					callback( err )
					return
				}
				Bureau.report.getPendingReports( ggid, callback )
			} )
		},

		/**
		 * @api {post} /report/getFullPendingReports getFullPendingReports
		 * @apiDescription Get all pending reports from your gamegroup with assassin and killmethod data
		 * @apiName report/getFullPendingReports
		 * @apiGroup report
		 *
		 * @apiSuccess {Object[]} reports Report data with extra fields
		 *
		 */

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
