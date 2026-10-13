<script>
import infoIcon from '@fortawesome/fontawesome-free/svgs/solid/circle-info.svg'

export default {
  data() {
    return {infoIcon}
  },
  props: {
    text: {
      type: String,
      default: "IS NOT IMPLEMENTED",
    }
  }
}
</script>

<template>
  <img
      :src="infoIcon"
      alt=""
      class="hint-icon"
      :title="text"
      role="img"
      :aria-label="text"
  >
</template>

<style scoped>
.hint-icon {
  width: 1rem;
  height: 1rem;
  filter: invert(35%) sepia(95%) saturate(3300%) hue-rotate(210deg) brightness(96%);
}
</style>
