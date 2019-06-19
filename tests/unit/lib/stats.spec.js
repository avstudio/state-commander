import { Context } from '../../../src'
import Stats from '../../../src/lib/stats'

Context.use(Stats)

global.console = { table: jest.fn() }

const ContextClass = Context.createClass()

class AwesomeCommand {
  execute() {
    // do nonthing
  }
}

const context = new ContextClass({
  commands: [AwesomeCommand]
})

describe('Stats', () => {
  beforeEach(() => {
    context.reset()
  })

  it('should count command calls and reset context stats object', () => {
    context.dispatch('awesomeCommand')
    context.dispatch('awesomeCommand')
    context.dispatch('awesomeCommand')
    context.dispatch('awesomeCommand')

    expect(context._stats.awesomeCommand).toBe(4)

    context.reset()

    expect(Object.keys(context._stats).length).toBe(0)
  })

  it('should print stats', () => {
    context.dispatch('awesomeCommand')

    context.printStats()

    expect(console.table).toBeCalledWith({
      awesomeCommand: 1
    })
  })
})
