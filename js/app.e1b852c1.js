(function(){"use strict";var e={1858:function(e,t,a){var n=a(9963),i=a(2201),o=a(6252);const l={class:"d-flex justify-content-center"},s={class:"nav nav-pills"},m={class:"nav-item"},r=(0,o.Uk)("Biotron"),c=(0,o.Uk)("Biotron"),d={class:"nav-item"},u=(0,o.Uk)("TouchMe"),h=(0,o.Uk)("TouchMe"),p={class:"m-2"};function _(e,t,a,n,i,_){const v=(0,o.up)("router-link"),f=(0,o.up)("router-view");return(0,o.wg)(),(0,o.iD)(o.HY,null,[(0,o._)("header",l,[(0,o._)("ul",s,[(0,o._)("li",m,["/biotron"===this.url?((0,o.wg)(),(0,o.j4)(v,{key:0,to:"/biotron",onClick:this.update,class:"nav-link active"},{default:(0,o.w5)((()=>[r])),_:1},8,["onClick"])):((0,o.wg)(),(0,o.j4)(v,{key:1,to:"/biotron",onClick:this.update,class:"nav-link"},{default:(0,o.w5)((()=>[c])),_:1},8,["onClick"]))]),(0,o._)("li",d,["/touchme"===this.url?((0,o.wg)(),(0,o.j4)(v,{key:0,onClick:this.update,to:"/touchme",class:"nav-link active"},{default:(0,o.w5)((()=>[u])),_:1},8,["onClick"])):((0,o.wg)(),(0,o.j4)(v,{key:1,to:"/touchme",onClick:this.update,class:"nav-link"},{default:(0,o.w5)((()=>[h])),_:1},8,["onClick"]))])])]),(0,o._)("div",p,[(0,o.Wm)(f)])],64)}var v={name:"App",data(){return{url:String,forceRerender:0}},mounted(){console.log("Hello! You`re curious, aren`t you?")},methods:{update(){this.forceRerender++}}},f=a(3744);const g=(0,f.Z)(v,[["render",_]]);var b=g;a(8877);const y=(0,o._)("h1",{class:"text-center"},"Biotron change settings",-1),w={class:"row"},V={class:"col"},x=(0,o._)("label",{for:"randomPlantVelSwitch"},"Humanize",-1),j={class:"col"},D=(0,o._)("label",{for:"plantVelDis"},"Mute",-1),S={key:0},k={key:0},C={key:1},O={class:"row"},P={class:"col"},L=(0,o._)("label",{for:"randomLightVelSwitch"},"Humanize",-1),M={class:"col"},R=(0,o._)("label",{for:"lightVelDis"},"Mute",-1),I={key:0,class:"row"},N={key:0},W={key:1},z=["disabled"];function U(e,t,a,i,l,s){const m=(0,o.up)("DeviceSelector"),r=(0,o.up)("SliderCommand"),c=(0,o.up)("GroupOfCommands"),d=(0,o.up)("SelectCommand"),u=(0,o.up)("SwitchComponent"),h=(0,o.up)("SliderRangeCommand"),p=(0,o.up)("DisableCommand"),_=(0,o.up)("FileDropArea");return(0,o.wg)(),(0,o.iD)("div",{onKeyup:t[9]||(t[9]=(0,n.D2)(((...e)=>this.sendData&&this.sendData(...e)),["enter"]))},[y,(0,o.Wm)(m,{"regex-name":"Biotron",onDevice_changed:t[0]||(t[0]=e=>{this.device=e})}),(0,o.Wm)(c,{"name-of-group":"BPM",description:"Plant BPM - how many notes from the plant will be generated per minute\n\nNote Off Percent - how many percent of the time the note will sound, where 100 is the full sound before the note changes, 50 is half the time the note is played\n\nLight Bpm - once every number of notes from the plant the note from the photoresistor will sound"},{objects:(0,o.w5)((()=>[((0,o.wg)(),(0,o.j4)(r,{"command-label":"Plant Bpm",key:this.forceRerender,"command-object":this.commands_data.plantBpm},null,8,["command-object"])),((0,o.wg)(),(0,o.j4)(r,{"command-label":"Note Off Percent",key:this.forceRerender,"command-object":this.commands_data.noteOffPercent},null,8,["command-object"])),((0,o.wg)(),(0,o.j4)(r,{"command-label":"Light Bpm",key:this.forceRerender,"command-object":this.commands_data.lightBpm},null,8,["command-object"]))])),_:1}),(0,o.Wm)(c,{"name-of-group":"Sensitivity (fib)",description:"Sensitivity (fib) - Fibonacci parameter responsible for the note distribution curve"},{objects:(0,o.w5)((()=>[((0,o.wg)(),(0,o.j4)(r,{"command-label":"Note Distance",key:this.forceRerender,"command-object":this.commands_data.noteDistance},null,8,["command-object"])),((0,o.wg)(),(0,o.j4)(r,{"command-label":"First Value",key:this.forceRerender,"command-object":this.commands_data.firstValue},null,8,["command-object"]))])),_:1}),(0,o.Wm)(c,{"name-of-group":"Smoothness",description:"Smoothness - the smoothness of the notes played, where 0 is an instant change in notes, 99 is a smooth change (notes change over time)"},{objects:(0,o.w5)((()=>[((0,o.wg)(),(0,o.j4)(r,{key:this.forceRerender,"command-object":this.commands_data.smoothness},null,8,["command-object"]))])),_:1}),(0,o.Wm)(c,{"name-of-group":"Scale",description:"Scale - scale played from the device"},{objects:(0,o.w5)((()=>[((0,o.wg)(),(0,o.j4)(d,{key:this.forceRerender,"list-of-variants":this.scales,"command-object":l.commands_data.scale},null,8,["list-of-variants","command-object"]))])),_:1}),(0,o.Wm)(c,{"name-of-group":"Velocity",description:"Velocity - pressing force\nHumanize - Velocity randomization at a controlled interval\nMute - disable note generation from the channel\n    "},{objects:(0,o.w5)((()=>[(0,o.Wm)(c,{"name-of-group":"Plant",description:"Plant - responsible for the notes generated by the plant"},{objects:(0,o.w5)((()=>[(0,o._)("div",w,[(0,o._)("div",V,[x,(0,o.Wm)(u,{id:"randomPlantVelSwitch","model-value":l.randomPlantVelocity,"onUpdate:modelValue":t[1]||(t[1]=e=>{l.randomPlantVelocity=e,l.forceRerender++})},null,8,["model-value"])]),(0,o._)("div",j,[D,(0,o.Wm)(u,{id:"plantVelDis","model-value":l.disablePlantVel,"onUpdate:modelValue":t[2]||(t[2]=e=>{l.disablePlantVel=e})},null,8,["model-value"])])]),l.disablePlantVel?(0,o.kq)("",!0):((0,o.wg)(),(0,o.iD)("div",S,[l.randomPlantVelocity?((0,o.wg)(),(0,o.iD)("div",C,[((0,o.wg)(),(0,o.j4)(h,{key:this.forceRerender,"max-command-object":l.commands_data.maxPlantVelocity,"min-command-object":l.commands_data.minPlantVelocity},null,8,["max-command-object","min-command-object"]))])):((0,o.wg)(),(0,o.iD)("div",k,[((0,o.wg)(),(0,o.j4)(r,{key:this.forceRerender,"command-object":l.commands_data.maxPlantVelocity},null,8,["command-object"]))]))]))])),_:1}),(0,o.Wm)(c,{"name-of-group":"Light",description:"Light - responsible for notes generated from the photoresistor"},{objects:(0,o.w5)((()=>[(0,o._)("div",O,[(0,o._)("div",P,[L,(0,o.Wm)(u,{id:"randomLightVelSwitch","model-value":l.randomLightVelocity,"onUpdate:modelValue":t[3]||(t[3]=e=>{l.randomLightVelocity=e,l.forceRerender++})},null,8,["model-value"])]),(0,o._)("div",M,[R,(0,o.Wm)(u,{id:"lightVelDis","model-value":l.disableLightVel,"onUpdate:modelValue":t[4]||(t[4]=e=>{l.disableLightVel=e})},null,8,["model-value"])])]),l.disableLightVel?(0,o.kq)("",!0):((0,o.wg)(),(0,o.iD)("div",I,[l.randomLightVelocity?((0,o.wg)(),(0,o.iD)("div",W,[((0,o.wg)(),(0,o.j4)(h,{key:this.forceRerender,"max-command-object":l.commands_data.maxLightVelocity,"min-command-object":l.commands_data.minLightVelocity},null,8,["max-command-object","min-command-object"]))])):((0,o.wg)(),(0,o.iD)("div",N,[((0,o.wg)(),(0,o.j4)(r,{key:this.forceRerender,"command-object":l.commands_data.maxLightVelocity},null,8,["command-object"]))]))]))])),_:1})])),_:1}),(0,o.Wm)(c,{"name-of-group":"Ultra sensitivity",description:"Ultra sensitivity - Increases the sensitivity of generation from a plant"},{objects:(0,o.w5)((()=>[((0,o.wg)(),(0,o.j4)(p,{key:this.forceRerender,"command-object":l.commands_data.randomness},null,8,["command-object"]))])),_:1}),(0,o.Wm)(c,{"name-of-group":"Same Note",description:"Same Note - notes that are played only when changing notes with a customizable step, where 1 - produces a note if the notes have changed by 1 note, 10 if there has been a shift by 10 notes"},{objects:(0,o.w5)((()=>[((0,o.wg)(),(0,o.j4)(r,{key:this.forceRerender,"command-object":l.commands_data.same_note},null,8,["command-object"]))])),_:1}),(0,o.Wm)(c,{"name-of-group":"Light Notes Range",description:"Light Notes Range - setting the range of notes played from the photoresistor (lower and upper limits are set)"},{objects:(0,o.w5)((()=>[((0,o.wg)(),(0,o.j4)(h,{key:this.forceRerender,"max-command-object":l.commands_data.max_range_light_note,"min-command-object":l.commands_data.min_range_light_note},null,8,["max-command-object","min-command-object"]))])),_:1}),(0,o.Wm)(c,{description:"Send - sending settings to the device\nSet Default - basic settings are set on the site (to apply them, you need to click Send)\nCreate Preset - saves settings to a file\nDrop Preset Here - you need to transfer the file there by drag drop, or by clicking on the button, select the settings file."},{objects:(0,o.w5)((()=>[(0,o._)("button",{onClick:t[5]||(t[5]=(...e)=>this.sendData&&this.sendData(...e)),disabled:null===this.device,class:"btn btn-primary mb-1",style:{width:"70%"}},"Send",8,z),(0,o._)("button",{onClick:t[6]||(t[6]=(...e)=>this.returnDefault&&this.returnDefault(...e)),class:"btn btn-primary mb-1",style:{width:"70%"}},"Set Default"),(0,o._)("button",{onClick:t[7]||(t[7]=(...e)=>this.createPreset&&this.createPreset(...e)),class:"btn btn-primary mb-1",style:{width:"70%"}},"Create Preset"),(0,o.Wm)(_,{name:"Drop Preset Here",onGet_drop:t[8]||(t[8]=e=>s.loadDataFromPreset(e))})])),_:1})],32)}a(7658);var H=a(3577);const Z={class:"row m-2"},B={for:"value_input"},F=["min","max"],A=["min","max","step"];function J(e,t,a,i,l,s){return(0,o.wg)(),(0,o.iD)("div",Z,[(0,o._)("label",B,(0,H.zw)(this.commandLabel),1),(0,o.wy)((0,o._)("input",{type:"number",id:"value_input",class:"form-control","onUpdate:modelValue":t[0]||(t[0]=e=>this.Value=e),min:this.commandObject.min_value,max:this.commandObject.max_value},null,8,F),[[n.nr,this.Value]]),(0,o.wy)((0,o._)("input",{type:"range",id:"range_input",class:"settings_input","onUpdate:modelValue":t[1]||(t[1]=e=>this.Value=e),min:this.commandObject.min_value,max:this.commandObject.max_value,step:this.commandObject.step},null,8,A),[[n.nr,this.Value]])])}var T=a(7327);class ${set_value(e){this.value=e}set_default(){this.value=this.default_value}constructor({name:e=null,number_command:t=0,value:a=null,min_value:n=0,max_value:i=127,step:o=1,default_value:l=0}){if((0,T.Z)(this,"flag_device",[11]),(0,T.Z)(this,"name",void 0),(0,T.Z)(this,"number_command",void 0),(0,T.Z)(this,"value",void 0),(0,T.Z)(this,"default_value",void 0),(0,T.Z)(this,"min_value",void 0),(0,T.Z)(this,"max_value",void 0),(0,T.Z)(this,"step",void 0),null===t)throw"Number Command is null";this.name=null===e?`Command number ${t}`:e,this.number_command=t,this.value=null===a?l:a,this.min_value=n,this.max_value=i,this.step=o,this.default_value=l}toString(){return`{"name": "${this.name}", "value": ${this.value}, "params": {\n            "number_command": ${this.number_command},\n            "min_value": ${this.min_value},\n            "max_value": ${this.max_value},\n            "step": ${this.step},\n            "default_value": ${this.default_value}\n        }}`}check_params(){return!(this.min_value>this.max_value)&&(!(this.value<this.min_value)&&!(this.value>this.max_value))}sendToMidi(e){if(!this.check_params())return;let t=[240];for(let a of this.flag_device)t.push(a);t.push(this.number_command);for(let a=0;a<Math.floor(this.value/127);a++)t.push(127);t.push(this.value%127),t.push(247),console.log(t),e.send(t)}}function q(e){const t=Date.now();let a=null;do{a=Date.now()}while(a-t<e)}var G={props:{commandLabel:{default:"",type:String},commandObject:{required:!0,type:$}},emits:["changedValue"],data(){return{Value:0}},watch:{Value(){this.checkLimit(),this.commandObject.set_value(parseInt(this.Value))}},methods:{checkLimit(){this.Value>this.commandObject.max_value&&(this.Value=this.commandObject.max_value),this.Value<this.commandObject.min_value&&(this.Value=this.commandObject.min_value)}},mounted(){this.Value=this.commandObject.value}};const E=(0,f.Z)(G,[["render",J],["__scopeId","data-v-5e32f92a"]]);var K=E;const Y={class:"settings_elem"};function Q(e,t,a,n,i,l){const s=(0,o.up)("hint-comp");return(0,o.wg)(),(0,o.iD)("div",Y,[(0,o._)("h2",null,[(0,o.Uk)((0,H.zw)(this.nameOfGroup)+" ",1),(0,o.Wm)(s,{description:this.description},null,8,["description"])]),(0,o.WI)(e.$slots,"objects",{},void 0,!0)])}const X=["title"];function ee(e,t,a,n,i,l){return""!==a.description?((0,o.wg)(),(0,o.iD)("span",{key:0,class:"hint",title:this.description}," ? ",8,X)):(0,o.kq)("",!0)}var te={name:"HintComp",props:{description:{type:String,default:""}},mounted(){}};const ae=(0,f.Z)(te,[["render",ee],["__scopeId","data-v-3fcf44fe"]]);var ne=ae,ie={name:"GroupOfCommands",components:{HintComp:ne},methods:{getTransitionRawChildren:o.Q6},props:{nameOfGroup:{default:"",type:String},description:{type:String,default:""}},mounted(){}};const oe=(0,f.Z)(ie,[["render",Q],["__scopeId","data-v-7843e752"]]);var le=oe;const se={class:"row m-2"},me={for:"value_input"},re=["value"];function ce(e,t,a,i,l,s){return(0,o.wg)(),(0,o.iD)("div",se,[(0,o._)("label",me,(0,H.zw)(this.commandLabel),1),(0,o.wy)((0,o._)("select",{"onUpdate:modelValue":t[0]||(t[0]=e=>this.Value=e),id:"scale",class:"form-control"},[((0,o.wg)(!0),(0,o.iD)(o.HY,null,(0,o.Ko)(this.listOfVariants,((e,t)=>((0,o.wg)(),(0,o.iD)("option",{key:t,value:t},(0,H.zw)(e),9,re)))),128))],512),[[n.bM,this.Value]])])}var de={props:{commandLabel:{default:"",type:String},listOfVariants:{default:{}},commandObject:{required:!0,type:$}},data(){return{Value:0}},watch:{Value(){this.commandObject.set_value(this.Value)}},mounted(){this.Value=this.commandObject.value}};const ue=(0,f.Z)(de,[["render",ce],["__scopeId","data-v-3ef0b675"]]);var he=ue;const pe={class:"form-floating mb-3"},_e=["value"],ve=(0,o._)("label",{for:"device"},"Select device",-1);function fe(e,t,a,i,l,s){return(0,o.wg)(),(0,o.iD)("div",pe,[(0,o.wy)((0,o._)("select",{"onUpdate:modelValue":t[0]||(t[0]=e=>l.currentMidiNum=e),class:"form-control"},[((0,o.wg)(!0),(0,o.iD)(o.HY,null,(0,o.Ko)(l.midiOut,((e,t)=>((0,o.wg)(),(0,o.iD)("option",{key:e.id,value:t},(0,H.zw)(e.name),9,_e)))),128))],512),[[n.bM,l.currentMidiNum]]),ve])}var ge={props:{regexName:{default:".*",type:String}},name:"DeviceSelector",data(){return{midiIn:[],midiOut:[],currentMidiNum:0}},watch:{currentMidiNum(){this.deviceChanged()}},methods:{midiReady(e){e.addEventListener("statechange",(e=>this.initDevices(e.target))),this.initDevices(e)},initDevices(e){this.midiIn=[],this.midiOut=[];const t=e.inputs.values();for(let n=t.next();n&&!n.done;n=t.next())n.value.name.match(this.regexName)&&this.midiIn.push(n.value);const a=e.outputs.values();for(let n=a.next();n&&!n.done;n=a.next())n.value.name.match(this.regexName)&&(this.midiOut.push(n.value),console.log(n.value),n.value.send([]));0!==a.length&&this.$emit("device_changed",this.midiOut[this.currentMidiNum])},deviceChanged(){this.$emit("device_changed",this.midiOut[this.currentMidiNum])}},mounted(){navigator.requestMIDIAccess({sysex:!0}).then((e=>this.midiReady(e)),(e=>console.log("Something went wrong",e)))}};const be=(0,f.Z)(ge,[["render",fe]]);var ye=be;const we=e=>((0,o.dD)("data-v-578c903a"),e=e(),(0,o.Cn)(),e),Ve={for:"checkbox_input"},xe={class:"container"},je={class:"col w-100"},De={class:"switch"},Se=we((()=>(0,o._)("span",{class:"slider round"},null,-1)));function ke(e,t,a,i,l,s){return(0,o.wg)(),(0,o.iD)(o.HY,null,[(0,o._)("label",Ve,(0,H.zw)(this.commandLabel),1),(0,o._)("div",xe,[(0,o._)("div",je,[(0,o._)("label",De,[(0,o.wy)((0,o._)("input",{id:"checkbox_input",type:"checkbox","onUpdate:modelValue":t[0]||(t[0]=e=>this.Checked=e)},null,512),[[n.e8,this.Checked]]),Se])])])],64)}var Ce={props:{commandLabel:{default:"",type:String},commandObject:{required:!0,type:$}},data(){return{Value:0,Checked:!0}},watch:{Checked(){this.Checked?this.Value=127:this.Value=0,this.commandObject.set_value(this.Value)}},mounted(){this.Value=this.commandObject.value,this.Checked=this.Value>0}};const Oe=(0,f.Z)(Ce,[["render",ke],["__scopeId","data-v-578c903a"]]);var Pe=Oe;const Le={id:"dropZone",class:"text-center"};function Me(e,t,a,n,i,l){return(0,o.wg)(),(0,o.iD)("div",{class:"droparea",onClick:t[1]||(t[1]=(...e)=>this.dropAreaClick&&this.dropAreaClick(...e)),onDragover:t[2]||(t[2]=e=>e.preventDefault()),onDrop:t[3]||(t[3]=e=>l.dropAreaDrop(e))},[(0,o._)("div",Le,[(0,o._)("input",{type:"file",id:"load_preset",style:{display:"none"},onChange:t[0]||(t[0]=e=>l.loadPresetChanged(e))},null,32),(0,o._)("p",null,(0,H.zw)(this.name),1)])],32)}var Re={methods:{dropAreaClick(){document.getElementById("load_preset").click()},dropAreaDrop(e){e.preventDefault();let t=e.dataTransfer.files[0],a=new FileReader,n=this;a.onload=function(e){n.$emit("get_drop",e.target.result)},"text/plain"!==t.type&&".scl"!==t.name.substring(t.name.lastIndexOf("."))||a.readAsText(t)},loadPresetChanged(e){let t=e.srcElement.files[0],a=new FileReader,n=this;a.onload=function(e){n.$emit("get_drop",e.target.result)},"text/plain"===t.type&&(a.readAsText(t),document.getElementById("load_preset").value="")}},props:{name:{type:String,default:"Drop preset here"}}};const Ie=(0,f.Z)(Re,[["render",Me],["__scopeId","data-v-fa3869ac"]]);var Ne=Ie,We=a(5702);const ze={class:"row m-2"},Ue={for:"value_input"},He={class:"row"},Ze={class:"col"},Be=["min","max"],Fe=(0,o.Uk)(" - "),Ae={class:"col"},Je=["min","max"],Te={class:"row"};function $e(e,t,a,i,l,s){const m=(0,o.up)("MultiRangeSlider");return(0,o.wg)(),(0,o.iD)("div",ze,[(0,o._)("label",Ue,(0,H.zw)(this.commandLabel),1),(0,o._)("div",He,[(0,o._)("div",Ze,[(0,o.wy)((0,o._)("input",{type:"number",id:"value_input_min",class:"form-control","onUpdate:modelValue":t[0]||(t[0]=e=>this.minValue=e),min:this.minCommandObject.min_value,max:this.minCommandObject.max_value},null,8,Be),[[n.nr,this.minValue]])]),Fe,(0,o._)("div",Ae,[(0,o.wy)((0,o._)("input",{type:"number",id:"value_input_max",class:"form-control","onUpdate:modelValue":t[1]||(t[1]=e=>this.maxValue=e),min:this.minCommandObject.min_value,max:this.maxCommandObject.max_value},null,8,Je),[[n.nr,this.maxValue]])])]),(0,o._)("div",Te,[(0,o.Wm)(m,{baseClassName:"multi-range-slider-bar-only",minValue:this.minValue,maxValue:this.maxValue,max:this.maxCommandObject.max_value,min:this.minCommandObject.min_value,step:this.minCommandObject.step,onInput:s.update_oBarValues},null,8,["minValue","maxValue","max","min","step","onInput"])])])}var qe=a(3103),Ge={components:{MultiRangeSlider:qe.Z},props:{commandLabel:{default:"",type:String},minCommandObject:{required:!0,type:$},maxCommandObject:{required:!0,type:$}},data(){return{minValue:0,maxValue:0}},watch:{minValue(){this.minValue<this.minCommandObject.min_value&&(this.minValue=this.minCommandObject),this.minValue>this.maxValue&&(this.minValue=this.maxValue),this.minCommandObject.set_value(this.minValue)},maxValue(){this.maxValue<this.minValue&&(this.maxValue=this.minValue),this.maxValue>this.maxCommandObject.max_value&&(this.minValue=this.maxCommandObject.max_value),this.maxCommandObject.set_value(this.maxValue)}},methods:{update_oBarValues(e){this.minValue=e.minValue,this.maxValue=e.maxValue}},mounted(){this.minValue=this.minCommandObject.value,this.maxValue=this.maxCommandObject.value,this.minValue>this.maxValue&&(this.minValue=this.maxValue)}};const Ee=(0,f.Z)(Ge,[["render",$e],["__scopeId","data-v-78cc1006"]]);var Ke=Ee;const Ye=e=>((0,o.dD)("data-v-b95bf0ae"),e=e(),(0,o.Cn)(),e),Qe={class:"container"},Xe={class:"col w-100"},et={class:"switch"},tt=["checked"],at=Ye((()=>(0,o._)("span",{class:"slider round"},null,-1)));function nt(e,t,a,n,i,l){return(0,o.wg)(),(0,o.iD)("div",Qe,[(0,o._)("div",Xe,[(0,o._)("label",et,[(0,o._)("input",{id:"checkbox_input",type:"checkbox",checked:a.modelValue,onClick:t[0]||(t[0]=t=>e.$emit("update:modelValue",t.target.checked))},null,8,tt),at])])])}var it={name:"SwitchComponent",props:{modelValue:{type:Boolean}},emits:["update:modelValue"]};const ot=(0,f.Z)(it,[["render",nt],["__scopeId","data-v-b95bf0ae"]]);var lt=ot,st={components:{SwitchComponent:lt,SliderRangeCommand:Ke,FileDropArea:Ne,DisableCommand:Pe,DeviceSelector:ye,SelectCommand:he,GroupOfCommands:le,SliderCommand:K},props:{id:{type:String,required:!0}},methods:{sendData(){if(!this.device)return;let e=[];this.randomPlantVelocity?(this.device.send([240,11,16,127,247]),q(100)):(this.device.send([240,11,16,0,247]),q(100)),this.disablePlantVel&&(this.device.send([240,11,5,0,247]),q(100),this.device.send([240,11,15,0,247]),q(100),e.push("minPlantVelocity"),e.push("maxPlantVelocity")),this.disableLightVel&&(this.device.send([240,11,6,0,247]),q(100),this.device.send([240,11,17,0,247]),q(100),e.push("minLightVelocity"),e.push("maxLightVelocity")),this.randomLightVelocity?(this.device.send([240,11,18,127,247]),q(100)):(this.device.send([240,11,18,0,247]),q(100));for(let t in this.commands_data)e.includes(t)||(this.commands_data[t].sendToMidi(this.device),q(100));this.saveData()},saveData(){let e=[];for(let n in this.commands_data)e.push(this.commands_data[n].toString());let t={plant_humanize:this.randomPlantVelocity,light_humanize:this.randomLightVelocity,plant_mute:this.disablePlantVel,light_mute:this.disableLightVel},a={commands:e,extra:t};localStorage.setItem(this.id,JSON.stringify(a))},loadData(){null===localStorage.getItem(this.id)&&this.saveData();for(let t of JSON.parse(localStorage.getItem(this.id)).commands){let e=JSON.parse(t);this.commands_data[e.name].set_value(e.value)}let e=JSON.parse(localStorage.getItem(this.id)).extra;this.randomPlantVelocity=e.plant_humanize,this.randomLightVelocity=e.light_humanize,this.disablePlantVel=e.plant_mute,this.disableLightVel=e.light_mute},returnDefault(){this.randomPlantVelocity=!1,this.randomLightVelocity=!1;for(let e in this.commands_data)this.commands_data[e].set_default();this.saveData(),this.forceRerender+=1,this.device.send([240,11,7,247])},createPreset(){let e=[];for(let i in this.commands_data)e.push(this.commands_data[i].toString());let t={plant_humanize:this.randomPlantVelocity,light_humanize:this.randomLightVelocity,plant_mute:this.disablePlantVel,light_mute:this.disableLightVel},a={commands:e,extra:t},n=new File([JSON.stringify(a)],"biotron_preset.txt",{type:"text/plain;charset=utf-8"});(0,We.p)(n,"biotron_preset.txt")},loadDataFromPreset(e){for(let a of JSON.parse(e).commands){let e=JSON.parse(a);this.commands_data[e.name].set_value(e.value)}let t=JSON.parse(localStorage.getItem(this.id)).extra;this.randomPlantVelocity=t.plant_humanize,this.randomLightVelocity=t.light_humanize,this.disablePlantVel=t.plant_mute,this.disableLightVel=t.light_mute,this.forceRerender+=1}},data(){return{scales:["Major","Minor","Chrom","Dorian","Mixolydian","Lydian","Wholetone","Minblues","Minpen","Majpen","Diminished"],device:null,forceRerender:0,disablePlantVel:!1,disableLightVel:!1,randomPlantVelocity:!1,randomLightVelocity:!1,commands_data:{plantBpm:new $({name:"plantBpm",number_command:0,default_value:60,max_value:1e3}),lightBpm:new $({name:"lightBpm",number_command:9,default_value:4,max_value:30}),noteOffPercent:new $({name:"noteOffPercent",number_command:12,default_value:100,max_value:100}),noteDistance:new $({name:"noteDistance",number_command:1,default_value:50,max_value:100}),firstValue:new $({name:"firstValue",number_command:2,default_value:10,max_value:100}),smoothness:new $({name:"smoothness",number_command:3,max_value:99}),scale:new $({name:"scale",number_command:4,default_value:0}),minPlantVelocity:new $({name:"minPlantVelocity",number_command:15,default_value:74,max_value:127}),maxPlantVelocity:new $({name:"maxPlantVelocity",number_command:5,default_value:75,max_value:127}),minLightVelocity:new $({name:"minLightVelocity",number_command:17,default_value:74,max_value:127}),maxLightVelocity:new $({name:"maxLightVelocity",number_command:6,default_value:75,max_value:127}),randomness:new $({name:"randomness",number_command:10,default_value:0}),same_note:new $({name:"same_note",number_command:11,default_value:0,max_value:10}),min_range_light_note:new $({name:"min_range_light_note",number_command:13,default_value:24}),max_range_light_note:new $({name:"max_range_light_note",number_command:14,default_value:48})}}},created(){null===localStorage.getItem(this.id)?this.saveData():this.loadData(),document.addEventListener("keyup",(e=>{"Enter"===e.code&&this.sendData()}))}};const mt=(0,f.Z)(st,[["render",U]]);var rt=mt;const ct=(0,o._)("h1",{class:"text-center"},"TouchMe change settings",-1),dt={class:"row"},ut={class:"col"},ht=(0,o._)("label",{for:"humanizeSwitch"},"Humanize",-1),pt={class:"col"},_t=(0,o._)("label",{for:"velocityDisableSwitch"},"Mute",-1),vt={key:0},ft={key:0},gt={key:1},bt={class:"row"},yt={class:"col"},wt=(0,o._)("label",{for:"notesRangeSwitch"},"Custom Range",-1),Vt={key:0},xt=["disabled"];function jt(e,t,a,n,i,l){const s=(0,o.up)("DeviceSelector"),m=(0,o.up)("SelectCommand"),r=(0,o.up)("GroupOfCommands"),c=(0,o.up)("SliderCommand"),d=(0,o.up)("SwitchComponent"),u=(0,o.up)("SliderRangeCommand"),h=(0,o.up)("FileDropArea");return(0,o.wg)(),(0,o.iD)(o.HY,null,[ct,(0,o.Wm)(s,{"regex-name":"TouchMe",onDevice_changed:t[0]||(t[0]=e=>{this.device=e})}),(0,o.Wm)(r,{"name-of-group":"Scale"},{objects:(0,o.w5)((()=>[((0,o.wg)(),(0,o.j4)(m,{key:this.forceRerender,"list-of-variants":this.scales,"command-object":this.touch_me_commands_data.Scale},null,8,["list-of-variants","command-object"]))])),_:1}),(0,o.Wm)(r,{"name-of-group":"Key"},{objects:(0,o.w5)((()=>[((0,o.wg)(),(0,o.j4)(c,{"command-label":"",key:this.forceRerender,"command-object":this.touch_me_commands_data.Key},null,8,["command-object"]))])),_:1}),(0,o.Wm)(r,{"name-of-group":"Velocity"},{objects:(0,o.w5)((()=>[(0,o._)("div",dt,[(0,o._)("div",ut,[ht,(0,o.Wm)(d,{id:"humanizeSwitch","model-value":this.isHumanize,"onUpdate:modelValue":t[1]||(t[1]=e=>{this.isHumanize=e,i.forceRerender++})},null,8,["model-value"])]),(0,o._)("div",pt,[_t,(0,o.Wm)(d,{id:"velocityDisableSwitch","model-value":this.isMute,"onUpdate:modelValue":t[2]||(t[2]=e=>{this.isMute=e})},null,8,["model-value"])])]),this.isMute?(0,o.kq)("",!0):((0,o.wg)(),(0,o.iD)("div",vt,[this.isHumanize?((0,o.wg)(),(0,o.iD)("div",gt,[((0,o.wg)(),(0,o.j4)(u,{key:this.forceRerender,"max-command-object":this.touch_me_commands_data.maxVelocity,"min-command-object":this.touch_me_commands_data.minVelocity},null,8,["max-command-object","min-command-object"]))])):((0,o.wg)(),(0,o.iD)("div",ft,[((0,o.wg)(),(0,o.j4)(c,{key:this.forceRerender,"command-object":this.touch_me_commands_data.maxVelocity},null,8,["command-object"]))]))]))])),_:1}),(0,o.Wm)(r,{"name-of-group":"Notes Range"},{objects:(0,o.w5)((()=>[(0,o._)("div",bt,[(0,o._)("div",yt,[wt,(0,o.Wm)(d,{id:"notesRangeSwitch","model-value":this.customRange,"onUpdate:modelValue":t[3]||(t[3]=e=>{this.customRange=e,i.forceRerender++})},null,8,["model-value"])])]),this.customRange?((0,o.wg)(),(0,o.iD)("div",Vt,[((0,o.wg)(),(0,o.j4)(u,{key:this.forceRerender,"max-command-object":this.touch_me_commands_data.highestNote,"min-command-object":this.touch_me_commands_data.lowestNote},null,8,["max-command-object","min-command-object"]))])):(0,o.kq)("",!0)])),_:1}),(0,o._)("button",{onClick:t[4]||(t[4]=(...e)=>this.sendData&&this.sendData(...e)),disabled:null==this.device,class:"btn btn-primary mb-1",style:{width:"70%"}},"Send",8,xt),(0,o._)("button",{onClick:t[5]||(t[5]=(...e)=>this.returnDefault&&this.returnDefault(...e)),class:"btn btn-primary mb-1",style:{width:"70%"}},"Set Default"),(0,o._)("button",{onClick:t[6]||(t[6]=(...e)=>this.createPreset&&this.createPreset(...e)),class:"btn btn-primary mb-1",style:{width:"70%"}},"Create Preset"),(0,o.Wm)(h,{name:"Drop Preset Here",onGet_drop:t[7]||(t[7]=e=>l.loadDataFromPreset(e))})],64)}var Dt={components:{SliderRangeCommand:Ke,SwitchComponent:lt,FileDropArea:Ne,SliderCommand:K,DeviceSelector:ye,GroupOfCommands:le,SelectCommand:he},props:{id:{type:String,required:!0}},methods:{sendData(){this.device.send([240,11,5,this.isMute?1:0,247]),this.device.send([240,11,4,this.isHumanize?1:0,247]),this.device.send([240,11,6,this.customRange?0:1,247]);for(let e in this.touch_me_commands_data)this.touch_me_commands_data[e].sendToMidi(this.device),q(100);this.saveData()},saveData(){let e=[];for(let n in this.touch_me_commands_data)e.push(this.touch_me_commands_data[n].toString());let t={mute:this.isMute,humanize:this.isHumanize},a={commands:e,extra:t};localStorage.setItem(this.id,JSON.stringify(a))},loadData(){null===localStorage.getItem(this.id)&&this.saveData();for(let t of JSON.parse(localStorage.getItem(this.id)).commands){let e=JSON.parse(t);this.touch_me_commands_data[e.name].set_value(e.value)}let e=JSON.parse(localStorage.getItem(this.id)).extra;this.isMute=e.mute,this.isHumanize=e.humanize},returnDefault(){this.randomPlantVelocity=!1,this.randomLightVelocity=!1;for(let e in this.touch_me_commands_data)this.touch_me_commands_data[e].set_default();this.saveData(),this.forceRerender+=1,this.device.send([240,11,7,247])},loadDataFromPreset(e){for(let a of JSON.parse(e).commands){let e=JSON.parse(a);this.touch_me_commands_data[e.name].set_value(e.value)}let t=JSON.parse(localStorage.getItem(this.id)).extra;this.isMute=t.mute,this.isHumanize=t.humanize,this.forceRerender+=1},createPreset(){let e=[];for(let i in this.touch_me_commands_data)e.push(this.touch_me_commands_data[i].toString());let t={mute:this.isMute,humanize:this.isHumanize},a={commands:e,extra:t},n=new File([JSON.stringify(a)],"touchme_preset.txt",{type:"text/plain;charset=utf-8"});(0,We.p)(n,"touchme_preset.txt")}},data(){return{scales:["Major","Minor","Chrom","Dorian","Mixolydian","Lydian","Wholetone","Minblues","Minpen","Majpen","Diminished"],device:null,forceRerender:0,isHumanize:!1,isMute:!1,customRange:!1,touch_me_commands_data:{Scale:new $({name:"Scale",number_command:0,default_value:0,max_value:11}),Key:new $({name:"Key",number_command:1,default_value:1,min_value:1,max_value:12}),maxVelocity:new $({name:"maxVelocity",number_command:2,default_value:70,max_value:127}),minVelocity:new $({name:"minVelocity",number_command:3,default_value:50,max_value:127}),highestNote:new $({name:"highestNote",number_command:8,default_value:84,max_value:127}),lowestNote:new $({name:"lowestNote",number_command:7,default_value:48,max_value:127})}}},created(){null===localStorage.getItem(this.id)?this.saveData():this.loadData()}};const St=(0,f.Z)(Dt,[["render",jt]]);var kt=St;const Ct=(0,o._)("h1",{class:"text-center"},"Scala Loader",-1),Ot=(0,o._)("h2",null,[(0,o.Uk)("Create your own scala file or choose from list on "),(0,o._)("a",{href:"https://isartum.net/leimma"},"Leimma")],-1),Pt={class:"row"},Lt={class:"col-9"},Mt={class:"col-3"};function Rt(e,t,a,i,l,s){const m=(0,o.up)("DeviceSelector"),r=(0,o.up)("FileDropArea");return(0,o.wg)(),(0,o.iD)(o.HY,null,[Ct,Ot,(0,o.Wm)(m,{"regex-name":"",onDevice_changed:t[0]||(t[0]=e=>{this.device=e})}),(0,o._)("div",Pt,[(0,o._)("div",Lt,[(0,o.wy)((0,o._)("input",{"onUpdate:modelValue":t[1]||(t[1]=e=>this.url=e),type:"text",id:"url_input",class:"form-control",placeholder:"Leimma link"},null,512),[[n.nr,this.url]])]),(0,o._)("div",Mt,[(0,o._)("button",{onClick:t[2]||(t[2]=(...e)=>this.loadUrl&&this.loadUrl(...e)),class:"btn btn-primary mb-1",style:{width:"70%"}},"Send")])]),(0,o.Wm)(r,{name:"Drop Scala File Here",onGet_drop:t[3]||(t[3]=e=>this.loadFile(e))})],64)}var It={components:{FileDropArea:Ne,DeviceSelector:ye},props:{},methods:{loadFile(e){let t=e.split("\n");if(!t[0].includes(".scl"))return;let a=t.lastIndexOf("!"),n=parseInt(t[a-1]),i=t.slice(a+1,a+n+1);this.convertCentsString(i,n)},loadUrl(){if(!this.url.includes("/tuningsystem"))return;let e=this.url.substring(this.url.lastIndexOf("/tuningsystem/")+14),t=e.substring(7,8);if("~"!==t&&"s"!==t)return void console.log("Strange Delimiter");let a=e.split(t);if("s"===t)for(let n=0;n<a.length;n++)a[n]=a[n].substring(4);a=a.slice(1),a.push("2r1"),this.convertCentsString(a,a.length,"r")},convertCentsString(e,t,a="/"){for(let n=0;n<t;n++)if(e[n].includes(a)){let t=e[n].split(a);e[n]=parseInt(1200*Math.log2(parseInt(t[0])/parseInt(t[1])))}else e[n]=parseInt(e[n]);this.sendCents(e)},sendCents(e){if(!this.device)return;let t=[240,11,20,13,1,247];this.device.send(t),console.log(t);let a=[];for(const i of e){a=[240,11,20,13,1];for(let e=0;e<Math.floor(i/127);e++)a.push(127);i%127!==0&&a.push(i%127),a.push(247),this.device.send(a),console.log(a),q(1e3)}let n=[240,11,20,13,127,247];this.device.send(n),console.log(n)}},data(){return{url:"",device:null}}};const Nt=(0,f.Z)(It,[["render",Rt]]);var Wt=Nt;const zt=[{path:"/"},{path:"/biotron",component:rt,props:{id:"BiotronWebMidiId_1"}},{path:"/touchme",component:kt,props:{id:"TouchmeWebMidiId_1"}},{path:"/scala",component:Wt}],Ut=(0,i.p7)({history:(0,i.r5)(),linkActiveClass:"active",routes:zt});(0,n.ri)(b).use(Ut).mount("#app")}},t={};function a(n){var i=t[n];if(void 0!==i)return i.exports;var o=t[n]={exports:{}};return e[n].call(o.exports,o,o.exports,a),o.exports}a.m=e,function(){var e=[];a.O=function(t,n,i,o){if(!n){var l=1/0;for(c=0;c<e.length;c++){n=e[c][0],i=e[c][1],o=e[c][2];for(var s=!0,m=0;m<n.length;m++)(!1&o||l>=o)&&Object.keys(a.O).every((function(e){return a.O[e](n[m])}))?n.splice(m--,1):(s=!1,o<l&&(l=o));if(s){e.splice(c--,1);var r=i();void 0!==r&&(t=r)}}return t}o=o||0;for(var c=e.length;c>0&&e[c-1][2]>o;c--)e[c]=e[c-1];e[c]=[n,i,o]}}(),function(){a.d=function(e,t){for(var n in t)a.o(t,n)&&!a.o(e,n)&&Object.defineProperty(e,n,{enumerable:!0,get:t[n]})}}(),function(){a.g=function(){if("object"===typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"===typeof window)return window}}()}(),function(){a.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)}}(),function(){a.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}}(),function(){var e={143:0};a.O.j=function(t){return 0===e[t]};var t=function(t,n){var i,o,l=n[0],s=n[1],m=n[2],r=0;if(l.some((function(t){return 0!==e[t]}))){for(i in s)a.o(s,i)&&(a.m[i]=s[i]);if(m)var c=m(a)}for(t&&t(n);r<l.length;r++)o=l[r],a.o(e,o)&&e[o]&&e[o][0](),e[o]=0;return a.O(c)},n=self["webpackChunkWebMidiPlaytronica"]=self["webpackChunkWebMidiPlaytronica"]||[];n.forEach(t.bind(null,0)),n.push=t.bind(null,n.push.bind(n))}();var n=a.O(void 0,[998],(function(){return a(1858)}));n=a.O(n)})();
//# sourceMappingURL=app.e1b852c1.js.map