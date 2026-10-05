<script>
const MAX_FILE_BYTES = 1024 * 1024

export default {
  emits: ['get_drop'],
  props: {
    name: {type: String, default: 'Drop preset here'}
  },
  data() {
    return {error: '', readId: 0}
  },
  beforeUnmount() {
    this.readId++
  },
  methods: {
    loadPresetChanged(event) {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (file) this.readFile(file)
    },
    dropAreaDrop(event) {
      this.readFile(event.dataTransfer?.files?.[0])
    },
    readFile(file) {
      if (!file) return
      const readId = ++this.readId
      this.error = ''
      if (file.size > MAX_FILE_BYTES) {
        this.error = 'File is too large. Choose a file smaller than 1 MB.'
        return
      }
      if (!/\.(json|txt|scl)$/i.test(file.name) && !['text/plain', 'application/json'].includes(file.type)) {
        this.error = 'Choose a .json, .txt or .scl file.'
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        if (readId !== this.readId) return
        if (typeof reader.result === 'string') this.$emit('get_drop', reader.result)
        else this.error = 'Could not read this file. Please try again.'
      }
      reader.onerror = reader.onabort = () => {
        if (readId === this.readId) this.error = 'Could not read this file. Please try again.'
      }
      try { reader.readAsText(file) }
      catch { this.error = 'Could not read this file. Please try again.' }
    }
  }
}
</script>

<template>
  <div class="fileDropArea" @dragover.prevent @drop.prevent="dropAreaDrop">
    <input ref="fileInput" type="file" hidden accept=".json,.txt,.scl,text/plain,application/json" @change="loadPresetChanged"/>
    <button type="button" class="fileDropArea__button" @click="$refs.fileInput.click()">{{ name }}</button>
    <small v-if="error" role="alert">{{ error }}</small>
  </div>
</template>

<style scoped>
.fileDropArea {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 2px dashed rgb(0, 114, 245);
  border-radius: 5px;
  color: rgb(0, 114, 245);
}
.fileDropArea__button {
  width: 100%;
  height: 100%;
  padding: 0.5rem;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.fileDropArea__button:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
.fileDropArea small { padding: 0 0.5rem 0.5rem; }
</style>
