const dotenv = require('dotenv')
const jsonata = require('jsonata')

dotenv.config()

const Database = require('./database')
const Github = require('./github')
const logger = require('./logger')
const stats = require('./stats')

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

  // metrics by project
  projects.forEach((project) => {
    const namespace = getNamespaceFromProject(project)
    const database = databases[namespace]

    stats.forEach(stat => stat(namespace, database))
  })
}

function getNamespaceFromProject(project) {
  return `${project.owner}-${project.repo}`
}

main().catch(error => logger.error(error))
