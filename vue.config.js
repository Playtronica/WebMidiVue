const {execFileSync} = require('child_process')
const path = require('path')

const biotronBeta = process.env.VUE_APP_BIOTRON_PWA_BETA === 'true'
let sourceRevision = process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || ''
if (!sourceRevision) {
  try {
    sourceRevision = execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], {encoding: 'utf8'}).trim()
  } catch (error) {
    sourceRevision = 'local-build'
  }
}
process.env.VUE_APP_BUILD_ID = sourceRevision.slice(0, 12)

module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
      ? '/'
      : '/',
  transpileDependencies: [],
  chainWebpack: config => {
    config.resolve.alias.set(
      '@pwa-entry',
      path.resolve(__dirname, biotronBeta ? 'src/registerServiceWorker.js' : 'src/noopServiceWorker.js')
    )
    config.resolve.alias.set(
      '@biotron-device-selector',
      path.resolve(__dirname, biotronBeta
        ? 'src/components/MidiComponents/BiotronDeviceSelector.vue'
        : 'src/components/MidiComponents/DeviceSelector.vue')
    )
    config.resolve.alias.set(
      '@sound-lab',
      path.resolve(__dirname, biotronBeta
        ? 'src/components/SoundLab/SoundLab.vue'
        : 'src/components/SoundLab/DisabledSoundLab.vue')
    )
    if (!biotronBeta) {
      config.plugins.delete('pwa')
      config.plugins.delete('workbox')
    }
  },
  pwa: {
    name: biotronBeta ? 'Biotron Settings Offline Beta' : 'Playtronica Settings',
    themeColor: '#ffffff',
    msTileColor: '#ffffff',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'default',
    manifestOptions: {
      id: biotronBeta ? './biotron-settings-offline-beta' : './playtronica-settings',
      short_name: biotronBeta ? 'Biotron Beta' : 'Settings',
      description: 'Configure Playtronica instruments over Web MIDI.',
      start_url: biotronBeta ? './#/biotron' : './#/',
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
