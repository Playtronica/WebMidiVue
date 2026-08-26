<template>
  <img src="/Logo-Black.png" alt="Playtronica logo" width="140" loading="eager" class="small--hide image-element" itemprop="logo">

  <header class="d-flex justify-content-center">

      <ul class="nav nav-pills">
      <li class="nav-item">
        <router-link  to="/biotron" @click="this.update" class="nav-link">Biotron</router-link>
      </li>
      <li class="nav-item">
        <router-link  to="/touchme" @click="this.update" class="nav-link">TouchMe</router-link>
      </li>
      <li class="nav-item">
        <router-link to="/playtron" @click="this.update" class="nav-link">Playtron</router-link>
      </li>
        <li class="nav-item">
          <router-link to="/scales" @click="this.update" class="nav-link">Scales</router-link>
        </li>
      <li class="nav-item">
        <a href="https://playtronica.github.io/WebMidiOrbita/?nomidi=true" class="nav-link" aria-current="page">Orbita</a>
      </li>
    </ul>
  </header>
  <div
      v-if="offlineMessage"
      class="offline-status mx-auto mt-2 px-3 py-2"
      :class="offlineStatusClass"
      role="status"
      aria-live="polite"
  >
    <span>{{ offlineMessage }}</span>
    <span v-if="offlineStatus.state === 'error'" class="offline-actions">
      <button type="button" class="offline-action" @click="retryOfflineSetup" :disabled="offlineRetrying">
        {{ offlineRetrying ? "Retrying…" : "Retry" }}
      </button>
      <button type="button" class="offline-action offline-action--secondary" @click="copyOfflineReport">
        {{ diagnosticsFeedback || "Copy diagnostics" }}
      </button>
    </span>
  </div>
  <div class="wrapper">
    <div class="m-2 content ">
      <router-view></router-view>

    </div>
    <footer class="bottom-panel">
      <SocialLinks/>
    </footer>
  </div>
</template>


<script>
import SocialLinks from "@/components/SocialLinks.vue";
import {
  collectOfflineDiagnostics,
  getOfflineStatus,
  OFFLINE_STATUS_EVENT,
  prepareOfflineAccess
} from "@/registerServiceWorker";


export default {
  name: 'App',
  components: {SocialLinks},
  data() {
    return {
      url: String,
      forceRerender: 0,
      offlineStatus: getOfflineStatus(),
      online: navigator.onLine,
      offlineRetrying: false,
      diagnosticsFeedback: ""
    }
  },
  computed: {
    offlineMessage() {
      if (this.offlineStatus.portable) {
        const version = this.offlineStatus.version ? ` ${this.offlineStatus.version}` : ''
        return `Offline portable${version} — Settings are running from this computer. Firmware updates still need internet.`
      }
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
          SW_FIRST_INSTALL_OFFLINE: "Offline copy is missing in this browser profile. Connect once, then press Retry.",
          SW_REGISTER_FAILED: "Chrome could not install the offline copy. Check the connection, then press Retry.",
          SW_READY_TIMEOUT: "Offline installation did not finish in time. Press Retry or copy diagnostics for support.",
          SW_NO_CONTROLLER: "Offline files are installed, but this page is not using them. Close every Settings window and reopen it.",
          SW_UNSUPPORTED: "This browser cannot install Settings for offline use. Use current Chrome or Edge."
        }
        const message = messages[this.offlineStatus.code] || "Offline setup failed. Press Retry or copy diagnostics for support."
        return `${message} Code: ${this.offlineStatus.code || "SW_SETUP_FAILED"}.`
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
  },
  beforeUnmount() {
    window.removeEventListener(OFFLINE_STATUS_EVENT, this.handleOfflineStatus)
    window.removeEventListener("online", this.handleConnectionChange)
    window.removeEventListener("offline", this.handleConnectionChange)
  },
  methods: {
    update() { this.forceRerender++ },
    handleOfflineStatus(event) {
      this.offlineStatus = event.detail
    },
    handleConnectionChange() {
      this.online = navigator.onLine
    },
    async retryOfflineSetup() {
      this.offlineRetrying = true
      this.diagnosticsFeedback = ""
      try {
        this.offlineStatus = await prepareOfflineAccess()
      } finally {
        this.offlineRetrying = false
      }
    },
    async copyOfflineReport() {
      const report = JSON.stringify(await collectOfflineDiagnostics(), null, 2)
      try {
        await navigator.clipboard.writeText(report)
        this.diagnosticsFeedback = "Copied"
      } catch (error) {
        console.error("Could not copy offline diagnostics:", error)
        this.diagnosticsFeedback = "Copy failed"
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

.offline-actions {
  display: inline-flex;
  gap: 0.5rem;
  margin-left: 0.75rem;
}

.offline-action {
  min-height: 36px;
  padding: 0.35rem 0.75rem;
  border: 1px solid currentColor;
  border-radius: 0.35rem;
  color: #fff;
  background: #842029;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.offline-action--secondary {
  color: #842029;
  background: #fff;
}

.offline-action:focus-visible {
  outline: 3px solid #0d6efd;
  outline-offset: 2px;
}

.offline-action:disabled {
  cursor: wait;
  opacity: 0.7;
}

@media (max-width: 640px) {
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
