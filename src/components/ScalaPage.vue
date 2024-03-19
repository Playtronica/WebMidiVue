

<template>
    <h1 class="text-center">Scala Loader</h1>
    <h2>Create your own scala file or choose from list on <a href="https://isartum.net/leimma">Leimma</a></h2>
    <DeviceSelector regex-name="" @device_changed="(x) => {this.device = x} "/>
    <div class="row">
      <div class="col-9">
        <input v-model="this.url" type="text" id="url_input" class="form-control" placeholder="Leimma link"/>
      </div>
      <div class="col-3">
        <button @click="this.loadUrl" class="btn btn-primary mb-1" style="width: 70%">Send</button>
      </div>
    </div>
    <FileDropArea name="Drop Scala File Here" @get_drop="(e) => this.loadFile(e)"/>
</template>

<script>

import DeviceSelector from "@/components/system/DeviceSelector.vue";
import FileDropArea from "@/components/system/FileDropArea.vue";
import { sleep } from "@/assets/js/SysExCommand"

export default  {
  components: {
    FileDropArea,
    DeviceSelector
  },
  props: {

  },
  methods: {
    /* eslint-disable */
    loadFile(e) {
      let lst = e.split("\n")
      if (!lst[0].includes(".scl")) return
      let ind = lst.lastIndexOf("!")
      let count = parseInt(lst[ind - 1])
      let cents = lst.slice(ind + 1, ind + count + 1)
      this.convertCentsString(cents, count)
    },
    loadUrl() {
      if (!this.url.includes("/tuningsystem")) return
      let cents = this.url.substring(this.url.lastIndexOf("/tuningsystem/") + "/tuningsystem/".length)
      let delimiter = cents.substring(7, 8)

      if (delimiter !== "~" && delimiter !== "s") {
        console.log("Strange Delimiter")
        return;
      }

      let lst = cents.split(delimiter)
      if (delimiter === "s") {
        for (let i = 0; i < lst.length; i++) {
          lst[i] = lst[i].substring(4)
        }
      }

      lst = lst.slice(1)
      lst.push("2r1")
      this.convertCentsString(lst, lst.length, "r")
    },
    convertCentsString(cents, count, delimiter="/") {
      for (let i = 0; i < count; i++) {
        if (cents[i].includes(delimiter)) {
          let d_m = cents[i].split(delimiter)
          cents[i] = parseInt(1200 * Math.log2(parseInt(d_m[0]) / parseInt(d_m[1])))
        }
        else cents[i] = parseInt(cents[i])
      }

      this.sendCents(cents)
    },
    sendCents(lst) {
      if (!this.device) return
      let start_scala_message = [0xF0, 0x0B, 0x14, 0x0D, 0x01, 0xF7]
      this.device.send(start_scala_message)
      console.log(start_scala_message)

      let message = []
      for (const number of lst) {
        message = [0xF0, 0x0B, 0x14, 0x0D, 0x01]
        for (let _ = 0; _ < Math.floor(number / 0x7F); _++) {
          message.push(0x7F)
        }
        if (number % 0x7F !== 0) {
          message.push(number % 0x7F)
        }
        message.push(0xF7)
        this.device.send(message)
        console.log(message)
        sleep(1000);
      }

      let stop_message = [0xF0, 0x0B, 0x14, 0x0D, 0x7F, 0xF7]
      this.device.send(stop_message)
      console.log(stop_message)

    }

  },
  data() {
    return {
      url: "",
      device: null,
    }
  },
}
</script>

<style scoped>

</style>