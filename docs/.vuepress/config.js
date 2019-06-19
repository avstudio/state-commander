module.exports = {
  title: 'State Commander',
  description:'Desc',
  themeConfig: {
    theme: '@vuepress/vue',
    nav: [{
        text: 'Home',
        link: '/'
      },
      {
        text: 'Github',
        link: 'https://github.com/avstudio/state-commander'
      },
    ],
    sidebar: [
      '/getting-started.md',
      {
        title:'Api',
        collapsable: false,
        children:[
          '/api/',
          '/api/context-base',
          '/api/module',
          '/api/handler',
          '/api/state',
          '/api/definition',
          '/api/command-class',
        ]
      },
      {
        title:'Pluggable',
        collapsable: false,
        children:[
          '/plugins/',
          '/plugins/custom-plugin.md',
        ]
      },
      {
        title:'Official Plugins',
        collapsable: false,
        children:[
          '/plugins/official-plugins',
          '/plugins/vue-context',
        ]
      },
      '/examples-and-support.md'
    ]

  }
}
