<template>
  <div>
    <label>
      {{ this.commandLabel }}
      <HintComponent v-if="this.description" :text="this.description"/>
    </label>
    <div class="d-flex flex-wrap justify-content-around">
      <div class="rounded-circle color-square m-2" v-for="(index, web_color) in colors" :key="index"
           :style="{backgroundColor: web_color, border: this.selectedColor === web_color ? '2px solid black' : ''}"
           @click="selectColor(web_color)">
      </div>
    </div>
    <label>
      Brightness
    </label>
    <div>
      <input type="range" id="range_input" class="settings_input"
             v-model="this.brightness" :min="0" :max="100"
             :step="1" @change="this.changed($event)"/>
    </div>
  </div>
</template>

<script>
import {SysExCommand} from "@/assets/js/SysExCommand";
import HintComponent from "@/components/HintComponent.vue";

export default {
  components: {HintComponent},
  props: {
    commandLabel: {
      default: "",
      type: String
    },
    commandColorObject: {
      required: true,
      type: SysExCommand
    },
    commandBrightObject: {
      required: true,
      type: SysExCommand,
    },
    commandColorAndBrightnessObject: {
      required: true,
      type: SysExCommand,
    },
    description: {
      type: String,
      required: false,
    }
  },
  emits: ["InputChanged"],
  methods: {
    selectColor(color) {
      this.selectedColor = color;
      console.log(this.selectedColor);
      this.changed()
    },
    getBrightnessColor() {
      let c = this.colors[this.selectedColor].substring(1);
      let rgb = parseInt(c, 16);
      let r = (rgb >> 16) & 0xff;
      let g = (rgb >>  8) & 0xff;
      let b = (rgb >>  0) & 0xff;

      let newR = Math.round(r * this.brightness / 100);
      newR = (newR < 255) ? newR : 255;
      let newG = Math.round(g * this.brightness / 100);
      newG = (newG < 255) ? newG : 255;
      let newB = Math.round(b * this.brightness / 100);
      newB = (newB < 255) ? newB : 255;

      let newColor = ((newR << 16) | (newG << 8) | newB).toString(16);
      while (newColor.length < 6) {
        newColor = '0' + newColor;
      }

      newColor = '#' + newColor;

      return newColor;
    },
    changed() {
      this.commandColorAndBrightnessObject.set_value(parseInt(this.getBrightnessColor().substring(1), 16))
      this.commandColorObject.set_value(parseInt(this.selectedColor.substring(1), 16))
      this.commandBrightObject.set_value(this.brightness)
      this.$emit('InputChanged', this.commandColorAndBrightnessObject)
    },

  },
  mounted() {
    this.selectedColor = "#" + this.commandColorObject.value.toString(16).toUpperCase().padStart(6, '0');
    this.brightness = this.commandBrightObject.value
  },
  data() {
    return {
      colors: {
        "#E6E6E6": "#FFE9AD",
        '#FF0000': "#FF0000",
        "#FFA500": "#FF4000",
        "#FFFF00": "#FF6E00",
        "#90FF00": "#90FF00",
        '#00FFFF': '#00FFFF',
        "#0040FF": '#0080FF',
        "#AE00FF": "#AE00FF",
      },
      selectedColor: '',
      brightness: 100,
    }
  },
}
</script>

<style scoped>
.color-square {
  width: 50px;
  height: 50px;
  cursor: pointer;
}
</style>