<template>
  <img src="/Logo-Black.png" alt="Playtronica logo" width="140" loading="eager" class="small--hide image-element" itemprop="logo">

  <header v-if="!firstPlay" :class="betaBuild ? 'device-header' : 'd-flex justify-content-center'">
    <span v-if="betaBuild" class="device-header__label">Devices</span>
    <nav :aria-label="betaBuild ? 'Choose a device' : 'Devices'" :class="{'device-header__scroll': betaBuild}">
      <ul class="nav nav-pills" :class="{'device-header__list': betaBuild}">
      <li class="nav-item">
        <router-link to="/biotron" class="nav-link">Biotron</router-link>
      </li>
      <li class="nav-item">
        <router-link to="/touchme" class="nav-link">TouchMe</router-link>
      </li>
      <li class="nav-item">
        <router-link to="/playtron" class="nav-link">Playtron</router-link>
      </li>
        <li class="nav-item">
          <router-link to="/scales" class="nav-link">Scales</router-link>
        </li>
      <li class="nav-item">
        <a href="https://playtronica.github.io/WebMidiOrbita/?nomidi=true" class="nav-link">Orbita<span v-if="betaBuild" aria-hidden="true"> ↗</span></a>
      </li>
    </ul>
    </nav>
  </header>
  <small v-if="betaBuild && !firstPlay" class="beta-build">Biotron offline beta · {{ buildId }}</small>
  <div
      v-if="offlineMessage && !firstPlay"
      class="offline-status mx-auto mt-2 px-3 py-2"
      :class="offlineStatusClass"
      role="status"
      aria-live="polite"
  >
    <span>{{ offlineMessage }}</span>
    <span v-if="offlineStatus.ready && online && !installed" class="offline-actions">
      <button
          v-if="installPrompt"
          type="button"
          class="offline-action"
          @click="installApp"
      >
        Install offline app
      </button>
      <small v-else>Install from the Chrome/Edge address bar to add it to your desktop.</small>
    </span>
    <span v-if="installed" class="offline-installed">Installed</span>
    <button
        v-if="offlineStatus.state === 'error'"
        type="button"
        class="offline-action offline-action--error"
        @click="retryOfflineSetup"
        :disabled="offlineRetrying"
    >
      {{ offlineRetrying ? "Retrying…" : "Retry" }}
    </button>
  </div>
  <div class="wrapper">
    <div class="m-2 content ">
      <CompatibilityGate :route="$route">
        <router-view></router-view>
      </CompatibilityGate>

    </div>
    <footer v-if="!firstPlay" class="bottom-panel">
      <SocialLinks/>
    </footer>
  </div>
</template>


<script>
import SocialLinks from "@/components/SocialLinks.vue";
import CompatibilityGate from "@compatibility-gate";
import {
  getOfflineStatus,
  OFFLINE_STATUS_EVENT,
  prepareOfflineAccess
} from "@pwa-entry";

const runningStandalone = () => window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true


export default {
  name: 'App',
  components: {CompatibilityGate, SocialLinks},
  data() {
    return {
      offlineStatus: getOfflineStatus(),
      online: navigator.onLine,
      installPrompt: null,
      installed: runningStandalone(),
      offlineRetrying: false,
      betaBuild: process.env.VUE_APP_BIOTRON_PWA_BETA === 'true',
      buildId: process.env.VUE_APP_BUILD_ID || 'local-build'
    }
  },
  computed: {
    firstPlay() {
      return this.betaBuild && this.$route.meta.firstPlay === true
    },
    offlineMessage() {
      if (this.offlineStatus.ready && !this.online) {
        return "Offline — Settings are available. Firmware updates still need internet."
      }
      if (this.offlineStatus.ready) {
        return "Ready offline — Settings are installed for this browser profile."
      }
      if (this.offlineStatus.state === "installing") {
        return "Preparing offline access… Keep this window open until it is ready."
      }
      if (this.offlineStatus.state === "error") {
        const messages = {
          SW_FIRST_INSTALL_OFFLINE: "Connect once to install the offline copy, then press Retry.",
          SW_NO_CONTROLLER: "Close every Settings window, reopen this page, then press Retry."
        }
        return messages[this.offlineStatus.code] || "Offline setup did not finish. Check the connection, then press Retry."
      }
      if (this.offlineStatus.state === "unsupported") {
        return "This browser cannot install Settings for offline use."
      }
      return ""
    },
    offlineStatusClass() {
      if (this.offlineStatus.ready) return "offline-status--ready"
      if (this.offlineStatus.state === "error" || this.offlineStatus.state === "unsupported") {
        return "offline-status--error"
      }
      return "offline-status--preparing"
    }
  },
  mounted() {
    console.log("Hello! You`re curious, aren`t you?")
    window.addEventListener(OFFLINE_STATUS_EVENT, this.handleOfflineStatus)
    window.addEventListener("online", this.handleConnectionChange)
    window.addEventListener("offline", this.handleConnectionChange)
    window.addEventListener("beforeinstallprompt", this.handleInstallPrompt)
    window.addEventListener("appinstalled", this.handleInstalled)
  },
  beforeUnmount() {
    window.removeEventListener(OFFLINE_STATUS_EVENT, this.handleOfflineStatus)
    window.removeEventListener("online", this.handleConnectionChange)
    window.removeEventListener("offline", this.handleConnectionChange)
    window.removeEventListener("beforeinstallprompt", this.handleInstallPrompt)
    window.removeEventListener("appinstalled", this.handleInstalled)
  },
  methods: {
    handleOfflineStatus(event) {
      this.offlineStatus = event.detail
    },
    handleConnectionChange() {
      this.online = navigator.onLine
    },
    handleInstallPrompt(event) {
      event.preventDefault()
      this.installPrompt = event
    },
    handleInstalled() {
      this.installPrompt = null
      this.installed = true
    },
    async installApp() {
      const prompt = this.installPrompt
      if (!prompt) return
      this.installPrompt = null
      await prompt.prompt()
      await prompt.userChoice
    },
    async retryOfflineSetup() {
      this.offlineRetrying = true
      try {
        this.offlineStatus = await prepareOfflineAccess()
      } finally {
        this.offlineRetrying = false
      }
    }
  }
}
</script>

<style>

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 1%;
}

.offline-status {
  width: min(720px, calc(100% - 2rem));
  border: 1px solid;
  border-radius: 0.5rem;
  font-size: 0.9rem;
}

.beta-build {
  display: block;
  margin-top: 0.25rem;
  color: #6c757d;
}

.device-header {
  display: flex;
  width: min(760px, calc(100% - 1rem));
  margin: .5rem auto 0;
  align-items: center;
  justify-content: center;
  gap: .75rem;
}

.device-header__label {
  flex: 0 0 auto;
  color: #6b6761;
  font-size: .8rem;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
}

.device-header__scroll {
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.device-header__scroll::-webkit-scrollbar {
  display: none;
}

.device-header__list {
  flex-wrap: nowrap;
  width: max-content;
}

.device-header__list .nav-link {
  min-height: 44px;
  align-content: center;
  white-space: nowrap;
}

.offline-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 0.75rem;
}

.offline-action {
  min-height: 36px;
  padding: 0.35rem 0.75rem;
  border: 1px solid currentColor;
  border-radius: 0.35rem;
  color: #0f5132;
  background: #fff;
  font: inherit;
  font-weight: 600;
}

.offline-action--error {
  margin-left: 0.75rem;
  color: #842029;
}

.offline-installed {
  display: inline-block;
  margin-left: 0.75rem;
  font-weight: 600;
}

@media (max-width: 640px) {
  .device-header {
    display: block;
  }
  .device-header__label {
    display: block;
    margin-bottom: .15rem;
    text-align: left;
  }
  .device-header__scroll {
    margin-right: -.5rem;
  }
  .offline-actions {
    display: flex;
    justify-content: center;
    margin: 0.5rem 0 0;
  }
}

.offline-status--ready {
  color: #0f5132;
  background: #d1e7dd;
  border-color: #badbcc;
}

.offline-status--preparing {
  color: #664d03;
  background: #fff3cd;
  border-color: #ffecb5;
}

.offline-status--error {
  color: #842029;
  background: #f8d7da;
  border-color: #f5c2c7;
}

.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

/* Hide default HTML checkbox */
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: .4s;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196F3;
}

input:checked + .slider:before {
  -webkit-transform: translateX(26px);
  -ms-transform: translateX(26px);
  transform: translateX(26px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

.content {
  flex: 1;
  padding: 20px;
  box-sizing: border-box;
}

.wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}


.bottom-panel {
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-top: 1px black dashed;
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Hide spin buttons in Firefox */
input[type="number"] {
  -moz-appearance: textfield;
}
</style>
