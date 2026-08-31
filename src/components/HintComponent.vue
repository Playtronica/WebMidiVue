<script>
import infoIcon from '@fortawesome/fontawesome-free/svgs/solid/circle-info.svg'

export default {
  data: () => ({infoIcon}),
  props: {text: {type: String, default: 'Help is not available.'}}
}
</script>

<template>
  <details class="hint">
    <summary role="button" :aria-label="`Help: ${text}`">
      <img :src="infoIcon" alt="">
    </summary>
    <span role="tooltip">{{ text }}</span>
  </details>
</template>

<style scoped>
.hint { position: relative; display: inline-block; vertical-align: middle; }
summary { display: grid; width: 2rem; height: 2rem; place-items: center; border-radius: 50%; cursor: pointer; }
summary::-webkit-details-marker { display: none; }
summary:hover, summary:focus-visible { background: #e9f0ff; outline: none; }
img { width: 1rem; height: 1rem; filter: invert(35%) sepia(95%) saturate(3300%) hue-rotate(210deg) brightness(96%); }
[role="tooltip"] { position: absolute; z-index: 20; top: calc(100% + .25rem); left: 50%; width: min(17rem, calc(100vw - 2rem)); transform: translateX(-50%); border-radius: .6rem; background: #20242b; color: white; padding: .6rem .75rem; font-size: .875rem; font-weight: 400; line-height: 1.35; text-align: left; box-shadow: 0 .35rem 1rem rgba(0, 0, 0, .2); }
</style>
