const _config = {
  errorMessage: ({ path }) => `Access denied to ${path}.`
}

module.exports = function (schema, config = _config) {
  schema.methods.actor = function (actor) {
    this._actor = actor
    return this
  }

  schema.query.actor = function (actor) {
    this._actor = actor
    return this
  }

  const _pathsToValidate = Object
    .keys(schema.paths)
    .map(val => schema.paths[val])
    .filter(item => item.options && item.options.validateAccess)
    .map(({ path, options }) => ({ path, validateAccess: options.validateAccess }))

  const _methodsToValidate = Object
    .keys(
      _pathsToValidate
        .map(item => item.validateAccess)
        .reduce((a, b) => Object.assign({}, a, b), {})
    )

  _methodsToValidate.forEach(method => {
    schema.pre(method, function (next) {
      const self = this._doc || this._update
      if (this._actor) _pathsToValidate
        .map(item => Object.assign({}, item, { validateAccess: item.validateAccess[method] }))
        .filter(item => self.hasOwnProperty(item.path) && item.validateAccess)
        .map(item => Object.assign({}, item, { value: self[item.path] }))
        .map(item => Object.assign({}, item, { isValid: item.validateAccess(item.value, this._actor) }))
        .forEach(item => item.isValid ? void (0) : next(new Error(config.errorMessage(item))))
      next()
    })
  })
}