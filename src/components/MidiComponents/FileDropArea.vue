<script>

  export default {
    methods: {
      dropAreaClick() {
        document.getElementById("load_preset").click()
      },
      dropAreaDrop(e) {
        e.preventDefault();
        let file = e.dataTransfer.files[0], reader = new FileReader();
        let vm = this;

        reader.onload = function(event) {
          // console.log(event.target.result);
          vm.$emit("get_drop", event.target.result)
        };

        if (file.type !== "text/plain" && file.name.substring(file.name.lastIndexOf(".")) !== ".scl") return
        reader.readAsText(file);
      },
      loadPresetChanged(e) {
        let file = e.srcElement.files[0], reader = new FileReader();
        let vm = this;
        reader.onload = function(event) {
          // console.log(event.target.result);
          vm.$emit("get_drop", event.target.result)
        };


        if (file.type !== "text/plain") return
        reader.readAsText(file);
        document.getElementById("load_preset").value="";
      }
    },
    props: {
      name: {
        type: String,
        default: "Drop preset here"
      }
    }
  }
</script>

<template>
  <div class="fileDropArea" @click="this.dropAreaClick" @dragover="(e) => e.preventDefault()" @drop="(e) => dropAreaDrop(e)">
    <input type="file" id="load_preset" style="display: none;" @change="(e) => loadPresetChanged(e)"/>
    <p>{{this.name}}</p>
  </div>
</template>

<style scoped>
.fileDropArea {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  border-style: dashed;
  border-color: rgb(0, 114, 245);
  padding: 1%;
  border-radius: 5px;
  color: rgb(0, 114, 245);
}

.fileDropArea p {
  margin: 0;



}
</style>