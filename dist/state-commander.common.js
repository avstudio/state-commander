/**
 * state-commander v0.0.2
 * (c) 2019 Aleksandar Vucic
 * @license MIT
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const isPromise = val => val && typeof val.then === 'function';

function assert(condition, msg) {
  if (!condition) throw new Error(`[StateCommander] ${msg}`)
}

// todo refactoring required
function makeRegistrationKey({ path = '', command = '', prefix = '' }) {
  assert(path || command, 'path or command required');
  const cn = command.charAt(0).toLowerCase() + command.slice(1);
  const cleanPath = path.replace(/(\W)+\/|\.{1,2}\/|\.\w+$/g, ''); // remove suffix, ./../ or extension
  const base = `${prefix}:${cleanPath}/${cn}`;
  return base
    .replace(/^[/:]+/, '')
    .replace(/\/\//, '/')
    .replace(/:\//, ':')
}

function makeHelperName(regKey) {
  return regKey
    .replace(/(\W)+\/|:after|:before|\.{1,2}\/|\.\w+$/g, '') // remove suffix, ./../ or extension
    .replace(/^\//, '') // remove first slash
    .replace(/:/g, '/') // convert : to /
    .replace(/(\/{1,2}\w)/g, c => c.toUpperCase() // replace slash and character to uppercase
      .replace(/\/{1,2}/, ''))
}

function parsePath(path = '') {
  const out = {
    full: null, root: null, filePath: null, filename: null, ext: null
  };
  // todo more testing
  const reg = /^(\w:[/\\]|[/\\]|[.]+[/\\]|^)(.*?)[\\/]?([^.\\/]+)(\.\w+$)?$/;
  if (!path) { return out }

  ({
    0: out.full = '',
    1: out.root = '',
    2: out.filePath = '',
    3: out.filename = '',
    4: out.ext = ''
  } = reg.exec(path) || []);

  return out
}

const toLowerCaseFirst = s => s.charAt(0).toLowerCase() + s.slice(1);

// https: //gist.github.com/sylvainleris/6a051f2a9e7420b32b6db7d8d47b968b
const last = a => a[a.length - 1];
const reduceOneRight = a => a.slice(0, -1);

class Hook {
  attach(fn) {
    this.execute = (stack => (...args) => stack(...reduceOneRight(args), () => {
      const next = last(args);
      fn.apply(this, [
        ...reduceOneRight(args),
        next.bind.apply(next, [null, ...reduceOneRight(args)])
      ]);
    }))(this.execute);
  }

  execute(...args) {
    const next = last(args);
    next.apply(this, reduceOneRight(args));
  }
}

const hooks = {};
const extensions = [];
const configuration = {};
const definitions = {};
const PluginInterface = [
  'extend', // extend created class
  'name', // registration name
  'description',
  'initialize', // on class initialization
  'reset'// on context reset
];

function registerHook(name) {
  assert(/^[\w/]+:\w+$/.test(name), 'invalid hook name. It should be: pluginNamePrefix:hookName');
  assert(!this.hooks[name], `hook ${name} is already registered`);
  Object.assign(this.hooks, { [name]: new Hook() });
}

function registerConfig(ext, config = {}) {
  const configName = toLowerCaseFirst(ext);
  if (!this.configuration[configName]) {
    Object.assign(this.configuration, { [configName]: config });
  }
}

function registerDefinition(definition = {}) {
  const [[key, entry = {}] = []] = Object.entries(definition);

  assert(key && Object.keys(entry).length, 'definition is empty');

  assert(!this.definitions[key], `definition ${key} already exists`);

  Object.entries(entry).forEach(([, item]) => {
    assert(Object.keys(item).length, 'definition of action is empty');
    assert(item.handler instanceof Function, 'missing handler');
    assert(item.invokeFn, 'missing invokeFn');
  });

  Object.assign(this.definitions, { [key]: definition[key] });
}

class Base {
  constructor(...data) {
    extensions.filter(ext => ext.initialize).forEach(ext => ext.initialize(this, ...data));
  }

  reset() {
    extensions.filter(ext => ext.reset).forEach(ext => ext.reset(this));
  }
}

var Context = {
  get Base() { return Base },
  get hooks() { return hooks },
  get configuration() { return configuration },
  get definitions() { return definitions },
  get extensions() { return extensions },
  use(ext, ...args) {
    assert(ext.name, 'missing plugin name');

    if (extensions.find(e => e.name === ext.name)) {
      return
    }

    if (ext.hooks) {
      ext.hooks.forEach((hook) => {
        registerHook.call(this, hook);
      });
    }

    if (ext.configuration) {
      registerConfig.call(this, ext.name, ext.configuration);
    }

    if (ext.definition) {
      registerDefinition.call(this, ext.definition);
    }

    if (ext.install) {
      ext.install(this, ...args);
    }

    PluginInterface.filter(n => ext[n]);

    extensions.push(
      PluginInterface.reduce((prev, fn) => ({ ...prev, [fn]: ext[fn] }), {})
    );
  },
  createClass(input) {
    const [name = 'default', options] = !input || typeof input === 'string'
      ? [input, {}]
      : [undefined, input];
    const Context = class extends this.Base { };

    const definition = this.definitions[name];
    assert(definition, `definition ${name} not found`);

    Context.definition = definition;
    Context.configuration = configuration;
    Context._$factory = this;

    extensions.filter(e => e.extend).forEach(e => e.extend(Context, options));

    return Context
  }
};

/* eslint-disable no-underscore-dangle */

function applyPathValues(path) {
  this._moduleName = path.filename;
  if (!this._path) { this._path = path.full; }
  this._namespace = [path.filePath, path.filename]
    .filter(Boolean)
    .join('/')
    .replace(/^\W+/, '');
  this._extension = path.ext;
}

const removeCommonSegments = (parent, child) => {
  const [a, b] = [parent.split('/'), child.split('/')];
  return b.filter((el, i) => a[i] !== el).join('/')
};

class PathParser {
  constructor(path = '') {
    this._path = '';
    this._namespace = '';
    // set defaults on initializer
    this.join(path);
  }

  get path() {
    return this._path
  }

  get moduleName() {
    return this._moduleName
  }

  get namespace() {
    return this._namespace
  }

  prepend(input = '') {
    this.join(input, { prepend: true });
  }

  join(input = '', { prepend = false } = {}) {
    const currentPath = parsePath(this._path);
    const newPath = parsePath(input);

    // for the first time just set values
    if (!currentPath.full) {
      applyPathValues.call(this, newPath);
      return this
    }

    // if no child path just skip all
    if (!newPath.full) { return this }

    const [parent, child] = prepend
      ? [newPath, currentPath]
      : [currentPath, newPath];

    // remove common segments
    const childWithoutParent = removeCommonSegments(parent.filePath, child.filePath);

    // join namespace
    this._namespace = [
      parent.filePath,
      parent.filename,
      childWithoutParent,
      child.filename
    ].filter(Boolean).join('/');

    return this
  }
}

const configuration$1 = {
  rootModuleName: 'root'
};

const hooks$1 = {};

class Base$1 {
  registerCommand(Command) {
    const command = Command;

    assert(
      Command && [
        Command.prototype.execute,
        Command.prototype.commit,
        Command.prototype.getter && Command.state
      ].some(t => t),
      `invalid command class ${Command.name}.
    class must have declared at least:
    execute, commit or getter with state property`
    );

    const { definition, Handler } = this.context.constructor;
    assert(definition, 'Missing context definition');
    assert(Handler, 'Handler extension is required');

    hooks$1['module:registerCommand'].execute(
      { command: Command },
      this,
      () => {
        command.registrationKey = makeRegistrationKey(
          { path: this.namespace, command: Command.name }
        );

        Object.entries(definition).forEach(([, item]) => {
          const fnName = item.invokeFn.name
            ? item.invokeFn.name
            : item.invokeFn;

          if (typeof Command.prototype[fnName] === 'function') {
            const handler = Handler.create(this, Command, item);
            // set reference to command
            Object.defineProperty(handler, 'command', {
              get() { return command }
            });
            this.context[`_${item.map}`][handler.registrationKey] = handler;
          }
        });
        this._commands.push(Command);
      }
    );
  }

  unregisterCommand(Command) {
    const { definition } = this.context.constructor;

    assert(definition, 'Missing context definition');

    hooks$1['module:unregisterCommand'].execute(
      { command: Command },
      this,
      () => {
        Object.entries(definition).forEach(([, item]) => {
          delete this.context[`_${item.map}`][Command.registrationKey];
        });
        this._commands = this._commands.filter(
          c => c.registrationKey !== Command.registrationKey
        );
      }
    );
  }

  getCommands() {
    return this._commands
  }

  unregisterAllCommands() {
    return this._commands.forEach(c => this.unregisterCommand(c))
  }
}

function getModules() {
  return this._modules
}

function getModule(key) {
  return this._modules[key]
}

function registerModule(m, { commands = [] } = {}) {
  assert(
    typeof m === 'string' || (m && m.constructor.name === 'Module'),
    'argument must be string (path) or instance of Module'
  );

  const newModule = typeof m === 'string'
    ? this.constructor.Module.create(this, m, { commands })
    : m;

  hooks$1['module:register'].execute(
    { module: newModule },
    this, () => {
      const key = newModule.registrationKey;
      assert(key, 'registration key is missing');
      assert(!this._modules[key], 'module already exists');

      this._modules[key] = newModule;
    }
  );
  return newModule
}

function unregisterModule(m) {
  assert(
    typeof m === 'string' || (m && m.constructor.name === 'Module'),
    'argument must be string (path) or instance of Module'
  );
  const mdl = m.registrationKey ? m : this.getModule(m);
  if (!mdl) { return }

  hooks$1['module:unregister'].execute(
    { module: mdl },
    this, () => {
      mdl.unregisterAllCommands();
      delete this._modules[mdl.registrationKey];
    }
  );
}

const ModuleFactory = {
  Base: Base$1,
  create(context, path,
    {
      commands = [],
      name = configuration$1.rootModuleName
    } = {}) {
    const pathParser = new PathParser(path);
    const Module = class extends this.Base { };

    const _module = new Module();

    Object.defineProperty(_module, 'context', {
      get() { return context }
    });

    Object.defineProperty(_module, '_pathParser', {
      get() { return pathParser }
    });

    Object.defineProperty(_module, 'path', {
      get() { return _module._pathParser.path }
    });

    Object.defineProperty(_module, 'namespace', {
      get() { return _module._pathParser.namespace }
    });

    Object.defineProperty(_module, 'name', {
      get() { return name || _module._pathParser.moduleName }
    });

    Object.defineProperty(_module, 'registrationKey', {
      get() {
        return (
          _module._pathParser.namespace
          || _module._pathParser.moduleName
          || _module.name
        ).toLowerCase()
      }
    });

    _module._commands = [];
    commands.forEach(c => _module.registerCommand(c));

    return _module
  }
};

var Module = {
  name: 'Module',
  hooks: [
    'module:register',
    'module:unregister',
    'module:registerCommand',
    'module:unregisterCommand',
  ],
  configuration: configuration$1,
  install(ContextFactory) {
    const Context = ContextFactory;
    Context.Module = ModuleFactory;

    // keep reference
    hooks$1['module:register'] = Context.hooks['module:register'];
    hooks$1['module:unregister'] = Context.hooks['module:unregister'];
    hooks$1['module:registerCommand'] = Context.hooks['module:registerCommand'];
    hooks$1['module:unregisterCommand'] = Context.hooks['module:unregisterCommand'];

    Context.Base.Module = Context.Module;
    Context.Base.prototype.getModule = getModule;
    Context.Base.prototype.getModules = getModules;
    Context.Base.prototype.registerModule = registerModule;
    Context.Base.prototype.unregisterModule = unregisterModule;
  },
  initialize(contextInstance, { commands = [] } = {}) {
    const context = contextInstance;
    context._modules = Object.create(null);

    context.registerModule(
      // add single root/non namespaced module
      context.constructor.Module.create(context, null, { commands })
    );
  }
};

const definition = {
  initializer: {
    prefix: 'init',
    map: 'initializers',
    invokeFn: 'initialize',
    // invoke multiple commands with pattern matching
    // todo improve this
    handler: /* async */ function initialize(event) {
      if (/\*/.test(event || '')) {
        return this._callAllCommands(this._initializers, event)
      }
      return this._callCommand(this._initializers, event)
    }
  },
  action: {
    map: 'actions',
    invokeFn: 'execute',
    // note the name here
    handler: /* async */ function dispatch(event, payload) {
      return this._callCommand(this._actions, event, payload)
    }
  },
  mutation: {
    map: 'mutations',
    prefix: 'commit',
    invokeFn: 'commit',
    // note the name here
    handler: function commit(event, payload) {
      return this._callCommandSync(this._mutations, event, payload)
    }
  },
};

var DefaultDefinition = {
  name: 'DefaultDefinition',
  definition: {
    default: definition
  },
  initialize(contextInstance) {
    const context = contextInstance;
    Object.entries(context.constructor.definition).forEach(([, item]) => {
      if (item.map) {
        context[`_${item.map}`] = Object.create(null);
      }

      context[item.handler.name] = (event, payload) => item.handler.call(
        context,
        item.prefix ? `${item.prefix}:${event}` : event,
        payload
      );
    });
  },
};

const hooks$2 = { };

class Base$2 {
  constructor(fn) {
    this._invokeFn = fn;
  }

  invoke(event, payload) {
    let res;
    hooks$2['handler:invoke'].execute(
      { event, payload, context: this },
      () => {
        res = this._invokeFn(event, payload);
      }
    );
    return res
  }
}

const HandlerFactory = {
  Base: Base$2,
  createClass() {
    const Handler = class extends this.Base { };
    return Handler
  },
  create(mdl, Command, definition) {
    const { invokeFn } = definition;
    const HandlerClass = this.createClass();

    const handler = new HandlerClass();
    Object.defineProperty(handler, 'module', {
      get() { return mdl }
    });

    Object.defineProperty(handler, '_definition', {
      get() { return definition }
    });

    Object.defineProperty(handler, '_invokeFn', {
      get() {
        return (...data) => (invokeFn instanceof Function
          ? invokeFn(new Command(...data))
          : new Command(...data)[invokeFn]())
      }
    });

    Object.defineProperty(handler, 'registrationKey', {
      get() {
        return makeRegistrationKey(
          {
            path: mdl.namespace,
            command: Command.name,
            prefix: definition.prefix
          }
        )
      }
    });

    return handler
  }
};

var Handler = {
  name: 'Handler',
  hooks: ['handler:invoke'],
  install(ContextFactory) {
    const Context = ContextFactory;
    Context.Handler = HandlerFactory;
    hooks$2['handler:invoke'] = Context.hooks['handler:invoke'];
    Context.Base.Handler = Context.Handler;
  }
};

const hooks$3 = {};
const configuration$2 = { };
// todo improve this
const patternKeyRegex = pattern => new RegExp(
  /\/*/.test(pattern) ? pattern.replace('*', '(.*?)') : 'a^'
);

const defaultNotFoundHandler = e => assert(false, `Command not found ${e}`);


function _callCommandSync(map, event, payload) {
  let res;

  hooks$3['command:invoke'].execute({
    map,
    event,
    payload
  },
  this,
  () => {
    const handler = map[event];
    res = handler
      ? handler.invoke(event, payload)
      : this._commandNotFound(event, payload);
  });
  return res
}

function _commandNotFound(event, data) {
  configuration$2.notFoundHandler()(event, data);
}

function _callCommand(map, event, payload) {
  const response = this._callCommandSync(map, event, payload);
  if (!isPromise(response)) {
    return Promise.resolve(response)
  }
  return response
}

function _callAllCommands(map, event, data) {
  if (/\/*/.test(event)) {
    const reg = patternKeyRegex(event);
    return Promise.all(Object.keys(map).reduce((prev, key) => {
      if (reg.test(key)) {
        prev.push(this._callCommand(map, key, data));
      }
      return prev
    }, []))
  }
  return Promise.all([])
}

var CommandDispatcher = {
  name: 'CommandDispatcher',
  hooks: ['command:invoke'],
  install(ContextFactory) {
    const Context = ContextFactory;
    const proto = Context.Base.prototype;

    proto._callCommand = _callCommand;
    proto._callCommandSync = _callCommandSync;
    proto._callAllCommands = _callAllCommands;
    proto._commandNotFound = _commandNotFound;

    // workaround to skip namespace for this module in Context configuration
    configuration$2.notFoundHandler = (
    ) => Context.configuration.notFoundHandler || defaultNotFoundHandler;

    hooks$3['command:invoke'] = Context.hooks['command:invoke'];
  }
};

const configuration$3 = {
  buildState: (state = {}) => state,
  setState: (oldState, key, value) => Object.assign(oldState, { [key]: value })
};

const hooks$4 = { };

function initState(contextInstance, force = false) {
  const context = contextInstance;
  if (!context._state || force !== !1) {
    context.getters = {};
    context._state = configuration$3.buildState({});
  }
}

function registerState(key, state, { override = false } = {}) {
  assert(key, 'missing key for state registration');

  initState(this);

  hooks$4['state:register'].execute(
    { key, state },
    this,
    () => {
      assert(!(override === !1 && this._state[key]), `state for ${key} already exists `);

      configuration$3.setState(this._state, key, state);
    }
  );
}

function unregisterState(key) {
  hooks$4['state:unregister'].execute(
    { key },
    this,
    () => {
      delete this.getters[key];

      Object.getOwnPropertyNames(this.getters).forEach((k) => {
        if (k.startsWith(key)) {
          delete this.getters[k];
        }
      });

      delete this._state[key];
    }
  );
}

const registerHook$1 = ({ module: mdl }, context, next) => {
  // first time
  initState(context);
  // let module to the things first
  next();

  const key = mdl.registrationKey;

  // register module if it's not already registered
  if (!context.state[key]) {
    context.registerState(key, {});
  }
};

const unregisterHook = ({ module: mdl }, context, next) => {
  next();
  mdl.context.unregisterState(mdl.registrationKey);
};

const registerCommandHook = ({ command }, mdl, next) => {
  // first time
  initState(mdl.context);
  // let module to the things first
  next();

  const Command = command;
  const { state = {}, registrationKey } = Command;
  const { getters, state: rootState } = mdl.context;

  // set context state to be available to command class instance
  Command.prototype.rootState = rootState;

  const mKey = mdl.registrationKey;

  // register module if doesn't exists
  if (!rootState[mKey]) {
    mdl.context.registerState(mKey, {});
  }

  const mState = rootState[mKey];

  // copy command state keys and assign to the module state
  Object.keys(state).forEach(
    (key) => {
      if (!mState[key]) {
        const desc = Object.getOwnPropertyDescriptor(state, key);
        // TODO rethink this
        // check if state property is not only getter
        if (desc.writable) {
        // use setter function from configuration
          configuration$3.setState(mState, key, state[key]);
        } else {
          // define getter only
          Object.defineProperty(mState, key, desc);
        }
      }
    }
  );

  // build state with factory and set to the instance
  Command.prototype.state = mState;

  // register command getter
  if (!getters[registrationKey] && typeof Command.prototype.getter === 'function') {
    Object.defineProperty(getters, registrationKey, {
      get() {
        return new Command().getter()
      },
      configurable: true
    });
  }
};

const unregisterCommandHook = ({ command }, mdl, next) => {
  next();
  mdl.context.unregisterState(command.registrationKey);
};

var State = {
  name: 'State',
  hooks: ['state:register', 'state:unregister'],
  configuration: configuration$3,
  install(ContextFactory) {
    const Context = ContextFactory;

    Context.State = this;

    Object.defineProperty(Context.Base.prototype, 'state', {
      get() {
        initState(this);
        return this._state
      },
    });
    Context.Base.prototype.registerState = registerState;
    Context.Base.prototype.unregisterState = unregisterState;

    assert(Context.Module, 'Missing Module which is required by State');

    // keep reference
    hooks$4['state:register'] = Context.hooks['state:register'];
    hooks$4['state:unregister'] = Context.hooks['state:unregister'];

    // attach handlers on the command registration hook to set the state
    Context.hooks['module:register'].attach(registerHook$1);
    Context.hooks['module:unregister'].attach(unregisterHook);
    Context.hooks['module:registerCommand'].attach(registerCommandHook);
    Context.hooks['module:unregisterCommand'].attach(unregisterCommandHook);
  },
  initialize(context) {
    initState(context);
  },
  reset(context) {
    initState(context, true);
  }
};

// configuration object for the possibility to be overwritten
const configuration$4 = {
  statsPrinter: stats => console.table(stats)
};

// This will be associated with context object instance
function printStats() {
  return configuration$4.statsPrinter(this._stats)
}

const commandInvokeHookHandler = ({ event }, contextInstance, next) => {
  // let flow continue and do counting after command is done
  next();

  const context = contextInstance;
  context._stats[event] = context._stats[event] || 0;
  context._stats[event] += 1;
};

var stats = {
  name: 'CommandStats',

  description: 'Plugin description',

  // set configuration
  // This can be overwritten
  // Context.configuration.commandStats.statsPrinter = ()=>{}
  configuration: configuration$4,

  // install method for our plugin
  // ContextFactory is actual the main Context object
  install(ContextFactory) {
    const Context = ContextFactory;

    // set our printer method on the context instance object
    Context.Base.prototype.printStats = printStats;

    // attach hook handler to the command invoke hook
    Context.hooks['command:invoke'].attach(commandInvokeHookHandler);
  },
  // runs on the context object initialization
  initialize(context) {
    // actually set out map
    this.reset(context);
  },
  // reset method. It is not mandatory and it depends on the plugin logic and purpose
  reset(contextInstance) {
    const context = contextInstance;
    context._stats = {};
  }
};

function addChild(child) {
  assert(
    (child && child.constructor.name === 'Module'),
    'argument must be string (path) or instance of Module'
  );

  this.context.unregisterModule(child);
  child._pathParser.prepend(this.path);
  this.context.registerModule(child);
  return this
}

var moduleInheritance = {
  name: 'ModuleInheritance',
  install(ContextFactory) {
    const Context = ContextFactory;
    Context.Module.Base.prototype.addChild = addChild;
  }
};

var moduleMapper = {
  name: 'ModuleMapper',
  description: 'Parse modules map input',
  initialize(context, options) {
    this.reset(context, options);
  },
  reset(context, options = {}) {
    Object.entries(options).forEach(([
      path, {
        state,
        commands = []
      } = {}]) => {
      const mdl = context.registerModule(path, { commands });

      // "override" if already exists
      if (state) {
        context.registerState(mdl.namespace, state, { override: true });
      }
    });
  }
};

const getFnName = fn => (typeof fn === 'function' ? fn.name : fn);
const createHelperName = (
  custom, prefix, registrationKey
) => custom || makeHelperName(`${prefix || ''}/${registrationKey}`);


const registerCommandHook$1 = ({ command }, mdl, next) => {
  const { context } = mdl;
  // init map if does not exists
  if (!context._helpers) { context._helpers = {}; }

  // let module continue with his job
  next();

  const Command = command;
  const { helpers = {}, registrationKey } = Command;
  const { getters } = context;
  const { definition } = context.constructor;

  // collect all definition actions and create helper names based on the invoke function name
  Object.values(definition).forEach((item) => {
    const invokeFnName = getFnName(item.invokeFn);
    if (typeof Command.prototype[invokeFnName] === 'function') {
      // use user predefined name if exists or compute one
      const helperName = helpers[invokeFnName] || createHelperName(null, item.prefix, registrationKey);
      if (!context._helpers[helperName]) {
        const handlerName = item.handler.name;
        const handlerFn = context[handlerName];
        // connect helper name and handler
        context._helpers[helperName] = payload => handlerFn(registrationKey, payload);
      }
    }
  });

  if (typeof Command.prototype.getter === 'function') {
    const getterHelperName = createHelperName(helpers.getter, 'get', registrationKey);

    if (!context._helpers[getterHelperName]) {
      context._helpers[getterHelperName] = () => getters[registrationKey];
    }
  }
};

const unregisterCommandHook$1 = ({ command }, mdl, next) => {
  next();

  const Command = command;
  const { helpers = {}, registrationKey } = Command;
  const { context } = mdl;
  const { definition } = context.constructor;

  const getterHelperName = createHelperName(helpers.getter, 'get', registrationKey);
  delete context._helpers[getterHelperName];

  Object.values(definition).forEach((item) => {
    const invokeFnName = getFnName(item.invokeFn);
    const helperName = helpers[invokeFnName] || createHelperName(null, item.prefix, registrationKey);
    delete context._helpers[helperName];
  });
};

function getHelpers() {
  return this._helpers
}

var commandHelpers = {
  name: 'CommandHelpers',
  description: 'Generate helper methods for registered commands',
  install(ContextFactory) {
    const Context = ContextFactory;

    assert(Context.State, 'Missing State which is required by Command Helpers');

    // attach to hook for command registration
    Context.hooks['module:registerCommand'].attach(registerCommandHook$1);
    Context.hooks['module:unregisterCommand'].attach(unregisterCommandHook$1);

    Context.Base.prototype.getHelpers = getHelpers;
  },
  initialize(context) {
    // prevent user to define GET prefix because it is used here in construction of getter helper name
    assert(
      !Object.values(context.constructor.definition).some(el => /get/i.test(el.prefix)),
      'prefix GET is reserved and used by CommandHelpers module. Please consider to define different prefix in context definition'
    );
  }
};

function vueContextInit() {
  const options = this.$options;
  if (options.context) {
    this.$context = typeof options.context === 'function'
      ? options.context()
      : options.context;
  } else if (options.parent && options.parent.$context) {
    this.$context = options.parent.$context;
  }
}

//  recursion to set a deep property on an object and hook it into the Vue reactivity system
function setState(state, key, value) {
  if (!state[key]) {
    this.set(state, key, {});
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    Object.entries(value).forEach(([k, item]) => {
      setState.call(this, state[key], k, item);
    });
  } else {
    // eslint-disable-next-line no-param-reassign
    state[key] = value;
  }
}

const VuePlugin = {
  install(Vue) {
    Vue.mixin({
      beforeCreate: vueContextInit
    });
  }
};

var vueContext = {
  name: 'VueContext',
  description: 'Connect State Commander with Vue',
  install(_Context, { vue: Vue }) {
    const Context = _Context;
    Context.configuration.state.buildState = (state = {}) => Vue.observable(state);
    Context.configuration.state.setState = (
      state, key, value
    ) => setState.call(Vue, state, key, value);
    // set context object in Vue
    Vue.use(VuePlugin);
  }
};

const log = (e, data = 'No data') => {
  console.log(`%cCOMMAND%c${e}`,
    'background: #009688; color: white; padding: 2px 4px; border-radius: 3px 0 0 3px; font-weight: bold;',
    'background: #dadedf; color: rgba(0,0,0,0.87); padding: 2px 4px; border-radius: 0 3px 3px 0; font-weight: bold;', data);
};

const callCommandHook = ({ event, payload }, _, next) => {
  log(event, payload);
  next();
};

var logger = {
  name: 'Logger',
  description: 'Log command execution',
  install(ContextFactory) {
    const Context = ContextFactory;
    Context.hooks['command:invoke'].attach(callCommandHook);
  }
};

Context.use(DefaultDefinition);
Context.use(CommandDispatcher);
Context.use(Module);
Context.use(Handler);
Context.use(State);

exports.CommandHelpers = commandHelpers;
exports.Context = Context;
exports.Logger = logger;
exports.ModuleInheritance = moduleInheritance;
exports.ModuleMapper = moduleMapper;
exports.Stats = stats;
exports.VueContext = vueContext;
exports.makeHelperName = makeHelperName;
exports.makeRegistrationKey = makeRegistrationKey;
