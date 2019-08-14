module.exports = `(
  $.*.user{
    login ~> $lowercase : login ~> $count
  }
)`
