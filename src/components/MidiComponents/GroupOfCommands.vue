<script>
  import HintComponent from "@/components/HintComponent.vue";

  export default {
    name: "GroupOfCommands",
    components: {HintComponent},

    props: {
      nameOfGroup: {
        default: "",
        type: String
      },
      description: {
        require: false,
        type: String,
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
    <h2 v-if="nameOfGroup">
      <label>
        {{this.nameOfGroup}}
        <HintComponent v-if="this.description" :text="this.description" />
      </label>
    </h2>
    
    <slot name="objects"></slot>

    <div class="description_elem" v-if="this.$slots.description">
      <slot name="description"></slot>
    </div>
</div>
</template>

<style scoped>
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