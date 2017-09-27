'use strict'

const fs = require( 'fs' )

const moment = require( 'moment' )

const LOG_FILE = `${process.env.BUREAU_LOG_DIR || './'}api.log`

const ts = () => moment().format()

const log = ( txt ) => fs.appendFile( LOG_FILE, `${ts()}\t${txt}\n`, 'utf8' )

module.exports = log
