const jsonata = require('jsonata')

const commitTransformation = jsonata(`{
  "author": author.{
    "login": login,
    "type": type
  },
  "commit": commit.{
    "author": author.{
      "date": date,
      "name": name
    },
    "committer": commiter.{
      "date": date,
      "name": name
    },
    "message": message
  },
  "committer": committer.{
    "login": login,
    "type": type
  },
  "owner": owner,
  "repo": repo,
  "sha": sha
}`)

const pullRequestTransformation = jsonata(`{
  "author_association": author_association,
  "closed_at": closed_at,
  "comments": comments,
  "created_at": created_at,
  "merged_at": merged_at,
  "number": number,
  "owner": owner,
  "requested_reviewers": requested_reviewers.[{
    "login": login,
    "type": type
  }],
  "repo": repo,
  "reviews": reviews,
  "state": state,
  "title": title,
  "updated_at": updated_at,
  "user": user.{
    "login": login,
    "type": type
  }
}`)

const reviewTransformation = jsonata(`{
  "author_association": author_association,
  "commit_id": commit_id,
  "owner": owner,
  "pull_request": $match(pull_request_url, /(\d+)$/).groups[0] ~> $number,
  "repo": repo,
  "state": state,
  "submitted_at": submitted_at,
  "user": user.{
    "login": login,
    "type": type
  }
}`)

const commentTransformation = jsonata(`{
  "author_association": author_association,
  "created_at": created_at,
  "owner": owner,
  "pull_request": $match(pull_request_url, /(\d+)$/).groups[0] ~> $number,
  "repo": repo,
  "updated_at": updated_at,
  "user": user.{
    "login": login,
    "type": type
  }
}`)



module.exports = {
  comment(comment) {
    return commentTransformation.evaluate(comment)
  },
  commit(commit) {
    return commitTransformation.evaluate(commit)
  },
  pullRequest(pullRequest) {
    return pullRequestTransformation.evaluate(pullRequest)
  },
  review(review) {
    return reviewTransformation.evaluate(review)
  }
}
