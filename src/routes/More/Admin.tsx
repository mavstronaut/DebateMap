import {styles} from "../../Frame/UI/GlobalStyles";
import {BaseComponent, BaseProps} from "../../Frame/UI/ReactGlobals";
import {firebaseConnect} from "react-redux-firebase";
import Button from "../../Frame/ReactComponents/Button";
import VMessageBox from "../../Frame/UI/VMessageBox";
import {MapNode, MapNodeType} from "../@Shared/Maps/MapNode";
import {ShowMessageBox} from "../../Frame/UI/VMessageBox";
import {Map, MapType} from "../@Shared/Maps/Map";
import {E} from "../../Frame/General/Globals_Free";

@firebaseConnect()
export default class AdminUI extends BaseComponent<{}, {}> {
	render() {
		let {firebase} = this.props;
		return (
			<div style={E(styles.page)}>
				<Button text="Reset database" onClick={()=> {
					ShowMessageBox({
						title: "Reset database?", message: "This will clear all existing data.", cancelButton: true,
						onOK: async ()=> {
							/*await firebase.Ref("nodes").remove();
							let rootNode: MapNode = {
								type: MapNodeType.Category,
								title: "Root",
								agrees: 0, degree: 0, disagrees: 0, weight: 0, // averages, generated by server
								creator: null,
								approved: true,
								accessLevel: 0, voteLevel: 0,
								supportChildren: {},
								opposeChildren: {},
								talkChildren: {},
							};
							await firebase.Ref(`nodes/${1}`).set(rootNode);
							ShowMessageBox({message: "Done!"});*/

							let user1Key = "Ecq3r7NvgahaMwQQ3PsdgqAFirD2";
							let data = {
								users: {
									[user1Key]: {
										avatarUrl: "https://lh6.googleusercontent.com/-CeOB1puP1U8/AAAAAAAAAAI/AAAAAAAAAZA/nk51qe4EF8w/photo.jpg",
										displayName: "Stephen Wicklund",
										email: "venryx@gmail.com",
										providerData: [
											{
												displayName: "Stephen Wicklund",
												email: "venryx@gmail.com",
												photoURL: "https://lh6.googleusercontent.com/-CeOB1puP1U8/AAAAAAAAAAI/AAAAAAAAAZA/nk51qe4EF8w/photo.jpg",
												providerId: "google.com",
												uid: "108415649882206100036"
											}
										]
									}
								},
								maps: {
									e1: {
										name: "Global",
										type: MapType.Global,
										rootNode: "e1"
									} as Map,
								},
								nodes: {
									e1: new MapNode({
										type: MapNodeType.Category, title: "Root",
										creator: user1Key, approved: true,
										agrees: 1, degree: .7, disagrees: 0, weight: 0, // totals/averages, generated by server
										children: {e2: {}, e3: {}, e4: {}, e5: {}, e6: {}, e7: {}, e8: {}, e9: {}}, talkRoot: null,
									}),
									e2: new MapNode({
										type: MapNodeType.Category, title: "Worldviews",
										creator: user1Key, approved: true,
									}),
									e3: new MapNode({
										type: MapNodeType.Category, title: "Science",
										creator: user1Key, approved: true,
									}),
									e4: new MapNode({
										type: MapNodeType.Category, title: "Philosophy",
										creator: user1Key, approved: true,
									}),
									e5: new MapNode({
										type: MapNodeType.Category, title: "Documents",
										creator: user1Key, approved: true,
									}),
									e6: new MapNode({
										type: MapNodeType.Category, title: "History",
										creator: user1Key, approved: true,
									}),
									e7: new MapNode({
										type: MapNodeType.Category, title: "Politics",
										creator: user1Key, approved: true,
									}),
									e8: new MapNode({
										type: MapNodeType.Category, title: "Policies",
										creator: user1Key, approved: true,
									}),
									e9: new MapNode({
										type: MapNodeType.Category, title: "Others",
										creator: user1Key, approved: true,
									}),
								},
								nodeExtras: {
									e1: {
										/*title:{^}
											revisions:{^}
												e1:{^}
													content:"If something in the universe has expanded, its age in years is at least half its expansion distance in [light years]"
													creator:"user123"
													date:"date123"
												e2:{^}
													content:"Things that reach a length of X [light years] through expansion (in one direction) (from [negligible size]) are at least X years old"
													creator:"user123"
													date:"date123"
											termBindings:{^}
												"light years":{^}
													light-year-10:{^}
														upvoters:{^}
															user123:true*/
										agrees: {
											Ecq3r7NvgahaMwQQ3PsdgqAFirD2: .7
										},
										disagrees: {
										}
									}
								}
							};

							await firebase.Ref().update({
								
							});
							ShowMessageBox({message: "Done!"});
						}
					});
				}}/>
			</div>
		);
	}
}