'use strict'

const _ = require( 'lodash' )
const utils = require( '../../utils' )

const filterOutTestGames = ( games ) => games.filter( ( g ) => g.name.search( /\btest.*?\b/i ) < 0 )

const fixFieldNames = ( games ) => games.map( ( game ) => {
	game = _.clone( game )
	game.id = game.gameid
	delete game.gameid
	return game
} )

const sortGames = ( games ) => games.reverse().sort( ( a, b ) => {
	return b.start - a.start
} )

const prepareGames = ( games ) => fixFieldNames( sortGames( filterOutTestGames( games ) ) )


const checkSameGamegroup = ( uid, gameid, callback ) => {
	Bureau.assassin.getGamegroup( data.USER_ID, ( err, ggid ) => {
		Bureau.game.getGame( gameid, ( err, game ) => {
			if ( err ) {
				callback( err )
				return
			}

			if ( ggid !== game.gamegroup ) {
				callback( 'That game is in a different gamegroup to you' )
				return
			}

			callback( null, game )
		} )
	} )
}

module.exports = ( Bureau ) => {

	const apiutils = require( '../apiutils' )( Bureau )

	return {

		/**
		 * @api {post} /game/getGame/:gameid getGame
		 * @apiDescription Get details of a game in your gamegroup
		 * @apiName game/getGame
		 * @apiGroup game
		 *
		 * @apiSuccess {Object} game The details for the game
		 *
		 */

		'getGame/:gameid': ( data, params, callback ) => {

			let gameid = params.gameid

			checkSameGamegroup( data.USER_ID, gameid, ( err, game ) => {

				if ( err ) {
					callback( err )
					return
				}

				callback( null, fixFieldNames( [ game ] )[ 0 ] )
			} )

		},

		/**
		 * @api {post} /game/getPlayerIdsInGame/:gameid getPlayerIdsInGame
		 * @apiDescription Get ids of players in a game in your gamegroup
		 * @apiName game/getPlayerIdsInGame
		 * @apiGroup game
		 *
		 * @apiSuccess {String[]} playersIds An array of ids of players in the game
		 *
		 */

		'getPlayerIdsInGame/:gameid': ( data, params, callback ) => {

			let gameid = params.gameid

			checkSameGamegroup( data.USER_ID, gameid, ( err, game ) => {

				if ( err ) {
					callback( err )
					return
				}

				Bureau.game.getPlayerIds( gameid, ( err, playerIds ) => {
					if ( err ) {
						callback( err )
						return
					}

					callback( null, playerIds )
				} )
			} )

		},

		/**
		 * @api {post} /game/getAssassinsInGame/:gameid getAssassinsInGame
		 * @apiDescription Get details of assassins in a game in your gamegroup
		 * @apiName game/getAssassinsInGame
		 * @apiGroup game
		 *
		 * @apiSuccess {Object[]} assasssins An array of assassins in the game
		 *
		 */

		'getAssassinsInGame/:gameid': ( data, params, callback ) => {

			let gameid = params.gameid

			checkSameGamegroup( data.USER_ID, gameid, ( err, game ) => {

				if ( err ) {
					callback( err )
					return
				}

				Bureau.game.getAssassins( gameid, ( err, assassins ) => {
					if ( err ) {
						callback( err )
						return
					}

					callback( null, assassins.map( utils.projectAssassin ) )
				} )
			} )
		},

		/**
		 * @api {post} /game/getGames getGames
		 * @apiDescription Get details of games in your gamegroup
		 * @apiName game/getGames
		 * @apiGroup game
		 *
		 * @apiSuccess {Object[]} games An array of games in the gamegroup
		 *
		 */

		getGames: ( data, params, callback ) => {

			Bureau.assassin.getGamegroup( data.USER_ID, ( err, ggid ) => {

				if ( err ) {
					callback( err )
					return
				}

				Bureau.game.getGamesInGamegroupAsArray( ggid, ( err, games ) => {

					if ( err ) {
						callback( err )
						return
					}

					callback( null, prepareGames( games ) )

				} )
			} )
		},

		/**
		 * @api {post} /game/getCurrentGames getCurrentGames
		 * @apiDescription Get details of current games in your gamegroup
		 * @apiName game/getCurrentGames
		 * @apiGroup game
		 *
		 * @apiSuccess {Object[]} games An array of current games in the gamegroup
		 *
		 */

		getCurrentGames: ( data, params, callback ) => {

			Bureau.assassin.getGamegroup( data.USER_ID, ( err, ggid ) => {

				if ( err ) {
					callback( err )
					return
				}

				Bureau.game.getCurrentGames( ggid, ( err, games ) => {

					if ( err ) {
						callback( err )
						return
					}

					callback( null, prepareGames( Bureau.game.toArray( games ) ) )

				} )
			} )
		},

		/**
		 * @api {post} /game/getGameIds getGameIds
		 * @apiDescription Get ids of games in this gamegroup
		 * @apiName game/getGameIds
		 * @apiGroup game
		 *
		 * @apiSuccess {String[]} gameIds An array of game ids in this gamegroup
		 *
		 */

		getGameIds: ( data, params, callback ) => {

			Bureau.assassin.getGamegroup( data.USER_ID, ( err, ggid ) => {

				if ( err ) {
					callback( err )
					return
				}

				Bureau.game.getGamesInGamegroupAsArray( ggid, ( err, games ) => {

					if ( err ) {
						callback( err )
						return
					}

					callback( null, prepareGames( games ).map( ( g ) => g.id ) )

				} )
			} )
		},

		/**
		 * @api {post} /game/getGamesWithPlayer/:playerid getGamesWithPlayer
		 * @apiDescription Get details of games with this player in
		 * @apiName game/getGamesWithPlayer
		 * @apiGroup game
		 *
		 * @apiPermission guild
		 *
		 * @apiSuccess {Object[]} games An array of games with this player
		 *
		 */

		'getGamesWithPlayer/:playerid': ( data, params, callback ) => {

			let playerId = params.playerid

			apiutils.onlyGuild( data.USER_ID, callback, ( err, guild ) => {

				apiutils.sameGamegroup( data.USER_ID, playerId, ( err, assassin ) => {

					if ( err ) {
						callback( err )
						return
					}

					Bureau.game.getGamesWithPlayer( playerId, ( err, games ) => {
						if ( err ) {
							callback( err )
							return
						}

						callback( null, prepareGames( Bureau.game.toArray( games ) ) )
					} )
				} )
			} )
		},

		/**
		 * @api {post} /game/getCurrentGamesWithPlayer/:playerid getCurrentGamesWithPlayer
		 * @apiDescription Get details of current games with this player in
		 * @apiName game/getCurrentGamesWithPlayer
		 * @apiGroup game
		 *
		 * @apiPermission guild
		 *
		 * @apiSuccess {Object[]} games An array of current games with this player
		 *
		 */

		'getCurrentGamesWithPlayer/:playerid': ( data, params, callback ) => {

			let playerId = params.playerid

			apiutils.onlyGuild( data.USER_ID, callback, ( err, guild ) => {

				apiutils.sameGamegroup( data.USER_ID, playerId, ( err, assassin ) => {

					if ( err ) {
						callback( err )
						return
					}

					Bureau.game.getCurrentGamesWithPlayer( playerId, ( err, games ) => {

						if ( err ) {
							callback( err )
							return
						}

						callback( null, prepareGames( Bureau.game.toArray( games ) ) )

					} )
				} )
			} )
		},

		/**
		 * @api {post} /game/getGamesWithMe/ getGamesWithMe
		 * @apiDescription Get details of games with this API user in
		 * @apiName game/getGamesWithMe
		 * @apiGroup game
		 *
		 * @apiSuccess {Object[]} games An array of games with the API user
		 *
		 */

		getGamesWithMe: ( data, params, callback ) => {

			Bureau.game.getGamesWithPlayer( data.USER_ID, ( err, games ) => {

				if ( err ) {
					callback( err )
					return
				}

				callback( null, prepareGames( Bureau.game.toArray( games ) ) )

			} )

		},

		/**
		 * @api {post} /game/getCurrentGamesWithMe/ getCurrentGamesWithMe
		 * @apiDescription Get details of current games with this API user in
		 * @apiName game/getCurrentGamesWithMe
		 * @apiGroup game
		 *
		 * @apiSuccess {Object[]} games An array of current games with the API user
		 *
		 */

		getCurrentGamesWithMe: ( data, params, callback ) => {

			Bureau.game.getCurrentGamesWithPlayer( data.USER_ID, ( err, games ) => {

				if ( err ) {
					callback( err )
					return
				}

				callback( null, prepareGames( Bureau.game.toArray( games ) ) )

			} )
		}
	}
}
