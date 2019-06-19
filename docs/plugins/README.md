# Plugin Api Reference

## name

- type: `String`
- mandatory: `true`

  Name of the plugin. This field is mandatory.

## description

- type: `String` | optional

  description of the plugin.

## install

- `install(ContextFactory:Object,options?:Object)`

  description of the plugin.

## initialize

- `initialize(contextInstance:Object,options?:Object)`

  this will be called when `constructor` of the new Context object is invoked.

## reset

- `reset(contextInstance:Object,options?:Object)`

  this will be called when `context.reset(...)` method is called and the purpose is to
  reset/reload context.

  > **NOTE:** Here you should handle you plugin state related to the context object.

## hooks

Register hook for your custom method
reset/reload context.
