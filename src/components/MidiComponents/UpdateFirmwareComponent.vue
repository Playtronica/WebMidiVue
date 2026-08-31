<script>
import {compareFirmwareVersions, GetLatestFirmware, LoadFirmware} from "@/assets/js/LoadFirmware";

export default {
  data() {
    return {
      isOnline: navigator.onLine,
      updateError: '',
      latestFirmware: null,
      checkingFirmware: false
    }
  },
  mounted() {
    window.addEventListener('online', this.syncOnlineStatus)
    window.addEventListener('offline', this.syncOnlineStatus)
    if (this.versionAware && this.currentVersion) this.refreshFirmwareStatus()
  },
  beforeUnmount() {
    window.removeEventListener('online', this.syncOnlineStatus)
    window.removeEventListener('offline', this.syncOnlineStatus)
  },
  methods: {
    syncOnlineStatus() {
      this.isOnline = navigator.onLine
      if (this.isOnline) this.updateError = ''
      if (this.isOnline && this.versionAware && this.currentVersion && !this.latestFirmware) this.refreshFirmwareStatus()
    },
    async refreshFirmwareStatus() {
      if (!this.isOnline || this.checkingFirmware) return
      this.checkingFirmware = true
      try {
        this.latestFirmware = await GetLatestFirmware(this.repo)
        this.updateError = ''
      } catch (error) {
        this.updateError = error.message
      } finally {
        this.checkingFirmware = false
      }
    },
    async updateFirmware() {
      this.updateError = ''
      try {
        await LoadFirmware(this.repo, this.device)
      } catch (error) {
        this.updateError = error.message
      }
    }
  },

  props: {
      repo: {
        type: String
      },
      text: {
        type: String,
        default: "Update Firmware",
      },
      device: Object,
      currentVersion: {
        type: String,
        default: ''
      },
      versionAware: {
        type: Boolean,
        default: false
      }
  },
  watch: {
    currentVersion(value) {
      if (this.versionAware && value && !this.latestFirmware) this.refreshFirmwareStatus()
    }
  },
  computed: {
    updateAvailable() {
      return Boolean(this.currentVersion && this.latestFirmware?.version &&
          compareFirmwareVersions(this.latestFirmware.version, this.currentVersion) > 0)
    },
    noUpdateNeeded() {
      return Boolean(this.currentVersion && this.latestFirmware?.version && !this.updateAvailable)
    },
    buttonText() {
      if (this.checkingFirmware) return 'Checking firmware…'
      if (this.versionAware && !this.currentVersion) return 'Connect to check firmware'
      if (this.noUpdateNeeded) return `Firmware ${this.currentVersion} ✓`
      if (this.updateAvailable) return `Update to ${this.latestFirmware.version}`
      return this.text
    }
  }
}
</script>

<template>
  <button data-bs-toggle="modal" data-bs-target="#UpdateConf" class="btn btn-primary" :class="$attrs.class"
          :disabled="checkingFirmware || noUpdateNeeded || (versionAware && !currentVersion)">{{buttonText}}</button>

  <div class="modal fade" id="UpdateConf" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="exampleModalLabel">Update Firmware</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <p v-if="noUpdateNeeded" class="alert alert-success mb-0">
            Firmware {{ currentVersion }} is already current. The public release is {{ latestFirmware.version }}.
            No download or update is needed.
          </p>
          <p v-else-if="updateAvailable">
            After clicking on "Update", you will get a file with the .uf2 extension and the device will switch to boot mode.
            The device will be displayed as removable media (like a USB flash drive).
            You should transfer the resulting .uf2 file to the removable media that appeared.
          </p>
          <h6 v-if="updateAvailable" style="color: red">ATTENTION</h6>
          <p v-if="updateAvailable">Chrome cannot silently write to a removable USB drive. Continue only if you are ready to move the downloaded file to RPI-RP2.</p>
          <p v-if="!currentVersion && !checkingFirmware" class="alert alert-warning mb-0">
            Connect Biotron and wait for its firmware version before updating.
          </p>
          <p v-if="!isOnline" class="alert alert-warning mb-0" role="status">
            Firmware updates require an internet connection. Device settings remain available offline.
          </p>
          <p v-if="updateError" class="alert alert-danger mb-0" role="alert">{{ updateError }}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          <button v-if="updateAvailable" type="button" class="btn btn-primary" :disabled="!isOnline || !device"
                  @click="updateFirmware">
            Update</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
