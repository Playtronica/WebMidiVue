<script>
export default {
  name: "BootstrapCollapse",
  props: {
    name_of_collapse: {
      type: String,
      required: true,
    }
  },
  data() {
    return {
      is_open: false,
    }
  },
  mounted() {
    this.$refs.collapse_object.addEventListener("show.bs.collapse",  () => {
      this.is_open = true
    })
    this.$refs.collapse_object.addEventListener("hide.bs.collapse",  () => {
      this.is_open = false
    })
  }
}
</script>

<template>
  <div class="toggle-label" data-bs-toggle="collapse" href="#collapse_object" role="button" aria-expanded="false"
       aria-controls="collapse_object" ref="collapse_header">
    <h1>
      {{name_of_collapse}}
      <span>{{ is_open ? "-" : "+"}}</span>
    </h1>
    <hr/>
  </div>

  <div class="collapse mt-2" id="collapse_object" ref="collapse_object">
    <slot name="objects"></slot>
  </div>


</template>

<style scoped>

</style>