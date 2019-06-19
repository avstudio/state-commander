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
context._state['some/module']; // {value1:'foo',value2:'bar'}
```

Within the state registration process,
this data will be used for creating new objects with `buildState()` factory.

## Configuration:

- `buildState(state:Object):Object` - factory for state objects

::: tip NOTE
In default implementation, this method will return the plain JS Object.
In some other implementations, like [VueContext](/plugins/vue-context.md) with `Vue.observable`
will return state object with additional logic to support its reactive nature.
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

### state

- type: `Object`

Will return context state object from all registered modules.

### registerState

- `registerState(key:String, state:Object)`

::: tip NOTE
State registration process is done through `module` / `command` registration.
Most likely you won't have the need to use it directly.
:::

### unregisterState

- `unregisterState(key:String)`
