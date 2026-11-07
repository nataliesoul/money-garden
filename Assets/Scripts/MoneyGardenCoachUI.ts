// Copyright 2026 Specs Inc.
// SPDX-License-Identifier: Apache-2.0
// Adapted from CLAD AIAssistantUI.ts: imperative transcript UI builder.
// Money Garden additions: existing custom theme, paged text, draft and persistent action deck.
import {MoneyGardenPanelUI,GardenAction} from './MoneyGardenPanelUI';
import {RoundedRectangle,RoundedRectBlendMode} from 'SpectaclesUIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangle';
const FONT=requireAsset('../Fonts/Inter.ttf') as Font;
export interface CoachUI {root:SceneObject;setCopy:(answer:string,question:string,status:string,topic:string)=>void;setActions:(rows:GardenAction[][])=>void;setEditing:(editing:boolean)=>void;}
export function buildUI(parent:SceneObject,onAction:(id:string)=>void):CoachUI {
 const obj=(p:SceneObject,name:string,position:vec3)=>{const o=global.scene.createSceneObject(name);o.setParent(p);o.getTransform().setLocalPosition(position);return o;};
 const root=obj(parent,'MoneyGardenCoach',new vec3(0,0,13));root.createComponent('Component.Canvas');
 const card=obj(root,'CoachCard',new vec3(0,15,0));
 const face=card.createComponent(RoundedRectangle.getTypeName()) as RoundedRectangle;face.size=new vec2(48,30);face.cornerRadius=1.2;face.backgroundColor=new vec4(.015,.27,.26,1);face.blendMode=RoundedRectBlendMode.Disabled;face.opacity=1;face.gradient=false;face.border=true;face.borderSize=.15;face.borderColor=new vec4(.42,.96,.75,1);face.initialize();
 const text=(name:string,y:number,h:number,size:number,color:vec4)=>{const t=obj(card,name,new vec3(0,y,.15)).createComponent('Component.Text') as Text;t.font=FONT;t.size=size;t.textFill.color=color;t.horizontalAlignment=HorizontalAlignment.Left;t.verticalAlignment=VerticalAlignment.Center;t.horizontalOverflow=HorizontalOverflow.Wrap;t.verticalOverflow=VerticalOverflow.Overflow;t.layoutRect=Rect.create(-21.5,21.5,-h/2,h/2);t.depthTest=true;return t;};
 const ink=new vec4(.94,1,.97,1),gold=new vec4(1,.76,.34,1);
 const title=text('CoachTitle',12,3,62,ink);title.text='Money Garden · AI coach';
 const disclosure=text('CoachDisclosure',8.5,3,33,gold);disclosure.text='Your chat + this lesson go to AI when you Send.\nUse fictional amounts; answers can be wrong.';
 const answer=text('CoachAnswer',1.3,10.5,38,ink);
 const draft=text('CoachDraft',-8.2,5,34,new vec4(.65,1,.85,1));
 const status=text('CoachStatus',-13,2,32,gold);
 const deck=obj(root,'CoachActions',new vec3(0,-12.6,0));const actions=deck.createComponent(MoneyGardenPanelUI.getTypeName()) as MoneyGardenPanelUI;actions.mode=1;actions.width=48;actions.height=19.8;actions.panelTint=new vec4(.015,.32,.3,1);actions.onAction.add(onAction);
 root.enabled=false;let editing=false;
 const move=(t:Text,y:number,h:number)=>{t.getSceneObject().getTransform().setLocalPosition(new vec3(0,y,.15));t.layoutRect=Rect.create(-21.5,21.5,-h/2,h/2);};
 return {root,setCopy:(a,d,s,topic)=>{title.text=editing?'Write your question':'AI coach · '+topic;answer.text=a;draft.text=d;status.text=s;},setActions:r=>actions.setActions(r),setEditing:value=>{
  if(value===editing)return;editing=value;
  // Reuse the same card and deck; the keyboard fits inside the coach's original vertical bounds.
  card.getTransform().setLocalPosition(new vec3(0,editing?22:15,0));face.size=new vec2(48,editing?16:30);
  move(title,editing?5.6:12,3);move(answer,editing?.5:1.3,editing?7:10.5);move(draft,editing?-5.5:-8.2,editing?2:5);
  disclosure.getSceneObject().enabled=!editing;status.getSceneObject().enabled=!editing;
  deck.getTransform().setLocalPosition(new vec3(0,editing?-1:-12.6,0));actions.height=editing?25:19.8;
 }};
}
