# mongoose-actor

A mongoose plugin to validate each path of a model using the value of the path and the actor who is triggering the action to the model. You can add validation according to the triggered method. Ideal to validate roles permission on path and method level.

## use case

Imagine you have an Person Model. You want to let all people change it own weigth, for example. But you don't want to let people change their birthdate, because it's an official data. So, only authorized people (like federal agents) should be able to change that information. That's when mongoose-actor join the party.

## who is the actor?

We are using the word `actor` to represent the author of the action (update, save, find...). Using the example above, if the actor is not an federal agent, they should not be able to update that information.

## how does it work

When you plug mongoose-actor in your schema, all of your paths which have the property `validateAccess` will be able to validate the actor when some mongoose method is triggered, having the ability to make custom validations per field per method.

The validation will receive the value inserted and the actor. It **must** return a boolean. If validation returns `true`, it will pass. Else, it will throw an error with the `errorMessage`.

In the example below, only federal agents can `save`, `findOneAndUpdate` or `remove` the property `name` of any `User`.

```javascript
import mongoose from 'mongoose'
import mongooseActor from 'mongoose-actor'

const _onlyFederalAgentAllowed = (val, actor) => actor.isFederalAgent 

const userSchema = mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    validateAccess: {
      save: _onlyFederalAgentAllowed,
      findOneAndUpdate: _onlyFederalAgentAllowed,
      remove: _onlyFederalAgentAllowed
    }
  },
  email: { 
    type: String, 
    required: true, 
    unique: true
  }
})

userSchema.plugin(mongooseActor)

export default mongoose.model('User', userSchema)
```

Later, when you call the mongoose methods, you must call together the actor method passing the actor:

```javascript
// Updating an user
async User
  .findOneAndUpdate({ name: 'João' }, { name: 'John' })
  .actor({ isFederalAgent: true })

// Saving a new user
async User({ name: 'João' })
  .actor({ isFederalAgent: true })
  .save()
```

## errorMessage

You can pass to your plugin an options object configuration. For now you only can set the errorMessage: 

```javascript
const config = {
  // Write your custom message.
  // If you don't, it will fallback to: `Access denied to ${path}`.
  errorMessage: ({ path }) => `U can't touch this: ${path}.`
}

userSchema.plugin(mongooseActor, config)

```



 

