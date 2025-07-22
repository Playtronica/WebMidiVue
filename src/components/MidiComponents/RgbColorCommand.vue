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
    }
  },
  methods: {
    changed(event) {
      this.commandObject.set_value(parseInt(event.target.value.replace("#", ""), 16))
      this.$emit('InputChanged', this.commandObject)
    }
  },
  created() {
    this.rawValue = "#" + this.commandObject.value.toString(16).padStart(6, '0');
  }
}
</script>

<template>
  <div class="row m-2">
    <label>
      {{ this.commandLabel }}
      <HintComponent v-if="this.description" :text="this.description"/>
    </label>
    <input type="color" v-model="this.rawValue" @change="changed">
  </div>
</template>

<style scoped>

</style>