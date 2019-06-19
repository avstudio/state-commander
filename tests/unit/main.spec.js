import { Context } from '../../src'

describe('StateCommander', () => {
  describe('Base configuration', () => {
    it('should have default extension', () => {
      expect(Context.definitions.default).toBeDefined()
      expect(Context.Module).toBeDefined()
      expect(Context.Handler).toBeDefined()
      expect(Context.Base.prototype.registerState).toBeDefined()
    })
  })
})
