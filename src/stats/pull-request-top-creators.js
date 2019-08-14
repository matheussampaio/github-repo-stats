const jsonata = require('jsonata')

const logger = require('../logger')
const topPullRequestCreatorExpression = require('../queries/top_pull_request_creator')

function main(namespace, database) {
  const pullRequests = database.get('pull_requests').value()

  getPullRequestTopCreators(namespace, pullRequests)
}

function getPullRequestTopCreators(namespace, pullRequests) {
  const top = jsonata(topPullRequestCreatorExpression).evaluate(pullRequests)

  logger.info(`[${namespace}] Ranking pull requests`, sortObjectByValue(top))
}

function sortObjectByValue(object) {
  const sortedObject = {}

  Object.keys(object)
    .sort((a, b) => object[b] - object[a])
    .forEach(login => sortedObject[login] = object[login])

  return sortedObject
}

module.exports = main
