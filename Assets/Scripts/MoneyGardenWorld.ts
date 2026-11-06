import {Interactable} from 'SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable';
import {InteractableManipulation} from 'SpectaclesInteractionKit.lspkg/Components/Interaction/InteractableManipulation/InteractableManipulation';
import Event from 'SpectaclesInteractionKit.lspkg/Utils/Event';
import {MoneyGardenState} from './MoneyGardenState';
const PLANT=requireAsset('../GeneratedMeshes/MoneyGardenPlant.glb') as ObjectPrefab;
type Color=[number,number,number,number];
const IVORY:Color=[.87,.87,.71,1],MINT:Color=[.27,.94,.7,1],GOLD:Color=[1,.69,.22,1],LILAC:Color=[.72,.55,1,1],TEAL:Color=[.15,.54,.51,1];
@component
export class MoneyGardenWorld extends BaseScriptComponent {
 @input @hint('Vertex-color material') material!:Material;
 @input @hint('Authored board surface anchor') board!:SceneObject;
 @input @hint('Budget station group') budget!:SceneObject;
 @input @hint('Essentials destination') essentials!:SceneObject;
 @input @hint('Savings reservoir destination') savings!:SceneObject;
 @input @hint('Discretionary destination') wants!:SceneObject;
 @input @hint('Draggable income token at unit scale') source!:SceneObject;
 @input @hint('Goal plant root') plant!:SceneObject;
 @input @hint('Tax layers group') taxes!:SceneObject;
 @input @hint('Logic paths group') logic!:SceneObject;
 @input @hint('Logic gate position') gate!:SceneObject;
 @input @hint('Debug the token hit zone') debugColliders:boolean=false;
 public onDrop=new Event<number>(); public ready=false;
 private stacks:SceneObject[]=[];private layers:SceneObject[]=[];private taxCoins!:SceneObject;
 private aOn!:SceneObject;private aOff!:SceneObject;private bOn!:SceneObject;private bOff!:SceneObject;
 private gateBar!:SceneObject;private pulse!:SceneObject;private pulseA!:SceneObject;private pulseB!:SceneObject;private inputA=false;private inputB=false;private pulseStart=-10;private passed=false;
 private time=0;private dragging=false;private lastModel='';private stage='welcome';private plantVisual!:SceneObject;private plantScale=1;
 private allocation=[0,0,0];private interactive=true;private sourceCollider!:ColliderComponent;private sourceInteract!:Interactable;private sourceDrag!:InteractableManipulation;
 private flightMeshes:SceneObject[]=[];private flights:{object:SceneObject;start:number;from:vec3;to:vec3;coin:SceneObject|null}[]=[];private shownReserve=0;private portions=[0,0,0];
 onAwake():void {this.createEvent('OnStartEvent').bind(()=>this.build());this.createEvent('UpdateEvent').bind(()=>this.update());}
 private build():void {
  if(!this.material||!this.board||!this.source)return;
  this.lathe(this.board,'Tabletop',[[0,-.8],[1,-.8],[1.02,-.4],[1.02,0],[1,.35],[0,.35]],TEAL,24,13);
  this.lathe(this.board,'IvoryRim',[[1,.05],[1.015,.25],[1,.5],[.965,.5],[.965,.3]],IVORY,24,13);
  [this.essentials,this.savings,this.wants].forEach((slot,i)=>{this.lathe(slot,'DestinationBowl',[[0,0],[5.7,0],[6,.5],[6,1.5],[5.6,1.7],[5.1,.5],[0,.5]],i===0?IVORY:i===1?MINT:LILAC);this.stacks.push(this.obj(slot,'AllocatedCredits'));});
  const visual=this.lathe(this.source,'CreditToken',[[0,-.6],[2.8,-.6],[3,-.4],[3,.4],[2.8,.6],[0,.6]],GOLD);visual.getTransform().setLocalRotation(quat.fromEulerAngles(Math.PI/2,0,0));
  const col=this.source.createComponent('Physics.ColliderComponent');const shape=Shape.createBoxShape();shape.size=new vec3(7,7,4);col.shape=shape;col.debugDrawEnabled=this.debugColliders;this.sourceCollider=col;
  const interact=this.source.createComponent(Interactable.getTypeName()) as Interactable;interact.targetingMode=3;this.sourceInteract=interact;
  const drag=this.source.createComponent(InteractableManipulation.getTypeName()) as InteractableManipulation;
  this.sourceDrag=drag;drag.setCanRotate(false);drag.setCanScale(false);drag.enableStretchZ=false;
  drag.onManipulationStart.add(()=>{this.dragging=true;});
  drag.onManipulationEnd.add(()=>{this.dragging=false;const p=this.source.getTransform().getLocalPosition();let closest=-1,dist=1;[this.essentials,this.savings,this.wants].forEach((o,i)=>{const q=o.getTransform().getLocalPosition();const d=((p.x-q.x)/7)**2+((p.y-q.y-3)/8)**2+((p.z-q.z)/14)**2;if(d<dist){dist=d;closest=i;}});this.resetSource();this.onDrop.invoke(closest);});
  for(let i=0;i<12;i++){const token=this.lathe(this.budget,'MovingCredit'+i,[[0,-.2],[2.8,-.2],[2.8,.2],[0,.2]],GOLD);token.enabled=false;this.flightMeshes.push(token);}
  this.plantVisual=this.obj(this.plant,'PlantGrowth');PLANT.instantiate(this.plantVisual);
  for(let i=0;i<3;i++) {const o=this.obj(this.taxes,'IncomeLayer'+i,new vec3(-15+i*15,1+i*2,0));this.lathe(o,'LayerTray',[[0,0],[5.8,0],[6,.25],[6,.7],[5.6,.8],[0,.8]],[...([MINT,GOLD,LILAC][i])] as Color);this.layers.push(this.obj(o,'TaxableAmount'));}
  this.taxCoins=this.obj(this.taxes,'IncomeKey',new vec3(0,0,8));
  for(const x of [-9,9]){const path=this.lathe(this.logic,'InputPath'+x,[[0,-6],[.28,-6],[.28,6],[0,6]],MINT);path.getTransform().setLocalPosition(new vec3(x,1,1));path.getTransform().setLocalRotation(quat.fromEulerAngles(0,0,Math.PI/2));}
  for(const [x,name] of [[-15,'A'],[15,'B']] as [number,string][]){const root=this.obj(this.logic,'Condition'+name,new vec3(x,2,1));const on=this.lathe(root,'TRUE',[[0,0],[2.5,0],[3,1],[2.5,3],[0,4]],MINT);const off=this.lathe(root,'FALSE',[[0,0],[2.5,0],[3,1],[2.5,3],[0,4]],LILAC);if(name==='A'){this.aOn=on;this.aOff=off;}else{this.bOn=on;this.bOff=off;}}
  [-4,4].forEach(x=>this.lathe(this.obj(this.gate,'Post',new vec3(x,0,0)),'PostMesh',[[1,0],[1,8]],IVORY));
  this.gateBar=this.obj(this.gate,'GateDoor',new vec3(0,3,0));const bar=this.lathe(this.gateBar,'GateBarMesh',[[.65,-4],[.65,4]],GOLD);bar.getTransform().setLocalRotation(quat.fromEulerAngles(0,0,Math.PI/2));
  this.pulse=this.lathe(this.logic,'DecisionPulse',[[0,-.8],[.9,0],[0,.8]],GOLD);this.pulse.enabled=false;
  this.pulseA=this.lathe(this.logic,'InputPulseA',[[0,-.7],[.8,0],[0,.7]],GOLD);this.pulseB=this.lathe(this.logic,'InputPulseB',[[0,-.7],[.8,0],[0,.7]],GOLD);this.pulseA.enabled=false;this.pulseB.enabled=false;
  const output=this.lathe(this.logic,'OutputPath',[[.25,-5],[.25,5]],MINT);output.getTransform().setLocalRotation(quat.fromEulerAngles(Math.PI/2,0,0));output.getTransform().setLocalPosition(new vec3(0,1,6));
  this.ready=true;
 }
 private resetSource():void {this.source.getTransform().setLocalPosition(new vec3(0,11,11));this.source.getTransform().setLocalRotation(quat.quatIdentity());this.source.getTransform().setLocalScale(vec3.one());}
 show(s:MoneyGardenState,interactive=true):void {
  if(!this.ready)return;this.stage=s.stage;const budget=['practice','budget','budgetPredict','month'].indexOf(s.stage)>=0;
  this.budget.enabled=budget;this.savings.enabled=s.stage!=='practice';this.wants.enabled=s.stage!=='practice';this.taxes.enabled=s.stage==='tax'||s.stage==='taxPredict'||s.stage==='taxGuided';this.logic.enabled=s.stage==='logic'||s.stage==='logicResult'||s.stage==='logicGuided';
  this.source.enabled=(s.stage==='practice'&&s.history.length===0)||(s.stage==='budget'&&s.remaining>0);
  this.sourceCollider.enabled=interactive;this.sourceInteract.enabled=interactive;this.sourceDrag.enabled=interactive;
  this.plant.enabled=!this.taxes.enabled&&!this.logic.enabled;
  this.plantScale=s.stage==='welcome'||s.stage==='summary'?1:.3+.7*Math.min(1,(s.stage==='month'?s.savingsAfter:s.allocated[1])/300);
  const key=s.snapshot()+':'+interactive;if(key===this.lastModel)return;this.lastModel=key;
  this.clearFlights();if(this.interactive!==interactive){this.allocation=[0,0,0];this.shownReserve=0;this.portions=[0,0,0];}this.interactive=interactive;
  this.stacks.forEach((o,i)=>this.coins(o,(s.stage==='month'&&i===1?s.savingsAfter:s.allocated[i])/100,GOLD));
  if(s.stage==='practice'||s.stage==='budget'){
   [this.essentials,this.savings,this.wants].forEach((slot,bin)=>{const before=Math.max(0,this.allocation[bin]/100),after=s.allocated[bin]/100,p=slot.getTransform().getLocalPosition();
    for(let i=before;i<after;i++){const coin=this.stacks[bin].getChild(i);coin.enabled=false;this.fly(new vec3(0,11,11),new vec3(p.x,.8+i*.9,p.z),coin);}
   });
  }else if(s.stage==='month'&&this.shownReserve>s.savingsAfter){const p=this.savings.getTransform().getLocalPosition();for(let i=s.savingsAfter/100;i<this.shownReserve/100;i++)this.fly(new vec3(p.x,.8+i*.9,p.z),new vec3(0,-3,18),null);}
  this.shownReserve=s.stage==='month'?s.savingsAfter:s.allocated[1];this.allocation=s.allocated.slice();
  if(s.stage!=='logicResult'&&!(s.stage==='logicGuided'&&s.logicGuidedDone)){this.pulseStart=-10;this.pulse.enabled=false;this.pulseA.enabled=false;this.pulseB.enabled=false;}
  const portions=[Math.min(s.income,1000),Math.min(Math.max(s.income-1000,0),1000),Math.max(s.income-2000,0)];
  this.layers.forEach((o,i)=>{while(o.getChildrenCount())o.getChild(0).destroy();const portion=portions[i];o.getTransform().setLocalScale(new vec3(1,portion>0?Math.max(.001,this.portions[i]/portion):1,1));const due=portion*[0,.1,.2][i],kept=portion-due;const unit=.003;
   if(kept>0)this.lathe(o,'RetainedIncome',[[0,.8],[4.7,.8],[4.7,.8+kept*unit],[0,.8+kept*unit]],MINT);
   if(due>0)this.lathe(o,'TaxPortion',[[0,.8+kept*unit],[4.7,.8+kept*unit],[4.7,.8+portion*unit],[0,.8+portion*unit]],GOLD);
  });
  this.portions=portions;this.inputA=s.a;this.inputB=s.b;
  this.aOn.enabled=s.a;this.aOff.enabled=!s.a;this.bOn.enabled=s.b;this.bOff.enabled=!s.b;
  this.passed=(s.stage==='logicResult'||s.stage==='logicGuided'&&s.logicGuidedDone)&&s.gate;
 }
 runPulse():void {this.pulseStart=this.time;this.pulse.enabled=true;}
 private update():void {if(!this.ready)return;this.time+=getDeltaTime();const dt=getDeltaTime();const growth=this.plantVisual.getTransform().getLocalScale().x;const g=growth+(this.plantScale-growth)*Math.min(1,dt*4);this.plantVisual.getTransform().setLocalScale(new vec3(g,g,g));
  this.flights.forEach(f=>{const u=(this.time-f.start)/.65;if(u<0){f.object.enabled=false;return;}if(u>=1){f.object.enabled=false;if(f.coin&&!isNull(f.coin))f.coin.enabled=true;return;}f.object.enabled=true;const p=vec3.lerp(f.from,f.to,u);p.y+=Math.sin(u*Math.PI)*5;f.object.getTransform().setLocalPosition(p);});
  this.layers.forEach(layer=>{const t=layer.getTransform(),v=t.getLocalScale().y;t.setLocalScale(new vec3(1,v+(1-v)*Math.min(1,dt*6),1));});
  const t=this.time-this.pulseStart;const incoming=t>=0&&t<1.2;
  this.pulseA.enabled=incoming&&this.inputA;this.pulseB.enabled=incoming&&this.inputB;
  if(incoming){const u=Math.min(1,t/1.2);this.pulseA.getTransform().setLocalPosition(new vec3(-15+15*u,4,1));this.pulseB.getTransform().setLocalPosition(new vec3(15-15*u,4,1));}
  this.pulse.enabled=t>=1.2&&t<2.6&&this.passed;
  if(this.pulse.enabled)this.pulse.getTransform().setLocalPosition(new vec3(0,3,1+(t-1.2)/1.4*10));
  const target=this.passed?8:3;const tr=this.gateBar.getTransform(),p=tr.getLocalPosition();tr.setLocalPosition(new vec3(0,p.y+(target-p.y)*Math.min(1,dt*6),0));if(!this.dragging&&this.source.enabled)this.source.getTransform().setLocalPosition(new vec3(0,11+Math.sin(this.time*1.7)*.3,11));}
 private clearFlights():void {this.flights.forEach(f=>{f.object.enabled=false;if(f.coin&&!isNull(f.coin))f.coin.enabled=true;});this.flights=[];}
 private fly(from:vec3,to:vec3,coin:SceneObject|null):void {const i=this.flights.length;if(i>=this.flightMeshes.length){if(coin)coin.enabled=true;return;}this.flights.push({object:this.flightMeshes[i],start:this.time+i*.08,from,to,coin});}
 private coins(parent:SceneObject,count:number,color:Color,r=2.9,step=.9):void {
  while(parent.getChildrenCount())parent.getChild(0).destroy();
  for(let i=0;i<Math.round(count);i++){
   const coin=this.obj(parent,'Credit'+i,new vec3(0,.8+i*step,0));
   this.lathe(coin,'CoinMesh',[[0,0],[r,0],[r+.1,.12],[r,.4],[0,.4]],color);
   this.lathe(coin,'CoinEdge',[[r+.11,.035],[r+.11,.145]],[.42,.25,.07,1]);
  }
 }
 private obj(parent:SceneObject,name:string,p?:vec3):SceneObject {const o=global.scene.createSceneObject(name);o.setParent(parent);if(p)o.getTransform().setLocalPosition(p);return o;}
 private lathe(parent:SceneObject,name:string,profile:number[][],color:Color,sx=1,sz=1):SceneObject {
  const o=this.obj(parent,name),b=new MeshBuilder([{name:'position',components:3},{name:'normal',components:3,normalized:true},{name:'color',components:4}]);b.topology=MeshTopology.Triangles;b.indexType=MeshIndexType.UInt16;
  const n=32,P=profile.length,v:number[]=[],idx:number[]=[];
  for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,c=Math.cos(a),s=Math.sin(a);for(let j=0;j<P;j++){const p=profile[j],pr=profile[Math.max(0,j-1)],nx=profile[Math.min(P-1,j+1)],dx=nx[0]-pr[0],dy=nx[1]-pr[1],len=Math.sqrt(dx*dx+dy*dy)||1;v.push(p[0]*c*sx,p[1],p[0]*s*sz,dy/len*c,-dx/len,dy/len*s,...color);}}
  for(let i=0;i<n;i++)for(let j=0;j<P-1;j++){const a=i*P+j,c=(i+1)*P+j;idx.push(a,a+1,c+1,a,c+1,c);}
  b.appendVerticesInterleaved(v);b.appendIndices(idx);b.updateMesh();const rm=o.createComponent('Component.RenderMeshVisual');rm.mesh=b.getMesh();rm.mainMaterial=this.material;return o;
 }
}
