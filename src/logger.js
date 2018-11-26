const pino = require('pino')

const logger = pino({
  level: process.env.LOG_LEVEL || 'debug',
  prettyPrint: true
})

module.exports = logger
