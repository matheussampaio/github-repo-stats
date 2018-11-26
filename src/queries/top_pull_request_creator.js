const normalize_logins = require('./normalize_logins')

module.exports = `(
  $normalize_logins := ${normalize_logins}

  $.*.user{
    login ~> $lowercase ~> $normalize_logins: login ~> $count
  }
)`
