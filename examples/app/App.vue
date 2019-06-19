<template>
  <section class="todoapp">
    <header class="header">
      <h1>todos</h1>
      <input

        @keydown.enter="submit"
        v-model="note"
        class="new-todo"
        placeholder="What needs to be done?"
        autofocus
      >
    </header>
    <!-- This section should be hidden by default and shown when there are todos -->
    <section class="main">
      <input
        id="toggle-all"
        class="toggle-all"
        type="checkbox"
        @click="toggleChecked"
      >
      <label for="toggle-all">Mark all as complete</label>
      <ul class="todo-list">
        <!-- These are here just to show the structure of the list items -->
        <!-- List items should get the class `editing` when editing and `completed` when marked as completed -->
        <li :class="{ completed:item.completed }" v-for=" item in filterNotes">
          <div class="view">
            <input
              @click="check(item)"
              class="toggle"
              type="checkbox"
              :checked="item.completed"
            >
            <label>{{item.note}}</label>
            <button class="destroy" @click="deleteNote(item)"></button>
          </div>
          <input
            class="edit"
            value="Create a TodoMVC template"
          >
        </li>
      </ul>
    </section>
    <!-- This footer should hidden by default and shown when there are todos -->
    <footer class="footer">
      <!-- This should be `0 items left` by default -->
      <span class="todo-count"><strong>{{leftItemsCount}}</strong> item left</span>
      <!-- Remove this if you don't implement routing -->
      <ul class="filters">
        <li>
          <a
            class="selected"
            href="#/"
            @click="filter = 'all'"
          >All</a>
        </li>
        <li>
          <a href="#/active" @click="filter = 'active'">Active</a>
        </li>
        <li>
          <a href="#/completed" @click="filter='completed'">Completed</a>
        </li>
      </ul>
      <!-- Hidden if no completed items are left ↓ -->
      <button class="clear-completed" @click="clearCompleted">Clear completed</button>
    </footer>
  </section>
</template>
<script>
import Vue from 'vue'

export default {
  inject:[
    'notes',
    'getNotes',
    'commitCheckAll',
    'commitClearCompleted',
    'commitCheckNote',
    'commitCreateNote',
    'commitDeleteNote',
  ],
  data(){
    return{
      filter:'all',
      checked:false,
      note:'',
    }
  },
  computed: {
    leftItemsCount(){
      return this.noteList.filter(n=>!n.completed).length
    },
    noteList () {
      // return this.$context.getters['notes']
      // shortcut for above
      return this.getNotes()
    },
    filterNotes(){
      switch (this.filter) {
        case 'active':
          return this.noteList.filter(n=>!n.completed)
          break
        case 'completed':
          return this.noteList.filter(n=>n.completed)
          break
        default:
          return this.noteList
          break
      }
    }
  },
  created() {
    // this.$context.dispatch('notes')
    // shortcut for above
    this.notes()
  },
  watch:{
    ['$context._state']:{
      handler(){
      this.$context.printStats()
      },
      deep:true
    }
  },
  methods:{
    setFilter(f){
      this.filter = f
    },
    toggleChecked(){
      this.checked = !this.checked
      // this.$context.commit('checkAll',this.checked)
      // shortcut for above
      this.commitCheckAll(this.checked)

    },
    clearCompleted(){
      // this.$context.commit('clearCompleted')
      // shortcut for above
      this.commitClearCompleted()
    },
    check(note){
      // this.$context.commit('checkNote',note)
      // shortcut for above
      this.commitCheckNote(note)
    },
    deleteNote(note){
      // this.$context.commit('deleteNote',note)
      // shortcut for above
      this.commitDeleteNote(note)
    },
    submit(){
      this.$context.commit('createNote',{ note:this.note,completed:false })
      this.note =''
    }
  }
}
</script>
