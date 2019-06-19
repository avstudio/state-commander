import Vue from 'vue'
import { Context } from '../../../src'
import VueContext from '../../../src/lib/vue-context'
import ModuleMapper from '../../../src/lib/module-mapper'
import { makeClass } from '../../helpers'

Context.use(VueContext, { vue: Vue })
Context.use(ModuleMapper)

const ContextClass = Context.createClass()

describe('VueContext', () => {
  it('should extend Vue', () => {
    const context = new ContextClass()
    const vm = new Vue({
      context,
      render: h => h('<div/>')
    })
    expect(vm.$context).toBeDefined()
    expect(vm.$context.dispatch).toBeDefined()
  })

  it('should recursively set Vue observer', (done) => {
    const context = new ContextClass(
      {
        'some/module': {
          state: {
            value1: 'value1',
            value2: 'value2',
            nested: {
              value1: 'value1',
              deepNested: {

                value1: 'value1',
              }
            }
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
            value2: 'value2',
            nested: {
              value1: 'value1',
              deepNested: {
                value1: 'value1',
              }
            },
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

    expect(context._state.__ob__).toBeDefined()
    expect(context.state['some/module'].__ob__).toBeDefined()
    expect(context.state['some/module'].nested.__ob__).toBeDefined()
    expect(context.state['some/module'].nested.deepNested.__ob__).toBeDefined()
    expect(context.state['some/module2'].__ob__).toBeDefined()
    expect(context.state['some/module2'].nested.__ob__).toBeDefined()
    expect(context.state['some/module2'].nested.deepNested.__ob__).toBeDefined()

    const vm = new Vue()

    const cb = jest.fn()
    vm.$watch(() => context.state['some/module2'].nested.deepNested, (val) => {
      cb(val)
    })

    context.state['some/module2'].nested.deepNested = 'new value'

    setTimeout(() => {
      expect(cb).toBeCalledWith('new value')
      done()
    }, 200)
  })
})
