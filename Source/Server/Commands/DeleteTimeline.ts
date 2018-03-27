import {GetNodeParentsAsync} from "../../Store/firebase/nodes";
import {Assert} from "js-vextensions";
import {GetDataAsync} from "../../Frame/Database/DatabaseHelpers";
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
import {Post} from "firebase-forum";
import {GetTimeline} from "../../Store/firebase/timelines";
import {Timeline} from "Store/firebase/timelines/@Timeline";

@UserEdit
export default class DeleteTimeline extends Command<{timelineID: number}> {
	oldData: Timeline;
	async Prepare() {
		let {timelineID} = this.payload;
		this.oldData = await GetAsync(()=>GetTimeline(timelineID))
	}
	async Validate() {
		if (this.oldData.steps) {
			throw new Error(`Cannot delete a timeline until all its steps have been deleted.`);
		}
	}

	GetDBUpdates() {
		let {timelineID} = this.payload;
		let updates = {};
		updates[`timelines/${timelineID}`] = null;
		updates[`maps/${this.oldData.mapID}/timelines/${timelineID}`] = null;
		return updates;
	}
}