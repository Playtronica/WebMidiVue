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
    },
    data() {
      return {

      }
    },
  }
</script>

<template>
  <div class="settings_elem">
    <h2>{{this.nameOfGroup}}</h2>
    <slot name="objects"></slot>
    <div class="description_elem" v-if="this.$slots.description">
      <slot name="description"></slot>
    </div>
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

  .description_elem {
    border: 1px dashed;
    border-radius: 5px;
    padding: 1%;
    margin-bottom: 1%;
  }

</style>