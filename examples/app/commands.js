const genId = () => Math.random().toString(36).substr(2, 9)

const notes = [
  {
    note: 'To eat something',
    id: genId(),
    completed: false,
  },
  {
    note: 'To do laundry',
    id: genId(),
    completed: false,
  }
]


export class Notes {
  static get state() {
    return {
      notes: []
    }
  }

  getter() {
    return this.state.notes
  }

  execute() {
    return new Promise((resolve) => {
      // simulate long request
      setTimeout(() => {
        this.state.notes = notes
        resolve(this.state.notes)
      }, 1000)
    })
  }
}

export class CreateNote {
  constructor(event, note = {}) {
    this.note = note
    this.note.id = genId()
  }

  commit() {
    this.state.notes.push(this.note)
  }
}

export class CheckNote {
  constructor(e, { id }) {
    this.id = id
  }

  commit() {
    const note = this.state.notes.find(n => n.id === this.id)
    note.completed = !note.completed
  }
}

export class ClearCompleted {
  commit() {
    this.state.notes = this.state.notes.filter(n => !n.completed)
  }
}

export class CheckAll {
  constructor(e, checked) {
    this.checked = checked
  }

  commit() {
    this.state.notes.forEach((n) => {
      const item = n
      item.completed = this.checked
    })
  }
}

export class DeleteNote {
  constructor(e, { id }) {
    this.id = id
  }

  commit() {
    this.state.notes.splice(this.state.notes.findIndex(n => n.id === this.id), 1)
  }
}
