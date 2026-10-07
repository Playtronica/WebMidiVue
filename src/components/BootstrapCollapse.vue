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
  <button type="button" class="toggle-label" data-bs-toggle="collapse" :data-bs-target="'#' + collapseId" :aria-expanded="is_open"
       :aria-controls="this.collapseId" ref="collapse_header">
    <h2>
      {{name_of_collapse}}
      <img :src="is_open ? chevronUp : chevronDown" alt="" class="collapse-chevron" aria-hidden="true">
    </h2>
  </button>

  <div v-if="!open_by_default" class="collapse mt-2" :id="this.collapseId" ref="collapse_object">
    <slot name="objects"></slot>
  </div>
  <div v-else class="collapse mt-2 show" :id="this.collapseId" ref="collapse_object">
    <slot name="objects"></slot>
  </div>


</template>

<style scoped>
.toggle-label { width:100%; border:0; background:transparent; text-align:left; }
.toggle-label:focus-visible { outline:3px solid #315ee7; outline-offset:3px; }
.toggle-label h2 { margin: 0; font-size: var(--ui-text-section, 1.25rem); font-weight: 700; }
.collapse-chevron {
  width: 1rem;
  height: 1rem;
}
</style>
