<script>
export default {
  props: {
    commandLabel: {
      default: "",
      type: String
    },
    minValue: {
      default: 0,
      type: Number
    },
    maxValue: {
      default: 100,
      type: Number
    },
    step: {
      default: 1,
      type: Number
    },
    defaultValue: {
      default: 0,
      type: Number
    }
  },
  data() {
    return {
      Value: 0
    }
  },
  watch: {
    Value() {
      this.checkLimit()
      this.$emit("change-value", parseInt(this.Value))
    }
  },
  methods: {
    checkLimit() {
      if (this.Value > this.maxValue) {
        this.Value = this.maxValue
      }
      if (this.Value < this.minValue) {
        this.Value = this.minValue
      }
    }
  },
  mounted() {
    this.Value = this.defaultValue;
  }
}
</script>

<template>
  <div class="row m-2">
    <label for="value_input">{{ this.commandLabel }}</label>

    <input type="number" id="value_input" class="form-control"
           v-model="this.Value" :min="this.minValue" :max="this.maxValue" />

    <input type="range" id="range_input" class="settings_input"
           v-model="this.Value" :min="this.minValue" :max="this.maxValue" :step="this.step"/>
  </div>
</template>

<style scoped>
  .settings_input {
    width: 100%;
  }
</style>