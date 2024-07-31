<template>
    <h1 class="text-center">Biotron Update Page</h1>
    <DeviceSelector style="display: none" regex-name="Biotron" @device_changed="(x) => {this.device = x} "/>

    <UpdateFirmwareComponent repo="Playtronica/biotron-releases" :device="this.device"/>
</template>

<script>

import DeviceSelector from "@/components/MidiComponents/DeviceSelector.vue";
import {LoadFirmware} from "@/assets/js/LoadFirmware";
import UpdateFirmwareComponent from "@/components/MidiComponents/UpdateFirmwareComponent.vue";


export default  {
  components: {
    UpdateFirmwareComponent,
    DeviceSelector,
  },
  data() {
    return {
      device: null
    }
  },
  methods: {
    LoadFirmware,
  }
}
</script>

<style scoped>

</style>