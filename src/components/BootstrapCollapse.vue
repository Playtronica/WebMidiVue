<script>
import {createListenerScope} from "@/assets/js/ListenerScope.mjs";
import chevronUp from '@fortawesome/fontawesome-free/svgs/solid/chevron-up.svg'
import chevronDown from '@fortawesome/fontawesome-free/svgs/solid/chevron-down.svg'

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
      chevronUp,
      chevronDown,
    }
  },
  mounted() {
    this.listenerScope = createListenerScope()
    this.listenerScope.on(this.$refs.collapse_object, "show.bs.collapse", () => {
      this.is_open = true
    })
    this.listenerScope.on(this.$refs.collapse_object, "hide.bs.collapse", () => {
      this.is_open = false
    })
  },
  beforeUnmount() {
    this.listenerScope?.clear()
  }
}
</script>

<template>
  <div class="toggle-label" data-bs-toggle="collapse" :href="'#' + collapseId" role="button" :aria-expanded="is_open"
       :aria-controls="this.collapseId" ref="collapse_header">
    <h1>
      {{name_of_collapse}}
      <img :src="is_open ? chevronUp : chevronDown" alt="" class="collapse-chevron" aria-hidden="true">
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
.collapse-chevron {
  width: 1rem;
  height: 1rem;
}
</style>
