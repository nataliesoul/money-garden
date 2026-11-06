import {scenariosIndex} from "Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator";
import {ScenarioMetadata} from "Leaf.lspkg/Scenarios/scenario/ScenarioMetadata";
import {findSceneObjectByName} from "Leaf.lspkg/Utils/common/Utils";
import {MoneyGardenAcceptance} from "./MoneyGardenAcceptance";
@component
export class MoneyGardenLeafIndex extends BaseScriptComponent {
 onAwake():void {this.createEvent("OnStartEvent").bind(()=>{const camera=findSceneObjectByName("LeafDebugUICamera");if(camera)camera.enabled=false;});}
 @scenariosIndex static scenariosIndex:ScenarioMetadata[]=["tutor","practice","budget","tax","logic","replay","utilities","ik"].map(mode=>({id:"money-garden-"+mode,typename:MoneyGardenAcceptance.getTypeName(),parameters:{mode,__leaf__timeout_secs:"240",__leaf__diagnostic_policy:"fail-fast",__leaf__diagnostic_report_duration_ms:"0"}}));
}