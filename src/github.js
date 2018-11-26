const octokit = require('@octokit/rest')
const pagination = require('@octokit/rest/plugins/pagination')
const _ = require('lodash')

octokit.plugin(pagination)

const transformations = require('./transformations')
const logger = require('./logger')

class Github {
  constructor() {
    this.octokit = octokit()
  }

  async authenticate() {
    logger.debug('authenticating...')

    await this.octokit.authenticate({
      type: 'token',
      token: process.env.GITHUB_ACCESS_TOKEN
    })

    logger.debug('authenticated.')
  }

  async downloadPullRequests(project, database) {
    logger.info(`[@${project.owner}/${project.repo}] Downloading PULL REQUESTS...`)

    const options = await this.octokit.pullRequests.list.endpoint.merge({
      ...project,
      per_page: 100,
      state: 'all'
    })

    const pullRequests = await this.octokit.paginate(options)

    pullRequests.forEach((pullRequest) => {
      pullRequest.owner = project.owner
      pullRequest.repo = project.repo
    })

    logger.info(`[@${project.owner}/${project.repo}] ${pullRequests.length} PULL REQUESTS downloaded.`)

    for (let i = 0; i < pullRequests.length; i++) {
      const pullRequest = pullRequests[i]

      logger.info(`[@${project.owner}/${project.repo}] Downloading REVIEWS for pull request #${pullRequest.number}...`)

      pullRequest.reviews = await this.downloadReview(pullRequest, database)

      logger.info(`[@${project.owner}/${project.repo}] ${pullRequest.reviews.length} REVIEWS downloaded from pull request #${pullRequest.number}.`)
    }

    for (let i = 0; i < pullRequests.length; i++) {
      const pullRequest = pullRequests[i]

      logger.info(`[@${project.owner}/${project.repo}] Downloading COMMENTS for for pull request #${pullRequest.number}...`)

      pullRequest.comments = await this.downloadComments(pullRequest, database)

      logger.info(`[@${project.owner}/${project.repo}] ${pullRequest.comments.length} COMMENTS downloaded from pull request #${pullRequest.number}.`)
    }

    for (let i = 0; i < pullRequests.length; i++) {
      const pullRequest = pullRequests[i]

      pullRequest.owner = project.owner
      pullRequest.repo = project.repo

      logger.info(`[@${project.owner}/${project.repo}] Writing PULL REQUEST #${pullRequest.number} to disk...`)

      database.set(`pull_requests.${pullRequest.id}`, transformations.pullRequest(pullRequest))
    }
  }

  async downloadCommits(project, database) {
    logger.info(`[@${project.owner}/${project.repo}] Downloading commits...`)

    const options = this.octokit.repos.listCommits.endpoint.merge({
      ...project,
      since: '2017-09-01T01:01:01Z',
      per_page: 100,
      state: 'all'
    })

    const commits = await this.octokit.paginate(options)

    logger.info(`[@${project.owner}/${project.repo}] Saving commits to disk...`)

    commits.forEach((commit) => {
      commit.owner = project.owner
      commit.repo = project.repo

      database.set(`commits.${commit.sha}`, transformations.commit(commit))
    })

    logger.info(`[@${project.owner}/${project.repo}] ${commits.length} commits saved.`)
  }

  async downloadReview(pullRequest) {
    const options = await this.octokit.pullRequests.listReviews.endpoint.merge({
      owner: pullRequest.owner,
      repo: pullRequest.repo,
      number: pullRequest.number,
      per_page: 100,
      state: 'all'
    })

    const reviews = await this.octokit.paginate(options)

    return reviews.map(transformations.review)
  }

  async downloadComments(pullRequest) {
    const options = await this.octokit.pullRequests.listComments.endpoint.merge({
      owner: pullRequest.owner,
      repo: pullRequest.repo,
      number: pullRequest.number,
      per_page: 100,
      state: 'all'
    })

    const comments = await this.octokit.paginate(options)

    return comments.map(transformations.comment)
  }

  async rateLimit() {
    const response = await this.octokit.rateLimit.get()

    return response.data
  }
}

module.exports = Github
