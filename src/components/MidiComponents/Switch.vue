<template>
    <div class="flex-row">
      <div>
        <label>
          {{ this.commandLabel }}
          <HintComponent v-if="this.description" :text="this.description" />
        </label>
      </div>

      <div>
        <label class="switch">
          <input id="checkbox_input" type="checkbox" :checked="commandObject.value"
                 @click="commandObject.set_value($event.target.checked)" @change="this.changed">
          <span class="slider round"></span>
        </label>
      </div>
    </div>
</template>

<script>
import {SysExCommand} from "@/assets/js/SysExCommand";
import HintComponent from "@/components/HintComponent.vue";

export default {
  name: "SwitchComponent",
  components: {HintComponent},
  props: {
    commandObject: {
      type: SysExCommand,
    },
    commandLabel: {
      type: String,
    },
    description: {
      type: String,
      required: false,
    }
  },
  emits: ["InputChanged"],
  methods: {
    changed() {
      this.$emit('InputChanged', this.commandObject)
    }
  }
}
</script>

<style scoped>
.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

/* Hide default HTML checkbox */
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: .4s;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196F3;
}

input:checked + .slider:before {
  -webkit-transform: translateX(26px);
  -ms-transform: translateX(26px);
  transform: translateX(26px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}
</style>