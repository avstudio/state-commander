import Context from '../../../src/context'
import Module from '../../../src/lib/module'
import Handler from '../../../src/lib/handler'
import State from '../../../src/lib/state'
import DefaultDefinition from '../../../src/lib/default-definition'
import ModuleMapper from '../../../src/lib/module-mapper'
import { makeClass } from '../../helpers'

Context.use(Handler)
Context.use(Module)
Context.use(State)
Context.use(DefaultDefinition)
Context.use(ModuleMapper)

const ContextClass = Context.createClass()

describe('ModuleMapper', () => {
  it('should parse module Map input', () => {
    const context = new ContextClass(
      {
        'some/module': {
          state: {
            value1: 'value1',
            value2: 'value2'
          },
          commands: [
            makeClass('Command').onInstance({
              execute() { },
              commit() { }
            }).build()
          ]
        },
        'some/module2': {
          state: {
            value1: 'value1',
            value2: 'value2'
          },
          commands: [
            makeClass('Command').onInstance({
              execute() { },
              commit() { }
            }).build()
          ]
        }
      }
    )
    const mdl1 = context._modules['some/module']
    const mdl2 = context._modules['some/module2']

    expect(context.state[mdl1.namespace].value1).toBe('value1')
    expect(context.state[mdl1.namespace].value2).toBe('value2')

    expect(context.state[mdl2.namespace].value1).toBe('value1')
    expect(context.state[mdl2.namespace].value2).toBe('value2')

    expect(mdl1.getCommands().length).toBe(1)
    expect(mdl2.getCommands().length).toBe(1)
  })
})
