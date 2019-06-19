# Context.Handler

- type: `Object`

Represent factory for creating command handlers.

## Hooks

- `handler:invoke` - will be executed when handler is executed

::: tip NOTE
Hook `handler:invoke` will be executed immediately after `command:invoke`
The main difference between `command:invoke` and `handler:invoke` is that
`command:invoke` will be always executed and
execution of `handler:invoke` depends on `command:invoke` successful realization.
:::

[See more about hooks](/plugins.md#hooks)

## Factory properties

### createClass

- `Context.Handler.createClass(): Class`

Create and return Handler class.

### create

- `Context.Handler.create(module:Module, commandClass:Class, definition:Object): Handler`

Factory method for creating new Handler instance.

::: tip NOTE
Most likely you won't have the need to use it directly.
:::

### Base

- type: `Class`

  Represent base `Handler` class. You can extend it like:

  ```js
  Context.Handler.Base.prototype.myFunc = () => {};
  ```

## Instance properties

### registrationKey

- `registrationKey`

Computed property for `handler` / `command` registration.

### module

Reference to the [Module](/api/module.md)

### \_definition

Reference to the `context` [Definition](/api/definition.md)
