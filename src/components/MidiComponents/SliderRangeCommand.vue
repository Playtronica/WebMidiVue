<script>
import {sleep, SysExCommand} from "@/assets/js/SysExCommand"
import "@/../node_modules/multi-range-slider-vue/MultiRangeSliderBarOnly.css"
import Slider from '@vueform/slider'
import HintComponent from "@/components/HintComponent.vue";

export default {
  components: {HintComponent, Slider},
  emits: ["input-changed"],
  props: {
    commandLabel: {
      default: "",
      type: String
    },
    minCommandObject: {
      required: true,
      type: SysExCommand
    },
    maxCommandObject: {
      required: true,
      type: SysExCommand
    },
    description: {
      type: String,
      required: false,
    }
  },
  data() {
    return {
      minValue: 0,
      maxValue: 0,
      values: [0, 0]
    }
  },
  methods: {
    changed() {
      this.minCommandObject.set_value(this.values[0]);
      this.maxCommandObject.set_value(this.values[1]);
      this.$emit('input-changed', this.minCommandObject)
      sleep(1)
      this.$emit('input-changed', this.maxCommandObject)
    },
  },
  created() {
    this.minValue = this.minCommandObject.value;
    this.maxValue = this.maxCommandObject.value;
    this.values = [this.minCommandObject.value, this.maxCommandObject.value]
    if (this.minValue > this.maxValue) {
      this.minValue = this.maxValue
    }
  }
}
</script>

<template>
  <div class="row m-2">
    <label>
      {{ this.commandLabel }}
      <HintComponent v-if="this.description" :text="this.description" />
    </label>
      <div class="row" style="margin-bottom: 10px">
        <div class="col">
          <input type="number" id="value_input_min" class="form-control" @change="this.changed"
                 v-model="this.values[0]" :min="this.minCommandObject.min_value" :max="this.minCommandObject.max_value" />
        </div>
        -
        <div class="col">
          <input type="number" id="value_input_max" class="form-control" @change="this.changed"
                 v-model="this.values[1]" :min="this.minCommandObject.min_value" :max="this.maxCommandObject.max_value" />
        </div>
      </div>
      <div class="row">
        <Slider
            v-model="values"
            class="slider-blue"
            :tooltips="false"
            :max="this.maxCommandObject.max_value"
            :min="this.minCommandObject.min_value"
            :step="this.minCommandObject.step"
            :lazy="false"
            @change="this.changed"
        />
      </div>

  </div>
</template>

<style scoped>
@import "@vueform/slider/themes/default.css";

.slider-blue {
  --slider-connect-bg: #3B82F6;
  --slider-handle-ring-color: #ffffff80;
  --slider-handle-bg: #0275ff;
}
</style>