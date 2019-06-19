/* eslint-disable no-underscore-dangle */
import { parsePath } from './utils'

function applyPathValues(path) {
  this._moduleName = path.filename
  if (!this._path) { this._path = path.full }
  this._namespace = [path.filePath, path.filename]
    .filter(Boolean)
    .join('/')
    .replace(/^\W+/, '')
  this._extension = path.ext
}

const removeCommonSegments = (parent, child) => {
  const [a, b] = [parent.split('/'), child.split('/')]
  return b.filter((el, i) => a[i] !== el).join('/')
}

export default class PathParser {
  constructor(path = '') {
    this._path = ''
    this._namespace = ''
    // set defaults on initializer
    this.join(path)
  }

  get path() {
    return this._path
  }

  get moduleName() {
    return this._moduleName
  }

  get namespace() {
    return this._namespace
  }

  prepend(input = '') {
    this.join(input, { prepend: true })
  }

  join(input = '', { prepend = false } = {}) {
    const currentPath = parsePath(this._path)
    const newPath = parsePath(input)

    // for the first time just set values
    if (!currentPath.full) {
      applyPathValues.call(this, newPath)
      return this
    }

    // if no child path just skip all
    if (!newPath.full) { return this }

    const [parent, child] = prepend
      ? [newPath, currentPath]
      : [currentPath, newPath]

    // remove common segments
    const childWithoutParent = removeCommonSegments(parent.filePath, child.filePath)

    // join namespace
    this._namespace = [
      parent.filePath,
      parent.filename,
      childWithoutParent,
      child.filename
    ].filter(Boolean).join('/')

    return this
  }
}
