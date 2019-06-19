import { Context, Logger } from '../../../src'
import { makeClass } from '../../helpers'

Context.use(Logger)

const ContextClass = Context.createClass()

describe('Logger', () => {
  it('should log command execution', () => {
    jest.spyOn(global.console, 'log')

    const SomeCommand = makeClass('SomeCommand')
      .onInstance({
        execute: jest.fn(),
      }).build()

    const context = new ContextClass({ commands: [SomeCommand] })

    context.registerModule('some/module', { commands: [SomeCommand] })

    context.dispatch('some/module/someCommand')

    expect(console.log).toBeCalled()
  })
})
