<template>
  <div class="mb-3 m-0 w-100">
    <div class="d-flex ">
      <div class="form-floating flex-grow-1 me-2">
        <select v-model="this.id" class="form-control" @change="this.patchChanged">-->
          <option v-for="patch in patches" v-bind:key="patch.id" :value="patch.id">{{patch.name}}</option>
        </select>
        <label for="device">Presets</label>
      </div>
        <button class="btn"
                :class="{ 'btn-outline-primary': this.button_state === 'Save', 'btn-outline-danger': this.button_state === 'Delete'}"
                type="button"  data-bs-toggle="modal" @click="this.modelOpen"
                :data-bs-target="this.button_state === 'Save' ? '#saveModal' : '#deleteModel'"
                :style="{display: active_button_enabled ? 'block' : 'none'}">
          {{ this.button_state }}</button>
    </div>
  </div>


  <div class="modal fade" id="saveModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="exampleModalLabel">Save Patch</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cancel"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label for="recipient-name" class="col-form-label">Patch Name</label>
            <input type="text" class="form-control" id="patchName" v-model="this.patchName"
                   :key="this.forceRerender" autocomplete="off" data-autofocus>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-primary" data-bs-dismiss="modal" @click="this.savePatch">Save</button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="deleteModel" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="exampleModalLabel">Delete Patch</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cancel"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            Do you really want to delete this patch?
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-danger" data-bs-dismiss="modal" @click="this.deletePatch">Delete</button>
        </div>
      </div>
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
        button_state: "Save",
        patchName: "",
        forceRerender: 0,
      }
    },
    watch: {

    },
    methods: {
      patchChanged() {
        console.log()
        localStorage.setItem(this.page_id, this.id)

        if (!this.patches) return;

        let current_item

        for (let patch of this.patches) {
          if (this.id === patch.id) {
            current_item = patch
            break
          }
        }

        if (!current_item) {
          return
        }

        this.active_button_enabled = current_item.editable
        this.button_state = current_item.saved ? "Delete" : "Save"

        document.dispatchEvent(new CustomEvent('PatchChanged'));
      },
      savePatch() {
        document.dispatchEvent(new CustomEvent('PatchSave', {detail: this.patchName}));
      },
      deletePatch() {
        document.dispatchEvent(new CustomEvent('PatchDelete'));
      },
      modelOpen() {
        this.patchName = "";
      }
    },
    mounted() {
      this.id = parseInt(localStorage.getItem(this.page_id))

      if (!this.patches) return;

      let current_item

      for (let patch of this.patches) {
        if (this.id === patch.id) {
          current_item = patch
          break
        }
      }

      if (!current_item) {
        return
      }

      this.active_button_enabled = current_item.editable
      this.button_state = current_item.saved ? "Delete" : "Save"

      document.addEventListener("shown.bs.modal", () => {
        if (this.button_state === "Save") {
          document.getElementById("patchName").focus()
        }
      })



    }
  }
</script>

<style scoped>

</style>