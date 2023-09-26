<script>
export default {
  props: {
    commandLabel: {
      default: "",
      type: String
    },
    listOfVariants: {
      default: {},
    },
    defaultValue: {
      default: 0,
      type: Number
    }
  },
  data() {
    return {
      Value: 0
    }
  },
  mounted() {
    this.Value = this.defaultValue;
  }
}
</script>

<template>
  <div class="row m-2">
    <label for="value_input">{{ this.commandLabel }}</label>

    <select id="scale" class="form-control">
      <option v-for="item in this.listOfVariants" v-bind:key="item">
        {{item}}
      </option>
    </select>
  </div>
</template>

<style scoped>
  .settings_input {
    width: 100%;
  }
</style>