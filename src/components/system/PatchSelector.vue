<template>
  <div class="input-group mb-3">
    <select v-model="this.id" class="form-control">
      <option v-for="patch in patches" v-bind:key="patch.id" :value="patch.id">{{patch.name}}</option>
    </select>
    <div class="input-group-prepend" :style="{display: active_button_enabled ? 'block' : 'none'}">
      <button class="btn" :class="{ 'btn-outline-primary': this.button_state === 'Save', 'btn-outline-danger': this.button_state === 'Delete'}"
              type="button" :disabled="this.active_button_enabled">{{ this.button_state }}</button>
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      patches: {
        type: Array
      },
      page_id: {
        type: String,
        required: true
      }
    },
    name: "PatchSelector",
    data() {
      return {
        id: 0,
        active_button_enabled: true,
        button_state: "Save"
      }
    },
    watch: {
      id() {
        localStorage.setItem(this.page_id, this.id)
        console.log(this.patches)
        let current_item

        for (let patch of this.patches) {
          if (this.id === patch.id) {
            current_item = patch
            break
          }
        }

        if (!current_item) {
          console.error("Paths with current id has not been found")
        }

        this.active_button_enabled = current_item.editable
        this.button_state = current_item.saved ? "Delete" : "Save"
      }
    },
    methods: {

    },
    mounted() {
      this.id = parseInt(localStorage.getItem(this.page_id))
    }
  }
</script>

<style scoped>

</style>