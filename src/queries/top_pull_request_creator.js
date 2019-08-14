module.exports = `(
  $.*.user{
    login ~> $lowercase ~> $count
  }
)`
