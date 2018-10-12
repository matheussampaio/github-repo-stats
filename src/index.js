const jsonata = require('jsonata')
const pino = require('pino')
const octokit = require('@octokit/rest')()

const logger = pino({
  level: process.env.LOG_LEVEL
})

const parsePullRequest = jsonata(`{
  "owner": user.login,
  "title": title,
  "created_at": created_at,
  "closed_at": closed_at,
  "requested_reviewers": requested_reviewers.{
  	"login": login
   }
}`)

const parseReviews = jsonata(`data.{
  "login": user.login,
  "submitted_at": submitted_at
}`)

const project = {
  owner: 'natgeo',
  repo: 'web-components',
}

async function main() {
  logger.debug('authenticating...')
  octokit.authenticate({
    type: 'token',
    token: process.env.GITHUB_ACCESS_TOKEN
  })
  logger.debug('authenticated.')

  logger.debug('requesting pull requests...')
  const { data: pullRequests } = await octokit.pullRequests.getAll({
    ...project,
    state: 'closed',
    per_page: 10,
    page: 1
  })
  logger.debug(`${pullRequests.length} fetched.`)

  const pullRequestInformations = []

  for (let i = 0; i < pullRequests.length; i++) {
    const pullRequest = pullRequests[i]

    pullRequestInformations.push(await getPullRequestInformations(pullRequest))
  }

  return pullRequestInformations
}

async function getPullRequestInformations(pullRequest) {
  logger.debug(`getting information about PR ${pullRequest.number}`)

  const informations = parsePullRequest.evaluate(pullRequest)

  const reviews = await octokit.pullRequests.getReviews({
    ...project,
    number: pullRequest.number
  })

  informations.reviews = parseReviews.evaluate(reviews)

  return informations
}

main().then(response => console.log(JSON.stringify(response, null, 2)))
