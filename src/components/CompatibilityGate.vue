<template>
  <CompatibilityNotice v-if="issue" :issue="issue" :feedback-url="feedbackUrl" />
  <slot v-else />
</template>

<script>
import CompatibilityNotice from '@/components/CompatibilityNotice.vue'
import {buildCompatibilityIssue, detectPlatformCapabilities, taskFeedbackUrl} from '@/compatibility.mjs'

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
    },
    feedbackUrl() { return this.issue && this.route.meta?.firstPlay ? taskFeedbackUrl('I could not start the Biotron first-sound test.', `Compatibility: ${this.issue.kind}`, process.env.VUE_APP_BUILD_ID || 'local-build') : '' }
  }
}
</script>
