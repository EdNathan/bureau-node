'use strict'

const _ = require( 'lodash' )
const app = require( '../app.js' )

let transformReport = ( report, uid ) => {
	let transformedReport = _.cloneDeep( report )

	delete transformedReport.id

	transformedReport.killerid = uid

	if ( transformedReport.coords && transformedReport.coords.split( ',' ).length == 2 ) {
		transformedReport.coords = transformedReport.coords.split( ',' ).map( ( n ) => Number( n.trim() ) ).reverse()
	} else {
		delete transformedReport.coords
	}


	return transformedReport
}

let doMigrate = () => {
	console.log( 'migrating' )

	const Bureau = app.Bureau

	Bureau.assassin.getAssassins( {
		kills: {
			$exists: true,
			$ne: []
		}
	}, ( err, assassins ) => {

		let reports = []

		if ( err ) {
			console.error( `Error getting assassins: ${err}` )
			return
		}

		assassins.forEach( ( assassin ) => {
			let uid = assassin._id + ''
			reports = reports.concat( assassin.kills.map( ( r ) => transformReport( r, uid ) ) )
		} )

		let reportsDone = -1
		let successful = 0
		let badGameId = 0

		let done = ( err, report ) => {
			if ( err ) {
				console.trace( `Error migrating report: ${err}`, reports[ reportsDone ] )
				return
			}

			if ( ++reportsDone === reports.length ) {
				console.log( `Report migration complete (${successful} successful, ${badGameId} bad game id)` )
				return
			} else {
				console.log( `${reportsDone}/${reports.length}\n`, reports[ reportsDone ] )
			}

			Bureau.game.getGame( reports[ reportsDone ].gameid, ( err, game ) => {

				if ( err && _.isEmpty( game ) ) {
					console.log( `${err}\n`, reports[ reportsDone ] )
					badGameId++
					done()
					return
				}

				Bureau.report._createReport( reports[ reportsDone ], ( err, dbReport ) => {
					successful++
					done( err, report )
				} )
			} )
		}

		done()


	} )
}


app.onLoad( doMigrate )
