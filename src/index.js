const dotenv = require('dotenv')

dotenv.config()

const Github = require('./github')
const logger = require('./logger')
const Database = require('./database')

async function main() {
  if (process.env.GITHUB_REPOSITORIES == null) {
    return logger.error('Missing environment variable: GITHUB_REPOSITORIES')
  }

  const projects = process.env.GITHUB_REPOSITORIES.split(',').map(repository => {
    const [owner, repo] = repository.split('/')

    return { owner, repo }
  })

  const databases = {}

  projects.forEach((project) => {
    const namespace = getNamespaceFromProject(project)
    databases[namespace] = new Database(namespace)
  })

  if (process.env.DOWNLOAD_EVERYTHING) {
    const github = new Github()

    await github.authenticate()

    const limit = await github.rateLimit()

    logger.info('RATE LIMIT', limit.rate.remaining)

    for (let i = 0; i < projects.length; i++) {
      const project = projects[i]

      const database = databases[getNamespaceFromProject(project)]

      await github.downloadPullRequests(project, database)

      await github.downloadCommits(project, database)

      database.write()
    }
  }

  const allDb = {
    pull_requests: {}
  }

  // metrics by project
  projects.forEach((project) => {
    const namespace = getNamespaceFromProject(project)
    const database = databases[namespace]
    const pullRequests = database.get('pull_requests').value()

    Object.assign(allDb.pull_requests, pullRequests)

    getPullRequestTopCreators(namespace, pullRequests)
  })

  // aggregated metrics
  const namespace = `All`
  getPullRequestTopCreators(namespace, allDb.pull_requests)
}

const topPullRequestCreatorExpression = require('./queries/top_pull_request_creator')
const jsonata = require('jsonata')

function getPullRequestTopCreators(namespace, pullRequests) {
  const top = jsonata(topPullRequestCreatorExpression).evaluate(pullRequests)

  logger.info(`[${namespace}] Ranking pull requests`, sortObjectByValue(top))
}

function sortObjectByValue(object) {
  const sortedObject = {}

  Object.keys(object).sort((a, b) => object[b] - object[a]).forEach(login => sortedObject[login] = object[login])

  return sortedObject
}

function getNamespaceFromProject(project) {
  return `${project.owner}-${project.repo}`
}

main().catch(error => logger.error(error))
