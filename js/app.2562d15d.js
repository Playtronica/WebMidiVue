(function(){"use strict";var e={192:function(e,t,a){var n=a(9963),i=a(6252);const m={class:"m-2"};function o(e,t,a,n,o,s){const l=(0,i.up)("BiotronPage");return(0,i.wg)(),(0,i.iD)("div",m,[(0,i.Wm)(l,{id:"Biotron Page 3"})])}const s=(0,i._)("h1",{class:"text-center"},"Biotron change settings",-1);function l(e,t,a,m,o,l){const c=(0,i.up)("DeviceSelector"),d=(0,i.up)("SliderCommand"),u=(0,i.up)("GroupOfCommands"),r=(0,i.up)("SelectCommand"),h=(0,i.up)("SliderCommandWithDisable"),_=(0,i.up)("DisableCommand"),v=(0,i.up)("SliderRangeCommand"),p=(0,i.up)("FileDropArea");return(0,i.wg)(),(0,i.iD)("div",{onKeyup:t[5]||(t[5]=(0,n.D2)(((...e)=>this.sendData&&this.sendData(...e)),["enter"]))},[s,(0,i.Wm)(c,{"regex-name":"",onDevice_changed:t[0]||(t[0]=e=>{this.device=e})}),(0,i.Wm)(u,{"name-of-group":"BPM"},{objects:(0,i.w5)((()=>[((0,i.wg)(),(0,i.j4)(d,{"command-label":"Plant Bpm",key:this.forceRerender,"command-object":this.commands_data.plantBpm},null,8,["command-object"])),((0,i.wg)(),(0,i.j4)(d,{"command-label":"Note Off Percent",key:this.forceRerender,"command-object":this.commands_data.noteOffPercent},null,8,["command-object"])),((0,i.wg)(),(0,i.j4)(d,{"command-label":"Light Bpm",key:this.forceRerender,"command-object":this.commands_data.lightBpm},null,8,["command-object"]))])),_:1}),(0,i.Wm)(u,{"name-of-group":"Sensitivity (fib)"},{objects:(0,i.w5)((()=>[((0,i.wg)(),(0,i.j4)(d,{"command-label":"Note Distance",key:this.forceRerender,"command-object":this.commands_data.noteDistance},null,8,["command-object"])),((0,i.wg)(),(0,i.j4)(d,{"command-label":"First Value",key:this.forceRerender,"command-object":this.commands_data.firstValue},null,8,["command-object"]))])),_:1}),(0,i.Wm)(u,{"name-of-group":"Smoothness"},{objects:(0,i.w5)((()=>[((0,i.wg)(),(0,i.j4)(d,{key:this.forceRerender,"command-object":this.commands_data.smoothness},null,8,["command-object"]))])),_:1}),(0,i.Wm)(u,{"name-of-group":"Scale"},{objects:(0,i.w5)((()=>[((0,i.wg)(),(0,i.j4)(r,{key:this.forceRerender,"list-of-variants":this.scales,"command-object":o.commands_data.scale},null,8,["list-of-variants","command-object"]))])),_:1}),(0,i.Wm)(u,{"name-of-group":"Velocity"},{objects:(0,i.w5)((()=>[((0,i.wg)(),(0,i.j4)(h,{key:this.forceRerender,"command-label":"Plant Velocity","command-object":o.commands_data.plantVelocity},null,8,["command-object"])),((0,i.wg)(),(0,i.j4)(h,{key:this.forceRerender,"command-label":"Light Velocity","command-object":o.commands_data.lightVelocity},null,8,["command-object"]))])),_:1}),(0,i.Wm)(u,{"name-of-group":"Randomness"},{objects:(0,i.w5)((()=>[((0,i.wg)(),(0,i.j4)(_,{key:this.forceRerender,"command-object":o.commands_data.randomness},null,8,["command-object"]))])),_:1}),(0,i.Wm)(u,{"name-of-group":"Same Note"},{objects:(0,i.w5)((()=>[((0,i.wg)(),(0,i.j4)(d,{key:this.forceRerender,"command-object":o.commands_data.same_note},null,8,["command-object"]))])),_:1}),(0,i.Wm)(u,{"name-of-group":"Light Notes Range"},{objects:(0,i.w5)((()=>[((0,i.wg)(),(0,i.j4)(v,{key:this.forceRerender,"max-command-object":o.commands_data.max_range_light_note,"min-command-object":o.commands_data.min_range_light_note},null,8,["max-command-object","min-command-object"]))])),_:1}),(0,i._)("button",{onClick:t[1]||(t[1]=(...e)=>this.sendData&&this.sendData(...e)),class:"btn btn-primary mb-1",style:{width:"70%"}},"Send"),(0,i._)("button",{onClick:t[2]||(t[2]=(...e)=>this.returnDefault&&this.returnDefault(...e)),class:"btn btn-primary mb-1",style:{width:"70%"}},"Set Default"),(0,i._)("button",{onClick:t[3]||(t[3]=(...e)=>this.createPreset&&this.createPreset(...e)),class:"btn btn-primary mb-1",style:{width:"70%"}},"Create Preset"),(0,i.Wm)(p,{name:"Drop Preset Here",onGet_drop:t[4]||(t[4]=e=>l.loadDataFromPreset(e))})],32)}a(7658);var c=a(3577);const d={class:"row m-2"},u={for:"value_input"},r=["min","max"],h=["min","max","step"];function _(e,t,a,m,o,s){return(0,i.wg)(),(0,i.iD)("div",d,[(0,i._)("label",u,(0,c.zw)(this.commandLabel),1),(0,i.wy)((0,i._)("input",{type:"number",id:"value_input",class:"form-control","onUpdate:modelValue":t[0]||(t[0]=e=>this.Value=e),min:this.commandObject.min_value,max:this.commandObject.max_value},null,8,r),[[n.nr,this.Value]]),(0,i.wy)((0,i._)("input",{type:"range",id:"range_input",class:"settings_input","onUpdate:modelValue":t[1]||(t[1]=e=>this.Value=e),min:this.commandObject.min_value,max:this.commandObject.max_value,step:this.commandObject.step},null,8,h),[[n.nr,this.Value]])])}var v=a(7327);class p{set_value(e){this.value=e}set_default(){this.value=this.default_value}constructor({name:e=null,number_command:t=0,value:a=null,min_value:n=0,max_value:i=127,step:m=1,default_value:o=0}){if((0,v.Z)(this,"flag_device",[11]),(0,v.Z)(this,"name",void 0),(0,v.Z)(this,"number_command",void 0),(0,v.Z)(this,"value",void 0),(0,v.Z)(this,"default_value",void 0),(0,v.Z)(this,"min_value",void 0),(0,v.Z)(this,"max_value",void 0),(0,v.Z)(this,"step",void 0),null===t)throw"Number Command is null";this.name=null===e?`Command number ${t}`:e,this.number_command=t,this.value=null===a?o:a,this.min_value=n,this.max_value=i,this.step=m,this.default_value=o}toString(){return`{"name": "${this.name}", "value": ${this.value}, "params": {\n            "number_command": ${this.number_command},\n            "min_value": ${this.min_value},\n            "max_value": ${this.max_value},\n            "step": ${this.step},\n            "default_value": ${this.default_value}\n        }}`}check_params(){return!(this.min_value>this.max_value)&&(!(this.value<this.min_value)&&!(this.value>this.max_value))}sendToMidi(e){if(!this.check_params())return;let t=[240];for(let a of this.flag_device)t.push(a);t.push(this.number_command);for(let a=0;a<Math.floor(this.value/127);a++)t.push(127);t.push(this.value%127),t.push(247),console.log(t),e.send(t)}}function b(e){const t=Date.now();let a=null;do{a=Date.now()}while(a-t<e)}var f={props:{commandLabel:{default:"",type:String},commandObject:{required:!0,type:p}},data(){return{Value:0}},watch:{Value(){this.checkLimit(),this.commandObject.set_value(this.Value)}},methods:{checkLimit(){this.Value>this.commandObject.max_value&&(this.Value=this.commandObject.max_value),this.Value<this.commandObject.min_value&&(this.Value=this.commandObject.min_value)}},mounted(){this.Value=this.commandObject.value}},g=a(3744);const j=(0,g.Z)(f,[["render",_],["__scopeId","data-v-234b8801"]]);var w=j;const x={class:"settings_elem"};function V(e,t,a,n,m,o){return(0,i.wg)(),(0,i.iD)("div",x,[(0,i._)("h2",null,(0,c.zw)(this.nameOfGroup),1),(0,i.WI)(e.$slots,"objects",{},void 0,!0)])}var y={name:"GroupOfCommands",methods:{getTransitionRawChildren:i.Q6},props:{nameOfGroup:{default:"",type:String}}};const O=(0,g.Z)(y,[["render",V],["__scopeId","data-v-781a2c6c"]]);var D=O;const C={class:"row m-2"},k={for:"value_input"},S=["value"];function R(e,t,a,m,o,s){return(0,i.wg)(),(0,i.iD)("div",C,[(0,i._)("label",k,(0,c.zw)(this.commandLabel),1),(0,i.wy)((0,i._)("select",{"onUpdate:modelValue":t[0]||(t[0]=e=>this.Value=e),id:"scale",class:"form-control"},[((0,i.wg)(!0),(0,i.iD)(i.HY,null,(0,i.Ko)(this.listOfVariants,((e,t)=>((0,i.wg)(),(0,i.iD)("option",{key:t,value:t},(0,c.zw)(e),9,S)))),128))],512),[[n.bM,this.Value]])])}var M={props:{commandLabel:{default:"",type:String},listOfVariants:{default:{}},commandObject:{required:!0,type:p}},data(){return{Value:0}},watch:{Value(){this.commandObject.set_value(this.Value)}},mounted(){this.Value=this.commandObject.value}};const P=(0,g.Z)(M,[["render",R],["__scopeId","data-v-3ef0b675"]]);var I=P;const N={class:"form-floating mb-3"},L=["value"],Z=(0,i._)("label",{for:"device"},"Select device",-1);function W(e,t,a,m,o,s){return(0,i.wg)(),(0,i.iD)("div",N,[(0,i.wy)((0,i._)("select",{"onUpdate:modelValue":t[0]||(t[0]=e=>o.currentMidiNum=e),class:"form-control"},[((0,i.wg)(!0),(0,i.iD)(i.HY,null,(0,i.Ko)(o.midiOut,((e,t)=>((0,i.wg)(),(0,i.iD)("option",{key:e.id,value:t},(0,c.zw)(e.name),9,L)))),128))],512),[[n.bM,o.currentMidiNum]]),Z])}var B={props:{regexName:{default:".*",type:String}},name:"DeviceSelector",data(){return{midiIn:[],midiOut:[],currentMidiNum:0}},watch:{currentMidiNum(){this.deviceChanged()}},methods:{midiReady(e){e.addEventListener("statechange",(e=>this.initDevices(e.target))),this.initDevices(e)},initDevices(e){this.midiIn=[],this.midiOut=[];const t=e.inputs.values();for(let n=t.next();n&&!n.done;n=t.next())n.value.name.match(this.regexName)&&this.midiIn.push(n.value);const a=e.outputs.values();for(let n=a.next();n&&!n.done;n=a.next())n.value.name.match(this.regexName)&&this.midiOut.push(n.value),n.value.send([]);0!==a.length&&this.$emit("device_changed",this.midiOut[this.currentMidiNum])},deviceChanged(){this.$emit("device_changed",this.midiOut[this.currentMidiNum])}},mounted(){navigator.requestMIDIAccess({sysex:!0}).then((e=>this.midiReady(e)),(e=>console.log("Something went wrong",e)))}};const $=(0,g.Z)(B,[["render",W]]);var A=$;const U=e=>((0,i.dD)("data-v-f75ef398"),e=e(),(0,i.Cn)(),e),E={class:"row m-2"},T={class:"row"},z={for:"value_input"},F={class:"row"},q={class:"col-9"},G=["min","max","disabled"],J=["min","max","step","disabled"],H={class:"col-3"},K={class:"container"},Y={class:"col w-100"},Q={class:"switch"},X=U((()=>(0,i._)("span",{class:"slider round"},null,-1)));function ee(e,t,a,m,o,s){return(0,i.wg)(),(0,i.iD)("div",E,[(0,i._)("div",T,[(0,i._)("label",z,(0,c.zw)(this.commandLabel),1)]),(0,i._)("div",F,[(0,i._)("div",q,[(0,i.wy)((0,i._)("input",{type:"number",id:"value_input",class:"form-control","onUpdate:modelValue":t[0]||(t[0]=e=>this.Value=e),min:this.commandObject.min_value,max:this.commandObject.max_value,disabled:this.Disabled},null,8,G),[[n.nr,this.Value]]),(0,i.wy)((0,i._)("input",{type:"range",id:"range_input",class:"settings_input","onUpdate:modelValue":t[1]||(t[1]=e=>this.Value=e),min:this.commandObject.min_value,max:this.commandObject.max_value,step:this.commandObject.step,disabled:this.Disabled},null,8,J),[[n.nr,this.Value]])]),(0,i._)("div",H,[(0,i._)("div",K,[(0,i._)("div",Y,[(0,i._)("label",Q,[(0,i.wy)((0,i._)("input",{id:"checkbox_input",type:"checkbox","onUpdate:modelValue":t[2]||(t[2]=e=>this.Checked=e),onClick:t[3]||(t[3]=e=>this.checkboxEvent())},null,512),[[n.e8,this.Checked]]),X])])])])])])}var te={props:{commandLabel:{default:"",type:String},commandObject:{required:!0,type:p}},data(){return{Value:0,Checked:!0,Disabled:!1}},methods:{checkboxEvent(){this.Checked?(this.Value=this.commandObject.max_value,this.Disabled=!1):(this.Value=this.commandObject.min_value,this.Disabled=!0)},checkLimit(){this.Value>this.commandObject.max_value&&(this.Value=this.commandObject.max_value),this.Value<this.commandObject.min_value&&(this.Value=this.commandObject.min_value)}},watch:{Value(){this.commandObject.set_value(this.Value),this.checkLimit()},Checked(){this.checkboxEvent()}},mounted(){this.Value=this.commandObject.value}};const ae=(0,g.Z)(te,[["render",ee],["__scopeId","data-v-f75ef398"]]);var ne=ae;const ie=e=>((0,i.dD)("data-v-578c903a"),e=e(),(0,i.Cn)(),e),me={for:"checkbox_input"},oe={class:"container"},se={class:"col w-100"},le={class:"switch"},ce=ie((()=>(0,i._)("span",{class:"slider round"},null,-1)));function de(e,t,a,m,o,s){return(0,i.wg)(),(0,i.iD)(i.HY,null,[(0,i._)("label",me,(0,c.zw)(this.commandLabel),1),(0,i._)("div",oe,[(0,i._)("div",se,[(0,i._)("label",le,[(0,i.wy)((0,i._)("input",{id:"checkbox_input",type:"checkbox","onUpdate:modelValue":t[0]||(t[0]=e=>this.Checked=e)},null,512),[[n.e8,this.Checked]]),ce])])])],64)}var ue={props:{commandLabel:{default:"",type:String},commandObject:{required:!0,type:p}},data(){return{Value:0,Checked:!0}},watch:{Checked(){this.Checked?this.Value=127:this.Value=0,this.commandObject.set_value(this.Value)}},mounted(){this.Value=this.commandObject.value,this.Checked=this.Value>0}};const re=(0,g.Z)(ue,[["render",de],["__scopeId","data-v-578c903a"]]);var he=re;const _e={id:"dropZone",class:"text-center"};function ve(e,t,a,n,m,o){return(0,i.wg)(),(0,i.iD)("div",{class:"droparea",onClick:t[1]||(t[1]=(...e)=>this.dropAreaClick&&this.dropAreaClick(...e)),onDragover:t[2]||(t[2]=e=>e.preventDefault()),onDrop:t[3]||(t[3]=e=>o.dropAreaDrop(e))},[(0,i._)("div",_e,[(0,i._)("input",{type:"file",id:"load_preset",style:{display:"none"},onChange:t[0]||(t[0]=e=>o.loadPresetChanged(e))},null,32),(0,i._)("p",null,(0,c.zw)(this.name),1)])],32)}var pe={methods:{dropAreaClick(){document.getElementById("load_preset").click()},dropAreaDrop(e){e.preventDefault();let t=e.dataTransfer.files[0],a=new FileReader,n=this;a.onload=function(e){n.$emit("get_drop",e.target.result)},"text/plain"===t.type&&a.readAsText(t)},loadPresetChanged(e){let t=e.srcElement.files[0],a=new FileReader,n=this;a.onload=function(e){n.$emit("get_drop",e.target.result)},"text/plain"===t.type&&(a.readAsText(t),document.getElementById("load_preset").value="")}},props:{name:{type:String,default:"Drop preset here"}}};const be=(0,g.Z)(pe,[["render",ve],["__scopeId","data-v-7145ae27"]]);var fe=be,ge=a(5702);const je={class:"row m-2"},we={for:"value_input"},xe={class:"row"},Ve={class:"col"},ye=["min","max"],Oe=(0,i.Uk)(" - "),De={class:"col"},Ce=["min","max"],ke={class:"row"};function Se(e,t,a,m,o,s){const l=(0,i.up)("MultiRangeSlider");return(0,i.wg)(),(0,i.iD)("div",je,[(0,i._)("label",we,(0,c.zw)(this.commandLabel),1),(0,i._)("div",xe,[(0,i._)("div",Ve,[(0,i.wy)((0,i._)("input",{type:"number",id:"value_input_min",class:"form-control","onUpdate:modelValue":t[0]||(t[0]=e=>this.minValue=e),min:this.minCommandObject.min_value,max:this.minCommandObject.max_value},null,8,ye),[[n.nr,this.minValue]])]),Oe,(0,i._)("div",De,[(0,i.wy)((0,i._)("input",{type:"number",id:"value_input_max",class:"form-control","onUpdate:modelValue":t[1]||(t[1]=e=>this.maxValue=e),min:this.minCommandObject.min_value,max:this.maxCommandObject.max_value},null,8,Ce),[[n.nr,this.maxValue]])])]),(0,i._)("div",ke,[(0,i.Wm)(l,{baseClassName:"multi-range-slider-bar-only",minValue:this.minValue,maxValue:this.maxValue,max:this.maxCommandObject.max_value,min:this.minCommandObject.min_value,step:this.minCommandObject.step,onInput:s.update_oBarValues},null,8,["minValue","maxValue","max","min","step","onInput"])])])}var Re=a(3103),Me={components:{MultiRangeSlider:Re.Z},props:{commandLabel:{default:"",type:String},minCommandObject:{required:!0,type:p},maxCommandObject:{required:!0,type:p}},data(){return{minValue:0,maxValue:0}},watch:{minValue(){this.minValue<this.minCommandObject.min_value&&(this.minValue=this.minCommandObject),this.minValue>this.maxValue&&(this.minValue=this.maxValue),this.minCommandObject.set_value(this.minValue)},maxValue(){this.maxValue<this.minValue&&(this.maxValue=this.minValue),this.maxValue>this.maxCommandObject.max_value&&(this.minValue=this.maxCommandObject.max_value),this.maxCommandObject.set_value(this.maxValue)}},methods:{update_oBarValues(e){this.minValue=e.minValue,this.maxValue=e.maxValue}},mounted(){this.minValue=this.minCommandObject.value,this.maxValue=this.maxCommandObject.value}};const Pe=(0,g.Z)(Me,[["render",Se],["__scopeId","data-v-75746f48"]]);var Ie=Pe,Ne={components:{SliderRangeCommand:Ie,FileDropArea:fe,DisableCommand:he,SliderCommandWithDisable:ne,DeviceSelector:A,SelectCommand:I,GroupOfCommands:D,SliderCommand:w},props:{id:{type:String,required:!0}},methods:{sendData(){for(let e in this.commands_data)this.commands_data[e].sendToMidi(this.device),b(10);this.saveData()},saveData(){let e=[];for(let a in this.commands_data)e.push(this.commands_data[a].toString());let t={commands:e};localStorage.setItem(this.id,JSON.stringify(t))},loadData(){null===localStorage.getItem(this.id)&&this.saveData();for(let e of JSON.parse(localStorage.getItem(this.id)).commands){let t=JSON.parse(e);this.commands_data[t.name].set_value(t.value)}},returnDefault(){for(let e in this.commands_data)this.commands_data[e].set_default();this.saveData(),this.forceRerender+=1,this.device.send([240,11,7,247])},createPreset(){let e=[];for(let n in this.commands_data)e.push(this.commands_data[n].toString());let t={commands:e},a=new File([JSON.stringify(t)],"biotron_preset.txt",{type:"text/plain;charset=utf-8"});(0,ge.p)(a,"biotron_preset.txt")},loadDataFromPreset(e){for(let t of JSON.parse(e).commands){let e=JSON.parse(t);this.commands_data[e.name].set_value(e.value)}this.forceRerender+=1}},data(){return{scales:["Major","Minor","Chrom","Dorian","Mixolydian","Lydian","Wholetone","Minblues","Minpen","Majpen","Diminished"],device:null,forceRerender:0,commands_data:{plantBpm:new p({name:"plantBpm",number_command:0,default_value:60,max_value:1e3}),lightBpm:new p({name:"lightBpm",number_command:9,default_value:4,max_value:30}),noteOffPercent:new p({name:"noteOffPercent",number_command:12,default_value:100,max_value:100}),noteDistance:new p({name:"noteDistance",number_command:1,default_value:50,max_value:100}),firstValue:new p({name:"firstValue",number_command:2,default_value:10,max_value:100}),smoothness:new p({name:"smoothness",number_command:3,max_value:99}),scale:new p({name:"scale",number_command:4,default_value:0}),plantVelocity:new p({name:"plantVelocity",number_command:5,default_value:127,max_value:127}),lightVelocity:new p({name:"lightVelocity",number_command:6,default_value:127,max_value:127}),randomness:new p({name:"randomness",number_command:10,default_value:0}),same_note:new p({name:"same_note",number_command:11,default_value:0,max_value:10}),min_range_light_note:new p({name:"min_range_light_note",number_command:13,default_value:24}),max_range_light_note:new p({name:"max_range_light_note",number_command:14,default_value:48})}}},created(){null===localStorage.getItem(this.id)?this.saveData():this.loadData(),document.addEventListener("keyup",(e=>{"Enter"===e.code&&this.sendData()}))}};const Le=(0,g.Z)(Ne,[["render",l]]);var Ze=Le,We={name:"App",components:{BiotronPage:Ze}};const Be=(0,g.Z)(We,[["render",o]]);var $e=Be;a(8877);(0,n.ri)($e).mount("#app")}},t={};function a(n){var i=t[n];if(void 0!==i)return i.exports;var m=t[n]={exports:{}};return e[n].call(m.exports,m,m.exports,a),m.exports}a.m=e,function(){var e=[];a.O=function(t,n,i,m){if(!n){var o=1/0;for(d=0;d<e.length;d++){n=e[d][0],i=e[d][1],m=e[d][2];for(var s=!0,l=0;l<n.length;l++)(!1&m||o>=m)&&Object.keys(a.O).every((function(e){return a.O[e](n[l])}))?n.splice(l--,1):(s=!1,m<o&&(o=m));if(s){e.splice(d--,1);var c=i();void 0!==c&&(t=c)}}return t}m=m||0;for(var d=e.length;d>0&&e[d-1][2]>m;d--)e[d]=e[d-1];e[d]=[n,i,m]}}(),function(){a.d=function(e,t){for(var n in t)a.o(t,n)&&!a.o(e,n)&&Object.defineProperty(e,n,{enumerable:!0,get:t[n]})}}(),function(){a.g=function(){if("object"===typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"===typeof window)return window}}()}(),function(){a.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)}}(),function(){a.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}}(),function(){var e={143:0};a.O.j=function(t){return 0===e[t]};var t=function(t,n){var i,m,o=n[0],s=n[1],l=n[2],c=0;if(o.some((function(t){return 0!==e[t]}))){for(i in s)a.o(s,i)&&(a.m[i]=s[i]);if(l)var d=l(a)}for(t&&t(n);c<o.length;c++)m=o[c],a.o(e,m)&&e[m]&&e[m][0](),e[m]=0;return a.O(d)},n=self["webpackChunkWebMidiPlaytronica"]=self["webpackChunkWebMidiPlaytronica"]||[];n.forEach(t.bind(null,0)),n.push=t.bind(null,n.push.bind(n))}();var n=a.O(void 0,[998],(function(){return a(192)}));n=a.O(n)})();
//# sourceMappingURL=app.2562d15d.js.map