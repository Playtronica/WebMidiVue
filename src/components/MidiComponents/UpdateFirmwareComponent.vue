<script>
import {LoadFirmware} from "@/assets/js/LoadFirmware";

export default {
  data() {
    return {
      isOnline: navigator.onLine,
      updateError: ''
    }
  },
  mounted() {
    window.addEventListener('online', this.syncOnlineStatus)
    window.addEventListener('offline', this.syncOnlineStatus)
  },
  beforeUnmount() {
    window.removeEventListener('online', this.syncOnlineStatus)
    window.removeEventListener('offline', this.syncOnlineStatus)
  },
  methods: {
    syncOnlineStatus() {
      this.isOnline = navigator.onLine
      if (this.isOnline) this.updateError = ''
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
      device: Object
  }
}
</script>

<template>
  <button data-bs-toggle="modal" data-bs-target="#UpdateConf" class="btn btn-primary" :class="$attrs.class">{{text}}</button>

  <div class="modal fade" id="UpdateConf" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="exampleModalLabel">Update Firmware</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <p>
            After clicking on "Update", you will get a file with the .uf2 extension and the device will switch to boot mode.
            The device will be displayed as removable media (like a USB flash drive).
            You should transfer the resulting .uf2 file to the removable media that appeared.
          </p>
          <h6 style="color: red">ATTENTION</h6>
          <p>The device won't work until you move the file.</p>
          <p v-if="!isOnline" class="alert alert-warning mb-0" role="status">
            Firmware updates require an internet connection. Device settings remain available offline.
          </p>
          <p v-if="updateError" class="alert alert-danger mb-0" role="alert">{{ updateError }}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          <button type="button" class="btn btn-primary" :disabled="!isOnline"
                  @click="updateFirmware">
            Update</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
