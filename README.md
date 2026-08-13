# WebMidiVue

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

The production build is an installable PWA. After one successful online visit,
the settings UI and hash routes are cached for offline use. Firmware updates are
intentionally online-only because the latest `.uf2` file is fetched from GitHub.

Verify the generated service worker, revisioned app shell and manifest:

```
npm run build
npm run test:pwa
npm run test:firmware
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
 
