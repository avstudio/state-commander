# Definition

Definition is the "interface" for building [Context](/api/README.md) object by
giving to it methods and functionality for invoking commands.

Simplified it works like this:

<mermaid>
graph TB
  context[Context] --> command[Command handler]
  command --> beforeCH["Hook command:invoke (before)"]
  command --> handler[Handler]
  command --> afterCH["Hook command:invoke (after)"]
  handler[Handler] --> beforeHH["Hook handler:invoke (before)"]
  handler --> invoke[Invoke Command Class function]
  handler[Handler] --> afterHH["Hook handler:invoke (after)"]
  invoke[Invoke Command Class function] --> initialize
  invoke[Invoke Command Class function] --> getter
  invoke[Invoke Command Class function] --> execute
  invoke[Invoke Command Class function] --> commit
</mermaid>

## Default Definition

Here is default context definition example:

```js
const definition = {
  initializer: {
    prefix: 'init',
    map: 'initializers',
    invokeFn: 'initialize',
    handler: /* async */ function initialize(event) {
      return this._callCommand(this._initializers, event);
    }
  },
  action: {
    map: 'actions',
    invokeFn: 'execute',
    // note the name here
    handler: /* async */ function dispatch(event, payload) {
      return this._callCommand(this._actions, event, payload);
    }
  },
  mutation: {
    map: 'mutations',
    prefix: 'commit',
    invokeFn: 'commit',
    // note the name here
    handler: function commit(event, payload) {
      return this._callCommandSync(this._mutations, event, payload);
    }
  }
};
```

### map

- type: `{[type: string]: String}`

  Collection name for this action which will store all command handlers related to this action

  ```js
    context._collectionMapName[...]
  ```

  ::: tip NOTE
  Collection name is required for storing keys into it. It the `map` name is the same for
  all [Definition](#definition) properties, then all commands will be stored in it.
  If that is the case, `prefix` for every action is required.
  :::

### prefix (optional)

- type: `{[type: string]: String}`

  Used in construction of the object `registrationKey` for collection assignment.

  ```js
    //command will be stored in collection like:
    context._collectionMapName['commit:some/module/updateCommand'] = ...

    //but you don't have to define prefix here. Instead you can call command like:
    context.commit('some/module/updateCommand')
  ```

  See more about [Invoking commands](#invoking-commands)

### invokeFn

- type: `{[type: string]: String | function(CommandClassInstance)}`

  This will invoke `invokeFn` method on the command class instance.
  If type is `function` then first argument will be command class instance.

### handler

- type: `{[type: string]: Function}`
  this method will be defined on the [Context](#context) instance object.

  > **NOTE:** The **`handler function name`** is **important** and it will be used to define this `handler` function on the context object <code>context.functionName()</code>
  > which will call

  - <code>context.\_callCommand(...) </code> will invoke single command asynchronously
  - <code>context.\_callCommandSync(...)</code> will invoke single command synchronously
  - <code>context.\_callAllCommands(...)</code> will invoke multiple commands asynchronously based on pattern matching
    ```js
    context.myMethod('foo/*', data);
    ```

## Custom command resolver

When you create custom [Definition](#definition) you can have custom implementation of command resolver function:

```js
//example of async handler command resolver

const myPlugin = {
  install(ContextFactory){
    const Context = ContextFactory
    Context.Base.prototype._myAsyncFunc = (event,payload)=> Promise.resolve()
  }
}

...

const myDefinition = {
  action:{
    map:'foo',
    ...
    handler:function dispatch(event,payload) {
      this._myAsyncFunc(even,payload)
    }
  }
}
```

See more [Creating plugins](#create-plugin) and [Custom Definition](#custom-definition)

## Extending default definition

Simple as:

```js
const myPlugin = {
  install(ContextFactory) {
    const cFactory = ContextFactory;
    cFactory.definitions.default.authorizeAction = {
      map: 'authorizations',
      prefix: 'auth',
      invokeFn: 'authorize',
      handler: function authorize(event, payload) {
        return this._callCommandSync(this._authorizations, event, payload);
      }
    };
  }
};
```

to support this just define authorize method in your [Command Class](#command-class) definition:

```js
  class MyCommand{
    ...
    authorize(){
      //do something before execute
    }
    ...
  }
```

and then you can call you command like:

```js
//will invoke authorize method on the command class instance
context.authorize('auth:user', { password: 'password' });
```

And finlay, you can always combine commands:

```js
context.authorize('auth:user', { password: 'password' });
context.dispatch('user', { ...payload });
```

## Custom Definition

Custom definition allows you to create custom "interface" on the context object itself.
within the [Default Definition]($definition) you can do the following:

```js
  //will invoke initialize method on the command class instance
  context.initialize(...)
  //will invoke initialize method on the command class instance
  context.commit(...)
  //will invoke execute method on the command class instance
  context.dispatch(...)
```

See more details about [CommandClass](#command-class) and [Invoking commands](#invoking-commands)

Even this can handle most situation, you can extend existing or create complete new definitions.

## Custom definition template

If default implementation does not work for you or you want something like CRUD operations
you can create the following template:

```js
const crudDefinition = {
  find:{
    map: 'collection',
    prefix:'find',
  },
  read:{
    map: 'collection',
    prefix:'read'
    invokeFn: 'read',
    handler: function read(event) {
      return this._callCommand(this._collection, event)
    }
  },
  update:{
    map: 'collection',
    prefix: 'update',
    invokeFn: 'update',
    handler: function update(event) {
      return this._callCommandSync(this._collection, event)
    }
  },
  destroy:{
    map: 'collection',
    prefix: 'destroy',
    invokeFn: 'destroy',
    handler: function destroy(event) {
      return this._callCommandSync(this._collection, event)
    }
  },

}
```

and then you can use it like:

```js
context.read('user');
context.update('user', { id });
context.destroy('user', { id });
```

## Invoking commands

Based on the default [Definition](/api/definition.md) template following instance methods are available:

### Initialize

- `context.initialize(string:event): Promise`
  will call `initialize` method on single or multiple commands based on `event`
  pattern matching and return promise for all commands.

```js
context.initialize('some/module/getAuthData');
context.initialize('some/module/*'); //all commands in the same module
context.initialize('*'); //all commands in all modules
```

### Commit

- `context.commit(string:event,...payload)`
  will call `commit` method on single the single command

```js
context.commit('some/module/updateAuthData', { id: 1, title: 'Title' });
```

### Dispatch

- `context.dispatch(string:event): Promise`
  will call `execute` method on the single command and return promise

```js
context.dispatch('some/module/authenticate', { token: '...' });
```

### Getter

- `context.getters['some/module/command']`
  will call `getter` method on the single command and return state value.

For more details: [getters](/api/state.html#getters)
