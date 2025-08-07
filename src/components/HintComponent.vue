<script>
import {Tooltip} from "bootstrap";
import '@fortawesome/fontawesome-free/css/all.min.css';

export default {
  props: {
    text: {
      type: String,
      default: "IS NOT IMPLEMENTED",
    }
  },
  mounted() {
    new Tooltip(document.body, {
      selector: "[data-bs-toggle='tooltip']",
    })
  }
}
</script>

<template>
  <div
      class="fas fa-info-circle"
      style="color: #0d6efd"
      data-bs-toggle="tooltip"
      data-bs-placement="right"
      data-bs-html='true'
      :title="text"
      disabled=""
  ></div>
</template>

<style scoped>

</style>