import Handler from '../../../src/lib/handler'
import DefaultDefinition from '../../../src/lib/default-definition'
import Module from '../../../src/lib/module'
import Context from '../../../src/context'
import { makeClass } from '../../helpers'

Context.use(DefaultDefinition)
Context.use(Handler)
Context.use(Module)

const HandlerClass = Context.Handler.createClass()
const ContextClass = Context.createClass()

describe('Handler', () => {
  it('should should extend Context', () => {
    expect(Context.Handler).toBeDefined()
  })

  it('should create Handler', () => {
    const Command = makeClass('Command').onInstance({
      execute() {}
    }).build()
    const context = new ContextClass()
    const mdl = context.registerModule('some/path')
    const handler = Context.Handler.create(mdl, Command, ContextClass.definition.action)
    const { definition } = ContextClass

    expect(handler._definition).toBe(definition.action)
    expect(handler._invokeFn).toBeInstanceOf(Function)
    expect(handler.registrationKey).toBe('some/path/command')
  })

  it('should hooks', () => {
    const before = jest.fn()
    const after = jest.fn()
    Context.hooks['handler:invoke'].attach((data, next) => {
      before()
      next()
      after()
    })
    const command = () => 'result'
    const handler = new HandlerClass(command)

    expect(handler.invoke()).toBe('result')
    expect(before).toHaveBeenCalledTimes(1)
    expect(after).toHaveBeenCalledTimes(1)
  })
})
