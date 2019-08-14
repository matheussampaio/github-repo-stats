const jsonata = require('jsonata')

process.env.LOG_LEVEL = 'error'

const main = require('./index')

const PROJECT = 'wizeline-Wizeline-discovery-kids-frontend'
let data = {}

async function load() {
  const { databases } = await main()
  const database = databases[PROJECT]

  data = {
    pullRequests: database.get('pull_requests').value(),
    commit: database.get('commits').value()
  }
}

function c(exp) {
  return jsonata(exp[0]).evaluate(data.commits)
}

function p(exp) {
  return jsonata(exp[0]).evaluate(data.pullRequests)
}

load()

module.exports = { c, p, data }
