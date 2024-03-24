<script>
  import {getTransitionRawChildren} from "@vue/runtime-core";
  import HintComp from "@/components/system/HintComponent.vue";

  export default {
    name: "GroupOfCommands",
    components: {HintComp},
    methods: {getTransitionRawChildren},
    props: {
      nameOfGroup: {
        default: "",
        type: String
      },
      description: {
        type: String,
        default: ""
      }
    },
    mounted() {
      // console.log(this.description)
    }
  }
</script>

<template>
  <div class="settings_elem">
    <h2>
      {{this.nameOfGroup}}
      <hint-comp :description="this.description"/>
    </h2>
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