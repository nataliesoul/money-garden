import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {ScenarioConfig} from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {createIKInteractor} from "Leaf.lspkg/Interactors/interactor/ik/visualizer/BitmojiAvatar";
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {MoneyGardenMain} from "../Scripts/MoneyGardenMain";
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider";
import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
type Snapshot={stage:string;learnerStage:string;tutor:{active:boolean;topic:string;step:number;stepCount:number;review:boolean;completed:{budget:boolean;tax:boolean;logic:boolean};demo:Snapshot};scenario:number;allocated:number[];remaining:number;income:number;tax:number;retained:number;a:boolean;b:boolean;useAnd:boolean;gate:boolean;monthSuccess:boolean;unmet:number;uncovered:number;savingsAfter:number};
@component
export class MoneyGardenAcceptance extends Scenario {
 private hand!:DefaultLeafInteractor;
 private app!:MoneyGardenMain;
 private snap():Snapshot{return JSON.parse(this.app.getStateSnapshot()) as Snapshot;}
 private text(name:string):string{const visit=(o:SceneObject):Text|null=>{const t=o.getComponent("Component.Text") as Text;if(t)return t;for(let i=0;i<o.getChildrenCount();i++){const found=visit(o.getChild(i));if(found)return found;}return null;};const t=visit(findSceneObjectByName(name));if(!t)throw new Error("No Text in "+name);return t.text;}
 private target(id:string){const hit=findInteractablesByName("MG_"+id,undefined,true)[0];if(!hit)throw new Error("Missing enabled control MG_"+id);return hit;}
 private async tap(id:string):Promise<void>{await this.hand.trigger(this.target(id));await sleep(300);}
 private conserved():void {const s=this.snap();expect(s.allocated.reduce((x,y)=>x+y,0)+s.remaining).toBe(this.app.state.scenario.income);expect(s.remaining>=0).toBe(true);expect(s.allocated.every(v=>v>=0&&v%100===0)).toBe(true);}
 private async budget():Promise<void>{await this.tap("start");await this.teach("budget");expect(this.snap().stage).toBe("practice");await this.tap("allocate0");expect(this.snap().allocated[0]).toBe(100);await this.tap("practiceDone");expect(this.snap().stage).toBe("budget");expect(this.snap().remaining).toBe(this.app.state.scenario.income);}
 private async allocate(bin:number,count:number):Promise<void>{for(let i=0;i<count;i++){const prev=this.snap();await this.tap("allocate"+bin);const next=this.snap();expect(next.allocated[bin]-prev.allocated[bin]).toBe(100);expect(prev.remaining-next.remaining).toBe(100);this.conserved();}}
 private async solve():Promise<void>{const c=this.app.state.scenario;await this.allocate(0,c.essentials/100);await this.allocate(1,c.surprise/100);await this.allocate(2,this.snap().remaining/100);await this.month();expect(this.snap().monthSuccess).toBe(true);expect(this.snap().unmet).toBe(0);expect(this.snap().uncovered).toBe(0);}
 private async taxes():Promise<void>{await this.budget();await this.month();await this.tap("toTaxes");await this.taxTeaching();expect(this.text("Feedback").includes("not a real tax schedule")).toBe(true);await this.tap("taxHigher");expect(this.snap().stage).toBe("tax");}
 private async logic():Promise<void>{await this.taxes();await this.tap("toLogic");await this.logicTeaching();expect(this.snap().stage).toBe("logic");}
 private async result(and:boolean,a:boolean,b:boolean):Promise<void>{if(this.snap().stage==="logicResult")await this.tap("tryInputs");if(this.snap().useAnd!==and)await this.tap("operator");if(this.snap().a!==a)await this.tap("conditionA");if(this.snap().b!==b)await this.tap("conditionB");const expected=and?a&&b:a||b;await this.tap(expected?"predictOpen":"predictClosed");await this.tap("runLogic");expect(this.snap().stage).toBe("logicResult");expect(this.snap().gate).toBe(expected);expect(this.text("StationLabel1").includes(expected?"OPEN":"CLOSED")).toBe(true);expect(this.text("Feedback").includes("Prediction matched")).toBe(true);await sleep(650);const height=findSceneObjectByName("GateDoor").getTransform().getLocalPosition().y;expect(expected?height>7:height<4).toBe(true);print("MG_TRUTH "+JSON.stringify({and,a,b,expected}));}
 private async finish():Promise<void>{await this.tap("toTaxes");await this.taxTeaching();await this.tap("taxHigher");await this.tap("toLogic");await this.logicTeaching();await this.result(true,true,true);await this.tap("finish");expect(this.snap().stage).toBe("summary");expect(this.text("Instruction").includes("Budget:")).toBe(true);expect(this.text("Instruction").includes("Taxes:")).toBe(true);expect(this.text("Instruction").includes("Logic:")).toBe(true);}

 private exists(id:string):boolean{return !!findInteractablesByName("MG_"+id,undefined,true)[0];}
 private learner():string{const s=JSON.parse(this.app.getStateSnapshot());delete s.tutor;s.stage=s.learnerStage;return JSON.stringify(s);}
 private async teach(topic:string):Promise<void>{expect(this.snap().stage).toBe("tutor");expect(this.snap().tutor.topic).toBe(topic);const before=this.learner();while(this.snap().tutor.active){expect(this.learner()).toBe(before);await this.tap("tutorNext");}expect((this.snap().tutor.completed as any)[topic]).toBe(true);}
 private async month():Promise<void>{await this.tap("runMonth");expect(this.snap().stage).toBe("budgetPredict");const good=this.snap().unmet===0&&this.snap().uncovered===0;await this.tap(good?"predictMonthYes":"predictMonthNo");expect(this.snap().stage).toBe("month");}
 private async taxTeaching():Promise<void>{await this.teach("tax");expect(this.snap().stage).toBe("taxGuided");expect(this.snap().income).toBe(2500);expect(this.exists("taxHigher")).toBe(false);await this.tap("guidedTaxAdd");expect(this.snap().income).toBe(3000);expect(this.snap().retained).toBe(2700);await this.tap("guidedTaxContinue");expect(this.snap().stage).toBe("taxPredict");expect(this.snap().income).toBe(3500);}
 private async logicTeaching():Promise<void>{await this.teach("logic");expect(this.snap().stage).toBe("logicGuided");expect(this.snap().useAnd).toBe(true);expect(this.snap().b).toBe(false);expect(this.exists("predictOpen")).toBe(false);expect(this.exists("guidedLogicRun")).toBe(false);await this.tap("conditionB");await this.tap("guidedLogicRun");await sleep(650);expect(findSceneObjectByName("GateDoor").getTransform().getLocalPosition().y>7).toBe(true);await this.tap("guidedLogicContinue");expect(this.snap().stage).toBe("logic");}
 private async review(topic:string):Promise<void>{const before=this.learner();await this.tap("teachAgain");expect(this.snap().tutor.review).toBe(true);expect(this.snap().tutor.topic).toBe(topic);await this.tap("tutorNext");await this.tap("tutorBack");expect(this.snap().tutor.step).toBe(0);await this.tap("tutorNext");await this.tap("tutorReplay");expect(this.snap().tutor.step).toBe(0);expect(this.learner()).toBe(before);await this.tap("tutorReturn");expect(this.learner()).toBe(before);expect(this.snap().tutor.active).toBe(false);}
 private async tutorChecks():Promise<void>{
  await this.tap("start");expect(this.snap().stage).toBe("tutor");expect(this.snap().learnerStage).toBe("welcome");expect(this.exists("allocate0")).toBe(false);expect(this.exists("tutorBack")).toBe(false);
  const initial=this.learner();await sleep(800);expect(this.snap().tutor.step).toBe(0);
  const allocations=[[0,0,0],[500,0,0],[500,300,0],[500,300,200],[500,300,200]];
  for(let i=0;i<5;i++){const t=this.snap().tutor;expect(t.step).toBe(i);expect(t.demo.allocated).toEqual(allocations[i]);expect(this.learner()).toBe(initial);expect(findSceneObjectByName("BudgetStation").enabled).toBe(true);expect(findSceneObjectByName("IncomeToken").getComponent("Physics.ColliderComponent").enabled).toBe(false);expect(findSceneObjectByName("IncomeToken").getComponent(Interactable.getTypeName()).enabled).toBe(false);if(i===4){expect(t.demo.savingsAfter).toBe(100);expect(this.text("StationLabel1").includes("100")).toBe(true);}if(i<4)await this.tap("tutorNext");}
  await this.tap("tutorBack");expect(this.snap().tutor.demo.stage).toBe("budget");await this.tap("tutorReplay");expect(this.snap().tutor.step).toBe(0);await this.teach("budget");expect(this.snap().allocated).toEqual([0,0,0]);await this.tap("allocate0");await this.tap("practiceDone");await this.allocate(0,2);await this.review("budget");
  await this.tap("runMonth");const plan=this.learner();await this.review("budget");expect(this.learner()).toBe(plan);await this.tap("editPlan");expect(this.snap().allocated).toEqual([200,0,0]);await this.tap("runMonth");await this.tap("predictMonthYes");expect(this.snap().monthSuccess).toBe(false);expect(this.text("Feedback").includes("Essentials short: 300")).toBe(true);
  await this.tap("toTaxes");const beforeTax=this.learner();const incomes=[0,1000,2000,2500,3000],taxes=[0,0,100,200,300];
  expect(this.exists("taxHigher")).toBe(false);
  for(let i=0;i<5;i++){expect(this.snap().tutor.demo.income).toBe(incomes[i]);expect(this.snap().tutor.demo.tax).toBe(taxes[i]);expect(this.learner()).toBe(beforeTax);expect(findSceneObjectByName("TaxStation").enabled).toBe(true);expect(this.text("Feedback").includes("not a real tax schedule")).toBe(true);if(i<4)await this.tap("tutorNext");}
  await this.taxTeaching();await this.tap("taxLower");expect(this.snap().retained).toBe(3500);expect(this.text("Feedback").includes("+500 - 100 tax = +400 retained")).toBe(true);await this.review("tax");
  await this.tap("toLogic");const beforeLogic=this.learner();expect(this.exists("predictOpen")).toBe(false);
  for(let i=0;i<4;i++){expect(this.snap().tutor.step).toBe(i);expect(this.learner()).toBe(beforeLogic);expect(findSceneObjectByName("LogicStation").enabled).toBe(true);if(i>0){await sleep(650);const open=i===2;expect(this.snap().tutor.demo.gate).toBe(open);const y=findSceneObjectByName("GateDoor").getTransform().getLocalPosition().y;expect(open?y>7:y<4).toBe(true);}if(i<3)await this.tap("tutorNext");}
  await this.logicTeaching();await this.tap("predictClosed");const predicted=this.learner();await this.review("logic");expect(this.learner()).toBe(predicted);await this.tap("runLogic");expect(this.snap().stage).toBe("logicResult");expect(this.text("Feedback").includes("Let us trace it.")).toBe(true);expect(this.text("Feedback").includes("A TRUE, B FALSE")).toBe(true);
  await this.tap("teachAgain");await this.tap("restart");expect(this.snap().stage).toBe("welcome");expect(this.snap().tutor.completed).toEqual({budget:false,tax:false,logic:false});await this.tap("start");expect(this.snap().tutor.step).toBe(0);
 }

 async run(config?:ScenarioConfig):Promise<void>{
  await sleep(1500);findSceneObjectByName("LeafDebugUICamera").enabled=false;this.hand=new DefaultLeafInteractor();this.app=findSceneObjectByName("MoneyGardenApp").getComponent(MoneyGardenMain.getTypeName()) as MoneyGardenMain;
  await this.tap("restart");expect(this.snap().stage).toBe("welcome");
  const mode=config?.get("mode")||"practice";print("MG_TEST_BEGIN "+mode);
  if(mode==="tutor"){await this.tutorChecks();}else if(mode==="practice"){
   await this.tap("start");await this.teach("budget");const token=findSceneObjectByName("IncomeToken"), bowl=findSceneObjectByName("Essentials");
   const target=findInteractablesByName("IncomeToken",undefined,true)[0];expect(!!target).toBe(true);
   const before=this.snap();await this.hand.drag(target,new vec3(0,.5,0),700);await sleep(400);
   expect(this.snap().remaining).toBe(before.remaining);expect(this.text("Feedback").includes("Token returned")).toBe(true);
   const end=bowl.getTransform().getWorldPosition().add(bowl.getTransform().getWorldRotation().multiplyVec3(new vec3(0,3,0)));
   const dragTarget=findInteractablesByName("IncomeToken",undefined,true)[0];const step=end.sub(token.getTransform().getWorldPosition()).uniformScale(.2);
   const off=dragTarget.onDragUpdate.add(()=>{const remaining=end.sub(token.getTransform().getWorldPosition()).uniformScale(.2);step.x=remaining.x;step.y=remaining.y;step.z=remaining.z;});
   await this.hand.drag(dragTarget,step,1200);off();await sleep(500);
   expect(this.snap().allocated[0]-before.allocated[0]).toBe(100);expect(before.remaining-this.snap().remaining).toBe(100);expect(token.enabled).toBe(false);this.conserved();
   expect(token.getTransform().getLocalScale().x).toBeCloseTo(1,3);await this.tap("practiceDone");expect(this.snap().allocated).toEqual([0,0,0]);expect(this.snap().stage).toBe("budget");
  }else if(mode==="budget"){
   await this.budget();await this.allocate(0,1);await this.allocate(1,1);await this.tap("undo");expect(this.snap().allocated).toEqual([100,0,0]);this.conserved();
   await this.month();expect(this.snap().monthSuccess).toBe(false);expect(this.snap().unmet).toBe(this.app.state.scenario.essentials-100);expect(this.snap().uncovered).toBe(this.app.state.scenario.surprise);expect(this.snap().savingsAfter).toBe(0);expect(this.text("Instruction").includes("No borrowing")).toBe(true);
   await this.tap("retryBudget");expect(this.snap().allocated).toEqual([0,0,0]);expect(this.snap().remaining).toBe(this.app.state.scenario.income);
   const c=this.app.state.scenario;await this.allocate(0,c.essentials/100);await this.allocate(1,c.surprise/100+1);await this.allocate(2,this.snap().remaining/100);const full=JSON.stringify(this.snap());await this.tap("allocate0");expect(JSON.stringify(this.snap())).toBe(full);expect(this.text("Feedback").includes("No unallocated")).toBe(true);
   await this.month();expect(this.snap().monthSuccess).toBe(true);expect(this.snap().savingsAfter).toBe(100);expect(this.snap().uncovered).toBe(0);
  }else if(mode==="tax"){
   await this.taxes();expect(this.snap().income).toBe(4000);expect(this.snap().tax).toBe(500);expect(this.snap().retained).toBe(3500);await this.tap("removeIncome");await this.tap("removeIncome");expect(this.snap().income).toBe(3000);expect(this.snap().tax).toBe(300);expect(this.snap().retained).toBe(2700);
   await this.tap("removeIncome");expect(this.snap().income).toBe(2500);expect(this.snap().tax).toBe(200);expect(this.snap().retained).toBe(2300);
   const before=this.snap(),layer0=this.text("StationLabel0"),layer1=this.text("StationLabel1");
   await this.tap("addIncome");expect(this.snap().income-before.income).toBe(500);expect(this.snap().tax-before.tax).toBe(100);expect(this.snap().retained-before.retained).toBe(400);expect(this.text("StationLabel0")).toBe(layer0);expect(this.text("StationLabel1")).toBe(layer1);
   await this.tap("compare");expect(this.text("Feedback").includes("+400")).toBe(true);expect(this.text("Feedback").includes("not a real tax schedule")).toBe(true);
   await this.tap("details");expect(this.text("Instruction").includes("8%")).toBe(true);await this.tap("details");
  }else if(mode==="logic"){
   await this.logic();await this.tap("runLogic");expect(this.snap().stage).toBe("logic");expect(this.text("Feedback").includes("Predict")).toBe(true);
   for(const and of [false,true])for(const pair of [[false,false],[false,true],[true,false],[true,true]]){await this.result(and,pair[0],pair[1]);if(!and){await this.tap("finish");expect(this.snap().stage).toBe("logicResult");expect(this.text("Feedback").includes("BOTH-checks policy")).toBe(true);}}
   expect(this.snap().stage).toBe("logicResult");
  }else if(mode==="replay"){
   await this.budget();await this.solve();await this.finish();const first=this.snap().scenario;await this.tap("replay");expect(this.snap().scenario).toBe(first);expect(this.snap().allocated).toEqual([0,0,0]);expect(this.snap().income).toBe(2500);expect(this.snap().useAnd).toBe(false);
   for(let round=0;round<3;round++){await this.budget();await this.solve();await this.finish();if(round<2){const old=this.snap().scenario;await this.tap("newScenario");expect(this.snap().scenario).toBe((old+1)%3);expect(this.snap().remaining).toBe(this.app.state.scenario.income);expect(this.snap().allocated).toEqual([0,0,0]);}}
  }else if(mode==="utilities"){
   await this.budget();await this.allocate(1,1);const before=this.app.getStateSnapshot();await this.tap("details");expect(this.text("LessonTitle")).toBe("Why this matters");expect(this.app.getStateSnapshot()).toBe(before);await this.tap("details");expect(this.text("LessonTitle")).toBe("1. Give money a job");
   const tracks=this.app.sceneObject.getComponents("Component.AudioComponent") as AudioComponent[];const bed=tracks.find(t=>t.volume>0&&t.volume<.2);if(!bed)throw new Error("Missing quiet music component");const volume=bed.volume;await this.tap("mute");expect(bed.volume).toBe(0);await this.tap("mute");expect(bed.volume).toBeCloseTo(volume,5);
   await this.tap("recenter");expect(this.app.getStateSnapshot()).toBe(before);const camera=WorldCameraFinderProvider.getInstance().getComponent().getTransform();const cp=camera.getWorldPosition(),p=this.app.gardenRoot.getTransform().getWorldPosition();expect(p.y-cp.y).toBeCloseTo(-8,2);expect(Math.sqrt((p.x-cp.x)**2+(p.z-cp.z)**2)).toBeCloseTo(this.app.viewingDistance,2);
  }else if(mode==="ik"){
   const ik=createIKInteractor({avatar:{debugOverlay:false}});print("MG_IK_ROUTE start "+(ik.right.isIndirect(this.target("start"))?"indirect":"direct"));await ik.trigger(this.target("start"));await sleep(400);expect(this.snap().stage).toBe("tutor");await this.teach("budget");expect(this.snap().stage).toBe("practice");print("MG_IK_ROUTE allocate0 "+(ik.right.isIndirect(this.target("allocate0"))?"indirect":"direct"));await ik.trigger(this.target("allocate0"));await sleep(400);expect(this.snap().allocated[0]).toBe(100);
  }else if(mode==="summaryView"){await this.budget();await this.solve();await this.finish();}else if(mode==="tutorBudgetView"){await this.tap("start");for(let i=0;i<4;i++)await this.tap("tutorNext");}else if(mode==="tutorTaxView"){await this.budget();await this.month();await this.tap("toTaxes");for(let i=0;i<3;i++)await this.tap("tutorNext");}else if(mode==="tutorLogicView"){await this.taxes();await this.tap("toLogic");await this.tap("tutorNext");await this.tap("tutorNext");}else if(mode==="practiceView"){await this.tap("start");await this.teach("budget");expect(this.snap().stage).toBe("practice");}else if(mode==="budgetView"){await this.budget();await this.allocate(0,5);await this.allocate(1,3);await this.allocate(2,1);expect(this.snap().remaining).toBe(100);}else if(mode==="shortfall"){await this.budget();await this.month();expect(this.snap().monthSuccess).toBe(false);expect(this.snap().unmet).toBe(this.app.state.scenario.essentials);expect(this.snap().uncovered).toBe(this.app.state.scenario.surprise);}else throw new Error("Unknown acceptance mode "+mode);
  this.conserved();print("MG_TEST_PASS "+mode+" "+this.app.getStateSnapshot());
 }
}