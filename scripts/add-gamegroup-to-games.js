'use strict'

const app = require( '../app.js' )

let doAddGameGroup = () => {
	console.log( 'adding gamegroup to games' )

	const Bureau = app.Bureau

	Bureau.gamegroup.getGamegroups( ( err, gamegroups ) => {

		if ( err ) {
			console.log( err )
			return
		}

		gamegroups = Object.keys( gamegroups ).map( ( ggid ) => gamegroups[ ggid ] )

		gamegroups.map( ( gamegroup ) => {
			let games = gamegroup.games.map( ( g ) => {
				g.gamegroup = gamegroup.ggid
				return g
			} )

			Bureau.gamegroup.updateGamegroup( gamegroup.ggid, {
				games
			}, ( err, gamegroup ) => {
				if ( err ) {
					console.log( err )
				} else {
					console.log( `Updated ${gamegroup.ggid}` )
				}
			} )
		} )

	} )
}


app.onLoad( doAddGameGroup )
