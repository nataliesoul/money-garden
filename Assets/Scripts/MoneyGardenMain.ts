import {MoneyGardenPanelUI,GardenAction} from './MoneyGardenPanelUI';

import {MoneyGardenWorld} from './MoneyGardenWorld';

import {MoneyGardenState,tax} from './MoneyGardenState';

import {MoneyGardenTutor,TutorTopic} from './MoneyGardenTutor';
import {MoneyGardenAudio} from './MoneyGardenAudio';

import WorldCameraFinderProvider from 'SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider';

const action=(id:string,label:string,icon?:'play'|'info'|'sound'|'center'):GardenAction=>({id,label,icon});

@component

export class MoneyGardenMain extends BaseScriptComponent {

 @input @hint('World-space lesson guide') guide!:MoneyGardenPanelUI;

 @input @hint('Actions below the model') controls!:MoneyGardenPanelUI;

 @input @hint('Labels adjacent to the active station') labels!:MoneyGardenPanelUI;

 @input @hint('Utility controls') dock!:MoneyGardenPanelUI;

 @input @hint('Out-of-view recovery panel') rescue!:MoneyGardenPanelUI;

 @input @hint('Spatial model controller') world!:MoneyGardenWorld;

 @input @hint('All lesson content, moves as one unit') gardenRoot!:SceneObject;

 @input @hint('Quiet looping background volume') @widget(new SliderWidget(0,0.4,0.01)) musicVolume:number=.12;

 @input @hint('Distance used by Recenter, in centimeters') @widget(new SliderWidget(90,150,5)) viewingDistance:number=115;

 @input @hint('Log read-only lesson state after every action') debug:boolean=true;

 public state=new MoneyGardenState();public tutor=new MoneyGardenTutor();

 private audio!:MoneyGardenAudio;private ready=false;private details=false;private feedback='';private lastAction=-100;private lastId='';private checkTimer=0;

 public getStateSnapshot():string{return JSON.stringify({...JSON.parse(this.state.snapshot()),stage:this.tutor.active?'tutor':this.state.stage,learnerStage:this.state.stage,tutor:this.tutor.snapshot()});}

 onAwake():void {

  this.createEvent('OnStartEvent').bind(()=>{if(!this.guide||!this.world||!this.gardenRoot){print('Money Garden: missing scene reference');return;}

   this.audio=new MoneyGardenAudio(this.sceneObject,this.musicVolume);

   [this.guide,this.controls,this.dock,this.rescue].forEach(ui=>ui.onAction.add(id=>this.handle(id)));

   this.world.onDrop.add(i=>this.allocate(i));

   const init=this.createEvent('DelayedCallbackEvent');init.bind(()=>{this.ready=true;this.rescue.setActions([[action('recenter','Garden this way','center')]]);this.recenter();this.render();});init.reset(.25);

  });

  this.createEvent('UpdateEvent').bind(()=>{if(!this.ready)return;this.checkTimer+=getDeltaTime();if(this.checkTimer>.3){this.checkTimer=0;this.updateRecovery();}});

 }

 private handle(id:string):void {

  if(!this.ready)return;const now=getTime();if(id===this.lastId&&now-this.lastAction<.18)return;this.lastId=id;this.lastAction=now;

  const s=this.state;

  if(id==='recenter'){this.recenter();return;}

  if(id==='mute'){this.audio.toggle();this.render();return;}

  if(id==='details'){this.details=!this.details;this.render();return;}

  if(id==='restart'){s.reset();this.tutor.reset();this.feedback='';this.details=false;this.render();return;}

  if(id==='teachAgain'){this.details=false;if(this.tutor.active){this.tutor.step=0;this.render();}else this.openTutor(this.topicForStage(),true);return;}
  if(this.tutor.active){
   this.details=false;
   if(id==='tutorBack'&&this.tutor.step>0)this.tutor.step--;
   else if(id==='tutorReplay')this.tutor.step=0;
   else if(id==='tutorReturn'&&this.tutor.review){this.tutor.active=false;this.render();return;}
   else if(id==='tutorNext'){
    if(this.tutor.step<this.tutor.stepCount-1)this.tutor.step++;
    else {const topic=this.tutor.topic,review=this.tutor.review;this.tutor.active=false;if(!review){this.tutor.completed[topic]=true;this.enterPractice(topic);}this.render();return;}
   }else return;
   this.render();if(this.tutor.topic==='logic'&&this.tutor.step>0)this.world.runPulse();return;
  }
  this.audio.play('retry');this.details=false;

  if(id==='start'&&s.stage==='welcome'){this.openTutor('budget');return;}

  else if(id.startsWith('allocate')&&(s.stage==='practice'||s.stage==='budget')){this.allocate(Number(id.slice(-1)));return;}

  else if(id==='practiceDone'&&s.stage==='practice'&&s.history.length){s.resetBudget();s.stage='budget';this.feedback='';}

  else if(id==='undo'&&s.stage==='budget'){if(s.undo())this.feedback='Last 100 credits returned to income.';else this.feedback='Allocate a token first.';}

  else if(id==='runMonth'&&s.stage==='budget'){s.stage='budgetPredict';s.budgetPrediction=null;this.feedback='';}
  else if((id==='predictMonthYes'||id==='predictMonthNo')&&s.stage==='budgetPredict'){s.budgetPrediction=id==='predictMonthYes';s.runMonth();s.budgetPredictionCorrect=s.budgetPrediction===s.monthSuccess;this.feedback=(s.budgetPredictionCorrect?'Your check matched. ':'Let us trace the shortfall. ')+`Essentials need ${s.unmet} more; surprise needs ${s.uncovered} more.`;this.audio.play('correct');}
  else if(id==='editPlan'&&s.stage==='budgetPredict'){s.stage='budget';this.feedback=this.budgetCoach();}

  else if(id==='retryBudget'&&s.stage==='month'){s.resetBudget();s.stage='budget';this.feedback='Try a new plan. Every credit is back.';}

  else if(id==='toTaxes'&&s.stage==='month'){this.openTutor('tax');return;}
  else if(id==='guidedTaxAdd'&&s.stage==='taxGuided'){s.previousIncome=2500;s.income=3000;s.taxGuidedDone=true;this.feedback='You added 500: 100 becomes tax and 400 is retained.';}
  else if(id==='guidedTaxContinue'&&s.stage==='taxGuided'&&s.taxGuidedDone){s.income=3500;s.previousIncome=3500;s.stage='taxPredict';this.feedback='';}

  else if((id==='taxHigher'||id==='taxLower')&&s.stage==='taxPredict'){s.taxPredictionCorrect=id==='taxHigher';s.previousIncome=3500;s.income=4000;s.stage='tax';this.feedback=(s.taxPredictionCorrect?'Yes: ':'Trace it: ')+'+500 - 100 tax = +400 retained. Teach again replays why.';this.audio.play('correct');}

  else if((id==='addIncome'||id==='removeIncome')&&s.stage==='tax'){s.previousIncome=s.income;s.income=Math.max(0,Math.min(4000,s.income+(id==='addIncome'?500:-500)));this.feedback=s.income===s.previousIncome?'Practice range: 0 to 4,000 credits.':'Mint is retained; gold is tax. Each column splits its own income.';}

  else if(id==='compare'&&s.stage==='tax'){const old=s.previousIncome-tax(s.previousIncome),cur=s.income-tax(s.income);this.feedback=`Retained: ${old} → ${cur} (${cur-old>=0?'+':''}${cur-old}). Tax: ${tax(s.previousIncome)} → ${tax(s.income)}.`;}

  else if(id==='toLogic'&&s.stage==='tax'){this.openTutor('logic');return;}
  else if(id==='conditionB'&&s.stage==='logicGuided'&&!s.logicGuidedDone){s.b=!s.b;this.feedback=s.b?'Both checks are TRUE. Run AND to see the path open.':'B is FALSE. Tap B once to make both checks TRUE.';}
  else if(id==='guidedLogicRun'&&s.stage==='logicGuided'&&s.b){s.logicGuidedDone=true;this.feedback='TRUE AND TRUE gives TRUE. Both paths open the gate.';this.render();this.world.runPulse();return;}
  else if(id==='guidedLogicContinue'&&s.stage==='logicGuided'&&s.logicGuidedDone){s.a=true;s.b=false;s.useAnd=false;s.prediction=null;s.stage='logic';this.feedback='Your turn: test whether OR fits the BOTH-checks goal.';}

  else if((s.stage==='logic'||s.stage==='logicResult')&&['conditionA','conditionB','operator','predictOpen','predictClosed','runLogic'].indexOf(id)>=0){

   if(id==='conditionA')s.a=!s.a;if(id==='conditionB')s.b=!s.b;if(id==='operator')s.useAnd=!s.useAnd;

   if(id==='predictOpen'||id==='predictClosed')s.prediction=id==='predictOpen';

   if(id==='runLogic'){if(s.prediction===null)this.feedback='Predict Open or Closed first.';else{s.stage='logicResult';s.logicPredictionCorrect=s.prediction===s.gate;this.feedback=(s.logicPredictionCorrect?'Prediction matched. ':'Let us trace it. ')+`A ${s.a?'TRUE':'FALSE'}, B ${s.b?'TRUE':'FALSE'}: `+(s.useAnd?'AND needs both. ':'OR needs either. ')+(s.gate?'Gate opens.':'Gate stays closed.');this.world.runPulse();this.audio.play('correct');}}

   else {s.stage='logic';this.feedback=id.startsWith('predict')?'Prediction saved. Run the gate to test it.':'';if(!id.startsWith('predict'))s.prediction=null;}

  }

  else if(id==='tryInputs'&&s.stage==='logicResult'){s.stage='logic';s.prediction=null;this.feedback='Change the inputs, then predict and run again.';}

  else if(id==='finish'&&s.stage==='logicResult'){if(!s.useAnd)this.feedback='Select AND and run once to enforce the BOTH-checks policy.';else{s.stage='summary';this.feedback='';this.audio.play('correct');}}

  else if((id==='replay'||id==='newScenario')&&s.stage==='summary'){s.reset(id==='newScenario');this.tutor.reset();this.feedback='';}

  this.render();

 }

 private allocate(bin:number):void {if(!this.ready||this.tutor.active)return;if(bin<0){this.feedback='Token returned. Release near a bowl, or use Allocate.';this.audio.play('retry');this.render();return;}if(this.state.stage==='practice'&&bin!==0){this.feedback='Practice: use the Essentials bowl on the left.';this.render();return;}if(this.state.allocate(bin)){this.audio.play('allocate');this.feedback=this.state.stage==='practice'?'You moved 100 credits. The total stayed the same.':this.budgetCoach();}else this.feedback='No unallocated credits remain. Undo to change the plan.';this.render();}

 private render():void {

  const s=this.state,c=s.scenario;let visual=s,interactive=true;let title='',body='',status=this.feedback,rows:GardenAction[][]=[],labels:string[]=[];let progress='BUDGET  /  TAXES  /  LOGIC';

  switch(s.stage){

   case 'welcome':title='Money Garden';body='Give your money a job.\nFirst I teach, then we try together, then you explore.';status=`${c.name} • 3 short lessons • fictional credits\nPinch a button, or click it in Interactive Preview.`;rows=[[action('start','Start growing','play')]];break;

   case 'practice':title='Try one token';body='Pinch and drag the glowing 100-credit token\nto the left bowl. Or tap Allocate below.';status=status||'Hold to move. Release near the bowl to snap.';rows=s.history.length?[[action('practiceDone','Plan with guidance','play')]]:[[action('allocate0','Allocate 100')]];labels=['ESSENTIALS\n'+s.allocated[0],'',''];break;

   case 'budget':title='1. Give money a job';body=`Cover ${c.essentials} essentials. Reserve ${c.surprise} for a surprise.\nThen choose where the rest goes.`;status=`${s.remaining} left of ${c.income} after-tax monthly credits\n${this.feedback||this.budgetCoach()}`;rows=[[action('allocate0','Essentials +100'),action('allocate1','Reserve +100'),action('allocate2','Choice +100')],[action('undo','Undo'),action('runMonth','Check my plan','play')]];labels=[`ESSENTIALS\n${s.allocated[0]} / ${c.essentials}`,`RESERVE\n${s.allocated[1]} / ${c.surprise}`,`YOUR CHOICE\n${s.allocated[2]}`];break;

   case 'budgetPredict':title='Check your plan';body=`Essentials: ${s.allocated[0]} of ${c.essentials}. Reserve: ${s.allocated[1]} of ${c.surprise}.\nWill this plan cover both needs when the surprise arrives?`;status='Use the amounts to decide. Then we will trace the outcome.';rows=[[action('predictMonthYes','Covers both'),action('predictMonthNo','Has a shortfall')],[action('editPlan','Back to plan')]];labels=[`ESSENTIALS\n${s.allocated[0]}`,`RESERVE\n${s.allocated[1]}`,`YOUR CHOICE\n${s.allocated[2]}`];break;
   case 'month':title=s.monthSuccess?'Your plan held up':'A chance to revise';body=`The ${c.surprise}-credit surprise arrives.\nReserve ${s.allocated[1]} → ${s.savingsAfter}. No borrowing is assumed.`;status=`Essentials short: ${s.unmet} • Surprise uncovered: ${s.uncovered}\n${s.budgetPredictionCorrect?'Your prediction matched.':'Compare the amounts; Teach again explains the steps.'}`;rows=[[action('retryBudget','Retry plan'),action('toTaxes','Explore taxes','play')]];labels=[`ESSENTIALS\n${s.allocated[0]} / ${c.essentials}`,`RESERVE LEFT\n${s.savingsAfter}`,`YOUR CHOICE\n${s.allocated[2]}`];break;

   case 'taxGuided':title='Try taxes with me';body=s.taxGuidedDone?'You added 500. Only the top layer changed.\nRetained: 2,300 to 2,700; tax: 200 to 300.':'Start at 2,500: tax 200, retained 2,300.\nTap Add 500. Watch only the top layer grow.';status='Practice rates - not a real tax schedule.\n'+(s.taxGuidedDone?'Now you are ready for a different example.':'Of the new 500, 100 will be tax and 400 retained.');rows=[[s.taxGuidedDone?action('guidedTaxContinue','Try on my own','play'):action('guidedTaxAdd','Add 500 together','play')]];labels=this.taxLabels(s.income);break;
   case 'taxPredict':title='2. Only the next layer';body='Annual taxable income rises from 3,500 to 4,000.\nWill retained income rise or fall?';status='Practice rates — not a real tax schedule.\nFirst 1,000: 0% • Next 1,000: 10% • Above: 20%';rows=[[action('taxHigher','Rise'),action('taxLower','Fall')]];labels=['FIRST 1,000\n0%','NEXT 1,000\n10%','ABOVE 2,000\n20%'];break;

   case 'tax':title='Layers, not a cliff';body=`Annual taxable income ${s.income}\nTax ${tax(s.income)} • Retained ${s.income-tax(s.income)}`;status='Practice rates — not a real tax schedule.\n'+(status||'Mint is retained. Gold is tax. Equal heights mean equal income.');rows=[[action('removeIncome','−500 income'),action('addIncome','+500 income'),action('compare','Compare')],[action('toLogic','Try logic','play')]];labels=[`0% LAYER\n${Math.min(s.income,1000)} → 0 tax`,`10% LAYER\n${Math.min(Math.max(s.income-1000,0),1000)} → ${Math.min(Math.max(s.income-1000,0),1000)*.1} tax`,`20% LAYER\n${Math.max(s.income-2000,0)} → ${Math.max(s.income-2000,0)*.2} tax`];break;

   case 'logicGuided':title='Try AND with me';body=s.logicGuidedDone?'Both checks are TRUE, so AND opens the gate.\nYou changed a condition and saw its consequence.':'A is already TRUE. B is FALSE.\nTap B to make it TRUE; then run AND.';status=this.feedback||'AND needs both checks. We will make both TRUE together.';rows=s.logicGuidedDone?[[action('guidedLogicContinue','Try on my own','play')]]:[[action('conditionB',`B: ${s.b?'TRUE':'FALSE'}`),...(s.b?[action('guidedLogicRun','Run AND','play')]:[])]];labels=[`A: ESSENTIALS\nTRUE`,`AND\n${s.logicGuidedDone?'OPEN':'BOTH NEEDED'}`,`B: RESERVE\n${s.b?'TRUE':'FALSE'}`];break;
   case 'logic':case 'logicResult':title='3. Which rule fits?';body='A purchase may pass only when BOTH are true:\nA: essentials covered. B: reserve survives the purchase.';status=status||`Predict the ${s.useAnd?'AND':'OR'} gate: Open or Closed?`;rows=[[action('conditionA',`A: ${s.a?'TRUE':'FALSE'}`),action('operator',`Gate: ${s.useAnd?'AND':'OR'}`),action('conditionB',`B: ${s.b?'TRUE':'FALSE'}`)],[action('predictOpen','Predict open'),action('predictClosed','Predict closed'),action('runLogic','Run','play')]];if(s.stage==='logicResult')rows[1]=[action('tryInputs','Try inputs'),action('runLogic','Run again'),action('finish','Finish','play')];labels=[`ESSENTIALS\n${s.a?'TRUE':'FALSE'}`,`${s.useAnd?'AND':'OR'} GATE\n${s.stage==='logicResult'?(s.gate?'OPEN':'CLOSED'):'PREDICT'}`,`RESERVE\n${s.b?'TRUE':'FALSE'}`];break;

   case 'summary':title='Keep the garden growing';body='Budget: give every credit a job.\nTaxes: higher rates apply only to higher layers.\nLogic: choose rules that match your goal.';status=`${c.name}: ${s.monthSuccess?'plan covered both needs':'shortfalls explored'}\nAND policy tested. Try a new scenario to practice again.`;rows=[[action('replay','Replay'),action('newScenario','New scenario','play')]];progress='BUDGET ✓   /   TAXES ✓   /   LOGIC ✓';break;

  }

  if(this.tutor.active){
   const t=this.tutor,p=t.page;title=p.title;body=p.body;status=(t.topic==='tax'?'Practice rates - not a real tax schedule.\n':'')+p.status;labels=p.labels;visual=t.demo;interactive=false;
   progress=`${t.topic.toUpperCase()} TUTOR / ${t.step+1} OF ${t.stepCount} / WORKED EXAMPLE`;
   const last=t.step===t.stepCount-1;rows=[[...(t.step>0?[action('tutorBack','Back')]:[]),action('tutorNext',last?(t.review?'Return to my work':'Try with me'):'Next','play'),action('tutorReplay','Replay lesson')]];
   if(t.review)rows.push([action('tutorReturn','Return to my work')]);
  }
  if(this.details&&!this.tutor.active){title='Why this matters';body=this.detailText();status=(s.stage==='tax'||s.stage==='taxPredict'||s.stage==='taxGuided'?'Practice rates - not a real tax schedule.':'Fictional learning exercises. No personal financial advice.')+'\nTap Details again to return.';}

  this.guide.setCopy(title,body,status,progress);this.guide.setChapter(s.stage==='welcome'&&!this.tutor.active?-1:this.topicForStage()==='budget'?0:this.topicForStage()==='tax'?1:2,s.stage==='summary'&&!this.tutor.active);this.controls.setActions(rows);this.labels.setLabels(labels);this.labels.setVisible(labels.length>0);

  this.dock.setActions([[action('teachAgain','Teach again'),...(!this.tutor.active?[action('details',this.details?'Close':'Details','info')]:[]),action('mute',this.audio.muted?'Unmute':'Mute','sound'),action('recenter','Recenter','center'),action('restart','Restart')]]);

  this.world.show(visual,interactive);if(this.debug)print('MONEY_GARDEN_STATE '+this.getStateSnapshot());

 }

 private topicForStage():TutorTopic {if(this.tutor.active)return this.tutor.topic;const stage=this.state.stage;return stage.indexOf('tax')===0?'tax':stage.indexOf('logic')===0||stage==='summary'?'logic':'budget';}
 private openTutor(topic:TutorTopic,review=false):void {this.tutor.open(topic,review);this.details=false;this.render();}
 private enterPractice(topic:TutorTopic):void {const s=this.state;this.feedback='';if(topic==='budget'){s.resetBudget();s.stage='practice';}else if(topic==='tax'){s.income=2500;s.previousIncome=2500;s.taxGuidedDone=false;s.stage='taxGuided';}else{s.a=true;s.b=false;s.useAnd=true;s.prediction=null;s.logicGuidedDone=false;s.stage='logicGuided';}}
 private budgetCoach():string {const s=this.state;return s.unmet>0?`Next: move ${s.unmet} more to Essentials.`:s.uncovered>0?`Essentials covered. Next: reserve ${s.uncovered} more.`:s.remaining>0?`Both needs covered. Choose a job for the last ${s.remaining}.`:'Every credit has a job. Check your plan when ready.';}
 private taxLabels(income:number):string[] {return [`FIRST 1,000\n${Math.min(income,1000)} at 0%`,`NEXT 1,000\n${Math.min(Math.max(income-1000,0),1000)} at 10%`,`ABOVE 2,000\n${Math.max(income-2000,0)} at 20%`];}
 private detailText():string {const s=this.state;if(s.stage==='tax'||s.stage==='taxPredict'||s.stage==='taxGuided')return `At 2,500: 0 + 100 + 100 = 200 tax.\nTop rate 20%; average 200 / 2,500 = 8%.\nThis omits deductions, credits, other taxes and benefits.`;if(s.stage==='logic'||s.stage==='logicResult'||s.stage==='logicGuided')return 'AND needs both conditions. OR needs either or both.\nOR is useful for other goals; this purchase policy needs AND.\nToggle A and B to explore all four combinations.';return 'A budget plans income, spending and saving.\nThis scenario’s reserve target is a challenge, not a rule for everyone.\nUndo before running; retry afterward. No debt is invented.';}

 private recenter():void {const cam=WorldCameraFinderProvider.getInstance().getComponent().getTransform();const p=cam.getWorldPosition(),q=cam.getWorldRotation();let forward=q.multiplyVec3(new vec3(0,0,-1));forward=new vec3(forward.x,0,forward.z).normalize();this.gardenRoot.getTransform().setWorldPosition(p.add(forward.uniformScale(this.viewingDistance)).add(new vec3(0,-8,0)));this.gardenRoot.getTransform().setWorldRotation(quat.angleAxis(Math.atan2(-forward.x,-forward.z),vec3.up()));}

 private updateRecovery():void {const cam=WorldCameraFinderProvider.getInstance().getComponent().getTransform(),local=cam.getInvertedWorldTransform().multiplyPoint(this.gardenRoot.getTransform().getWorldPosition());const show=local.z>0||Math.abs(Math.atan2(local.x,-local.z))>.55;this.rescue.setVisible(show);if(show){this.rescue.sceneObject.getTransform().setWorldPosition(cam.getWorldTransform().multiplyPoint(new vec3(0,-15,-85)));this.rescue.sceneObject.getTransform().setWorldRotation(cam.getWorldRotation());}}

}

