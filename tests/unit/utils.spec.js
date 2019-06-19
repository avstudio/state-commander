import { makeRegistrationKey, makeHelperName, parsePath } from '../../src/utils'

describe('#registrationKey', () => {
  it('should return valid key without prefix', () => {
    expect(
      makeRegistrationKey({ path: 'ns/module', command: 'UpdateCommand' })
    ).toBe('ns/module/updateCommand')

    expect(
      makeRegistrationKey({ path: '/ns/module', command: 'UpdateCommand' })
    ).toBe('ns/module/updateCommand')

    expect(
      makeRegistrationKey({ path: '/ns/module/', command: 'UpdateCommand' })
    ).toBe('ns/module/updateCommand')
  })

  it('should return valid key with prefix', () => {
    expect(
      makeRegistrationKey({
        prefix: 'commit',
        path: '/ns/module/',
        command: 'UpdateCommand'
      })
    ).toBe('commit:ns/module/updateCommand')

    expect(
      makeRegistrationKey({
        prefix: 'commit',
        path: 'ns/module/',
        command: 'UpdateCommand'
      })
    ).toBe('commit:ns/module/updateCommand')
  })

  it('should return valid key without path and prefix', () => {
    expect(
      makeRegistrationKey({
        command: 'UpdateCommand'
      })
    ).toBe('updateCommand')
  })

  it('should return valid key without path and with prefix', () => {
    expect(
      makeRegistrationKey({
        prefix: 'commit',
        command: 'UpdateCommand'
      })
    ).toBe('commit:updateCommand')
  })

  it('should ignore path part ./../, symbols and extension', () => {
    expect(makeRegistrationKey({
      path: '../../ns1/module.js',
      command: 'UpdateCommand',
      prefix: 'commit'
    })).toBe('commit:ns1/module/updateCommand')

    expect(makeRegistrationKey({
      path: './ns1/module.js',
      command: 'UpdateCommand',
      prefix: 'commit'
    })).toBe('commit:ns1/module/updateCommand')

    expect(makeRegistrationKey({
      path: '@/../ns1/module.js',
      command: 'UpdateCommand',
      prefix: 'commit'
    })).toBe('commit:ns1/module/updateCommand')

    expect(makeRegistrationKey({
      path: '#/ns1/module.js',
      command: 'UpdateCommand',
      prefix: 'commit'
    })).toBe('commit:ns1/module/updateCommand')

    expect(makeRegistrationKey({
      path: '#/ns1/module.js',
      command: 'UpdateCommand'
    })).toBe('ns1/module/updateCommand')
  })
})

describe('#makeHelperName', () => {
  it('should return valid name without prefix', () => {
    expect(makeHelperName('ns1/ns2/module')).toBe('ns1Ns2Module')
    expect(makeHelperName('module')).toBe('module')
  })

  it('should return valid name with prefix', () => {
    expect(makeHelperName('commit:ns1/ns2/module')).toBe('commitNs1Ns2Module')
    expect(makeHelperName('commit:module')).toBe('commitModule')
  })

  it('should ignore suffix', () => {
    expect(makeHelperName('commit:ns1/ns2/module:after')).toBe('commitNs1Ns2Module')
    expect(makeHelperName('ns1/ns2/module:after')).toBe('ns1Ns2Module')

    expect(makeHelperName('commit:ns1/ns2/module:before')).toBe('commitNs1Ns2Module')
    expect(makeHelperName('ns1/ns2/module:before')).toBe('ns1Ns2Module')
  })

  it('should ignore path part ./../, symbols and extension', () => {
    expect(makeHelperName('../../ns1/module.js')).toBe('ns1Module')
    expect(makeHelperName('./../ns1/module.js')).toBe('ns1Module')
    expect(makeHelperName('./ns1/module.js')).toBe('ns1Module')
    expect(makeHelperName('@/../ns1/module.js')).toBe('ns1Module')
    expect(makeHelperName('#/ns1/module.js')).toBe('ns1Module')
  })

  it('should remove first slash', () => {
    expect(makeHelperName('/ns1/ns2/module')).toBe('ns1Ns2Module')
  })
})

describe('#parsePath', () => {
  it('should parse path', () => {
    const samples = {
      'path.js': ['path.js', '', '', 'path', '.js'],
      './path.js': ['./path.js', './', '', 'path', '.js'],
      '../path/to/file.js': ['../path/to/file.js', '../', 'path/to', 'file', '.js'],
      '/path/file.js': ['/path/file.js', '/', 'path', 'file', '.js'],
      'path/file.js': ['path/file.js', '', 'path', 'file', '.js'],
      file: ['file', '', '', 'file', ''],
      'D:/var/www/www.example.com/index.php': ['D:/var/www/www.example.com/index.php', 'D:/', 'var/www/www.example.com', 'index', '.php'],
      '..\\\\path\\\\to\\\\file.js': ['..\\\\path\\\\to\\\\file.js', '..\\', '\\path\\\\to\\', 'file', '.js'],
      '.\\path.js': ['.\\path.js', '.\\', '', 'path', '.js']
    }

    Object.entries(samples).forEach(([k, item]) => {
      const res = Object.values(parsePath(k))
      expect(res).toEqual(item)
    })
  })
})
