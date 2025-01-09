<script>
import {LoadFirmware} from "@/assets/js/LoadFirmware";

export default {
  methods: {LoadFirmware},

  props: {
      repo: {
        type: String
      },
      device: Object
  }
}
</script>

<template>
  <button data-bs-toggle="modal" data-bs-target="#UpdateConf" class="btn btn-primary mb-1" style="width: 70%">Update Firmware</button>

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
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          <button type="button" class="btn btn-primary" data-bs-dismiss="modal"
                  @click="LoadFirmware(this.repo, this.device)">
            Update</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>