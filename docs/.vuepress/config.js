module.exports = {
  base: '/vue3-docs/',
  title: 'Vue3源码系列',
  description: '针对vue3的新特性做一些源码分析和实例应用',
  head: [
    ['link', { rel: 'icon', href: '/logo.png' }]
  ],
  themeConfig: {
    nav: [
      { text: '新特性', link: '/feature/introduce'},
      { text: '迁移最佳实践', link: '/migrate/'}
    ],
    sidebar: {
      '/feature/': [
        'introduce',
        'composition-api'
      ]
    },
    logo: '/logo.png',
    sidebarDepth: 2,
    displayAllHeaders: true
  }
}