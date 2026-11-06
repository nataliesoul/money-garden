export type Stage = 'welcome'|'practice'|'budget'|'month'|'taxPredict'|'tax'|'logic'|'logicResult'|'summary';
export interface Scenario { name:string; income:number; essentials:number; surprise:number; }
export const SCENARIOS:Scenario[] = [
 {name:'First harvest',income:1000,essentials:500,surprise:200},
 {name:'A busy month',income:1200,essentials:600,surprise:300},
 {name:'A smaller harvest',income:900,essentials:400,surprise:200}
];
export function tax(income:number):number { return Math.round(Math.min(Math.max(income-1000,0),1000)*.1+Math.max(income-2000,0)*.2); }
export class MoneyGardenState {
 stage:Stage='welcome'; scenarioIndex=0; allocated=[0,0,0]; history:number[]=[];
 income=2500; previousIncome=2500; a=true;b=false; useAnd=false; prediction:boolean|null=null;
 taxPredictionCorrect=false; logicPredictionCorrect=false; monthSuccess=false;
 get scenario():Scenario {return SCENARIOS[this.scenarioIndex];}
 get remaining():number{return this.scenario.income-this.allocated.reduce((s,n)=>s+n,0);}
 get gate():boolean{return this.useAnd ? this.a&&this.b : this.a||this.b;}
 allocate(bin:number):boolean { if((this.stage!=='budget'&&this.stage!=='practice')||bin<0||bin>2||this.remaining<100)return false; if(this.stage==='practice'&&this.history.length>0)return false; this.allocated[bin]+=100; this.history.push(bin); return true; }
 undo():boolean {if(this.stage!=='budget')return false;const bin=this.history.pop();if(bin===undefined)return false;this.allocated[bin]-=100;return true;}
 resetBudget():void {this.allocated=[0,0,0];this.history=[];this.monthSuccess=false;}
 runMonth():void {this.monthSuccess=this.allocated[0]>=this.scenario.essentials&&this.allocated[1]>=this.scenario.surprise;this.stage='month';}
 get savingsAfter():number{return Math.max(0,this.allocated[1]-this.scenario.surprise);}
 get uncovered():number{return Math.max(0,this.scenario.surprise-this.allocated[1]);}
 get unmet():number{return Math.max(0,this.scenario.essentials-this.allocated[0]);}
 reset(next=false):void {if(next)this.scenarioIndex=(this.scenarioIndex+1)%SCENARIOS.length;this.stage='welcome';this.resetBudget();this.income=2500;this.previousIncome=2500;this.a=true;this.b=false;this.useAnd=false;this.prediction=null;this.taxPredictionCorrect=false;this.logicPredictionCorrect=false;}
 snapshot():string {return JSON.stringify({stage:this.stage,scenario:this.scenarioIndex,allocated:this.allocated,remaining:this.remaining,income:this.income,tax:tax(this.income),retained:this.income-tax(this.income),a:this.a,b:this.b,useAnd:this.useAnd,gate:this.gate,monthSuccess:this.monthSuccess,unmet:this.unmet,uncovered:this.uncovered,savingsAfter:this.savingsAfter});}
}
