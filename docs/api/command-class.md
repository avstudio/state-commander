# Command Class

Command class represent the way to encapsulate handling state logic (or part of the module state).

Every time when context handler ivnoke command, it will create new CommandClass instance and call
related instance method.

```js
class MyCommand{
    static get helpers() {
      return {
        initialize: 'init',
        execute: 'find',
        commit: 'update',
        getter: 'get'
      }
    }

    //your module state properties
    static get state(){
      return {
        value:'some value',
        value2:'some value2'
      }
    }
    //your payload will be here
    constructor(event, payload){
      //store here you data
      this.id = payload.id
      this.value = null
    }

    //do this at the beginning
    initialize(){
      this.state.value = localStorage.get('value')
    }

    getter(){
      return this.state.value.toUpperCase()
    }

    commit(){
      this.state.value = this.value
      //do something with id and value
      localStorage.set('value',...)
    }

    dispatch(){
      db.get('data').then((data) => {
        this.value = data.value
        this.commit()
      })
      .catch(...)
    }
  }
```

## Class properties

### state

- type: `Object`

Represent state for this command. It can hold one or more key value pairs.

::: tip NOTE
State will be merged within the module state and replaced with new state object.
:::

For more details see [State](/api/state.md)

### helpers

- type: `Object`

See more about [Command Helpers](/plugins/official-plugins.md#command-helpers) plugin

## Instance properties by modules

[State Module](/api/state.md#command-class-instance-properties)

## Invoking commands

For more information about see: [invoking commands](/api/definition.html#invoking-commands)
