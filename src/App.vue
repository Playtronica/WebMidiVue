<template>
  <header class="d-flex justify-content-center">
    <ul class="nav nav-pills">
      <li class="nav-item">
        <router-link v-if="this.url === '/biotron'" to="/biotron" @click="this.update" class="nav-link active">Biotron</router-link>
        <router-link v-else to="/biotron" @click="this.update" class="nav-link">Biotron</router-link>
      </li>
      <li class="nav-item">
        <router-link v-if="this.url === '/touchme'" @click="this.update" to="/touchme" class="nav-link active">TouchMe</router-link>
        <router-link v-else to="/touchme" @click="this.update" class="nav-link">TouchMe</router-link>
      </li>
    </ul>
  </header>
  <div class="m-2">
    <router-view></router-view>
  </div>
</template>


<script>
export default {
  name: 'App',
  data() {
    return {
      url: String,
      forceRerender: 0
    }
  },
  async mounted() {
    console.log("Hello! You`re curious, aren`t you?")

    if (navigator.requestMIDIAccess) {
      console.log("MIDI is supported!");
      try {
        // eslint-disable-next-line no-unused-vars
        const midiAccess = await navigator.requestMIDIAccess();
        console.log("MIDI is supported!");
      } catch (error) {
        console.error("Could not access MIDI devices:", error);
        window.alert("You have denied access to MIDI devices.");
      }
    } else {
      console.error("MIDI is not supported. Sending notification...");
      window.alert("Only works on Chrome on desktop computer.");
    }

  },
  methods: {
    update() { this.forceRerender++ }
  }
}
</script>

<style>

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 1%;
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
