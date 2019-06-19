# Custom plugin

Using simple object with following properties, you can extend State Commander
to fit your needs.

```js
{
  const myPlugin = {
    name:'MyPlugin'
    description:'Plugin description'
    hooks:[],
    configuration:{},
    extend(){}
    initialize(){}
    reset(){}
    install(){...}
  }
}
```

Let's create simple State Commander [Stats](/plugins/official-plugins.md#stats) plugin.
This plugin is part of the State Commander for the needs of this tutorial and can be imported.

See more details for plugin [Stats](/plugins/official-plugins.md#stats).

```js
// @module stats.js

//configuration object for the possibility to be overwritten
const configuration = {
  statsPrinter: stats => console.table(stats)
};

// This will be associated with context object instance
function printStats() {
  return configuration.statsPrinter(this._stats);
}

const commandInvokeHookHandler = ({ event }, contextInstance, next) => {
  // let flow continue and do counting after command is done
  next();

  const context = contextInstance;
  context._stats[event] = context._stats[event] || 0;
  context._stats[event] += 1;
};

export default {
  name: 'CommandStats',

  description: 'Plugin description',

  //set configuration
  //This can be overwritten
  //Context.configuration.commandStats.statsPrinter = ()=>{}
  configuration,

  //install method for our plugin
  //ContextFactory is actual the main Context object
  install(ContextFactory) {
    const Context = ContextFactory;

    // set our printer method on the context instance object
    Context.Base.prototype.printStats = printStats;

    // attach hook handler to the command invoke hook
    Context.hooks['command:invoke'].attach(commandInvokeHookHandler);
  },
  // runs on the context object initialization
  initialize(context) {
    //actually set out map
    this.reset(context);
  },
  // reset method. It is not mandatory and it depends on the plugin logic and purpose
  reset(contextInstance) {
    const context = contextInstance;
    context._stats = {};
  }
};
```

```js
// stats.spec.js

import { Context } from 'state-commander';
import Stats from 'my-lib-location';

Context.use(Stats);

global.console = { table: jest.fn() };

const ContextClass = Context.createClass();

class AwesomeCommand {
  execute() {
    // do nonthing
  }
}

const context = new ContextClass({
  commands: [AwesomeCommand]
});

describe('Stats', () => {
  beforeEach(() => {
    context.reset();
  });

  it('should count command calls and reset context stats object', () => {
    context.dispatch('awesomeCommand');
    context.dispatch('awesomeCommand');
    context.dispatch('awesomeCommand');
    context.dispatch('awesomeCommand');

    expect(context._stats.awesomeCommand).toBe(4);

    context.reset();

    expect(Object.keys(context._stats).length).toBe(0);
  });

  it('should print stats', () => {
    context.dispatch('awesomeCommand');

    context.printStats();

    expect(console.table).toBeCalledWith({
      awesomeCommand: 1
    });
  });
});
```

See more about [Plugin API reference](/plugins/README.md)
