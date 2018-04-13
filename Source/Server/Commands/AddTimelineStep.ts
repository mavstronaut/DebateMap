import {Assert} from "js-vextensions";
import {GetDataAsync} from "../../Frame/Database/DatabaseHelpers";
import {Command, MergeDBUpdates} from "../Command";
import {E} from "js-vextensions";
import {Term} from "../../Store/firebase/terms/@Term";
import AddNode from "./AddNode";
import {UserEdit} from "Server/CommandMacros";
import {Layer} from "Store/firebase/layers/@Layer";
import {Timeline} from "Store/firebase/timelines/@Timeline";
import {TimelineStep} from "../../Store/firebase/timelineSteps/@TimelineStep";

@UserEdit
export default class AddTimelineStep extends Command<{timelineID: number, step: TimelineStep}> {
	stepID: number;
	timeline_oldSteps: number[];
	async Prepare() {
		let {timelineID, step} = this.payload;

		let lastStepID = await GetDataAsync("general", "lastTimelineStepID") as number;
		this.stepID = lastStepID + 1;
		step.timelineID = timelineID;

		this.timeline_oldSteps = await GetDataAsync("timelines", timelineID, "steps") || [];
	}
	async Validate() {
		let {step} = this.payload;
		AssertValidate("TimelineStep", step, `TimelineStep invalid`);
	}
	
	GetDBUpdates() {
		let {timelineID, step} = this.payload;
		let updates = {
			// add step
			"general/lastTimelineStepID": this.stepID,
			[`timelineSteps/${this.stepID}`]: step,
			// add to timeline
			[`timelines/${timelineID}/steps`]: this.timeline_oldSteps.concat(this.stepID),
		} as any;
		return updates;
	}
}