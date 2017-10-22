const _ = require('lodash')

const _options = {
  errorMessage: ({ path }) => `Access denied to ${path}.`
}

module.exports = function (schema, options = _options) {
  schema.methods.actor = function (actor) {
    this._actor = actor
    return this
  }

  schema.query.actor = function (actor) {
    this._actor = actor
    return this
  }

  const _pathsToValidate = _.chain(schema.paths)
    .values()
    .map(path => path.options && path.options.validateAccess ? {
      path: path.path,
      validateAccess: path.options.validateAccess
    } : void (0))
    .filter(item => item)
    .value()

  const _methodsToValidate = Object.keys(
    _pathsToValidate
      .map(item => item.validateAccess)
      .reduce((a, b) => ({ ...a, ...b }), {})
  )

  _methodsToValidate.forEach(method => {
    schema.pre(method, function (next) {
      const self = this._doc || this._update
      if (!_.isNil(this._actor)) _pathsToValidate
        .map(path => ({ ...path, validateAccess: path.validateAccess[method] }))
        .filter(item => _.has(self, item.path) && item.validateAccess)
        .map(item => ({ ...item, value: self[item.path] }))
        .map(item => ({ ...item, isValid: item.validateAccess(item.value, this._actor) }))
        .forEach(item => item.isValid ? void (0) : next(new Error(options.errorMessage(item))))
      next()
    })
  })
}