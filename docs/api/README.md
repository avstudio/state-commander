# Context

## Factory properties

### use

- `use(Object)`

  Extending Context with new functionality. See more about [Creating Plugins](/plugins/README.md)

  ```js
  //example
  {
    const myPlugin = {
      name:'MyPlugin'
      install(){...}
      ...
    }
  }
  ```

### extensions

- type: `Array<Object>`

  Getter which will return list of installed plugins

  ::: warning NOTE
  not for direct modification
  :::

### configurations

- type: `Object`

  Getter that holds `configuration` options for all installed extensions

  ```js
  const myPlugin = {
    configuration:{
      logHandler:(msg)=>{...}
    }
  }

  Context.configuration.myPlugin.logHandler = ()=>{...}
  ```

  Override configuration like:

  ```js
  Context.configuration.myPlugin.logHandler = ()=>{...}
  ```

See more about [Creating Plugins](/plugins/README.md)

### definitions

- type: `Object`

  Getter that holds  "templates" for creating `Context` instance object

  See more about [Definition](/api/definition.md)

### createClass

- `createClass(definition?: string='default', options?:Object | options?:Object): Class`

  Create and return context class with provided [Definition](/api/definition.md) template.
  The function will receive the template `name` or `options` or both.
  Received options object will be passed to `myPlugin.extend(...)` function for plugin further functionality

  ```js
  const myPlugin = {
    ...
    extend(ContextFactory,options){
    }
  }
  ```

#### Class properties

- `Context.definition` - reference to the selected context [definition](/api/definition.md)

- `Context._$factory` - reference to the [Context](/api/README.md) factory

See more about [Creating Plugins](/plugins/README.md)

### hooks

- `Context.hooks[hookName:String].attach(handler:Function)`

Getter that holds Hooks / middleware functions and can be used for plugin functionality.

::: warning NOTE
Hooks are meant to be used only for plugin development and not for direct use.
For "ordinary" subscriptions, please use [Subscription](/plugins/official-plugins.md#subscription) module.
:::

See more about [Creating Plugins](/plugins/README.md)

## Default configuration

### Command not found handler

```js
Context.configuration.notFoundHandler = ()=>{...}
```

Default implementation will throw Error. It can be override via `configuration` option.

### Hooks

- `command:invoke` - will be executed on command execution

```js
Context.hooks['command:invoke'].attach((data,context,next) => {/* do something */})
```

  [See more about hooks](/plugins.md#hooks)
