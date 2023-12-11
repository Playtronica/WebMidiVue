(function(){"use strict";var e={7957:function(e,t,a){var n=a(9963),i=a(2201),o=a(6252);const m={class:"d-flex justify-content-center"},l={class:"nav nav-pills"},s={class:"nav-item"},d=(0,o.Uk)("Biotron"),c=(0,o.Uk)("Biotron"),r={class:"nav-item"},u=(0,o.Uk)("TouchMe"),h=(0,o.Uk)("TouchMe"),_={class:"m-2"};function v(e,t,a,n,i,v){const p=(0,o.up)("router-link"),b=(0,o.up)("router-view");return(0,o.wg)(),(0,o.iD)(o.HY,null,[(0,o._)("header",m,[(0,o._)("ul",l,[(0,o._)("li",s,["/biotron"===this.url?((0,o.wg)(),(0,o.j4)(p,{key:0,to:"/biotron",onClick:this.update,class:"nav-link active"},{default:(0,o.w5)((()=>[d])),_:1},8,["onClick"])):((0,o.wg)(),(0,o.j4)(p,{key:1,to:"/biotron",onClick:this.update,class:"nav-link"},{default:(0,o.w5)((()=>[c])),_:1},8,["onClick"]))]),(0,o._)("li",r,["/touchme"===this.url?((0,o.wg)(),(0,o.j4)(p,{key:0,onClick:this.update,to:"/touchme",class:"nav-link active"},{default:(0,o.w5)((()=>[u])),_:1},8,["onClick"])):((0,o.wg)(),(0,o.j4)(p,{key:1,to:"/touchme",onClick:this.update,class:"nav-link"},{default:(0,o.w5)((()=>[h])),_:1},8,["onClick"]))])])]),(0,o._)("div",_,[(0,o.Wm)(b)])],64)}var p={name:"App",data(){return{url:String,forceRerender:0}},mounted(){console.log(1)},methods:{update(){this.forceRerender++}}},b=a(3744);const f=(0,b.Z)(p,[["render",v]]);var g=f;a(8877);const y=(0,o._)("h1",{class:"text-center"},"Biotron change settings",-1),w={class:"row"},V={class:"col"},j=(0,o._)("label",{for:"randomPlantVelSwitch"},"Humanize",-1),x={class:"col"},D=(0,o._)("label",{for:"plantVelDis"},"Mute",-1),k={key:0},S={key:0},C={key:1},O={class:"row"},P={class:"col"},M=(0,o._)("label",{for:"randomLightVelSwitch"},"Humanize",-1),R={class:"col"},L=(0,o._)("label",{for:"lightVelDis"},"Mute",-1),W={key:0,class:"row"},I={key:0},N={key:1},Z=["disabled"];function B(e,t,a,i,m,l){const s=(0,o.up)("DeviceSelector"),d=(0,o.up)("SliderCommand"),c=(0,o.up)("GroupOfCommands"),r=(0,o.up)("SelectCommand"),u=(0,o.up)("SwitchComponent"),h=(0,o.up)("SliderRangeCommand"),_=(0,o.up)("DisableCommand"),v=(0,o.up)("FileDropArea");return(0,o.wg)(),(0,o.iD)("div",{onKeyup:t[9]||(t[9]=(0,n.D2)(((...e)=>this.sendData&&this.sendData(...e)),["enter"]))},[y,(0,o.Wm)(s,{"regex-name":"Biotron",onDevice_changed:t[0]||(t[0]=e=>{this.device=e})}),(0,o.Wm)(c,{"name-of-group":"BPM"},{objects:(0,o.w5)((()=>[((0,o.wg)(),(0,o.j4)(d,{"command-label":"Plant Bpm",key:this.forceRerender,"command-object":this.commands_data.plantBpm},null,8,["command-object"])),((0,o.wg)(),(0,o.j4)(d,{"command-label":"Note Off Percent",key:this.forceRerender,"command-object":this.commands_data.noteOffPercent},null,8,["command-object"])),((0,o.wg)(),(0,o.j4)(d,{"command-label":"Light Bpm",key:this.forceRerender,"command-object":this.commands_data.lightBpm},null,8,["command-object"]))])),_:1}),(0,o.Wm)(c,{"name-of-group":"Sensitivity (fib)"},{objects:(0,o.w5)((()=>[((0,o.wg)(),(0,o.j4)(d,{"command-label":"Note Distance",key:this.forceRerender,"command-object":this.commands_data.noteDistance},null,8,["command-object"])),((0,o.wg)(),(0,o.j4)(d,{"command-label":"First Value",key:this.forceRerender,"command-object":this.commands_data.firstValue},null,8,["command-object"]))])),_:1}),(0,o.Wm)(c,{"name-of-group":"Smoothness"},{objects:(0,o.w5)((()=>[((0,o.wg)(),(0,o.j4)(d,{key:this.forceRerender,"command-object":this.commands_data.smoothness},null,8,["command-object"]))])),_:1}),(0,o.Wm)(c,{"name-of-group":"Scale"},{objects:(0,o.w5)((()=>[((0,o.wg)(),(0,o.j4)(r,{key:this.forceRerender,"list-of-variants":this.scales,"command-object":m.commands_data.scale},null,8,["list-of-variants","command-object"]))])),_:1}),(0,o.Wm)(c,{"name-of-group":"Velocity"},{objects:(0,o.w5)((()=>[(0,o.Wm)(c,{"name-of-group":"Plant"},{objects:(0,o.w5)((()=>[(0,o._)("div",w,[(0,o._)("div",V,[j,(0,o.Wm)(u,{id:"randomPlantVelSwitch","model-value":m.randomPlantVelocity,"onUpdate:modelValue":t[1]||(t[1]=e=>{m.randomPlantVelocity=e,m.forceRerender++})},null,8,["model-value"])]),(0,o._)("div",x,[D,(0,o.Wm)(u,{id:"plantVelDis","model-value":m.disablePlantVel,"onUpdate:modelValue":t[2]||(t[2]=e=>{m.disablePlantVel=e})},null,8,["model-value"])])]),m.disablePlantVel?(0,o.kq)("",!0):((0,o.wg)(),(0,o.iD)("div",k,[m.randomPlantVelocity?((0,o.wg)(),(0,o.iD)("div",C,[((0,o.wg)(),(0,o.j4)(h,{key:this.forceRerender,"max-command-object":m.commands_data.maxPlantVelocity,"min-command-object":m.commands_data.minPlantVelocity},null,8,["max-command-object","min-command-object"]))])):((0,o.wg)(),(0,o.iD)("div",S,[((0,o.wg)(),(0,o.j4)(d,{key:this.forceRerender,"command-object":m.commands_data.maxPlantVelocity},null,8,["command-object"]))]))]))])),_:1}),(0,o.Wm)(c,{"name-of-group":"Light"},{objects:(0,o.w5)((()=>[(0,o._)("div",O,[(0,o._)("div",P,[M,(0,o.Wm)(u,{id:"randomLightVelSwitch","model-value":m.randomLightVelocity,"onUpdate:modelValue":t[3]||(t[3]=e=>{m.randomLightVelocity=e,m.forceRerender++})},null,8,["model-value"])]),(0,o._)("div",R,[L,(0,o.Wm)(u,{id:"lightVelDis","model-value":m.disableLightVel,"onUpdate:modelValue":t[4]||(t[4]=e=>{m.disableLightVel=e})},null,8,["model-value"])])]),m.disableLightVel?(0,o.kq)("",!0):((0,o.wg)(),(0,o.iD)("div",W,[m.randomLightVelocity?((0,o.wg)(),(0,o.iD)("div",N,[((0,o.wg)(),(0,o.j4)(h,{key:this.forceRerender,"max-command-object":m.commands_data.maxLightVelocity,"min-command-object":m.commands_data.minLightVelocity},null,8,["max-command-object","min-command-object"]))])):((0,o.wg)(),(0,o.iD)("div",I,[((0,o.wg)(),(0,o.j4)(d,{key:this.forceRerender,"command-object":m.commands_data.maxLightVelocity},null,8,["command-object"]))]))]))])),_:1})])),_:1}),(0,o.Wm)(c,{"name-of-group":"Randomness"},{objects:(0,o.w5)((()=>[((0,o.wg)(),(0,o.j4)(_,{key:this.forceRerender,"command-object":m.commands_data.randomness},null,8,["command-object"]))])),_:1}),(0,o.Wm)(c,{"name-of-group":"Same Note"},{objects:(0,o.w5)((()=>[((0,o.wg)(),(0,o.j4)(d,{key:this.forceRerender,"command-object":m.commands_data.same_note},null,8,["command-object"]))])),_:1}),(0,o.Wm)(c,{"name-of-group":"Light Notes Range"},{objects:(0,o.w5)((()=>[((0,o.wg)(),(0,o.j4)(h,{key:this.forceRerender,"max-command-object":m.commands_data.max_range_light_note,"min-command-object":m.commands_data.min_range_light_note},null,8,["max-command-object","min-command-object"]))])),_:1}),(0,o._)("button",{onClick:t[5]||(t[5]=(...e)=>this.sendData&&this.sendData(...e)),disabled:null===this.device,class:"btn btn-primary mb-1",style:{width:"70%"}},"Send",8,Z),(0,o._)("button",{onClick:t[6]||(t[6]=(...e)=>this.returnDefault&&this.returnDefault(...e)),class:"btn btn-primary mb-1",style:{width:"70%"}},"Set Default"),(0,o._)("button",{onClick:t[7]||(t[7]=(...e)=>this.createPreset&&this.createPreset(...e)),class:"btn btn-primary mb-1",style:{width:"70%"}},"Create Preset"),(0,o.Wm)(v,{name:"Drop Preset Here",onGet_drop:t[8]||(t[8]=e=>l.loadDataFromPreset(e))})],32)}a(7658);var z=a(3577);const U={class:"row m-2"},T={for:"value_input"},H=["min","max"],A=["min","max","step"];function F(e,t,a,i,m,l){return(0,o.wg)(),(0,o.iD)("div",U,[(0,o._)("label",T,(0,z.zw)(this.commandLabel),1),(0,o.wy)((0,o._)("input",{type:"number",id:"value_input",class:"form-control","onUpdate:modelValue":t[0]||(t[0]=e=>this.Value=e),min:this.commandObject.min_value,max:this.commandObject.max_value},null,8,H),[[n.nr,this.Value]]),(0,o.wy)((0,o._)("input",{type:"range",id:"range_input",class:"settings_input","onUpdate:modelValue":t[1]||(t[1]=e=>this.Value=e),min:this.commandObject.min_value,max:this.commandObject.max_value,step:this.commandObject.step},null,8,A),[[n.nr,this.Value]])])}var $=a(7327);class J{set_value(e){this.value=e}set_default(){this.value=this.default_value}constructor({name:e=null,number_command:t=0,value:a=null,min_value:n=0,max_value:i=127,step:o=1,default_value:m=0}){if((0,$.Z)(this,"flag_device",[11]),(0,$.Z)(this,"name",void 0),(0,$.Z)(this,"number_command",void 0),(0,$.Z)(this,"value",void 0),(0,$.Z)(this,"default_value",void 0),(0,$.Z)(this,"min_value",void 0),(0,$.Z)(this,"max_value",void 0),(0,$.Z)(this,"step",void 0),null===t)throw"Number Command is null";this.name=null===e?`Command number ${t}`:e,this.number_command=t,this.value=null===a?m:a,this.min_value=n,this.max_value=i,this.step=o,this.default_value=m}toString(){return`{"name": "${this.name}", "value": ${this.value}, "params": {\n            "number_command": ${this.number_command},\n            "min_value": ${this.min_value},\n            "max_value": ${this.max_value},\n            "step": ${this.step},\n            "default_value": ${this.default_value}\n        }}`}check_params(){return!(this.min_value>this.max_value)&&(!(this.value<this.min_value)&&!(this.value>this.max_value))}sendToMidi(e){if(!this.check_params())return;let t=[240];for(let a of this.flag_device)t.push(a);t.push(this.number_command);for(let a=0;a<Math.floor(this.value/127);a++)t.push(127);t.push(this.value%127),t.push(247),console.log(t),e.send(t)}}function q(e){const t=Date.now();let a=null;do{a=Date.now()}while(a-t<e)}var G={props:{commandLabel:{default:"",type:String},commandObject:{required:!0,type:J}},emits:["changedValue"],data(){return{Value:0}},watch:{Value(){this.checkLimit(),this.commandObject.set_value(parseInt(this.Value))}},methods:{checkLimit(){this.Value>this.commandObject.max_value&&(this.Value=this.commandObject.max_value),this.Value<this.commandObject.min_value&&(this.Value=this.commandObject.min_value)}},mounted(){this.Value=this.commandObject.value}};const E=(0,b.Z)(G,[["render",F],["__scopeId","data-v-5e32f92a"]]);var K=E;const Y={class:"settings_elem"};function Q(e,t,a,n,i,m){return(0,o.wg)(),(0,o.iD)("div",Y,[(0,o._)("h2",null,(0,z.zw)(this.nameOfGroup),1),(0,o.WI)(e.$slots,"objects",{},void 0,!0)])}var X={name:"GroupOfCommands",methods:{getTransitionRawChildren:o.Q6},props:{nameOfGroup:{default:"",type:String}}};const ee=(0,b.Z)(X,[["render",Q],["__scopeId","data-v-781a2c6c"]]);var te=ee;const ae={class:"row m-2"},ne={for:"value_input"},ie=["value"];function oe(e,t,a,i,m,l){return(0,o.wg)(),(0,o.iD)("div",ae,[(0,o._)("label",ne,(0,z.zw)(this.commandLabel),1),(0,o.wy)((0,o._)("select",{"onUpdate:modelValue":t[0]||(t[0]=e=>this.Value=e),id:"scale",class:"form-control"},[((0,o.wg)(!0),(0,o.iD)(o.HY,null,(0,o.Ko)(this.listOfVariants,((e,t)=>((0,o.wg)(),(0,o.iD)("option",{key:t,value:t},(0,z.zw)(e),9,ie)))),128))],512),[[n.bM,this.Value]])])}var me={props:{commandLabel:{default:"",type:String},listOfVariants:{default:{}},commandObject:{required:!0,type:J}},data(){return{Value:0}},watch:{Value(){this.commandObject.set_value(this.Value)}},mounted(){this.Value=this.commandObject.value}};const le=(0,b.Z)(me,[["render",oe],["__scopeId","data-v-3ef0b675"]]);var se=le;const de={class:"form-floating mb-3"},ce=["value"],re=(0,o._)("label",{for:"device"},"Select device",-1);function ue(e,t,a,i,m,l){return(0,o.wg)(),(0,o.iD)("div",de,[(0,o.wy)((0,o._)("select",{"onUpdate:modelValue":t[0]||(t[0]=e=>m.currentMidiNum=e),class:"form-control"},[((0,o.wg)(!0),(0,o.iD)(o.HY,null,(0,o.Ko)(m.midiOut,((e,t)=>((0,o.wg)(),(0,o.iD)("option",{key:e.id,value:t},(0,z.zw)(e.name),9,ce)))),128))],512),[[n.bM,m.currentMidiNum]]),re])}var he={props:{regexName:{default:".*",type:String}},name:"DeviceSelector",data(){return{midiIn:[],midiOut:[],currentMidiNum:0}},watch:{currentMidiNum(){this.deviceChanged()}},methods:{midiReady(e){e.addEventListener("statechange",(e=>this.initDevices(e.target))),this.initDevices(e)},initDevices(e){this.midiIn=[],this.midiOut=[];const t=e.inputs.values();for(let n=t.next();n&&!n.done;n=t.next())n.value.name.match(this.regexName)&&this.midiIn.push(n.value);const a=e.outputs.values();for(let n=a.next();n&&!n.done;n=a.next())n.value.name.match(this.regexName)&&(this.midiOut.push(n.value),n.value.send([]));0!==a.length&&this.$emit("device_changed",this.midiOut[this.currentMidiNum])},deviceChanged(){this.$emit("device_changed",this.midiOut[this.currentMidiNum])}},mounted(){navigator.requestMIDIAccess({sysex:!0}).then((e=>this.midiReady(e)),(e=>console.log("Something went wrong",e)))}};const _e=(0,b.Z)(he,[["render",ue]]);var ve=_e;const pe=e=>((0,o.dD)("data-v-578c903a"),e=e(),(0,o.Cn)(),e),be={for:"checkbox_input"},fe={class:"container"},ge={class:"col w-100"},ye={class:"switch"},we=pe((()=>(0,o._)("span",{class:"slider round"},null,-1)));function Ve(e,t,a,i,m,l){return(0,o.wg)(),(0,o.iD)(o.HY,null,[(0,o._)("label",be,(0,z.zw)(this.commandLabel),1),(0,o._)("div",fe,[(0,o._)("div",ge,[(0,o._)("label",ye,[(0,o.wy)((0,o._)("input",{id:"checkbox_input",type:"checkbox","onUpdate:modelValue":t[0]||(t[0]=e=>this.Checked=e)},null,512),[[n.e8,this.Checked]]),we])])])],64)}var je={props:{commandLabel:{default:"",type:String},commandObject:{required:!0,type:J}},data(){return{Value:0,Checked:!0}},watch:{Checked(){this.Checked?this.Value=127:this.Value=0,this.commandObject.set_value(this.Value)}},mounted(){this.Value=this.commandObject.value,this.Checked=this.Value>0}};const xe=(0,b.Z)(je,[["render",Ve],["__scopeId","data-v-578c903a"]]);var De=xe;const ke={id:"dropZone",class:"text-center"};function Se(e,t,a,n,i,m){return(0,o.wg)(),(0,o.iD)("div",{class:"droparea",onClick:t[1]||(t[1]=(...e)=>this.dropAreaClick&&this.dropAreaClick(...e)),onDragover:t[2]||(t[2]=e=>e.preventDefault()),onDrop:t[3]||(t[3]=e=>m.dropAreaDrop(e))},[(0,o._)("div",ke,[(0,o._)("input",{type:"file",id:"load_preset",style:{display:"none"},onChange:t[0]||(t[0]=e=>m.loadPresetChanged(e))},null,32),(0,o._)("p",null,(0,z.zw)(this.name),1)])],32)}var Ce={methods:{dropAreaClick(){document.getElementById("load_preset").click()},dropAreaDrop(e){e.preventDefault();let t=e.dataTransfer.files[0],a=new FileReader,n=this;a.onload=function(e){n.$emit("get_drop",e.target.result)},"text/plain"===t.type&&a.readAsText(t)},loadPresetChanged(e){let t=e.srcElement.files[0],a=new FileReader,n=this;a.onload=function(e){n.$emit("get_drop",e.target.result)},"text/plain"===t.type&&(a.readAsText(t),document.getElementById("load_preset").value="")}},props:{name:{type:String,default:"Drop preset here"}}};const Oe=(0,b.Z)(Ce,[["render",Se],["__scopeId","data-v-7145ae27"]]);var Pe=Oe,Me=a(5702);const Re={class:"row m-2"},Le={for:"value_input"},We={class:"row"},Ie={class:"col"},Ne=["min","max"],Ze=(0,o.Uk)(" - "),Be={class:"col"},ze=["min","max"],Ue={class:"row"};function Te(e,t,a,i,m,l){const s=(0,o.up)("MultiRangeSlider");return(0,o.wg)(),(0,o.iD)("div",Re,[(0,o._)("label",Le,(0,z.zw)(this.commandLabel),1),(0,o._)("div",We,[(0,o._)("div",Ie,[(0,o.wy)((0,o._)("input",{type:"number",id:"value_input_min",class:"form-control","onUpdate:modelValue":t[0]||(t[0]=e=>this.minValue=e),min:this.minCommandObject.min_value,max:this.minCommandObject.max_value},null,8,Ne),[[n.nr,this.minValue]])]),Ze,(0,o._)("div",Be,[(0,o.wy)((0,o._)("input",{type:"number",id:"value_input_max",class:"form-control","onUpdate:modelValue":t[1]||(t[1]=e=>this.maxValue=e),min:this.minCommandObject.min_value,max:this.maxCommandObject.max_value},null,8,ze),[[n.nr,this.maxValue]])])]),(0,o._)("div",Ue,[(0,o.Wm)(s,{baseClassName:"multi-range-slider-bar-only",minValue:this.minValue,maxValue:this.maxValue,max:this.maxCommandObject.max_value,min:this.minCommandObject.min_value,step:this.minCommandObject.step,onInput:l.update_oBarValues},null,8,["minValue","maxValue","max","min","step","onInput"])])])}var He=a(3103),Ae={components:{MultiRangeSlider:He.Z},props:{commandLabel:{default:"",type:String},minCommandObject:{required:!0,type:J},maxCommandObject:{required:!0,type:J}},data(){return{minValue:0,maxValue:0}},watch:{minValue(){this.minValue<this.minCommandObject.min_value&&(this.minValue=this.minCommandObject),this.minValue>this.maxValue&&(this.minValue=this.maxValue),this.minCommandObject.set_value(this.minValue)},maxValue(){this.maxValue<this.minValue&&(this.maxValue=this.minValue),this.maxValue>this.maxCommandObject.max_value&&(this.minValue=this.maxCommandObject.max_value),this.maxCommandObject.set_value(this.maxValue)}},methods:{update_oBarValues(e){this.minValue=e.minValue,this.maxValue=e.maxValue}},mounted(){this.minValue=this.minCommandObject.value,this.maxValue=this.maxCommandObject.value,this.minValue>this.maxValue&&(this.minValue=this.maxValue)}};const Fe=(0,b.Z)(Ae,[["render",Te],["__scopeId","data-v-78cc1006"]]);var $e=Fe;const Je=e=>((0,o.dD)("data-v-b95bf0ae"),e=e(),(0,o.Cn)(),e),qe={class:"container"},Ge={class:"col w-100"},Ee={class:"switch"},Ke=["checked"],Ye=Je((()=>(0,o._)("span",{class:"slider round"},null,-1)));function Qe(e,t,a,n,i,m){return(0,o.wg)(),(0,o.iD)("div",qe,[(0,o._)("div",Ge,[(0,o._)("label",Ee,[(0,o._)("input",{id:"checkbox_input",type:"checkbox",checked:a.modelValue,onClick:t[0]||(t[0]=t=>e.$emit("update:modelValue",t.target.checked))},null,8,Ke),Ye])])])}var Xe={name:"SwitchComponent",props:{modelValue:{type:Boolean}},emits:["update:modelValue"]};const et=(0,b.Z)(Xe,[["render",Qe],["__scopeId","data-v-b95bf0ae"]]);var tt=et,at={components:{SwitchComponent:tt,SliderRangeCommand:$e,FileDropArea:Pe,DisableCommand:De,DeviceSelector:ve,SelectCommand:se,GroupOfCommands:te,SliderCommand:K},props:{id:{type:String,required:!0}},methods:{sendData(){let e=[];this.randomPlantVelocity?(this.device.send([240,11,16,127,247]),q(100)):(this.device.send([240,11,16,0,247]),q(100)),this.disablePlantVel&&(this.device.send([240,11,5,0,247]),q(100),this.device.send([240,11,15,0,247]),q(100),e.push("minPlantVelocity"),e.push("maxPlantVelocity")),this.disableLightVel&&(this.device.send([240,11,6,0,247]),q(100),this.device.send([240,11,17,0,247]),q(100),e.push("minLightVelocity"),e.push("maxLightVelocity")),this.randomLightVelocity?(this.device.send([240,11,18,127,247]),q(100)):(this.device.send([240,11,18,0,247]),q(100));for(let t in this.commands_data)e.includes(t)||(this.commands_data[t].sendToMidi(this.device),q(100));this.saveData()},saveData(){let e=[];for(let a in this.commands_data)e.push(this.commands_data[a].toString());let t={commands:e};localStorage.setItem(this.id,JSON.stringify(t))},loadData(){null===localStorage.getItem(this.id)&&this.saveData();for(let e of JSON.parse(localStorage.getItem(this.id)).commands){let t=JSON.parse(e);this.commands_data[t.name].set_value(t.value)}},returnDefault(){this.randomPlantVelocity=!1,this.randomLightVelocity=!1;for(let e in this.commands_data)this.commands_data[e].set_default();this.saveData(),this.forceRerender+=1,this.device.send([240,11,7,247])},createPreset(){let e=[];for(let n in this.commands_data)e.push(this.commands_data[n].toString());let t={commands:e},a=new File([JSON.stringify(t)],"biotron_preset.txt",{type:"text/plain;charset=utf-8"});(0,Me.p)(a,"biotron_preset.txt")},loadDataFromPreset(e){for(let t of JSON.parse(e).commands){let e=JSON.parse(t);this.commands_data[e.name].set_value(e.value)}this.forceRerender+=1}},data(){return{scales:["Major","Minor","Chrom","Dorian","Mixolydian","Lydian","Wholetone","Minblues","Minpen","Majpen","Diminished"],device:null,forceRerender:0,disablePlantVel:!1,disableLightVel:!1,randomPlantVelocity:!1,randomLightVelocity:!1,commands_data:{plantBpm:new J({name:"plantBpm",number_command:0,default_value:60,max_value:1e3}),lightBpm:new J({name:"lightBpm",number_command:9,default_value:4,max_value:30}),noteOffPercent:new J({name:"noteOffPercent",number_command:12,default_value:100,max_value:100}),noteDistance:new J({name:"noteDistance",number_command:1,default_value:50,max_value:100}),firstValue:new J({name:"firstValue",number_command:2,default_value:10,max_value:100}),smoothness:new J({name:"smoothness",number_command:3,max_value:99}),scale:new J({name:"scale",number_command:4,default_value:0}),minPlantVelocity:new J({name:"minPlantVelocity",number_command:15,default_value:74,max_value:127}),maxPlantVelocity:new J({name:"maxPlantVelocity",number_command:5,default_value:75,max_value:127}),minLightVelocity:new J({name:"minLightVelocity",number_command:17,default_value:74,max_value:127}),maxLightVelocity:new J({name:"maxLightVelocity",number_command:6,default_value:75,max_value:127}),randomness:new J({name:"randomness",number_command:10,default_value:0}),same_note:new J({name:"same_note",number_command:11,default_value:0,max_value:10}),min_range_light_note:new J({name:"min_range_light_note",number_command:13,default_value:24}),max_range_light_note:new J({name:"max_range_light_note",number_command:14,default_value:48})}}},created(){null===localStorage.getItem(this.id)?this.saveData():this.loadData(),document.addEventListener("keyup",(e=>{"Enter"===e.code&&this.sendData()}))}};const nt=(0,b.Z)(at,[["render",B]]);var it=nt;const ot=(0,o._)("h1",{class:"text-center"},"TouchMe change settings",-1),mt={class:"row"},lt={class:"col"},st=(0,o._)("label",{for:"humanizeSwitch"},"Humanize",-1),dt={class:"col"},ct=(0,o._)("label",{for:"velocityDisableSwitch"},"Mute",-1),rt={key:0},ut={key:0},ht={key:1},_t=["disabled"];function vt(e,t,a,n,i,m){const l=(0,o.up)("DeviceSelector"),s=(0,o.up)("SelectCommand"),d=(0,o.up)("GroupOfCommands"),c=(0,o.up)("SliderCommand"),r=(0,o.up)("SwitchComponent"),u=(0,o.up)("SliderRangeCommand"),h=(0,o.up)("FileDropArea");return(0,o.wg)(),(0,o.iD)(o.HY,null,[ot,(0,o.Wm)(l,{"regex-name":"TouchMe",onDevice_changed:t[0]||(t[0]=e=>{this.device=e})}),(0,o.Wm)(d,{"name-of-group":"Scale"},{objects:(0,o.w5)((()=>[((0,o.wg)(),(0,o.j4)(s,{key:this.forceRerender,"list-of-variants":this.scales,"command-object":this.touch_me_commands_data.Scale},null,8,["list-of-variants","command-object"]))])),_:1}),(0,o.Wm)(d,{"name-of-group":"Key"},{objects:(0,o.w5)((()=>[((0,o.wg)(),(0,o.j4)(c,{"command-label":"",key:this.forceRerender,"command-object":this.touch_me_commands_data.Key},null,8,["command-object"]))])),_:1}),(0,o.Wm)(d,{"name-of-group":"Velocity"},{objects:(0,o.w5)((()=>[(0,o._)("div",mt,[(0,o._)("div",lt,[st,(0,o.Wm)(r,{id:"humanizeSwitch","model-value":this.isHumanize,"onUpdate:modelValue":t[1]||(t[1]=e=>{this.isHumanize=e,i.forceRerender++})},null,8,["model-value"])]),(0,o._)("div",dt,[ct,(0,o.Wm)(r,{id:"velocityDisableSwitch","model-value":this.isMute,"onUpdate:modelValue":t[2]||(t[2]=e=>{this.isMute=e})},null,8,["model-value"])])]),this.isMute?(0,o.kq)("",!0):((0,o.wg)(),(0,o.iD)("div",rt,[this.isHumanize?((0,o.wg)(),(0,o.iD)("div",ht,[((0,o.wg)(),(0,o.j4)(u,{key:this.forceRerender,"max-command-object":this.touch_me_commands_data.maxVelocity,"min-command-object":this.touch_me_commands_data.minVelocity},null,8,["max-command-object","min-command-object"]))])):((0,o.wg)(),(0,o.iD)("div",ut,[((0,o.wg)(),(0,o.j4)(c,{key:this.forceRerender,"command-object":this.touch_me_commands_data.maxVelocity},null,8,["command-object"]))]))]))])),_:1}),(0,o._)("button",{onClick:t[3]||(t[3]=(...e)=>this.sendData&&this.sendData(...e)),disabled:null==this.device,class:"btn btn-primary mb-1",style:{width:"70%"}},"Send",8,_t),(0,o._)("button",{onClick:t[4]||(t[4]=(...e)=>this.returnDefault&&this.returnDefault(...e)),class:"btn btn-primary mb-1",style:{width:"70%"}},"Set Default"),(0,o._)("button",{onClick:t[5]||(t[5]=(...e)=>this.createPreset&&this.createPreset(...e)),class:"btn btn-primary mb-1",style:{width:"70%"}},"Create Preset"),(0,o.Wm)(h,{name:"Drop Preset Here",onGet_drop:t[6]||(t[6]=e=>m.loadDataFromPreset(e))})],64)}var pt={components:{SliderRangeCommand:$e,SwitchComponent:tt,FileDropArea:Pe,SliderCommand:K,DeviceSelector:ve,GroupOfCommands:te,SelectCommand:se},props:{id:{type:String,required:!0}},methods:{sendData(){this.device.send([240,11,5,this.isMute?1:0,247]),this.device.send([240,11,4,this.isHumanize?1:0,247]);for(let e in this.touch_me_commands_data)this.touch_me_commands_data[e].sendToMidi(this.device),q(100);this.saveData()},saveData(){let e=[];for(let a in this.touch_me_commands_data)e.push(this.touch_me_commands_data[a].toString());let t={commands:e};localStorage.setItem(this.id,JSON.stringify(t))},loadData(){null===localStorage.getItem(this.id)&&this.saveData();for(let e of JSON.parse(localStorage.getItem(this.id)).commands){let t=JSON.parse(e);this.touch_me_commands_data[t.name].set_value(t.value)}},returnDefault(){this.randomPlantVelocity=!1,this.randomLightVelocity=!1;for(let e in this.touch_me_commands_data)this.touch_me_commands_data[e].set_default();this.saveData(),this.forceRerender+=1,this.device.send([240,11,7,247])},loadDataFromPreset(e){for(let t of JSON.parse(e).commands){let e=JSON.parse(t);this.touch_me_commands_data[e.name].set_value(e.value)}this.forceRerender+=1},createPreset(){let e=[];for(let n in this.touch_me_commands_data)e.push(this.touch_me_commands_data[n].toString());let t={commands:e},a=new File([JSON.stringify(t)],"touchme_preset.txt",{type:"text/plain;charset=utf-8"});(0,Me.p)(a,"touchme_preset.txt")}},data(){return{scales:["Major","Minor","Chrom","Dorian","Mixolydian","Lydian","Wholetone","Minblues","Minpen","Majpen","Diminished"],device:null,forceRerender:0,isHumanize:!1,isMute:!1,touch_me_commands_data:{Scale:new J({name:"Scale",number_command:0,default_value:0,max_value:11}),Key:new J({name:"Key",number_command:1,default_value:1,min_value:1,max_value:12}),maxVelocity:new J({name:"maxVelocity",number_command:2,default_value:70,max_value:127}),minVelocity:new J({name:"minVelocity",number_command:3,default_value:50,max_value:127})}}},created(){null===localStorage.getItem(this.id)?this.saveData():this.loadData()}};const bt=(0,b.Z)(pt,[["render",vt]]);var ft=bt;const gt=[{path:"/"},{path:"/biotron",component:it,props:{id:"BiotronWebMidiId"}},{path:"/touchme",component:ft,props:{id:"TouchmeWebMidiId"}}],yt=(0,i.p7)({history:(0,i.PO)(),linkActiveClass:"active",routes:gt});(0,n.ri)(g).use(yt).mount("#app")}},t={};function a(n){var i=t[n];if(void 0!==i)return i.exports;var o=t[n]={exports:{}};return e[n].call(o.exports,o,o.exports,a),o.exports}a.m=e,function(){var e=[];a.O=function(t,n,i,o){if(!n){var m=1/0;for(c=0;c<e.length;c++){n=e[c][0],i=e[c][1],o=e[c][2];for(var l=!0,s=0;s<n.length;s++)(!1&o||m>=o)&&Object.keys(a.O).every((function(e){return a.O[e](n[s])}))?n.splice(s--,1):(l=!1,o<m&&(m=o));if(l){e.splice(c--,1);var d=i();void 0!==d&&(t=d)}}return t}o=o||0;for(var c=e.length;c>0&&e[c-1][2]>o;c--)e[c]=e[c-1];e[c]=[n,i,o]}}(),function(){a.d=function(e,t){for(var n in t)a.o(t,n)&&!a.o(e,n)&&Object.defineProperty(e,n,{enumerable:!0,get:t[n]})}}(),function(){a.g=function(){if("object"===typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"===typeof window)return window}}()}(),function(){a.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)}}(),function(){a.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}}(),function(){var e={143:0};a.O.j=function(t){return 0===e[t]};var t=function(t,n){var i,o,m=n[0],l=n[1],s=n[2],d=0;if(m.some((function(t){return 0!==e[t]}))){for(i in l)a.o(l,i)&&(a.m[i]=l[i]);if(s)var c=s(a)}for(t&&t(n);d<m.length;d++)o=m[d],a.o(e,o)&&e[o]&&e[o][0](),e[o]=0;return a.O(c)},n=self["webpackChunkWebMidiPlaytronica"]=self["webpackChunkWebMidiPlaytronica"]||[];n.forEach(t.bind(null,0)),n.push=t.bind(null,n.push.bind(n))}();var n=a.O(void 0,[998],(function(){return a(7957)}));n=a.O(n)})();
//# sourceMappingURL=app.392fce12.js.map