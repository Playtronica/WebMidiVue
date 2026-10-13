<template>
  <CompatibilityNotice v-if="issue" :issue="issue" />
  <slot v-else />
</template>

<script>
import CompatibilityNotice from '@/components/CompatibilityNotice.vue'
import {buildCompatibilityIssue, detectPlatformCapabilities} from '@/compatibility.mjs'

export default {
  name: 'CompatibilityGate',
  components: {CompatibilityNotice},
  props: {route: {type: Object, required: true}},
  data() {
    return {capabilities: detectPlatformCapabilities()}
  },
  computed: {
    issue() {
      return buildCompatibilityIssue(this.capabilities, this.route.meta || {})
    }
  }
}
</script>
