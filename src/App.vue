<template>
  <div :class="{'beta-shell': betaBuild}">
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
  <small v-if="betaBuild" class="beta-build"><span>Biotron offline beta</span> · {{ buildId }}</small>
  <div
      v-if="offlineMessage && !firstPlay"
      class="offline-status mx-auto mt-2 px-3 py-2"
      :class="offlineStatusClass"
      role="status"
      aria-live="polite"
  >
    <span>{{ offlineMessage }}</span>
    <span v-if="offlineStatus.ready && !installed" class="offline-actions">
      <button
          type="button"
          class="offline-action"
          @click="installApp"
      >
        Add desktop shortcut
      </button>
    </span>
    <span v-if="installed" class="offline-installed">Added to desktop</span>
    <button
        v-if="offlineStatus.state === 'error'"
        type="button"
        class="offline-action offline-action--error"
        @click="retryOfflineSetup"
        :disabled="offlineRetrying"
    >
      {{ offlineRetrying ? "Retrying…" : "Retry" }}
    </button>
    <small v-if="showInstallHelp && offlineStatus.ready && !installed" class="offline-install-help">
      Android Chrome: menu ⋮ → Add to Home screen. Chrome: menu ⋮ → Cast, save and share → Install page as app. Edge: menu ⋯ → More tools → Apps → Install this site as an app.
    </small>
  </div>
  <div class="wrapper">
    <div class="m-2 content ">
      <CompatibilityGate :route="$route">
        <router-view v-slot="{ Component }">
          <KeepAlive include="DeviceFirstPlay">
            <component :is="Component" />
          </KeepAlive>
        </router-view>
      </CompatibilityGate>

      <aside v-if="betaBuild" class="beta-feedback mx-auto my-4 text-start" aria-labelledby="beta-feedback-title">
        <small class="beta-feedback__eyebrow">Built with Biotron owners</small>
        <p id="beta-feedback-title" class="beta-feedback__title">Help shape the next Biotron Settings</p>
        <p class="text-secondary mb-3">
          I’m Andrey from Playtronica. I personally read every reply. We acknowledge concrete bug reports within two working days and publish a short update every Friday.
        </p>
        <a :href="feedbackMailto" class="btn beta-feedback__action">
          Tell Andrey what should change
        </a>
        <small class="d-block mt-2 text-muted">Your email opens with three questions and this build number. Nothing is sent automatically.</small>
      </aside>

    </div>
    <footer v-if="!firstPlay" class="bottom-panel">
      <SocialLinks/>
    </footer>
  </div>
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
import {
  clearInstallPrompt,
  getInstallPrompt,
  INSTALL_PROMPT_AVAILABLE_EVENT,
  takeInstallPrompt
} from "@/pwaInstallPrompt.mjs";

const runningStandalone = () => window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true


export default {
  name: 'App',
  components: {CompatibilityGate, SocialLinks},
  data() {
    return {
      offlineStatus: getOfflineStatus(),
      online: navigator.onLine,
      installPrompt: getInstallPrompt(),
      installed: runningStandalone(),
      showInstallHelp: false,
      offlineRetrying: false,
      betaBuild: process.env.VUE_APP_BIOTRON_PWA_BETA === 'true',
      buildId: process.env.VUE_APP_BUILD_ID || 'local-build'
    }
  },
  computed: {
    firstPlay() {
      return this.betaBuild && this.$route.meta.firstPlay === true
    },
    feedbackMailto() {
      const subject = `Biotron Settings beta feedback — ${this.buildId}`
      const body = `What were you trying to make Biotron do?\n\nWhere did you hesitate or get a result you did not expect?\n\n` +
        `If we changed one thing before the next version, what should it be?\n\nBuild: ${this.buildId}\nPage: ${this.$route.path}`
      return `mailto:manirko@playtronica.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    },
    offlineMessage() {
      if (this.offlineStatus.ready && !this.online) {
        return "Offline mode — Settings are working without internet. Firmware updates still need internet."
      }
      if (this.offlineStatus.ready) {
        return "Offline mode is ready — this browser can reopen Settings without internet."
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
    window.addEventListener(INSTALL_PROMPT_AVAILABLE_EVENT, this.handleInstallPrompt)
    window.addEventListener("appinstalled", this.handleInstalled)
  },
  beforeUnmount() {
    window.removeEventListener(OFFLINE_STATUS_EVENT, this.handleOfflineStatus)
    window.removeEventListener("online", this.handleConnectionChange)
    window.removeEventListener("offline", this.handleConnectionChange)
    window.removeEventListener(INSTALL_PROMPT_AVAILABLE_EVENT, this.handleInstallPrompt)
    window.removeEventListener("appinstalled", this.handleInstalled)
  },
  methods: {
    handleOfflineStatus(event) {
      this.offlineStatus = event.detail
    },
    handleConnectionChange() {
      this.online = navigator.onLine
    },
    handleInstallPrompt() {
      this.installPrompt = getInstallPrompt()
      this.showInstallHelp = false
    },
    handleInstalled() {
      clearInstallPrompt()
      this.installPrompt = null
      this.installed = true
      this.showInstallHelp = false
    },
    async installApp() {
      const prompt = takeInstallPrompt()
      if (!prompt) {
        this.showInstallHelp = !this.showInstallHelp
        return
      }
      this.installPrompt = null
      await prompt.prompt()
      const choice = await prompt.userChoice
      if (choice?.outcome !== 'accepted') this.showInstallHelp = true
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
#app { font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-align: center; color: #2c3e50; margin-top: 1%; }
.beta-shell { --beta-ink:#16181d; --beta-muted:#686b73; --beta-line:rgba(27,31,40,.11); --beta-surface:rgba(255,255,255,.88); --beta-accent:#315ee7; min-height:100vh; padding:.75rem 0 2rem; color:var(--beta-ink); background:radial-gradient(circle at 8% 0%,rgba(119,218,178,.13),transparent 28rem),radial-gradient(circle at 96% 12%,rgba(49,94,231,.09),transparent 24rem),#f6f5f1; }
.beta-shell > .image-element { width:132px; margin:.35rem auto .75rem; }
.offline-status { width:min(720px,calc(100% - 2rem)); border:1px solid; border-radius:1rem; font-size:.9rem; }
.beta-build { display:block; margin-top:.45rem; color:var(--beta-muted,#6c757d); font-size:.75rem; letter-spacing:.01em; }
.beta-build span { color:var(--beta-accent); font-weight:700; }
.device-header { display:flex; width:min(760px,calc(100% - 1rem)); margin:.25rem auto 0; padding:.35rem; align-items:center; justify-content:center; gap:.75rem; border:1px solid var(--beta-line); border-radius:1rem; background:var(--beta-surface); box-shadow:0 10px 30px rgba(30,37,55,.05); backdrop-filter:blur(16px); }
.device-header__label { flex:0 0 auto; color:#6b6761; font-size:.8rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase; }
.device-header__scroll { min-width:0; overflow-x:auto; scrollbar-width:none; }
.device-header__scroll::-webkit-scrollbar { display:none; }
.device-header__list { flex-wrap:nowrap; width:max-content; }
.device-header__list .nav-link { min-height:44px; padding-inline:.85rem; align-content:center; border-radius:.75rem; color:#575a62; white-space:nowrap; }
.device-header__list .nav-link:hover,.device-header__list .nav-link:focus-visible { color:var(--beta-ink); background:rgba(49,94,231,.07); }
.device-header__list .nav-link.active { color:#fff; background:var(--beta-accent); box-shadow:0 6px 18px rgba(49,94,231,.24); }
.offline-actions { display:inline-flex; align-items:center; gap:.5rem; margin-left:.75rem; }
.offline-action { min-height:36px; padding:.35rem .75rem; border:1px solid currentColor; border-radius:.7rem; color:#0f5132; background:#fff; font:inherit; font-weight:600; }
.offline-action--error { margin-left:.75rem; color:#842029; }
.offline-installed { display:inline-block; margin-left:.75rem; font-weight:600; }
.offline-install-help { display:block; width:100%; margin-top:.5rem; }
.offline-status--ready { color:#0f5132; background:#d1e7dd; border-color:#badbcc; }
.offline-status--preparing { color:#664d03; background:#fff3cd; border-color:#ffecb5; }
.offline-status--error { color:#842029; background:#f8d7da; border-color:#f5c2c7; }
.beta-feedback { width:min(760px,100%); padding:clamp(1.2rem,4vw,2rem); border:1px solid rgba(49,94,231,.14); border-radius:1.35rem; background:linear-gradient(135deg,rgba(255,255,255,.96),rgba(238,243,255,.9)); box-shadow:0 18px 50px rgba(30,37,55,.07); }
.beta-feedback__eyebrow { display:block; margin-bottom:.45rem; color:var(--beta-accent); font-size:.72rem; font-weight:800; letter-spacing:.09em; text-transform:uppercase; }
.beta-feedback__title { margin-bottom:.45rem; font-size:clamp(1.2rem,3vw,1.55rem); font-weight:750; letter-spacing:-.025em; }
.beta-feedback__action { min-height:44px; padding:.65rem 1rem; border:1px solid var(--beta-accent); border-radius:.8rem; color:#fff; background:var(--beta-accent); font-weight:700; }
.beta-feedback__action:hover,.beta-feedback__action:focus-visible { color:#fff; background:#254dc8; box-shadow:0 7px 20px rgba(49,94,231,.2); }
.switch { position:relative; display:inline-block; width:60px; height:34px; }
.switch input { opacity:0; width:0; height:0; }
.slider { position:absolute; cursor:pointer; inset:0; background-color:#ccc; transition:.4s; }
.slider:before { position:absolute; content:""; height:26px; width:26px; left:4px; bottom:4px; background-color:white; transition:.4s; }
input:checked + .slider { background-color:#2196F3; }
input:focus + .slider { box-shadow:0 0 1px #2196F3; }
input:checked + .slider:before { transform:translateX(26px); }
.slider.round { border-radius:34px; }
.slider.round:before { border-radius:50%; }
.content { flex:1; width:min(820px,100%); margin-inline:auto !important; padding:clamp(1rem,3vw,1.5rem); box-sizing:border-box; }
.wrapper { display:flex; flex-direction:column; min-height:100vh; }
.bottom-panel { height:60px; display:flex; justify-content:center; align-items:center; border-top:1px solid rgba(27,31,40,.1); }
input::-webkit-outer-spin-button,input::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
input[type="number"] { -moz-appearance:textfield; }
@media (max-width:640px) { .device-header{display:block}.device-header__label{display:block;margin-bottom:.15rem;text-align:left}.device-header__scroll{margin-right:-.5rem}.offline-actions{display:flex;justify-content:center;margin:.5rem 0 0} }
@media (prefers-reduced-motion:no-preference) { .beta-shell .btn,.beta-shell .nav-link,.beta-shell .offline-action{transition:color .18s ease,background-color .18s ease,border-color .18s ease,box-shadow .18s ease,transform .18s ease}.beta-shell .btn:not(:disabled):active,.beta-shell .offline-action:not(:disabled):active{transform:translateY(1px)} }
</style>
