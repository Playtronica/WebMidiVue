<script>
// eslint-disable-next-line no-unused-vars
import HintComponent from "@/components/HintComponent.vue";
import {SysExCommand} from "@/assets/js/SysExCommand";

export default {
  name: "RgbColorCommand",
  components: {
    HintComponent
  },
  props: {
    commandLabel: {
      default: "",
      type: String
    },
    commandObject: {
      required: true,
      type: SysExCommand
    },
    description: {
      type: String,
      required: false,
    }
  },
  emits: ["InputChanged"],
  data() {
    return {
      rawValue: "#000000",
      sendTimer: null,
    }
  },
  methods: {
    toHex(value) {
      return "#" + value.toString(16).padStart(6, '0');
    },
    // Native picker fires "change" only when its popup closes, so send on "input"
    // once the user stops dragging instead
    changed() {
      clearTimeout(this.sendTimer)
      this.sendTimer = setTimeout(() => {
        const value = parseInt(this.rawValue.replace("#", ""), 16)
        if (value === this.commandObject.value) return
        this.commandObject.set_value(value)
        this.$emit('InputChanged', this.commandObject)
      }, 150)
    }
  },
  watch: {
    // Keeps the picker in sync on preset load without remounting it (remount closes the popup)
    "commandObject.value"(value) {
      this.rawValue = this.toHex(value);
    }
  },
  created() {
    this.rawValue = this.toHex(this.commandObject.value);
  },
  beforeUnmount() {
    clearTimeout(this.sendTimer)
  }
}
</script>

<template>
  <div class="row">
    <label>
      {{ this.commandLabel }}
      <HintComponent v-if="this.description" :text="this.description"/>
    </label>
    <input type="color" v-model="this.rawValue" @input="changed">
  </div>
</template>

<style scoped>

</style>