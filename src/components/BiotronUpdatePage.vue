<template>
    <h1 class="text-center">Biotron Update Page</h1>
    <DeviceSelector style="display: none" regex-name="Biotron" @device_changed="(x) => {this.device = x} "/>

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
            <button type="button" class="btn btn-primary" data-bs-dismiss="modal" @click="this.updateFirmware">Update</button>
          </div>
        </div>
      </div>
    </div>
</template>

<script>

import biotronFirmware from "!!binary-loader!@/../public/biotron-firmware_v1.5.0.uf2";
import {saveAs} from "@progress/kendo-file-saver";
import {sleep} from "@/assets/js/SysExCommand";
import DeviceSelector from "@/components/system/DeviceSelector.vue";



export default  {
  components: {
    DeviceSelector,
  },
  methods: {
    updateFirmware() {
      let array = new Uint8Array(biotronFirmware.length);
      for (let i = 0; i < biotronFirmware.length; i++) {
        array[i] = biotronFirmware.charCodeAt(i);
      }
      console.log(array)
      let myFile = new File([array], "biotron-firmware_v1.5.0.uf2")
      saveAs(myFile, "biotron-firmware_v1.5.0.uf2");
      if (!this.device) return;
      this.device.send([240, 11, 127, 247])
      sleep(100)
      this.device.send([240, 11, 20, 13, 127, 247])
    },
  }
}
</script>

<style scoped>

</style>