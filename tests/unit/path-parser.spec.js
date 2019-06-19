import PathParser from '../../src/path-parser'

describe('PathParser', () => {
  describe('#namespace', () => {
    it('should be valid without path ', () => {
      expect(new PathParser().path).toBeNull()
    })

    it('should remove extension and @', () => {
      expect(new PathParser('@ns/module.js').namespace).toBe('ns/module')
    })

    it('should return the same value', () => {
      expect(new PathParser('ns').namespace).toBe('ns')
    })

    it('should add parent filename in namespaces ', () => {
      expect(new PathParser('parent.js').join('doc/file.js').namespace).toBe('parent/doc/file')
    })

    it('should replace the same common path segments', () => {
      expect(
        new PathParser('/documents/work/parentModule.js').join(
          '/documents/work/childModule.js'
        ).namespace
      ).toBe('documents/work/parentModule/childModule')
    })

    it('should replace one common segment', () => {
      expect(
        new PathParser('/documents/work/parentModule.js').join(
          '/documents/childModule.js'
        ).namespace
      ).toBe('documents/work/parentModule/childModule')
    })

    it('should join namespaces', () => {
      expect(
        new PathParser('parentPath/parentModule.js').join(
          'childPath/childModule.js'
        ).namespace
      ).toBe('parentPath/parentModule/childPath/childModule')
    })

    it('should set child namespace if parent does not exist', () => {
      expect(
        new PathParser().join(
          'childPath/childModule.js'
        ).namespace
      ).toBe('childPath/childModule')
    })

    it('should prepend namespace', () => {
      expect(
        new PathParser('parentPath/parentModule.js').join(
          'childPath/childModule.js',
          { prepend: true }
        ).namespace
      ).toBe('childPath/childModule/parentPath/parentModule')
    })
  })

  describe('#path', () => {
    it('should keep @', () => {
      expect(new PathParser('@ns/module.js').path).toBe('@ns/module.js')
    })

    it('should keep the same path', () => {
      expect(new PathParser('parent/file.js').join('child/file.js').path).toBe('parent/file.js')
    })
  })

  describe('#moduleName', () => {
    it('should be undefined', () => {
      expect(new PathParser().moduleName).toBeNull()
    })

    it('should extract last part of path with or without ext as module name', () => {
      expect(new PathParser('/ns1/ns2/fooModule').moduleName).toBe('fooModule')
      expect(new PathParser('/ns1/ns2/fooModule.js').moduleName).toBe('fooModule')
    })
  })
})
