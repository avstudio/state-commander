# Context.Base

- type: `Class`

  Represent Base class from which a new context object will be created.

  You can extend base class prototype like:

  ```js
  Context.Base.prototype.myFunc = () => {};
  ```

  or the class itself

  ```js
  Context.Base.myFunc = () => {};
  ```

## Instance properties

### \_callCommand

- `_callCommand(collectionMap:String,event:String,payload:*): Promise`

It will find and invoke command asynchronously

### \_callCommandSync

- `_callCommandSync(collectionMap:String,event:String,...payload)`

It will find and invoke command synchronously

### \_callAllCommands

- `_callAllCommands(collectionMap:String,event:String,...payload): Promise`

It will find and invoke multiple commands asynchronously and return single Promise

### \_commandNotFound

- `_commandNotFound(event:String,...payload)`

See [default configuration](/api/README.md#command-not-found-handler) for this implementation

## Instance properties by modules

[Context.Module](/api/module.md#context-instance-properties)

[Context.State](/api/state.md#context-instance-properties)
