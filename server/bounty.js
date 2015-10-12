module.exports = function( Bureau ) {

	var mongoose = Bureau.mongoose
	var Schema = mongoose.Schema

	var _ = require( 'lodash' )

	var BountySchema = {
		title: {
			type: String,
			required: true,
			validate: {
				validator: function( val ) {
					return val && val.trim().length >= 10
				},
				message: 'A bounty must have a title at minimum 10 chars long'
			}
		},
		comment: String,
		anyPlayer: {
			required: true,
			type: Boolean
		},
		players: [ String ],
		issuers: {
			type: [ String ],
			default: []
		},
		anyKillmethod: {
			required: true,
			type: Boolean
		},
		killmethods: [ String ],
		gamegroup: {
			required: true,
			type: String
		},
		created: {
			required: true,
			type: Date
		},
		state: {
			required: true,
			type: Number
		}
	}

	var Bounty = mongoose.model( 'Bounty', BountySchema )

	var mongooseErrorsToString = function( err ) {
		return _.map( err.errors, function( e ) {
			return e.message
		} ).join( ' ' )
	}

	return {

		STATES: {
			ACTIVE: 0,
			CLAIMED: 1,
			ARCHIVED: 2
		},

		createBounty: function( data, callback ) {

			if ( data.hasOwnProperty( '_id' ) ) {
				delete data._id;
			}

			if ( !data || _.isEmpty( data ) || !_.isPlainObject( data ) ) {
				callback( 'Invalid or no data object supplied to create bounty' )
				return;
			}
			if ( !data.gamegroup ) {
				callback( 'A bounty must belong to a gamegroup' )
				return;
			}
			if ( !data.anyPlayer && ( !data.players ||
					!_.isArray( data.players ) ||
					_.isEmpty( data.players ) ) ) {
				callback( 'A bounty must target some players' )
				return;
			}
			if ( !data.anyKillmethod && ( !data.killmethods ||
					!_.isArray( data.killmethods ) ||
					_.isEmpty( data.killmethods ) ) ) {
				callback( 'A bounty must utilise at least 1 killmethod' )
				return;
			}

			data.created = new Date()
			data.state = Bureau.bounty.STATES.ACTIVE

			var bounty = new Bounty( data )

			bounty.save( function( err, bounty ) {

				if ( err ) {
					callback( mongooseErrorsToString( err ) )
					return
				}

				if ( !bounty.anyPlayer ) {

					var message = ''

					var sendNotification = function() {
						bounty.players.map( function( playerId ) {
							Bureau.notifications.addNotification( playerId, {
								text: message,
								source: 'The Bounty Office'
							} )
						} )
					}

					if ( bounty.issuers.length > 0 ) {
						Bureau.assassin.getAssassinsFromIds( bounty.issuers, function( err, assassins ) {
							var names = assassins.map( function( assassin ) {
								return assassin.forename + ' ' + assassin.surname
							} )

							if ( names.length > 1 ) {
								message = names.slice( 0, -1 ).join( ', ' ) + ' and ' + names.slice( -1 )[ 0 ]
							} else {
								message = names[ 0 ]
							}

							message += ' set a bounty on you!'
							sendNotification()

						} )
					} else {
						message = 'The Guild set a bounty on you!'
						sendNotification()
					}
				}

				callback( null, bounty )
			} )
		},

		getBounty: function( bountyId, callback ) {

			Bounty.findOne( {
				_id: bountyId
			}, function( err, bounty ) {

				if ( err || !bounty || _.isEmpty( bounty ) ) {
					callback( 'Bounty with id ' + bountyId + ' does not exist' )
					return;
				}

				callback( err, bounty )
			} )
		},

		updateBounty: function( bountyId, stuff, callback ) {

			delete stuff.created;
			delete stuff.gamegroup;

			Bounty.findByIdAndUpdate( bountyId, {
				$set: stuff
			}, function( err, bounty ) {

				if ( err ) {
					callback( err )
					return;
				}

				Bounty.findById( bountyId, function( err, bounty ) {

					callback( null, bounty )

				} )

			} );
		},

		setBountyState: function( bountyId, state, callback ) {

			Bureau.bounty.updateBounty( bountyId, {
				state: state
			}, callback )
		},

		archiveBounty: function( bountyId, callback ) {
			Bureau.bounty.setBountyState( bountyId, Bureau.bounty.STATES.ARCHIVED, callback )
		},

		getActiveBounties: function( ggid, callback ) {

			Bounty.find( {
				gamegroup: ggid,
				state: Bureau.bounty.STATES.ACTIVE
			}, function( err, bounties ) {

				if ( err ) {
					callback( err, [] )
					return
				}

				callback( null, bounties )

			} )

		}
	}
}
