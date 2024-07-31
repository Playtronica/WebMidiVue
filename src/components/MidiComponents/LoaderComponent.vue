<script>


import validateDuration from "@/assets/js/validateDuration";
import calcPropertyValue from "@/assets/js/calcPropertyValue";

export default {
  name: 'RingLoader',
  props: {
    loading: {
      type: Boolean,
      default: true,
    },
    size: {
      type: Number,
      default: 55,
    },
    color: {
      type: String,
      default: '#3083fa',
    },
    duration: {
      type: String,
      default: '1.2s',
      validator: validateDuration,
    },
  },
  data() {
    return {
      spinnerStyle: {
        borderWidth: `${this.size * 0.1}px`,
        borderColor: `${this.color} transparent transparent transparent`,
        animationDuration: this.duration,
      },
    }
  },
  computed: {
    animDiv1() {
      return calcPropertyValue('animationDelay', this.duration, -0.375)
    },
    animDiv2() {
      return calcPropertyValue('animationDelay', this.duration, -0.25)
    },
    animDiv3() {
      return calcPropertyValue('animationDelay', this.duration, -0.125)
    },
  },
}
</script>

<template>
  <div id="loader_div" style="position: fixed;
   z-index: 10; width: 100%; height: 100%; background-color: rgba(59,54,54,0.4);
    top: 0;
    left: 0;">

    <div class="container text-center" style="transform: translate(0, 50vh);">
      <div class="row justify-content-center">
        <h1 style="color: #0d6efd; font-weight: bold; text-shadow: 0px 0px 6px #fff;">
          Loading
        </h1>
        <div v-show="loading" class="lds-ring" :style="{ width: `${size}px`, height: `${size}px`, padding: `0px` }">
          <div v-bind:style="[spinnerStyle, animDiv1]"></div>
          <div v-bind:style="[spinnerStyle, animDiv2]"></div>
          <div v-bind:style="[spinnerStyle, animDiv3]"></div>
          <div v-bind:style="[spinnerStyle]"></div>
        </div>

      </div>

    </div>

  </div>
</template>

<style scoped>
.lds-ring {
  display: inline-block;
  position: relative;
}
.lds-ring div {
  box-sizing: border-box;
  display: block;
  position: absolute;

  /* ratio: calc(64px / 80px) */
  width: 80%;
  height: 80%;

  /* ratio: calc(8px / 80px) */
  margin: 10%;
  border: 8px solid #fff;
  border-radius: 50%;
  border-color: #fff transparent transparent transparent;
  animation-name: lds-ring;
  animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
  animation-iteration-count: infinite;
}
@keyframes lds-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>