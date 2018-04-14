import DeleteNode from "../../../../Server/Commands/DeleteNode";
import {GetDataAsync, RemoveHelpers, SlicePath, WaitTillPathDataIsReceiving, WaitTillPathDataIsReceived} from "../../../../Frame/Database/DatabaseHelpers";
import {MapNode, MapNodeL2, Polarity, ChildEntry} from "../../../../Store/firebase/nodes/@MapNode";
import {PermissionGroupSet} from "../../../../Store/firebase/userExtras/@UserExtraInfo";
import {VMenuStub} from "react-vmenu";
import {MapNodeType, MapNodeType_Info, GetMapNodeTypeDisplayName} from "../../../../Store/firebase/nodes/@MapNodeType";
import {GetUserID, GetUserPermissionGroups} from "../../../../Store/firebase/users";
import {RootState} from "../../../../Store";
import {VMenu} from "react-vmenu";
import {BaseComponent} from "react-vextensions";
import {Div, Pre} from "react-vcomponents";
import {ShowMessageBox} from "react-vmessagebox";
import {WaitXThenRun} from "js-vextensions";
import {TextInput} from "react-vcomponents";
import {styles} from "../../../../Frame/UI/GlobalStyles";
import {DN} from "js-vextensions";
import keycode from "keycode";
import {firebaseConnect} from "react-redux-firebase";
import {connect} from "react-redux";
import {ACTNodeCopy, GetCopiedNode} from "../../../../Store/main";
import {Select} from "react-vcomponents";
import {GetEntries, GetValues} from "../../../../Frame/General/Enums";
import {VMenuItem} from "react-vmenu/dist/VMenu";
import {ForDelete_GetError, ForUnlink_GetError, GetNode, GetNodeChildrenAsync, GetNodeParentsAsync, GetParentNode, IsLinkValid, IsNewLinkValid, IsNodeSubnode, GetParentNodeL3, GetNodeID} from "../../../../Store/firebase/nodes";
import {Connect} from "../../../../Frame/Database/FirebaseConnect";
import {SignInPanel, ShowSignInPopup} from "../../NavBar/UserPanel";
import {IsUserBasicOrAnon, IsUserCreatorOrMod} from "../../../../Store/firebase/userExtras";
import {ClaimForm, MapNodeL3} from "../../../../Store/firebase/nodes/@MapNode";
import {ShowAddChildDialog} from "./NodeUI_Menu/AddChildDialog";
import { GetNodeChildren, ForCut_GetError, ForCopy_GetError } from "../../../../Store/firebase/nodes";
import {E} from "js-vextensions";
import {GetNodeDisplayText, GetValidNewChildTypes, GetNodeForm, GetNodeL3} from "../../../../Store/firebase/nodes/$node";
import {Map} from "../../../../Store/firebase/maps/@Map";
import LinkNode from "Server/Commands/LinkNode";
import UnlinkNode from "Server/Commands/UnlinkNode";
import CloneNode from "Server/Commands/CloneNode";
import {SplitStringBySlash_Cached} from "Frame/Database/StringSplitCache";
import { ShowAddSubnodeDialog } from "UI/@Shared/Maps/MapNode/NodeUI_Menu/AddSubnodeDialog";
import { GetPathNodes, GetPathNodeIDs } from "../../../../Store/main/mapViews";
import {GetNodeL2} from "Store/firebase/nodes/$node";
import {ACTSetLastAcknowledgementTime} from "Store/main";
import {GetTimeFromWhichToShowChangedNodes} from "Store/main/maps/$map";
import {GetPathsToNodesChangedSinceX} from "../../../../Store/firebase/mapNodeEditTimes";
import { MapNodeRevision } from "Store/firebase/nodes/@MapNodeRevision";
import {SetNodeUILocked} from "./NodeUI";
import AddChildNode from "../../../../Server/Commands/AddChildNode";
import { ACTMapNodeExpandedSet } from "Store/main/mapViews/$mapView/rootNodeViews";

type Props = {map: Map, node: MapNodeL3, path: string, inList?: boolean}
	& Partial<{permissions: PermissionGroupSet, parentNode: MapNodeL2, copiedNode: MapNodeL3, copiedNode_asCut: boolean, pathsToChangedInSubtree: string}>;
@Connect((_: RootState, {map, node, path}: Props)=> {
	let sinceTime = GetTimeFromWhichToShowChangedNodes(map._id);
	let pathsToChangedNodes = GetPathsToNodesChangedSinceX(map._id, sinceTime);
	let pathsToChangedInSubtree = pathsToChangedNodes.filter(a=>a == path || a.startsWith(path + "/")); // also include self, for this
	return ({
		_: (ForUnlink_GetError(GetUserID(), map, node), ForDelete_GetError(GetUserID(), map, node)),
		//userID: GetUserID(), // not needed in Connect(), since permissions already watches its data
		permissions: GetUserPermissionGroups(GetUserID()),
		parentNode: GetParentNodeL3(path),
		copiedNode: GetCopiedNode(),
		copiedNode_asCut: State(a=>a.main.copiedNodePath_asCut),
		pathsToChangedInSubtree,
	});
})
export default class NodeUI_Menu extends BaseComponent<Props, {}> {
	render() {
		let {map, node, path, inList, permissions, parentNode, copiedNode, copiedNode_asCut, pathsToChangedInSubtree} = this.props;
		let userID = GetUserID();
		let firebase = store.firebase.helpers;
		//let validChildTypes = MapNodeType_Info.for[node.type].childTypes;
		let validChildTypes = GetValidNewChildTypes(node, path, permissions);
		let formForClaimChildren = node.type == MapNodeType.Category ? ClaimForm.YesNoQuestion : ClaimForm.Base;

		let nodeText = GetNodeDisplayText(node, path);

		return (
			<VMenuStub preOpen={e=>e.passThrough != true}>
				{IsUserBasicOrAnon(userID) && !inList && validChildTypes.map(childType=> {
					let childTypeInfo = MapNodeType_Info.for[childType];
					//let displayName = GetMapNodeTypeDisplayName(childType, node, form);
					let polarities = childType == MapNodeType.Argument ? [Polarity.Supporting, Polarity.Opposing] : [null];
					return polarities.map(polarity=> {
						let displayName = GetMapNodeTypeDisplayName(childType, node, ClaimForm.Base, polarity);
						return (
							<VMenuItem key={childType + "_" + polarity} text={`Add ${displayName}`} style={styles.vMenuItem} onClick={e=> {
								if (e.button != 0) return;
								if (userID == null) return ShowSignInPopup();
								
								ShowAddChildDialog(node, path, childType, polarity, userID, map._id);
							}}/>
						);
					});
				})}
				{IsUserBasicOrAnon(userID) && !inList && path.includes("/") && !path.includes("L") &&
					<VMenuItem text="Add subnode (in layer)" style={styles.vMenuItem}
						onClick={e=> {
							if (e.button != 0) return;
							if (userID == null) return ShowSignInPopup();
							ShowAddSubnodeDialog(map._id, node, path);
						}}/>}
				{IsUserBasicOrAnon(userID) &&
					<VMenuItem text="Convert to multi-premise" style={styles.vMenuItem}
						onClick={async e=> {
							if (e.button != 0) return;

							let newNode = new MapNode({
								parents: {[parentNode._id]: {_: true}},
								type: MapNodeType.Claim,
							});
							let newRevision = new MapNodeRevision({titles: {base: "Second premise (click to edit)"}});
							let newLink = {_: true, form: ClaimForm.Base} as ChildEntry;

							SetNodeUILocked(parentNode._id, true);
							let info = await new AddChildNode({mapID: map._id, node: newNode, revision: newRevision, link: newLink}).Run();
							store.dispatch(new ACTMapNodeExpandedSet({mapID: map._id, path: path + "/" + info.nodeID, expanded: true, recursive: false}));
							store.dispatch(new ACTSetLastAcknowledgementTime({nodeID: info.nodeID, time: Date.now()}));

							await WaitTillPathDataIsReceiving(`nodeRevisions/${info.revisionID}`);
							await WaitTillPathDataIsReceived(`nodeRevisions/${info.revisionID}`);
							SetNodeUILocked(parentNode._id, false);
						}}/>}
				{pathsToChangedInSubtree.length > 0 &&
					<VMenuItem text="Mark subtree as viewed" style={styles.vMenuItem}
						onClick={e=> {
							if (e.button != 0) return;
							for (let path of pathsToChangedInSubtree) {
								store.dispatch(new ACTSetLastAcknowledgementTime({nodeID: GetNodeID(path), time: Date.now()}));
							}
						}}/>}
				{IsUserBasicOrAnon(userID) && !inList &&
					<VMenuItem text={copiedNode ? <span>Cut <span style={{fontSize: 10, opacity: .7}}>(right-click to clear)</span></span> as any : `Cut`}
						enabled={ForCut_GetError(userID, map, node) == null} title={ForCut_GetError(userID, map, node)}
						style={styles.vMenuItem}
						onClick={e=> {
							e.persist();
							if (e.button == 0) {
								store.dispatch(new ACTNodeCopy({path, asCut: true}));
							} else {
								store.dispatch(new ACTNodeCopy({path: null, asCut: true}));
							}
						}}/>}
				{IsUserBasicOrAnon(userID) &&
					<VMenuItem text={copiedNode ? <span>Copy <span style={{fontSize: 10, opacity: .7}}>(right-click to clear)</span></span> as any : `Copy`} style={styles.vMenuItem}
						enabled={ForCopy_GetError(userID, map, node) == null} title={ForCopy_GetError(userID, map, node)}
						onClick={e=> {
							e.persist();
							if (e.button == 0) {
								store.dispatch(new ACTNodeCopy({path, asCut: false}));
							} else {
								store.dispatch(new ACTNodeCopy({path: null, asCut: false}));
							}
						}}/>}
				{IsUserBasicOrAnon(userID) && copiedNode && IsNewLinkValid(node, path, copiedNode, permissions) &&
					<VMenuItem text={`Paste${copiedNode_asCut ? "" : " as link"}: "${GetNodeDisplayText(copiedNode, null, formForClaimChildren).KeepAtMost(50)}"`}
						style={styles.vMenuItem} onClick={e=> {
							if (e.button != 0) return;
							if (userID == null) return ShowSignInPopup();

							if (copiedNode.type == MapNodeType.Argument && !copiedNode_asCut) {
								return void ShowMessageBox({title: `Argument at two locations?`, cancelButton: true, onOK: proceed, message:
`Are you sure you want to paste this argument as a linked child?

Only do this if you're sure that the impact-premise applies exactly the same to both the old parent and the new parent.${""
	} (usually it does not, ie. usually it's specific to its original parent claim)

If not, paste the argument as a clone instead.`
								});
							}
							proceed();

							async function proceed() {
								await new LinkNode(E(
									{mapID: map._id, parentID: node._id, childID: copiedNode._id},
									copiedNode.type == MapNodeType.Claim && {childForm: formForClaimChildren},
									copiedNode.type == MapNodeType.Argument && {childPolarity: copiedNode.link.polarity},
								)).Run();
								if (copiedNode_asCut) {
									let baseNodePath = State(a=>a.main.copiedNodePath);		
									let baseNodePath_ids = GetPathNodeIDs(baseNodePath);
									await new UnlinkNode({mapID: map._id, parentID: baseNodePath_ids.XFromLast(1), childID: baseNodePath_ids.Last()}).Run();
								}
							}
						}}/>}
				{IsUserBasicOrAnon(userID) && copiedNode && IsNewLinkValid(node, path, copiedNode.Extended({_id: -1}), permissions) && !copiedNode_asCut &&
					<VMenuItem text={`Paste as clone: "${GetNodeDisplayText(copiedNode, null, formForClaimChildren).KeepAtMost(50)}"`} style={styles.vMenuItem} onClick={async e=> {
						if (e.button != 0) return;
						if (userID == null) return ShowSignInPopup();

						let baseNodePath = State(a=>a.main.copiedNodePath);
						let baseNodePath_ids = GetPathNodeIDs(baseNodePath);
						let info = await new CloneNode({mapID: map._id, baseNodePath, newParentID: node._id}).Run();

						store.dispatch(new ACTSetLastAcknowledgementTime({nodeID: info.nodeID, time: Date.now()}));
						
						if (copiedNode_asCut) {
							await new UnlinkNode({mapID: map._id, parentID: baseNodePath_ids.XFromLast(1), childID: baseNodePath_ids.Last()}).Run();
						}
					}}/>}
				{IsUserCreatorOrMod(userID, node) && !inList &&
					<VMenuItem text="Unlink" enabled={ForUnlink_GetError(userID, map, node) == null} title={ForUnlink_GetError(userID, map, node)}
						style={styles.vMenuItem} onClick={async e=> {
							if (e.button != 0) return;
							/*let error = ForUnlink_GetError(userID, node);
							if (error) {
								return void ShowMessageBox({title: `Cannot unlink`, message: error});
							}*/
							
							/*let parentNodes = await GetNodeParentsAsync(node);
							if (parentNodes.length <= 1) {*/
							/*if (node.parents.VKeys(true).length <= 1) {
								return void ShowMessageBox({title: `Cannot unlink`, message: `Cannot unlink this child, as doing so would orphan it. Try deleting it instead.`});
							}*/

							//let parent = parentNodes[0];
							let parentText = GetNodeDisplayText(parentNode, path.substr(0, path.lastIndexOf(`/`)));
							ShowMessageBox({
								title: `Unlink child "${nodeText}"`, cancelButton: true,
								message: `Unlink the child "${nodeText}" from its parent "${parentText}"?`,
								onOK: ()=> {
									new UnlinkNode({mapID: map._id, parentID: parentNode._id, childID: node._id}).Run();
								}
							});
						}}/>}
				{IsUserCreatorOrMod(userID, node) &&
					<VMenuItem text="Delete" enabled={ForDelete_GetError(userID, map, node) == null} title={ForDelete_GetError(userID, map, node)}
						style={styles.vMenuItem} onClick={e=> {
							if (e.button != 0) return;
							/*let error = ForDelete_GetError(userID, node);
							if (error) {
								return void ShowMessageBox({title: `Cannot delete`, message: error});
							}*/

							//let parentNodes = await GetNodeParentsAsync(node);
							/*if (node.parents.VKeys(true).length > 1) {
								return void ShowMessageBox({title: `Cannot delete`, message: `Cannot delete this child, as it has more than one parent. Try unlinking it instead.`});
							}*/
							//let s_ifParents = parentNodes.length > 1 ? "s" : "";
							let contextStr = IsNodeSubnode(node) ? ", and its placement in-layer" : ", and its link with 1 parent";

							ShowMessageBox({
								title: `Delete "${nodeText}"`, cancelButton: true,
								message: `Delete the node "${nodeText}"${contextStr}?`,
								onOK: ()=> {
									new DeleteNode({mapID: map._id, nodeID: node._id}).Run();
								}
							});
						}}/>}
			</VMenuStub>
		);
	}
}