# Vue Context

VueContext is State Commander and Vue extension to provide Vue reactivity and
context object for command execution.

## Installation

```js
import Vue from 'vue';
import { Context, VueContext, VueContextInstall } from 'state-commander';
import App from './App.vue';

//some commands
import * as commands from './commands';

Context.use(VueContext);

//support for Vue to register context object reference
Vue.use(VueContextInstall);

//create Context class with defaults
const ContextClass = Context.createClass();

// global context object
const context = new ContextClass({
  commands: Object.values(commands)
});

new Vue({
  el: '#app',
  context, //add context
  render: h => h(App)
});
```

## Example

```js
//@module commands.js

export class Notes {
  static get state() {
    return {
      notes: []
    };
  }

  getter() {
    return this.state.notes;
  }

  execute() {
    return new Promise(resolve => {
      // simulate long request
      setTimeout(() => {
        this.state.notes = notes;
        resolve(this.state.notes);
      }, 1000);
    });
  }
}

export class CheckAll {
  constructor(e, checked) {
    this.checked = checked;
  }

  commit() {
    this.state.notes.forEach(n => {
      const item = n;
      item.completed = this.checked;
    });
  }
}
```

```js
//component

export default {
  data() {
    return {
      // ...
    };
  },
  computed: {
    // ...
    noteList() {
      return this.$context.getters['notes'];
    }
    // ....
  },
  created() {
    //run execute method to retrieve data
    this.$context.dispatch('notes');
  },
  methods: {
    toggleChecked() {
      this.checked = !this.checked;
      this.$context.commit('checkAll', this.checked);
    }
  }
};
```

There is example app you can run.
There is an example app that demonstrates the use of this extension

[Example app](https://github.com/avstudio/state-commander)

For more info:
[Examples](/examples-and-support.md)

## Vue provide/inject with command helpers

Additionally, you can use
[Command Helpers](/plugins/official-plugins.md#command-helpers)
to create 'shortcuts' and call them directly in your components.

See more about how to install this plugin:
[Command Helpers](/plugins/official-plugins.md#command-helpers)

```js
// ...
Vue.use(CommandHelpers);
// ...
new Vue({
  provide: context.getHelpers(),
  el: '#app',
  context,
  render: h => h(App)
});
// ...
```

```js
export default {
  inject: ['notes', 'commitCheckAll'],
  data() {
    return {
      // ...
    };
  },
  computed: {
    // ...
    noteList() {
      return this.$context.getters['notes'];
    }
    // ....
  },
  created() {
    //run execute method to retrieve data
    // this.$context.dispatch('notes');
    this.notes();
  },
  methods: {
    toggleChecked() {
      this.checked = !this.checked;
      // this.$context.commit('checkAll', this.checked);
      this.commitCheckAll(this.checked);
    }
  }
};
```
