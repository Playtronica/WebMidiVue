<script>

import {SysExCommand} from "@/assets/js/SysExCommand";

export default {
  props: {
    commandLabel: {
      default: "",
      type: String
    },
    commandObject: {
      required: true,
      type: SysExCommand
    }
  },
  data() {
    return {
      Value: 0,
      Checked: true,
      Disabled: false
    }
  },
  methods: {
    checkboxEvent() {
      if (this.Checked) {
        this.Value = this.commandObject.max_value;
        this.Disabled = false;
      }
      else {
        this.Value = this.commandObject.min_value;
        this.Disabled = true;
      }
    },
    checkLimit() {
      if (this.Value > this.commandObject.max_value) {
        this.Value = this.commandObject.max_value
      }
      if (this.Value < this.commandObject.min_value) {
        this.Value = this.commandObject.min_value
      }
    }
  },
  watch: {
    Value() {
      this.commandObject.set_value(this.Value)
      this.checkLimit()
    },
    Checked() {
      this.checkboxEvent()
    }
  },
  mounted() {
    this.Value = this.commandObject.value;
  }
}
</script>

<template>
  <div class="row m-2">
    <div class="row">
      <label for="value_input">{{ this.commandLabel }}</label>
    </div>
    <div class="row">
      <div class="col-9">
        <input type="number" id="value_input" class="form-control"
               v-model="this.Value" :min="this.commandObject.min_value" :max="this.commandObject.max_value"
               :disabled="this.Disabled"/>

        <input type="range" id="range_input" class="settings_input"
               v-model="this.Value" :min="this.commandObject.min_value" :max="this.commandObject.max_value"
               :step="this.commandObject.step"
                :disabled="this.Disabled"/>
      </div>
      <div class="col-3">
        <div class="container">
          <div class="col w-100">
            <label class="switch">
              <input id="checkbox_input" type="checkbox" v-model="this.Checked" @click="this.checkboxEvent()">
              <span class="slider round"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .settings_input {
    width: 100%;
  }

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