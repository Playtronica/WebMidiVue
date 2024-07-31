<script>

export default {
  props: {
    size: {
      default: '40px'
    },
    background: {
      default: '#0d6efd'
    },
    duration: {
      default: '2.0s'
    }
  },
  computed: {
    bounceStyle () {
      return {
        backgroundColor: this.background,
        animationDuration: this.duration
      }
    },
    styles () {
      return {
        width: this.size,
        height: this.size
      }
    }
  }
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
        <div v-bind:style="styles" class="spinner spinner--double-bounce">
          <div class="double-bounce1" v-bind:style="bounceStyle"></div>
          <div class="double-bounce2" v-bind:style="bounceStyle"></div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.spinner {
  position: relative;
  display: inline-block;
  * {
    line-height: 0;
    box-sizing: border-box;
  }
}

.double-bounce1, .double-bounce2 {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  opacity: 0.6;
  position: absolute;
  top: 0;
  left: 0;
  animation: double-bounce 2.0s ease-in-out infinite;
}

.double-bounce2 {
  animation-delay: -1.0s;
}

@keyframes double-bounce {
  0%, 100% {
    transform: scale(0.0);
  }
  50% {
    transform: scale(1.0);
  }
}
</style>