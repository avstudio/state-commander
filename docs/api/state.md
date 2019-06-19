# Context.State

State is defined as static getter on the [Command Class](#command-class)

Every class has it's own state, but at the and the state will be merged into single [Module](/api/module.md) state.

So for example assuming that are both commands are part of the `some/module` module:

```js
//inside some/module
class MyCommand1 {
  static get state() {
    return {
      value1: 'foo'
    };
  }
}

//inside some/module
class MyCommand2 {
  static get state() {
    return {
      value2: 'bar'
    };
  }
}
```

State for this module will be registered and merged as:

```js
context.state['some/module']; // {value1:'foo',value2:'bar'}
```

Within the state registration process,
this data will be used for creating new objects with `buildState()` and `setState()` factory.

## Configuration:

- `buildState(state:Object):Object` -

  Set root state objects

- `setState(state:Object,key:String, properties:Object)`

  Assign new nested properties to the state object recursively

  ::: warning
  this will mutate given `state`
  :::

::: tip NOTE
In default implementation, this method will return the plain JS Object.
In some other implementations, like [VueContext](/plugins/vue-context.md) with `Vue.observable` and
`Vue.set` will return state object with additional logic to support its reactive nature.
:::

## Hooks

- `state:register` - will be executed when state is registered
- `state:unregister` - will be executed when state is unregistered

  [See more about hooks](/plugins.md#hooks)

## Command class instance properties

This module will define following instance properties on each [Command Class](./command-class) instance:

- `state:Object` - it will return `module` state object
- `rootState:Object` - it will return `context` state object containing the state of all modules

```js
class MyCommand {
  commit() {
    //this.state => module state
    //this.rootState => context state
  }
}
```

## Context instance properties

### getters

- type: `Object`

  Invoking context getters

  ```js
  context.getters['some/module/myCommand'];
  ```

  will invoke class getter method:

  ```js
  class MyCommand{
    ...
    getter(){
      return this.value.toUpperCase()
    }
    ...
  }
  ```
  You can retrieve module state by module `namespace`:

  ```js
  context.state['some/module'];
  ```

### state

- type: `Object`

Will return context state object from all registered modules.

### registerState

- `registerState(key:String, state:Object,options?:Object)`

Options can have `override: true`  to force (override) new object for given key

::: tip NOTE
State registration process is done through `module` / `command` registration.
Most likely you won't have the need to use it directly.
:::

### unregisterState

- `unregisterState(key:String)`
