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
  it('should parse modueMap input', () => {
    const context = new ContextClass(
      {
        'some/module': {
          state: {
            value: 'some'
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
    const mdl = context._modules['some/module']
    expect(context._state[mdl.namespace].value).toBe('some')
    expect(mdl.getCommands().length).toBe(1)
  })
})
