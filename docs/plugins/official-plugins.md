# Extending State Commander

These are some module which they are part of the core bundle, but they are optional
for inclusion.

## Module Inheritance

```js
import { Context, ModuleInheritance } from 'state-commander';

Context.use(ModuleInheritance);
```

Gives functionality for module nesting.

```js
const parent = context.registerModule('parent/module');
const child = context.registerModule('child/module');

parent.addChild(child);

expect(child.namespace).toBe('parent/module/child/module');
```

## Module Mapper

Gives functionality for parsing module map. Useful for importing modules.

```js
import { Context, ModuleMapper } from 'state-commander';

Context.use(ModuleMapper);

const ContextClass = Context.createClass();

const context = new ContextClass({
  'some/module': {
    state: {
      value: 'some'
    },
    commands: [
      CommandClass1,
      CommandClass2,
      ...
    ]
  }
});
```

## Module Map Generator

::: tip TODO
this is under construction
:::

## Logger

Print some information in console.

```js
import { Context, Logger } from 'state-commander';

if (process.env.NODE_ENV !== 'production') {
  Context.use(Logger);
}
```

## Command Helpers

It creates helper methods (aliases) for invoking commands.

```js
import { Context, CommandHelpers } from 'state-commander';

Context.use(CommandHelpers);
```

### Context instance properties

#### getHelpers

- `getHelpers(): Object`

It returns map `{[helperName]:command}`

```js
//So instead of this:
context.commit('my/module/someAction', payload);

// you can call this
myModuleSomeAction(payload);

//to generate them just call:
const helpers = context.getHelpers();
// this will give you something like:
console.log(helpers);
// {
//   myModuleSomeAction: commandFn(){}
// }
```

This module is designed in mind to support [Vue.js](https://vuejs.org/) `provide/inject` functionality.

```js
  ...
  new Vue({
    provide: context.getHelpers()
    el: '#app',
    context,
    render: h => h(App)
  })

 Vue.component( {
   ...
   inject:['myModuleSomeAction']
   ...
  })
```

By default this module will generate computed names for commands based on [Module](/api/module) and [Command Class](/api/command-class) name

You can override those names within class definition itself.

### Command class static properties

You can define custom helper names:

```js
// module user
class MyCommand{
  get helpers() {
    return {
      initialize: 'init',
      execute: 'find',
      commit: 'update',
      getter: 'get'
    }
  }

  commit(){
    ...
  }
}
...
//it will produce following
userInit()
userFind()
userUpdate()
userGet()
```

## Subscription

```js
import { Context, Subscription } from 'state-commander';

Context.use(Subscription);
```

It gives simple event subscription functionality.

### Before

It will be triggered before command is executed

```js
const unsubscribeFn = context.subscribe('commit:user:before', () => {});
```

### After

```js
const unsubscribeFn = context.subscribe('commit:user', () => {});
//or explicitly
const unsubscribeFn = context.subscribe('commit:user:after', () => {});
```

::: warning NOTE:
`prefix` is important and it's required. Depend of the definition it will be: `commit:`,`get:` etc.
:::

## Stats

```js
import { Context, Stats } from 'state-commander';

Context.use(Stats);
```

Simple plugin for counting command calls. It was created for the needs of the tutorial.
.

See more: [Custom plugin](/plugins/custom-plugin.md)
