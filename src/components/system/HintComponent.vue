<template>
  <span v-if='description !== "" ' class="hint" :title="this.description">
  ?

  </span>
</template>

<script>
export default {
  name: "HintComp",
  props: {
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

<style scoped>
  .hint {
    font-size: 50%;
    border: 2px solid #0275ff;
    border-radius: 100%;
    padding: 0 6px;
  }
</style>