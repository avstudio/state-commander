# Context.Module

- type: `Object`

Represent factory for creating context modules.

## Configuration:

- `rootModuleName: 'root'`

## Hooks

- `module:register` - will be executed when module is registered
- `module:unregister` - will be executed when module is unregistered

  [See more about hooks](/plugins.md#hooks)

## Factory properties

### Base

- type: `Class`

  Represent base `Module` class. You can extend it like:

  ```js
  Context.Module.Base.prototype.myFunc = () => {};
  ```

### create

- `Context.Module.create(context:Context, path:String, options?: { commands = [CommandClass], name?:String}): Module`

Factory to create new `Module` instances.

## Instance properties

### context

`Context` instance reference

### registrationKey

Computed property for `module` / `command` registration.

### path

Module directory path `../../path/to/module`

### namespace

Module namespace computed from path `path/to/module`

### registerCommand

- `registerCommand( command: CommandClass )`

Register command class with assertion to have at least following implemented:

```js
Command.prototype.execute ||
  Command.prototype.commit ||
  (Command.prototype.getter && Command.state);
```

See more about [Command Class](/api/command-class.md)

### unregisterCommand

- `unregisterCommand( command: CommandClass )`

Unregister command class.

See more about [Command Class](/api/command-class.md)

### unregisterAllCommands

- `unregisterAllCommands()`

### getCommands

- `getCommands(): Array`

It will return all registered [Command Classes](/api/command-class.md)

## Context Instance properties

This extension will provide following `context` instance properties:

### getModule

- `getModule(namespace: String): Module`

  Will return module by namespace

### getModules

- `getModules(): [ Module ]`

  Will return all context modules

### registerModule

- `registerModule(module: Module | String, options?: { commands:[ CommandClass ] })`

  register module by namespace or by passing module instance object

### unregisterModule

- `unregisterModule(module: Module | namespace: String)`

unregister module by namespace or by passing module instance object
