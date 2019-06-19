// https: //gist.github.com/sylvainleris/6a051f2a9e7420b32b6db7d8d47b968b
const last = a => a[a.length - 1]
const reduceOneRight = a => a.slice(0, -1)

export default class Hook {
  attach(fn) {
    this.execute = (stack => (...args) => stack(...reduceOneRight(args), () => {
      const next = last(args)
      fn.apply(this, [
        ...reduceOneRight(args),
        next.bind.apply(next, [null, ...reduceOneRight(args)])
      ])
    }))(this.execute)
  }

  execute(...args) {
    const next = last(args)
    next.apply(this, reduceOneRight(args))
  }
}
