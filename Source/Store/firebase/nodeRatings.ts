import {GetArgumentImpactPseudoRating, GetArgumentImpactPseudoRatingSet} from "../../Frame/Store/RatingProcessor";
import {RatingType} from "../../Store/firebase/nodeRatings/@RatingType";
import { GetData, GetData_Options } from "../../Frame/Database/DatabaseHelpers";
import {CachedTransform} from "js-vextensions";
import {MapNode} from "../../Store/firebase/nodes/@MapNode";
import {RatingsRoot, Rating} from "./nodeRatings/@RatingsRoot";
import {GetNodeChildren, GetNode, GetNodeChildrenL2} from "./nodes";
import {ClaimForm, MapNodeL3} from "./nodes/@MapNode";
import {GetNodeL2} from "./nodes/$node";
import {MapNodeType} from "./nodes/@MapNodeType";
import {emptyObj} from "../../Frame/Store/ReducerUtils";

export function GetNodeRatingsRoot(nodeID: number) {
	//RequestPaths(GetPaths_NodeRatingsRoot(nodeID));
	return GetData("nodeRatings", nodeID) as RatingsRoot;
}

// path is needed if you want 
export function GetRatingSet(nodeID: number, ratingType: RatingType, path?: string) {
	if (ratingType == "impact") {
		let node = GetNodeL2(nodeID);
		if (node == null) return null;
		let nodeChildren = GetNodeChildrenL2(node);
		if (nodeChildren.Any(a=>a == null)) return emptyObj;
		let premises = nodeChildren.filter(a=>a == null || a.type == MapNodeType.Claim);
		return GetArgumentImpactPseudoRatingSet(node, premises);
	}
	let ratingsRoot = GetNodeRatingsRoot(nodeID);
	return ratingsRoot ? ratingsRoot[ratingType] : null;
}
//export function GetRatings(nodeID: number, ratingType: RatingType, thesisForm?: ThesisForm): Rating[] {
export function GetRatings(nodeID: number, ratingType: RatingType): Rating[] {
	let ratingSet = GetRatingSet(nodeID, ratingType);
	return CachedTransform("GetRatings", [nodeID, ratingType], {ratingSet}, ()=>ratingSet ? ratingSet.VValues(true) : []);
}
export function GetRating(nodeID: number, ratingType: RatingType, userID: string) {
	let ratingSet = GetRatingSet(nodeID, ratingType);
	if (ratingSet == null) return null;
	return ratingSet[userID];
}
export function GetRatingValue(nodeID: number, ratingType: RatingType, userID: string, resultIfNoData = null): number {
	let rating = GetRating(nodeID, ratingType, userID);
	return rating ? rating.value : resultIfNoData;
}
export function GetRatingAverage(nodeID: number, ratingType: RatingType, ratings?: Rating[], resultIfNoData = null): number {
	// if voting disabled, always show full bar
	let node = GetNodeL2(nodeID);
	if (node && node.current.votingDisabled) return 100;

	ratings = ratings || GetRatings(nodeID, ratingType);
	if (ratings.length == 0) return resultIfNoData as any;
	return CachedTransform("GetRatingAverage", [nodeID, ratingType], {ratings}, ()=>ratings.map(a=>a.value).Average().RoundTo(1));
}

/*export function GetPaths_MainRatingSet(node: MapNode) {
	let mainRatingType = MapNode.GetMainRatingTypes(node)[0];
	return [`nodeRatings/${node._id}/${mainRatingType}`];
}
export function GetPaths_MainRatingAverage(node: MapNode) {
	let result = GetPaths_MainRatingSet(node);
	if (node.type == MapNodeType.Argument || node.type == MapNodeType.Argument)
		result.AddRange(GetPaths_CalculateArgumentStrength(node, GetNodeChildren(node)));
	return result;
}*/

/** Returns an int from 0 to 100. */
/*export function GetMainRatingAverage(node: MapNode, resultIfNoData = null): number {
	// if static category, always show full bar
	if (node._id < 100)
		return 100;
	return GetRatingAverage(node._id, MapNode.GetMainRatingTypes(node)[0], resultIfNoData);
}*/

/** Returns an int from 0 to 100. */
/*export function GetMainRatingFillPercent(node: MapNode) {
	let mainRatingAverage = GetMainRatingAverage(node);
	if (node.current.impactPremise && (node.current.impactPremise.thenType == ImpactPremise_ThenType.StrengthenParent || node.current.impactPremise.thenType == ImpactPremise_ThenType.WeakenParent))
		return mainRatingAverage != null ? mainRatingAverage.Distance(50) * 2 : 0;
	return mainRatingAverage || 0;
}*/
export function GetFillPercentForRatingAverage(node: MapNode, ratingAverage: number, reverseRating?: boolean) {
	ratingAverage = TransformRatingForContext(ratingAverage, reverseRating);
	/*if (node.current.impactPremise && (node.current.impactPremise.thenType == ImpactPremise_ThenType.StrengthenParent || node.current.impactPremise.thenType == ImpactPremise_ThenType.WeakenParent))
		return ratingAverage != null ? ratingAverage.Distance(50) * 2 : 0;*/
	return ratingAverage || 0;
}
export function TransformRatingForContext(ratingValue: number, reverseRating: boolean) {
	if (ratingValue == null) return null;
	if (reverseRating) return 100 - ratingValue;
	return ratingValue;
}

/*export function ShouldRatingTypeBeReversed(ratingType: RatingType, nodeReversed: boolean, contextReversed: boolean) {
	//return nodeReversed || (contextReversed && ratingType == "adjustment");
	return nodeReversed;
}*/
export function ShouldRatingTypeBeReversed(node: MapNodeL3) {
	//return node.type == MapNodeType.Argument && node.finalPolarity != node.link.polarity;
	return node.link.form == ClaimForm.Negation;
}