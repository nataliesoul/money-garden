import {MoneyGardenState} from './MoneyGardenState';
export type TutorTopic='budget'|'tax'|'logic';
export interface TutorPage {title:string;body:string;status:string;labels:string[];}
/** Teaching uses its own model; opening a lesson never edits the learner's work. */
export class MoneyGardenTutor {
 active=false;topic:TutorTopic='budget';step=0;review=false;
 completed:{budget:boolean;tax:boolean;logic:boolean}={budget:false,tax:false,logic:false};
 get stepCount():number{return this.topic==='logic'?4:5;}
 open(topic:TutorTopic,review=false):void {this.topic=topic;this.step=0;this.review=review;this.active=true;}
 reset():void {this.active=false;this.topic='budget';this.step=0;this.review=false;this.completed={budget:false,tax:false,logic:false};}
 get demo():MoneyGardenState {
  const d=new MoneyGardenState();
  if(this.topic==='budget'){d.stage=this.step===4?'month':'budget';d.allocated=this.step===0?[0,0,0]:this.step===1?[500,0,0]:this.step===2?[500,300,0]:[500,300,200];d.monthSuccess=this.step===4;}
  else if(this.topic==='tax'){d.stage='tax';d.income=[0,1000,2000,2500,3000][this.step];}
  else {d.stage=this.step===0?'logic':'logicResult';d.a=true;d.b=false;d.useAnd=this.step!==2;}
  return d;
 }
 get page():TutorPage {
  if(this.topic==='budget')return [
   {title:'Income comes in',body:'Income is money coming in. A budget plans its jobs.\nWe have 1,000 after tax this month. Each coin is 100.',status:'This is our example. Your practice money stays separate.',labels:['ESSENTIALS\n0','RESERVE\n0','YOUR CHOICE\n0']},
   {title:'Cover essentials first',body:'Essentials are costs you need to cover, like food.\nWe move 500 to Essentials; 500 remains.',status:'500 allocated + 500 unallocated = 1,000. No money is created.',labels:['ESSENTIALS\n500','RESERVE\n0','YOUR CHOICE\n0']},
   {title:'Keep a reserve',body:'A reserve is money kept ready for an unexpected cost.\nWe set aside 300; 200 remains to choose.',status:'The plant grows with our reserve. This target is an example.',labels:['ESSENTIALS\n500','RESERVE\n300','YOUR CHOICE\n0']},
   {title:'Choose how to spend',body:'Discretionary spending is money you can choose to use.\nOur last 200 goes to Your choice; 0 is left.',status:'500 essentials + 300 reserve + 200 choice = 1,000.',labels:['ESSENTIALS\n500','RESERVE\n300','YOUR CHOICE\n200']},
   {title:'A surprise arrives',body:'A 200-credit cost arrives. Reserve falls from 300 to 100.\nEssentials stay covered; 100 is still saved.',status:'You saw the plan work. Next, move one token with guidance.',labels:['ESSENTIALS\n500','RESERVE LEFT\n100','YOUR CHOICE\n200']}
  ][this.step];
  if(this.topic==='tax')return [
   {title:'Taxable and retained',body:'Tax is money paid to government.\nTaxable income is the amount we use to calculate tax.\nRetained is what remains after this example tax.',status:'Mint will be retained money. Gold will be tax.',labels:['FIRST 1,000\n0%','NEXT 1,000\n10%','ABOVE 2,000\n20%']},
   {title:'The first layer',body:'The first 1,000 has a 0% rate in our example.\n1,000 x 0% = 0 tax. All 1,000 is retained.',status:'Each column represents its own portion of income.',labels:['1,000 INCOME\n0 tax / 1,000 left','NEXT LAYER\nempty','TOP LAYER\nempty']},
   {title:'Next portion: 10%',body:'The next 1,000 adds 100 tax and 900 retained.\nAt 2,000 total: 100 tax; 1,900 retained.',status:'The first 1,000 still has 0 tax. Its rate did not change.',labels:['FIRST 1,000\n0 tax','NEXT 1,000\n100 tax','TOP LAYER\nempty']},
   {title:'Example: 2,500',body:'Only the top 500 gets 20%: it adds 100 tax.\nTax = 0 + 100 + 100 = 200; retained = 2,300.',status:'Top rate 20%; average tax 200 / 2,500 = 8%.',labels:['FIRST 1,000\n0 tax','NEXT 1,000\n100 tax','TOP 500\n100 tax']},
   {title:'Another 500 arrives',body:'At 3,000, the extra 500 adds 100 tax and 400 retained.\nTax: 200 to 300. Retained: 2,300 to 2,700.',status:'Earlier layers stay unchanged. Next, try this with guidance.',labels:['FIRST 1,000\n0 tax','NEXT 1,000\n100 tax','TOP 1,000\n200 tax']}
  ][this.step];
  return [
   {title:'True or false',body:'TRUE means a check is met; FALSE means it is not.\nA: essentials covered. B: reserve survives a purchase.',status:'Our example: A is TRUE, B is FALSE. Watch two rules.',labels:['A: ESSENTIALS\nTRUE','TWO CHECKS','B: RESERVE\nFALSE']},
   {title:'AND needs both',body:'A is TRUE but B is FALSE. Both are not met.\nAND gives FALSE, so the gate stays closed.',status:'A sends a pulse. B does not. AND needs both paths.',labels:['A: TRUE','AND\nCLOSED','B: FALSE']},
   {title:'OR accepts either',body:'With the same inputs, A alone is enough for OR.\nOR gives TRUE; the gate opens. Both TRUE also passes.',status:'OR fits an either-check goal, but not our BOTH-checks policy.',labels:['A: TRUE','OR\nOPEN','B: FALSE']},
   {title:'Match rule to goal',body:'Our purchase policy requires essentials AND reserve.\nReturn to AND: with B FALSE, this purchase must wait.',status:'Next, make B TRUE with guidance and see AND open.',labels:['A: TRUE','AND POLICY\nCLOSED','B: FALSE']}
  ][this.step];
 }
 snapshot():object {return {active:this.active,topic:this.topic,step:this.step,stepCount:this.stepCount,review:this.review,completed:{...this.completed},demo:this.active?JSON.parse(this.demo.snapshot()):null};}
}
