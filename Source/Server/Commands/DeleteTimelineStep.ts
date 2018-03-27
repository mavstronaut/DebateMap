import {GetNodeParentsAsync} from "../../Store/firebase/nodes";
import {Assert} from "js-vextensions";
import {GetAsync_Raw} from "../../Frame/Database/DatabaseHelpers";
import {Command, MergeDBUpdates} from "../Command";
import {MapNode, ClaimForm} from "../../Store/firebase/nodes/@MapNode";
import {E} from "../../Frame/General/Others";
import {Term} from "../../Store/firebase/terms/@Term";
import {MapNodeType} from "../../Store/firebase/nodes/@MapNodeType";
import {Map} from "../../Store/firebase/maps/@Map";
import DeleteNode from "Server/Commands/DeleteNode";
import {UserEdit} from "Server/CommandMacros";
import {Subforum} from "firebase-forum";
import {ShowMessageBox} from "react-vmessagebox";
import {GetAsync} from "Frame/Database/DatabaseHelpers";
import {TimelineStep} from "Store/firebase/timelineSteps/@TimelineStep";
import {GetTimelineStep, GetTimeline} from "../../Store/firebase/timelines";

@UserEdit
export default class DeleteTimelineStep extends Command<{stepID: number}> {
	oldData: TimelineStep;
	timeline_oldSteps: number[];
	async Prepare() {
		let {stepID} = this.payload;
		this.oldData = await GetAsync_Raw(()=>GetTimelineStep(stepID));
		let timeline = await GetAsync_Raw(()=>GetTimeline(this.oldData.timelineID));
		this.timeline_oldSteps = timeline.steps;
	}
	async Validate() {}

	GetDBUpdates() {
		let {stepID} = this.payload;
		let updates = {};
		updates[`timelines/${this.oldData.timelineID}/steps`] = this.timeline_oldSteps.Except(stepID);
		updates[`timelineSteps/${stepID}`] = null;
		return updates;
	}
}