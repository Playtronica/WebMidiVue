<script>

export default {
  name: "BootstrapCollapse",
  props: {
    name_of_collapse: {
      type: String,
      required: true,
    },
    open_by_default: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      is_open: this.open_by_default,
      collapseId: 'collapse-' + Math.random().toString(36).substring(2, 10),
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
  <div class="toggle-label" data-bs-toggle="collapse" :href="'#' + collapseId" role="button" aria-expanded="false"
       :aria-controls="this.collapseId" ref="collapse_header">
    <h1>
      {{name_of_collapse}}
      <span>{{ is_open ? "-" : "+"}}</span>
    </h1>
    <hr/>
  </div>

  <div v-if="!open_by_default" class="collapse mt-2" :id="this.collapseId" ref="collapse_object">
    <slot name="objects"></slot>
  </div>
  <div v-else class="collapse mt-2 show" :id="this.collapseId" ref="collapse_object">
    <slot name="objects"></slot>
  </div>


</template>

<style scoped>

</style>