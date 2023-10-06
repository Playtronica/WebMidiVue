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

        if (file.type !== "text/plain") return
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
  <div class="droparea"  @click="this.dropAreaClick" @dragover="(e) => e.preventDefault()" @drop="(e) => dropAreaDrop(e)">
    <div id="dropZone" class="text-center">
      <input type="file" id="load_preset" style="display: none;" @change="(e) => loadPresetChanged(e)"/>
      <p>{{this.name}}</p>
    </div>
  </div>
</template>

<style scoped>
.droparea {
  padding: 15px;

  /* background: rgba(255, 248, 248, 0.7); */
}
#dropZone {
  border: 2px dashed #0072f5;
  -webkit-border-radius: 5px;
  border-radius: 5px;
  padding: 50px;
  text-align: center;
  font: 21pt bold arial;
  color: #0072f5;
}
</style>