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
  <i
      class="fas fa-info-circle"
      style="color: #0d6efd"
      data-bs-toggle="tooltip"
      data-bs-placement="right"
      :title="text"
      ref="info"
  ></i>
</template>

<style scoped>

</style>