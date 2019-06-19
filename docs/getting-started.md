# Getting Started

## What is State Commander

State Commander is a small JS application framework for application state management
enforcing "command design pattern".
It comes with required interface for building applications which require non-centralized
state management, but rather encapsulated units of logic (Class like command) for
handling part of the application state.

## Why State Commander

::: tip DISCLAIMER
State Commander is heavily inspired by [Vue Commander](https://vuecommander.com/)
and [Vuex](https://vuex.vuejs.org/)

These are my (author) observations and opinions about this library and
problems that can potentially solve in accordance with my own experience
and doesn't necessarily mean that this is the "best" aproach for solving
problems. It is up to you to decide if this can fit to your needs.
:::

There are already awesome pattern/library like [Vuex](https://vuex.vuejs.org/) / [Redux](https://redux.js.org/) for handling application
state in the centralized fashion. In the most cases this will satisfied all the needs.

But consider situation when you have requirement for different types of the same application like: Community, Full,
Trial, Demo etc. or you have requirement to "cherry pick" logic based on some conditional bushiness requirement.

Depend of the implementation you can probably build store dynamically or otherwise you
will have either, different store for each type or you will ended with one big store with a lot of
boilerplate code.

With centralized store approach the business layer is more or less tightly connected
with application layer,UI logic etc.

Consider this example:

```html
<button @click="savePost()" />
```

In Vue implementation, this button would probably call some method:

```js
export default {
  methods: {
    savePost() {
      fetch('https://api.ulr.com/posts', {
        method: 'post',
        body: JSON.stringify({ post })
      }).then(function(response) {
        //
      });
    }
  }
};
```

So,what if this method is conditional based on some application type or business logic?

```html
<button @click="savePost()" />
```

```js
export default {
  computed: {
    isDemoApp() {
      return this.$store.getters['applicationType'] === 'demo';
    },
    canSavePost() {
      return
        this.$store.getters['currentUser'] &&
        this.$store.getters['currentUser'].isPaid && !this.isDemoApp && ...;
    }
  },
  methods: {
    savePost() {
      if (this.canSavePost) {
        fetch('https://api.ulr.com/posts', {
          method: 'post',
          body: JSON.stringify({ post })
        })
          .then(function(response) {
            //hide loader or something
          })
          .error(this.showError)
      } else {
        if (this.isDemoApp) {
          this.showError({message: 'In demo application you can not save posts!' });
        } else {
          this.showError({ message:'You are not authorized' });
        }
      }
    }
  }
};
```

Of course there are many better ways to solve this problem, but that's not the point here.
Wouldn't be nice if we can move business outside our component?

Using Vuex we can do of course something like this:

```js
//store
{
  actions: {
    savePost ({ commit }, {post}) {
      fetch('https://api.ulr.com/posts', {
        method: 'post',
        body: JSON.stringify({ post })
      })
        .then(function(response) {
          //
        })
    }
  }
}

export default {
  methods: {
    savePost() {
      if (this.canSavePost) {
        this.dispatch('savePost',{post})
        .catch(this.showError)
      } else {
        if (this.isDemoApp) {
          this.showError({message: 'In demo application you can not save posts!' });
        } else {
          this.showError({ message:'You are not authorized' });
        }
      }
    }
  }
};
```

But there was still some business logic left.
So, maybe we can move logic completely in the `store`:

```js
{
  actions: {
    savePost ({ getters }, {post}) {
      const isDemoApp =  getters['applicationType'] === 'demo';
      const canUserSave = getters['currentUser'] && getters['currentUser'].isPaid && !isDemoApp && ...;

      if(canUserSave){
        return fetch('https://api.ulr.com/posts', {
          method: 'post',
          body: JSON.stringify({ post })
        })
      } else {
        if(isDemoApp){
          return Promise.reject('In demo ....')
        }
        return Promise.reject('You are not...')
      }
    }
  }
}

export default {
  methods: {
    savePost() {
      this.dispatch('savePost',{post})
        .catch(this.showError)
    }
  }
};
```

Sure we can improve this action but I just want to make the point about this kind of situation .

Let's try another approach:

```js
// @module fullApp/post.js

class SavePost {
  static get state(){
    return{
      canSavePost:false,
    }
  }
  constructor({ post }) {
    this.post = post;
    const {applicationType , currentUser } = this.rootState
    this.canUserSave = currentUser && currentUser.isPaid
  }

  // authorize logic can be related to this single command.
  // it can throw error or set the state for later checking
  authorize(){
    this.state.canSavePost = false
  }

  commit() {
    //you can guard commit or if you more control you can do that in application layer
    this.authorize()
    if(this.canSavePost){
      this.state.posts.push(this.post)
      this._clearState()
    }
  }

  execute() {
    if(this.canSavePost){
      return Promise.reject('You are not authorized')
    }

      return fetch('https://api.ulr.com/posts', {
        method: 'post',
        body: JSON.stringify({ post:this.post })
      }).then((res) => {
        this.commit()
        resolve(this.post)
      }).catch(reject)
  }

  _clearState(){
    this.this.state.canSavePost = false
  }
}


export default {
  computed(){
    //disable button, show message etc
    canSavePost(){
      return this.$context.getters['post/canSavePost']
    }
  },
  methods: {
    savePost() {
      //control here or in the command
      this.authorize('savePost',{post})
      this.dispatch('savePost',{post})
        .catch(this.showError)
    }
  }
};
```

So for the full app we have `savePost` action. But what about demo type of app?

```js
// @module demoApp/post.js

class SavePost {
  static get state(){
    return{
      canSavePost:false,
    }
  }

  execute() {
    return Promise.reject('In demo application you can not save the post!')
  }
}

//component will remain the same
export default {
  computed(){
    //do disable button, show message etc
    canSavePost(){
      return this.$context.getters['post/canSavePost']
    }
  },
  methods: {
    savePost() {
      this.$context.authorize('savePost',{post})
      this.$context.dispatch('savePost',{post})
        .catch(this.showError)
    }
  }
};
```

Default [Context](/api/README.md) `notFoundHandler` will throw error. We can easily override that with different logic
like triggering some event and then handle/show errors:

```js
Context.configuration.notFoundHandler = command => {
  eventBus.$emit('commandNotFound', command);
};

//demo app

app.$on('commandNotFound', (event, { data }) => {
  switch (evet) {
    case 'savePost':
      this.showError('In demo app you can not save Posts...');
      break;
    default:
      this.showError('In demo app you can not...');
      break;
  }
});
```

And now you can ignore completely CommandClass and have only this:

```js
export default {
  computed(){
    //do disable button, show message etc
    canSavePost(){
      return this.$context.getters['post/canSavePost']
    }
  },
  methods: {
    savePost() {
      this.$context.authorize('savePost',{post})
      this.$context.dispatch('savePost',{post})
        .catch(this.showError)
    }
  }
};
```

With "command approach", you can separate application layer from business layer.
When `button` is clicked, it will call command and thats it.

"Whoever is interested" will respond to that command depend of the business logic.

## Concepts and thoughts

Using [Command Class](/api/command-class.md) we can even go further:

```js
// some future State Commander plugin for command history handling
const history = [];

class Command1 {
  constructor(event, { data }) {}

  saveState() {
    //save before commit
  }

  commit() {
    //commit data
  }

  rollback() {
    //return to previous state
  }
}

class Command2 {
  constructor(event, { data }) {}

  saveState() {
    //save before commit
  }

  commit() {
    //commit data
  }

  rollback() {
    //return to previous state
  }
}

...

try {
  this.$context.commit('Command1',{...})
  this.$context.commit('Command2',{...})
} catch (err) {
  this.$context.history('undo')
  // ...
  //and later something like
  history.forEach(command => command.rollback() )

```

## Backend

State Commander potentially can work in the same way on the `Backend` side:

```js
class SavePost {
  execute() {
    db.save('posts', { post: this.post });
  }
}

//api
app.post('/posts', async (req, res) => {
  const response = await context.dispatch('savePost', req.post);
  res.send(response);
});
```

## Frontend and Backend together

```js
class Document {
  validate() {
    if (this.document.title.length < 3) {
      throw new Error('not valid');
    }
  }
}

// Backend
app.post('/posts', async (req, res) => {
  try {
    context.validate('document');
    const response = await context.dispatch('savePost', req.post);
    res.send(response);
  } catch (error) {
    res.send(error);
  }
});

// Frontend
export default {
  methods: {
    save() {
      try {
        this.$context.validate('document', { document });
      } catch (error) {
        this.showError(error);
      }
    }
  }
};
```
