import {MapNodeType} from "../../Store/firebase/nodes/@MapNodeType";
import {MapNode, ClaimForm, MapNodeL2} from "../../Store/firebase/nodes/@MapNode";
import {GetRating, GetRatingValue, GetRatingSet} from "../../Store/firebase/nodeRatings";
import {GetRatingAverage, GetRatings} from "../../Store/firebase/nodeRatings";
import {Rating} from "../../Store/firebase/nodeRatings/@RatingsRoot";
import {GetRatingTypesForNode, GetNodeForm} from "../../Store/firebase/nodes/$node";
import {CachedTransform} from "js-vextensions";
import {emptyObj} from "./ReducerUtils";
import { ArgumentType } from "Store/firebase/nodes/@MapNodeRevision";

export function GetArgumentStrengthPseudoRating(argument: MapNodeL2, premises: MapNodeL2[], userID: string): Rating {
	if (premises.Any(a=>a == null)) return null; // must still be loading
	if (premises.length == 0) return null;

	let premiseProbabilities = premises.map(child=> {
		let ratingType = GetRatingTypesForNode(child)[0].type;
		let ratingValue = GetRatingValue(child._id, ratingType, userID, 0) / 100;
		let form = GetNodeForm(child, argument);
		let probability = form == ClaimForm.Negation ? 1 - ratingValue : ratingValue;
		return probability;
	});
	let combinedProbabilityOfPremises;
	if (argument.current.argumentType == ArgumentType.All)
		combinedProbabilityOfPremises = premiseProbabilities.reduce((total, current)=>total * current, 1);
	else if (argument.current.argumentType == ArgumentType.AnyTwo) {
		let strongest = premiseProbabilities.Max(null, true);
		let secondStrongest = premiseProbabilities.length > 1 ? premiseProbabilities.Except(strongest).Max(null, true) : 0;
		combinedProbabilityOfPremises = strongest * secondStrongest;
	} else 
		combinedProbabilityOfPremises = premiseProbabilities.Max(null, true);
	
	let impact = GetRatingValue(argument._id, "impact", userID, 0);
	//let strengthForType = adjustment.Distance(50) / 50;
	let strengthForType = impact / 100;
	var result = combinedProbabilityOfPremises * strengthForType;

	return {
		_key: userID,
		updated: null,
		value: (result * 100).RoundTo(1),
	};
}
//export function GetArgumentStrengthEntries(nodeChildren: MapNode[], users: string[]) {
/*export function GetArgumentStrengthPseudoRatings(nodeChildren: MapNode[]): Rating[] {
	if (nodeChildren.Any(a=>a == null)) return []; // must still be loading
	let impactPremise = nodeChildren.First(a=>a.impactPremise != null);
	let premises = nodeChildren.Except(impactPremise);
	if (premises.length == 0) return [];

	let usersWhoRated = nodeChildren.SelectMany(child=>GetRatings(child._id, MapNode.GetMainRatingTypes(child)[0]).map(a=>a._key)).Distinct();
	let result = usersWhoRated.map(userID=>GetArgumentStrengthPseudoRating(nodeChildren, userID));
	return result;
}*/
export function GetArgumentStrengthPseudoRatingSet(argument: MapNodeL2, premises: MapNodeL2[]): {[key: string]: Rating} {
	if (premises.Any(a=>a == null)) return emptyObj; // must still be loading
	if (premises.length == 0) return emptyObj;

	let childRatingSets = premises.map(child=> {
		return GetRatingSet(child._id, GetRatingTypesForNode(child).FirstOrX(null, {}).type) || emptyObj;
	});
	let dataUsedInCalculation = {...childRatingSets};

	let result = CachedTransform("GetArgumentStrengthPseudoRatingSet", [argument._id], dataUsedInCalculation, ()=> {
		let usersWhoRatedAllChildren = null;
		for (let [index, child] of premises.entries()) {
			let childRatingSet = childRatingSets[index];
			if (usersWhoRatedAllChildren == null) {
				usersWhoRatedAllChildren = {};
				for (let userID of childRatingSet.VKeys(true))
					usersWhoRatedAllChildren[userID] = true;
			} else {
				for (let userID in usersWhoRatedAllChildren) {
					if (childRatingSet[userID] == null)
						delete usersWhoRatedAllChildren[userID];
				}
			}
		}

		let result = {};
		for (let userID in usersWhoRatedAllChildren)
			result[userID] = GetArgumentStrengthPseudoRating(argument, premises, userID);
		return result;
	});
	return result;
}

/*export function CalculateArgumentStrength(nodeChildren: MapNode[]) {
	if (nodeChildren.Any(a=>a == null)) return 0; // must still be loading
	let impactPremise = nodeChildren.First(a=>a.impactPremise != null);
	let premises = nodeChildren.Except(impactPremise);
	if (premises.length == 0) return 0;

	let premiseProbabilities = premises.map(child=>GetRatingAverage(child._id, "probability", 0) / 100);
	let all = impactPremise.impactPremise.ifType == ImpactPremise_IfType.All;
	let combinedProbabilityOfPremises = all
		? premiseProbabilities.reduce((total, current)=>total * current, 1)
		: premiseProbabilities.Max(null, true);
	
	if (impactPremise.impactPremise.thenType == ImpactPremise_ThenType.StrengthenParent || impactPremise.impactPremise.thenType == ImpactPremise_ThenType.WeakenParent) {
		let averageAdjustment = GetRatingAverage(impactPremise._id, "adjustment", 50);
		let strengthForType = averageAdjustment.Distance(50) / 50;
		var result = combinedProbabilityOfPremises * strengthForType;
	} else {
		var result = combinedProbabilityOfPremises * (GetRatingAverage(impactPremise._id, "probability", 0) / 100);
	}
	return (result * 100).RoundTo(1);
}*/