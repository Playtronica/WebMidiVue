<script>
import {bootDevice} from '@/assets/js/SysExCommand'
import {compareFirmwareVersions, GetLatestFirmware, LoadFirmware, prepareFirmware, writeFirmware} from '@/assets/js/LoadFirmware'
const target = process.env.VUE_APP_BIOTRON_FIRMWARE_TARGET
const internalFirmware = target ? {version: target, internal: true,
  name: process.env.VUE_APP_BIOTRON_FIRMWARE_NAME, url: process.env.VUE_APP_BIOTRON_FIRMWARE_URL,
  sha256: process.env.VUE_APP_BIOTRON_FIRMWARE_SHA256, size: Number(process.env.VUE_APP_BIOTRON_FIRMWARE_SIZE)} : null
export default {
  props: {repo: String, device: Object, currentVersion: {type: String, default: ''},
    versionAware: {type: Boolean, default: false}, text: {type: String, default: 'Update Firmware'}},
  data: () => ({online: navigator.onLine, latest: internalFirmware, phase: 'idle', message: '', error: '',
    prepared: null, checking: false, reconnectTimer: null}),
  computed: {
    available() { return Boolean(this.currentVersion && this.latest?.version && compareFirmwareVersions(this.latest.version, this.currentVersion) > 0) },
    current() { return Boolean(this.currentVersion && this.latest?.version && !this.available) },
    internal() { return Boolean(this.latest?.internal) },
    busy() { return ['preparing', 'booting', 'writing', 'reconnecting'].includes(this.phase) },
    buttonText() {
      if (this.checking) return 'Checking firmware…'
      if (this.versionAware && !this.currentVersion) return 'Connect to check firmware'
      if (this.current) return `Firmware ${this.currentVersion} ✓`
      if (this.available) return `Update to ${this.latest.version}`
      return this.text
    },
    actionText() {
      if (!this.internal) return 'Update'
      return {idle: 'Download & verify', 'preflight-error': 'Try again', prepared: 'Restart Biotron',
        'select-drive': 'Choose RPI-RP2 & install'}[this.phase] || ''
    },
    actionDisabled() { return this.busy || !this.online || (this.phase !== 'select-drive' && !this.device) }
  },
  mounted() {
    window.addEventListener('online', this.syncOnline)
    window.addEventListener('offline', this.syncOnline)
    if (this.versionAware && this.currentVersion && !this.latest) this.refresh()
  },
  beforeUnmount() {
    window.removeEventListener('online', this.syncOnline); window.removeEventListener('offline', this.syncOnline)
    clearTimeout(this.reconnectTimer)
  },
  watch: {currentVersion(value) {
    if (this.versionAware && value && !this.latest) this.refresh()
    if (this.phase === 'reconnecting' && value === this.latest?.version) {
      clearTimeout(this.reconnectTimer); this.prepared = null; this.phase = 'complete'
      this.message = `Firmware ${value} is installed and verified.`
    }
  }},
  methods: {
    syncOnline() { this.online = navigator.onLine; if (this.online) this.error = '' },
    async refresh() {
      if (!this.online || this.checking) return
      this.checking = true
      try { this.latest = await GetLatestFirmware(this.repo); this.error = '' }
      catch (error) { this.error = error.message }
      finally { this.checking = false }
    },
    async runStep() {
      this.error = ''
      if (!this.internal) {
        try { await LoadFirmware(this.repo, this.device) } catch (error) { this.error = error.message }
        return
      }
      try {
        if (['idle', 'preflight-error'].includes(this.phase)) {
          if (!window.showDirectoryPicker) throw new Error('Automatic installation requires current Chrome or Edge on a desktop computer.')
          this.phase = 'preparing'; this.message = 'Downloading and checking firmware…'
          this.prepared = await prepareFirmware(this.latest); this.phase = 'prepared'
          this.message = `Firmware ${this.latest.version} is verified. Biotron has not restarted yet.`
        } else if (this.phase === 'prepared') {
          this.phase = 'booting'; this.message = 'Restarting Biotron in update mode…'; await bootDevice(this.device)
          this.phase = 'select-drive'; this.message = 'Choose the RPI-RP2 drive to install the verified firmware.'
        } else if (this.phase === 'select-drive') {
          this.phase = 'writing'; await writeFirmware(this.prepared, this.latest); this.phase = 'reconnecting'
          this.message = `Firmware copied. Waiting for Biotron ${this.latest.version}…`
          this.reconnectTimer = setTimeout(() => {
            if (this.phase !== 'reconnecting') return
            this.phase = 'verification-error'; this.error = 'Expected firmware did not reconnect. Reconnect USB and check its version before retrying.'
          }, 30000)
        }
      } catch (error) {
        if (error?.name === 'AbortError') { this.phase = 'select-drive'; this.message = 'No drive selected. Choose RPI-RP2 when ready.'; return }
        this.error = error.message; this.phase = ['idle', 'preparing', 'preflight-error'].includes(this.phase) ? 'preflight-error' : `${this.phase}-error`
      }
    }
  }
}
</script>
<template>
  <button data-bs-toggle="modal" data-bs-target="#UpdateConf" class="btn btn-primary" :class="$attrs.class"
          :disabled="checking || current || (versionAware && !currentVersion)">{{ buttonText }}</button>
  <div class="modal fade" id="UpdateConf" tabindex="-1" aria-labelledby="firmware-title" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered"><div class="modal-content">
      <div class="modal-header"><h5 class="modal-title" id="firmware-title">Update firmware</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>
      <div class="modal-body">
        <p v-if="available">Installed: {{ currentVersion }}. Available: {{ latest.version }}.</p>
        <p v-if="internal && available">The browser verifies the complete file before restarting Biotron, then writes it directly to the update drive.</p>
        <p v-if="internal && available" class="small text-muted">Chrome or Edge will ask you to choose <strong>RPI-RP2</strong>. This safety confirmation cannot be skipped.</p>
        <p v-if="current" class="alert alert-success mb-0">Firmware {{ currentVersion }} is current.</p>
        <p v-if="!online" class="alert alert-warning mb-0">Connect to the internet for firmware updates. Settings remain available offline.</p>
        <p v-if="error" class="alert alert-danger mb-0" role="alert">{{ error }}</p>
        <p v-if="message" class="alert alert-info mb-0" role="status" aria-live="polite">{{ message }}</p>
      </div>
      <div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        <button v-if="available && actionText" type="button" class="btn btn-primary" :disabled="actionDisabled" @click="runStep">{{ actionText }}</button>
        <button v-if="busy" type="button" class="btn btn-primary" disabled>Working…</button></div>
    </div></div>
  </div>
</template>
