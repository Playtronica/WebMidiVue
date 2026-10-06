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
  border: 1px solid var(--ui-control-border, #b8c0cc);
  border-radius: var(--ui-radius, .75rem);
  color: var(--ui-ink, #16181d);
  background: #fff;
}
.fileDropArea__button {
  width: 100%;
  height: 100%;
  min-height: 44px;
  padding: .6rem 1rem;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 600;
  line-height: 1.25;
  cursor: pointer;
}
.fileDropArea:hover { border-color: #8995a7; background: #eef1f6; }
.fileDropArea__button:focus-visible { outline: 2px solid var(--ui-accent, #315ee7); outline-offset: 2px; }
.fileDropArea small { padding: 0 0.5rem 0.5rem; }
</style>
