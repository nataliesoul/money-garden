import {FlexLayout} from 'SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout';
import {FlexItem} from 'SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem';
import {FlexAlign,FlexAlignSelf,FlexDirection,FlexJustify} from 'SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes';
import {StateName} from 'SpectaclesUIKit.lspkg/Scripts/Components/Element';
import {RoundedRectangleVisual,RoundedRectangleVisualState} from 'SpectaclesUIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangleVisual';
import {RoundedRectangle,RoundedRectBlendMode,GradientParameters} from 'SpectaclesUIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangle';
import {BackPlate} from 'SpectaclesUIKit.lspkg/Scripts/BackPlate';
import {Button} from 'SpectaclesUIKit.lspkg/Scripts/Components/Button/Button';
import {ElementContent} from 'SpectaclesUIKit.lspkg/Scripts/Components/Content/ElementContent';
import Event from 'SpectaclesInteractionKit.lspkg/Utils/Event';
const FONT=requireAsset('../Fonts/Inter.ttf') as Font;
const PLAY=requireAsset('../Icons/play_arrow.png') as Texture;
const INFO=requireAsset('../Icons/info.png') as Texture;
const SOUND=requireAsset('../Icons/volume_up.png') as Texture;
const CENTER=requireAsset('../Icons/center_focus_strong.png') as Texture;
type Role='title'|'body'|'caption'|'button'|'value';
const TYPE_SCALE={title:{size:86,weight:700},body:{size:39,weight:500},caption:{size:38,weight:500},button:{size:39,weight:600},value:{size:48,weight:700}};
function applyTextRole(t:Text,role:Role,scale=1):void {t.size=TYPE_SCALE[role].size*scale;(t as Text & {weight?:number}).weight=TYPE_SCALE[role].weight;}
interface ActionView {object:SceneObject;button:Button;item:FlexItem;layout:FlexLayout|null;text?:Text;content?:ElementContent;}
export interface GardenAction {id:string;label:string;icon?:'play'|'info'|'sound'|'center';}
@component
export class MoneyGardenPanelUI extends BaseScriptComponent {
 @ui.label('Money Garden / Botanical field guide')
 @ui.separator
 @input @hint('0 lesson guide, 1 action deck, 2 spatial labels, 3 recovery dock') mode:number=0;
 @input @hint('Panel width in centimeters') width:number=48;
 @input @hint('Panel height in centimeters') height:number=17;
 @input @hint('Bright primary text') @widget(new ColorWidget()) ink:vec4=new vec4(.94,1,.97,1);
 @ui.group_start('Field guide theme')
 @input @hint('Deep teal card surface') @widget(new ColorWidget()) panelTint:vec4=new vec4(.015,.32,.30,1);
 @input @hint('Bright mint outlines and active chapter markers') @widget(new ColorWidget()) mint:vec4=new vec4(.42,.96,.75,1);
 @input @hint('Warm gold primary-action and note accents') @widget(new ColorWidget()) gold:vec4=new vec4(1,.76,.34,1);
 @input @hint('Rounded card corners in centimeters') @widget(new SliderWidget(.4,2,.1)) cornerRadius:number=1.15;
 @input @hint('Typography scale around the readable base sizes') @widget(new SliderWidget(.95,1.15,.05)) typeScale:number=1;
 @ui.group_end
 public onAction=new Event<string>();
 private title!:Text;private body!:Text;private status!:Text;private progress!:Text;
 private actionHost!:SceneObject;private actionPane:SceneObject|null=null;private parking!:SceneObject;
 private actionViews:{[id:string]:ActionView}={};private rebuildEvent!:DelayedCallbackEvent;private rebuildQueued=false;private renderedActions='';
 private labelTexts:Text[]=[];private labelHeadings:Text[]=[];private chapterFaces:RoundedRectangle[]=[];private chapterTexts:Text[]=[];private chapter=-1;private chapterComplete=false;private panelFace:RoundedRectangle|null=null;private backPlate:BackPlate|null=null;private labelCards:SceneObject[]=[];private ready=false;private pendingActions:GardenAction[][]=[];private pendingLabels:string[]=[];
 private pendingText=['Money Garden','Grow a plan. Watch the consequences.','','BUDGET   /   TAXES   /   LOGIC'];
 onAwake():void {
  this.rebuildEvent=this.createEvent('DelayedCallbackEvent');this.rebuildEvent.bind(()=>{this.rebuildQueued=false;this.rebuildActions();});
  this.createEvent('OnDestroyEvent').bind(()=>this.rebuildEvent.cancel());
  this.createEvent('OnStartEvent').bind(()=>this.build());
 }
 private build():void {
  this.sceneObject.createComponent('Component.Canvas');
  if(this.mode!==2){const plate=this.sceneObject.createComponent(BackPlate.getTypeName()) as BackPlate;plate.size=new vec2(this.width,this.height);plate.style='simple';this.backPlate=plate;this.panelFace=this.surface(this.sceneObject,'FieldGuideSurface',this.width,this.height,this.panelTint,this.tint(this.mint,.8),new vec3(0,0,.52),this.cornerRadius);this.panelFace.gradient=true;this.panelFace.setBackgroundGradient(this.gradient(this.tint(this.panelTint,1.45),this.panelTint));}
  const content=this.obj(this.sceneObject,'Content',new vec3(0,0,.6));
  if(this.mode===0){
   const col=this.flexColumn(content,this.width,this.height,{gap:.35,padY:.7,padX:1.5,align:FlexAlign.Stretch});
   this.flexChild(col,{w:this.width-3,h:1.7},holder=>this.buildChapters(holder));
   this.progress=this.textRow(col,'caption',1.2,'Progress');this.progress.textFill.color=this.gold;
   this.title=this.textRow(col,'title',3,'LessonTitle');
   this.body=this.textRow(col,'body',4.5,'Instruction');
   this.flexChild(col,{w:this.width-3,h:3.3},holder=>{
    this.surface(holder,'FieldNote',this.width-3,3.3,this.tint(this.panelTint,.62),this.tint(this.gold,.85),new vec3(0,0,-.08),.55);
    const text=this.obj(holder,'Feedback',new vec3(0,0,.1));this.status=this.makeText(text,'caption',this.width-5,3.1);
   });
  } else if(this.mode===2){
   const row=this.flexRow(content,this.width,this.height,{gap:1,justify:FlexJustify.Center,align:FlexAlign.Center});
   for(let i=0;i<3;i++)this.flexChild(row,{w:(this.width-2)/3,h:this.height},child=>{
    child.name='StationLabel'+i;const card=this.obj(child,'Plaque');this.labelCards.push(card);const w=(this.width-2)/3;
    this.surface(card,'LabelBacking',w,this.height,this.panelTint,i===1?this.gold:this.mint,new vec3(0,0,-.15),.65);
    const labelCol=this.flexColumn(this.obj(card,'LabelContent',new vec3(0,0,.1)),w-.8,this.height,{gap:.15,padY:.35,justify:FlexJustify.Center,align:FlexAlign.Stretch});
    // Value is first in hierarchy so existing read-only station checks read the meaningful amount/state.
    const valueHolder=this.flexChild(labelCol,{w:w-1,h:2.5},o=>{o.name='LabelText';this.labelTexts.push(this.makeText(o,'value',w-1,2.5));});
    (valueHolder.getComponent(FlexItem.getTypeName()) as FlexItem).order=1;
    const headHolder=this.flexChild(labelCol,{w:w-1,h:1.3},o=>{o.name='StationHeading';const t=this.makeText(o,'caption',w-1,1.3);t.textFill.color=this.mint;this.labelHeadings.push(t);});
    (headHolder.getComponent(FlexItem.getTypeName()) as FlexItem).order=0;
   });
  } else {this.actionHost=content;this.parking=this.obj(this.sceneObject,'InactiveActions');this.parking.enabled=false;}
  this.ready=true;this.setCopy(...this.pendingText as [string,string,string,string]);this.setActions(this.pendingActions);this.setLabels(this.pendingLabels);this.setChapter(this.chapter,this.chapterComplete);
 }
 setCopy(title:string,body:string,status:string,progress:string):void {this.pendingText=[title,body,status,progress];if(!this.ready||this.mode!==0)return;this.title.text=title;this.body.text=body;this.status.text=status;this.progress.text=progress;}
 setLabels(labels:string[]):void {this.pendingLabels=labels.slice();for(let i=0;i<this.labelTexts.length;i++){const parts=(labels[i]||'').split('\n');this.labelHeadings[i].text=parts.length>1?parts[0]:'';this.labelTexts[i].text=parts.length>1?parts.slice(1).join('\n'):parts[0];this.labelCards[i].enabled=!!labels[i];}}
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
  const actionHeight=Math.min(this.height,rows.length*5.2+Math.max(0,rows.length-1)+1.2);if(this.panelFace)this.panelFace.size=new vec2(this.width,actionHeight);if(this.backPlate)this.backPlate.size=new vec2(this.width,actionHeight);
  const col=this.flexColumn(this.actionPane,this.width,actionHeight,{gap:1,padY:.6,padX:1,justify:FlexJustify.Center,align:FlexAlign.Center});
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
   const b=child.createComponent(Button.getTypeName()) as Button;b.size=new vec3(w,5.2,1);b.visual=this.buttonVisual(child,a);b.initialize();
   const label=this.obj(child,'Label',new vec3(0,0,.12));v={object:child,button:b,item,layout:null};
   v.text=this.makeText(label,'button',w-.8,4.3);
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
 setChapter(chapter:number,complete=false):void {this.chapter=chapter;this.chapterComplete=complete;this.chapterFaces.forEach((face,i)=>{const active=i===chapter,done=complete||i<chapter;face.backgroundColor=active?this.tint(this.mint,.2):this.tint(this.panelTint,.72);face.borderColor=active?this.gold:done?this.mint:this.tint(this.mint,.65);this.chapterTexts[i].textFill.color=active?this.ink:done?this.mint:this.tint(this.ink,.78);});}
 private buildChapters(parent:SceneObject):void {
  const row=this.flexRow(parent,this.width-3,1.7,{gap:.6,align:FlexAlign.Center});
  this.flexChild(row,{w:2.5,h:1.7},holder=>{
   holder.getTransform().setLocalScale(new vec3(1.25,1.25,1));
   this.surface(holder,'Stem',.12,1.25,this.mint,this.mint,new vec3(0,-.1,0),.06);
   [-1,1].forEach(side=>{const leaf=this.obj(holder,'Leaf'+side,new vec3(side*.37,.28,.02));leaf.getTransform().setLocalRotation(quat.angleAxis(side*-.55,vec3.forward()));this.surface(leaf,'LeafBlade',1.05,.5,side<0?this.gold:this.mint,side<0?this.gold:this.mint,vec3.zero(),.25);});
  });
  const w=(this.width-7.3)/3;
  ['01 BUDGET','02 TAXES','03 LOGIC'].forEach(label=>this.flexChild(row,{w,h:1.7},holder=>{
   this.chapterFaces.push(this.surface(holder,'ChapterTab',w,1.7,this.panelTint,this.mint,new vec3(0,0,-.05),.4));
   const t=this.makeText(this.obj(holder,'ChapterLabel',new vec3(0,0,.1)),'caption',w-.4,1.5);t.text=label;this.chapterTexts.push(t);
  }));
 }
 private tint(c:vec4,f:number):vec4 {return new vec4(Math.min(1,c.x*f),Math.min(1,c.y*f),Math.min(1,c.z*f),1);}
 private gradient(top:vec4,bottom:vec4):GradientParameters {return {enabled:true,type:'Linear',start:new vec2(-1,1),end:new vec2(1,-1),stop0:{enabled:true,percent:0,color:top},stop1:{enabled:true,percent:1,color:bottom}};}
 private surface(parent:SceneObject,name:string,w:number,h:number,color:vec4,border:vec4,p:vec3,r:number):RoundedRectangle {
  const o=this.obj(parent,name,p),shape=o.createComponent(RoundedRectangle.getTypeName()) as RoundedRectangle;shape.size=new vec2(w,h);shape.cornerRadius=r;shape.gradient=false;shape.backgroundColor=color;shape.opacity=1;shape.blendMode=RoundedRectBlendMode.Disabled;shape.border=true;shape.borderType='Color';shape.borderSize=.14;shape.borderColor=border;shape.initialize();return shape;
 }
 private buttonVisual(parent:SceneObject,a:GardenAction):RoundedRectangleVisual {
  // Supported UIKit custom visual override; retain Button's SIK lifecycle and hit target.
  const utility=this.height<7||this.mode===3,primary=!utility&&a.icon==='play';
  const fill=primary?new vec4(.02,.40,.30,1):utility?this.tint(this.panelTint,.65):this.tint(this.panelTint,1.4);
  const edge=primary?this.gold:utility?this.tint(this.mint,.8):this.mint;
  const state=(color:vec4,border:vec4,size:number):RoundedRectangleVisualState=>({baseType:'Gradient',baseGradient:this.gradient(this.tint(color,1.22),color),hasBorder:true,borderType:'Color',borderColor:border,borderSize:size,shouldScale:false});
  const style:Partial<Record<StateName,RoundedRectangleVisualState>>={
   default:state(fill,edge,primary?.2:.13),hovered:state(this.tint(fill,1.5),this.mint,.22),
   triggered:state(this.tint(fill,.74),this.gold,.27),inactive:state(this.tint(this.panelTint,.6),this.tint(this.mint,.2),.045),
   toggledDefault:state(fill,this.gold,.2),toggledHovered:state(this.tint(fill,1.5),this.mint,.22),toggledTriggered:state(this.tint(fill,.74),this.gold,.27)
  };
  const visual=new RoundedRectangleVisual({sceneObject:parent,style,transparent:false});visual.cornerRadius=utility?.7:.95;return visual;
 }
 private makeText(parent:SceneObject,role:Role,w:number,h:number):Text {
  const t=parent.createComponent('Component.Text') as Text;t.font=FONT;t.depthTest=true;t.textFill.color=this.ink;applyTextRole(t,role,this.typeScale);
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
