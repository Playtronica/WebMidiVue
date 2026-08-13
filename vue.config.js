module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
      ? '/'
      : '/',
  transpileDependencies: [],
  pwa: {
    name: 'Playtronica Settings',
    themeColor: '#ffffff',
    msTileColor: '#ffffff',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'default',
    manifestOptions: {
      short_name: 'Settings',
      description: 'Configure Playtronica instruments over Web MIDI.',
      start_url: './#/',
      scope: './',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#ffffff',
      icons: [
        { src: './img/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: './img/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
      ]
    },
    iconPaths: {
      faviconSVG: null,
      favicon32: null,
      favicon16: null,
      appleTouchIcon: 'img/icons/icon-192x192.png',
      maskIcon: null,
      msTileImage: 'img/icons/icon-192x192.png'
    },
    workboxPluginMode: 'GenerateSW',
    workboxOptions: {
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      skipWaiting: false,
      navigateFallback: 'index.html',
      // Vue CLI excludes install icons by default; cache them explicitly so the
      // installed app remains complete when the first offline launch occurs.
      exclude: [/\.map$/, /favicon\.ico$/, /^manifest.*\.js?$/]
    }
  }
}
