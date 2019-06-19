class Command {
  constructor(...data) {
    this.init(...data)
  }

  // eslint-disable-next-line class-methods-use-this
  init() {
    // for mocking
  }
}

// eslint-disable-next-line import/prefer-default-export
export const makeClass = (name) => {
  const klass = class extends Command { }
  Object.defineProperty(klass, 'name', { value: name })
  return {
    onClass(map) {
      Object.entries(map).forEach(([key, fn]) => {
        klass[key] = fn
      })
      return this
    },

    onInstance(map) {
      Object.entries(map).forEach(([key, fn]) => {
        klass.prototype[key] = fn
      })
      return this
    },
    build() {
      return klass
    }
  }
}

export const resetContext = (Context) => {
  const hooks = {}
  const configuration = {}
  const definitions = {}
  const C = Context

  C.extensions.length = 0
  Object.defineProperty(C, 'definitions', {
    get() {
      return definitions
    }
  })
  Object.defineProperty(C, 'hooks', {
    get() {
      return hooks
    }
  })
  Object.defineProperty(C, 'configuration', {
    get() {
      return configuration
    }
  })
}
