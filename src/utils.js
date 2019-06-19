export const isPromise = val => val && typeof val.then === 'function'

export function assert(condition, msg) {
  if (!condition) throw new Error(`[StateCommander] ${msg}`)
}

// todo refactoring required
export function makeRegistrationKey({ path = '', command = '', prefix = '' }) {
  assert(path || command, 'path or command required')
  const cn = command.charAt(0).toLowerCase() + command.slice(1)
  const cleanPath = path.replace(/(\W)+\/|\.{1,2}\/|\.\w+$/g, '') // remove suffix, ./../ or extension
  const base = `${prefix}:${cleanPath}/${cn}`
  return base
    .replace(/^[/:]+/, '')
    .replace(/\/\//, '/')
    .replace(/:\//, ':')
}

export function makeHelperName(regKey) {
  return regKey
    .replace(/(\W)+\/|:after|:before|\.{1,2}\/|\.\w+$/g, '') // remove suffix, ./../ or extension
    .replace(/^\//, '') // remove first slash
    .replace(/:/g, '/') // convert : to /
    .replace(/(\/{1,2}\w)/g, c => c.toUpperCase() // replace slash and character to uppercase
      .replace(/\/{1,2}/, ''))
}

export function parsePath(path = '') {
  const out = {
    full: null, root: null, filePath: null, filename: null, ext: null
  }
  // todo more testing
  const reg = /^(\w:[/\\]|[/\\]|[.]+[/\\]|^)(.*?)[\\/]?([^.\\/]+)(\.\w+$)?$/
  if (!path) { return out }

  ({
    0: out.full = '',
    1: out.root = '',
    2: out.filePath = '',
    3: out.filename = '',
    4: out.ext = ''
  } = reg.exec(path) || [])

  return out
}

export const toLowerCaseFirst = s => s.charAt(0).toLowerCase() + s.slice(1)
