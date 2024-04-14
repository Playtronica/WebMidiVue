<script>
import {SysExCommand} from "@/assets/js/SysExCommand";

export default {
  props: {
    commandLabel: {
      default: "",
      type: String
    },
    listOfVariants: {
      default: {},
    },
    commandObject: {
      required: true,
      type: SysExCommand
    }
  },
  data() {
    return {
      Value: 0
    }
  },
  methods: {
    changed() {
      document.dispatchEvent(new CustomEvent('InputChanged'))
    }
  },
  watch: {
    Value() {
      this.commandObject.set_value(this.Value)
    }
  },
  mounted() {
    this.Value = this.commandObject.value;
  }
}
</script>

<template>
  <div class="row m-2">
    <label for="value_input">{{ this.commandLabel }}</label>

    <select v-model="this.Value" id="scale" class="form-control" @input="changed">
      <option v-for="(item, index) in this.listOfVariants" v-bind:key="index" :value="index">
        {{item}}
      </option>
    </select>
  </div>
</template>

<style scoped>
  .settings_input {
    width: 100%;
  }
</style>