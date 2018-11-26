const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const logger = require('./logger')

const DEFAULTS = {
  pull_requests: {},

}

class Database {
  constructor(name) {
    logger.info(`Initializing DB: ${name}.json`)

    const adapter = new FileSync(`${name}.json`)

    this.db = low(adapter)

    this.db.defaults(DEFAULTS).write()
  }

  set(path, value) {
    this.db = this.db.set(path, value)
  }

  write() {
    this.db.write()
  }

  get(path) {
    return this.db.get(path)
  }
}

module.exports = Database
