import {FlexLayout} from 'SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout';
import {FlexItem} from 'SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem';
import {FlexAlign,FlexAlignSelf,FlexDirection,FlexJustify} from 'SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes';
import {RoundedRectangle,RoundedRectBlendMode} from 'SpectaclesUIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangle';
import {BackPlate} from 'SpectaclesUIKit.lspkg/Scripts/BackPlate';
import {Button} from 'SpectaclesUIKit.lspkg/Scripts/Components/Button/Button';
import {ElementContent} from 'SpectaclesUIKit.lspkg/Scripts/Components/Content/ElementContent';
import Event from 'SpectaclesInteractionKit.lspkg/Utils/Event';
const FONT=requireAsset('../Fonts/Inter.ttf') as Font;
const PLAY=requireAsset('../Icons/play_arrow.png') as Texture;
const INFO=requireAsset('../Icons/info.png') as Texture;
const SOUND=requireAsset('../Icons/volume_up.png') as Texture;
const CENTER=requireAsset('../Icons/center_focus_strong.png') as Texture;
type Role='title'|'body'|'caption'|'button';
const TYPE_SCALE={title:{size:93,weight:700},body:{size:39,weight:500},caption:{size:38,weight:500},button:{size:39,weight:500}};
function applyTextRole(t:Text,role:Role):void {t.size=TYPE_SCALE[role].size;(t as Text & {weight?:number}).weight=TYPE_SCALE[role].weight;}
interface ActionView {object:SceneObject;button:Button;item:FlexItem;layout:FlexLayout|null;text?:Text;content?:ElementContent;}
export interface GardenAction {id:string;label:string;icon?:'play'|'info'|'sound'|'center';}
@component
export class MoneyGardenPanelUI extends BaseScriptComponent {
 @input @hint('0 lesson guide, 1 action deck, 2 spatial labels, 3 recovery dock') mode:number=0;
 @input @hint('Panel width in centimeters') width:number=48;
 @input @hint('Panel height in centimeters') height:number=17;
 @input @hint('Bright primary text') @widget(new ColorWidget()) ink:vec4=new vec4(.94,1,.97,1);
 public onAction=new Event<string>();
 private title!:Text;private body!:Text;private status!:Text;private progress!:Text;
 private actionHost!:SceneObject;private actionPane:SceneObject|null=null;private parking!:SceneObject;
 private actionViews:{[id:string]:ActionView}={};private rebuildEvent!:DelayedCallbackEvent;private rebuildQueued=false;private renderedActions='';
 private labelTexts:Text[]=[];private labelCards:SceneObject[]=[];private ready=false;private pendingActions:GardenAction[][]=[];private pendingLabels:string[]=[];
 private pendingText=['Money Garden','Grow a plan. Watch the consequences.','','BUDGET   /   TAXES   /   LOGIC'];
 onAwake():void {
  this.rebuildEvent=this.createEvent('DelayedCallbackEvent');this.rebuildEvent.bind(()=>{this.rebuildQueued=false;this.rebuildActions();});
  this.createEvent('OnDestroyEvent').bind(()=>this.rebuildEvent.cancel());
  this.createEvent('OnStartEvent').bind(()=>this.build());
 }
 private build():void {
  this.sceneObject.createComponent('Component.Canvas');
  if(this.mode!==2){const plate=this.sceneObject.createComponent(BackPlate.getTypeName()) as BackPlate;plate.size=new vec2(this.width,this.height);plate.style='default';}
  const content=this.obj(this.sceneObject,'Content',new vec3(0,0,.6));
  if(this.mode===0){
   const col=this.flexColumn(content,this.width,this.height,{gap:.5,padY:1,padX:1.5,align:FlexAlign.Stretch});
   this.progress=this.textRow(col,'caption',1.5,'Progress');
   this.title=this.textRow(col,'title',3.3,'LessonTitle');
   this.body=this.textRow(col,'body',4.5,'Instruction');
   this.status=this.textRow(col,'caption',3.7,'Feedback');
  } else if(this.mode===2){
   const row=this.flexRow(content,this.width,this.height,{gap:1,justify:FlexJustify.Center,align:FlexAlign.Center});
   for(let i=0;i<3;i++)this.flexChild(row,{w:(this.width-2)/3,h:this.height},child=>{
    child.name='StationLabel'+i;const card=this.obj(child,'Plaque');this.labelCards.push(card);
    const backing=this.obj(card,'LabelBacking',new vec3(0,0,-.15));const shape=backing.createComponent(RoundedRectangle.getTypeName()) as RoundedRectangle;
    shape.size=new vec2((this.width-2)/3,this.height);shape.cornerRadius=.45;shape.gradient=false;shape.backgroundColor=new vec4(.045,.16,.17,1);shape.opacity=1;shape.blendMode=RoundedRectBlendMode.Disabled;shape.initialize();
    const text=this.obj(card,'LabelText',new vec3(0,0,.1));this.labelTexts.push(this.makeText(text,'caption',(this.width-2)/3-.6,this.height-.4));
   });
  } else {this.actionHost=content;this.parking=this.obj(this.sceneObject,'InactiveActions');this.parking.enabled=false;}
  this.ready=true;this.setCopy(...this.pendingText as [string,string,string,string]);this.setActions(this.pendingActions);this.setLabels(this.pendingLabels);
 }
 setCopy(title:string,body:string,status:string,progress:string):void {this.pendingText=[title,body,status,progress];if(!this.ready||this.mode!==0)return;this.title.text=title;this.body.text=body;this.status.text=status;this.progress.text=progress;}
 setLabels(labels:string[]):void {this.pendingLabels=labels.slice();for(let i=0;i<this.labelTexts.length;i++){this.labelTexts[i].text=labels[i]||'';this.labelCards[i].enabled=!!labels[i];}}
 setVisible(show:boolean):void {this.sceneObject.enabled=show;}
 setActions(rows:GardenAction[][]):void {
  // Coalesce renders without mutating a target inside its release callback.
  this.pendingActions=rows.map(row=>row.map(a=>({...a})));
  if(!this.ready||!this.actionHost||this.rebuildQueued)return;
  if(JSON.stringify(this.pendingActions)===this.renderedActions)return;
  this.rebuildQueued=true;this.rebuildEvent.reset(.001);
 }
 private rebuildActions():void {
  if(!this.ready||!this.actionHost||isNull(this.actionHost))return;
  const rows=this.pendingActions,key=JSON.stringify(rows);if(key===this.renderedActions)return;
  // Keep each Button/Interactable alive: SIK/LEAF may still hold it through exitHover.
  // Only empty layout wrappers are destroyed. Disabled parked targets cannot be hit.
  Object.keys(this.actionViews).forEach(id=>{const v=this.actionViews[id];v.object.enabled=false;if(v.layout&&!isNull(v.layout))v.layout.removeItems([v.item]);v.layout=null;v.object.setParent(this.parking);});
  if(this.actionPane&&!isNull(this.actionPane))this.actionPane.destroy();
  this.actionPane=this.obj(this.actionHost,'Actions');
  const col=this.flexColumn(this.actionPane,this.width,this.height,{gap:1,padY:.6,padX:1,justify:FlexJustify.Center,align:FlexAlign.Center});
  rows.forEach(actions=>this.flexChild(col,{w:this.width-2,h:5.2},holder=>{
   const row=this.flexRow(holder,this.width-2,5.2,{gap:1,justify:FlexJustify.Center,align:FlexAlign.Center});
   const w=Math.min(22,(this.width-2-(actions.length-1))/Math.max(1,actions.length));
   actions.forEach(a=>this.placeAction(row,a,w));
  }));
  this.renderedActions=key;
 }
 private placeAction(row:SceneObject,a:GardenAction,w:number):void {
  let v=this.actionViews[a.id];
  if(!v){
   const child=this.obj(this.parking,'MG_'+a.id);const item=child.createComponent(FlexItem.getTypeName()) as FlexItem;item.flexShrink=0;
   const b=child.createComponent(Button.getTypeName()) as Button;
   const label=this.obj(child,'Label',new vec3(0,0,.12));v={object:child,button:b,item,layout:null};
   if(a.icon){const ec=label.createComponent(ElementContent.getTypeName()) as ElementContent;ec.textSize=TYPE_SCALE.button.size;ec.leadingIcon={play:PLAY,info:INFO,sound:SOUND,center:CENTER}[a.icon];ec.leadingIconSize=1.5;v.content=ec;}
   else v.text=this.makeText(label,'button',w-.7,4.3);
   this.actionViews[a.id]=v;
   b.onTriggerUp.add(()=>{if(!this.rebuildQueued&&child.enabled)this.onAction.invoke(a.id);});
  }
  v.object.setParent(row);v.object.getTransform().setLocalPosition(new vec3(0,0,.02));v.object.enabled=true;
  v.item.overrideWidth=w;v.item.overrideHeight=5.2;v.button.size=new vec3(w,5.2,1);
  if(v.content){v.content.text=a.label;v.content.sizeOverride=new vec2(w-.8,4.3);}
  if(v.text){v.text.text=a.label;v.text.layoutRect=Rect.create(-(w-.7)/2,(w-.7)/2,-2.15,2.15);}
  const layout=row.getComponent(FlexLayout.getTypeName()) as FlexLayout;v.layout=layout;const current=v;
  layout.onInitialized.add(()=>{if(!isNull(current.item)&&current.layout===layout)layout.addItems([current.item]);});
 }
 private makeText(parent:SceneObject,role:Role,w:number,h:number):Text {
  const t=parent.createComponent('Component.Text') as Text;t.font=FONT;t.depthTest=true;t.textFill.color=this.ink;applyTextRole(t,role);
  t.horizontalAlignment=HorizontalAlignment.Center;t.verticalAlignment=VerticalAlignment.Center;t.horizontalOverflow=HorizontalOverflow.Wrap;t.verticalOverflow=VerticalOverflow.Overflow;t.layoutRect=Rect.create(-w/2,w/2,-h/2,h/2);return t;
 }
 private textRow(parent:SceneObject,role:Role,h:number,name:string):Text {let result!:Text;this.flexChild(parent,{w:this.width-3,h},child=>{child.name=name;result=this.makeText(child,role,this.width-3,h);});return result;}
 private obj(parent:SceneObject,name:string,position?:vec3):SceneObject {const o=global.scene.createSceneObject(name);o.setParent(parent);if(position)o.getTransform().setLocalPosition(position);return o;}
 private liftInZ(o:SceneObject,z:number):void {const t=o.getTransform(),p=t.getLocalPosition();t.setLocalPosition(new vec3(p.x,p.y,p.z+z));}
 private flexColumn(parent:SceneObject,w:number,h:number,opts?:{gap?:number,padY?:number,padX?:number,justify?:FlexJustify,align?:FlexAlign}):SceneObject{return this.makeFlex(parent,FlexDirection.Column,w,h,opts);}
 private flexRow(parent:SceneObject,w:number,h:number,opts?:{gap?:number,padY?:number,padX?:number,justify?:FlexJustify,align?:FlexAlign}):SceneObject{return this.makeFlex(parent,FlexDirection.Row,w,h,opts);}
 private makeFlex(parent:SceneObject,direction:FlexDirection,width:number,height:number,opts?:{gap?:number,padY?:number,padX?:number,justify?:FlexJustify,align?:FlexAlign}):SceneObject {
  const container=this.obj(parent,'Flex');this.liftInZ(container,.02);const f=container.createComponent(FlexLayout.getTypeName()) as FlexLayout;const fi=container.createComponent(FlexItem.getTypeName()) as FlexItem;if(width>0)fi.overrideWidth=width;if(height>0)fi.overrideHeight=height;
  f.onInitialized.add(()=>{f.width=width;f.height=height;f.direction=direction;if(direction===FlexDirection.Row)f.columnGap=opts?.gap??0;else f.rowGap=opts?.gap??0;f.paddingTop=opts?.padY??0;f.paddingBottom=opts?.padY??0;f.paddingLeft=opts?.padX??0;f.paddingRight=opts?.padX??0;f.justifyContent=opts?.justify??FlexJustify.Start;f.alignItems=opts?.align??FlexAlign.Stretch;});return container;
 }
 private flexChild(parent:SceneObject,size:{w?:number,h?:number,grow?:number},builder:(o:SceneObject)=>void):SceneObject {
  const child=this.obj(parent,'Item');this.liftInZ(child,.02);const item=child.createComponent(FlexItem.getTypeName()) as FlexItem;if(size.w&&size.w>0)item.overrideWidth=size.w;if(size.h&&size.h>0)item.overrideHeight=size.h;item.flexGrow=size.grow??0;item.flexShrink=0;builder(child);const f=parent.getComponent(FlexLayout.getTypeName()) as FlexLayout|null;if(f)f.onInitialized.add(()=>{if(!isNull(item))f.addItems([item]);});return child;
 }
}
