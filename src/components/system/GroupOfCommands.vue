<script>
  import {getTransitionRawChildren} from "@vue/runtime-core";

  export default {
    name: "GroupOfCommands",
    methods: {getTransitionRawChildren},
    props: {
      nameOfGroup: {
        default: "",
        type: String
      }
    }
  }
</script>

<template>
  <div class="settings_elem">
    <h2>{{this.nameOfGroup}}</h2>
    <slot name="objects"></slot>
  </div>
</template>

<style scoped>
  .settings_block {
    margin: 1%;
    margin-top: 2%;
  }

  .settings_elem {
    border: 1px solid;
    border-radius: 5px;
    padding: 1%;
    margin-bottom: 1%;
  }

  .settings_elem h2 {
    font-weight: bold;
  }
</style>