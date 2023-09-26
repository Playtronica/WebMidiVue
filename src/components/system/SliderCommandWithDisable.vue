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
    defaultChecked: {
      default: true,
      type: Boolean,
    },
    defaultValue: {
      default: 0,
      type: Number
    }
  },
  data() {
    return {
      Value: 0,
      Checked: true
    }
  },
  methods: {
    checkboxEvent() {
      if (!this.Checked) {
        this.Value = this.defaultValue;
      }
      else {
        this.Value = this.minValue;
      }
    },
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
    this.Checked = this.defaultChecked;
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
        <input type="number" id="value_input" class="form-control" :disabled="!this.Checked" @input="this.checkLimit"
               v-model="this.Value" :min="this.minValue" :max="this.maxValue"/>

        <input type="range" id="range_input" class="settings_input"
               v-model="this.Value" :min="this.minValue" :max="this.maxValue" :step="this.step"/>
      </div>
      <div class="col-3">
        <div class="container">
          <div class="col w-100">
            <label class="switch">
              <input id="checkbox_input" type="checkbox" v-model="Checked" @click="this.checkboxEvent()">
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