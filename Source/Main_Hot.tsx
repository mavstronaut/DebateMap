import "./Frame/General/Globals";
import {ParseModuleData, Require} from "webpack-runtime-require";
import {Store} from "redux";
import {RootState, MakeRootReducer} from "./Store/index";
import {FirebaseApp, DBPath, GetData} from "./Frame/Database/DatabaseHelpers";
import ReactDOM from "react-dom";
import StackTrace from "stacktrace-js";
import React from "react/lib/ReactWithAddons";
import {OnAccessPath, Connect} from "./Frame/Database/FirebaseConnect";
import "./Store/firebase/nodeRatings/@RatingsRoot";
import {State_overrides, State_Options} from "./UI/@Shared/StateOverrides";
import {JSVE, DeepGet} from "js-vextensions";
import "./Frame/General/Logging";
import "./Frame/General/Testing";
import {Manager as Manager_Forum} from "firebase-forum";
import {Manager as Manager_Feedback} from "firebase-feedback";
import Moment from "moment";
import {GetNewURL} from "./Frame/URL/URLManager";
import {replace, push} from "redux-little-router";
import {GetUserID, GetUser} from "Store/firebase/users";
import {ShowSignInPopup} from "UI/@Shared/NavBar/UserPanel";
import {GetDataAsync, GetAsync, ApplyDBUpdates} from "Frame/Database/DatabaseHelpers";
import {GetUserPermissionGroups} from "./Store/firebase/users";
import VReactMarkdown_Remarkable from "./Frame/ReactComponents/VReactMarkdown_Remarkable";

JSVE.logFunc = Log;

// converts firestore-paths into firebase-paths
function ToFirebasePath(path: string) {
	if (!IsString(path)) return path;
	return path.replace(/\./g, "");
}

//g.FirebaseConnect = Connect;
let sharedData = {
	//store: null, // set below
	rootReducer: MakeRootReducer(),
	State_overrides,
	GetNewURL,
	FormatTime: (time: number, formatStr: string)=> {
		if (formatStr == "[calendar]") {
			let result = Moment(time).calendar();
			//if (result.includes("/")) return Moment(time).format("YYYY-MM-DD");
			return result;
		}
		return Moment(time).format(formatStr);
	},
	
	router_replace: replace,
	router_push: push,
	
	logTypes: g.logTypes,

	//FirebaseConnect: Connect, // must set "window.FirebaseConnect" manually
	State,
	GetData: (options, ...pathSegments)=>GetData(E(options, {inVersionRoot: false}), ...pathSegments.map(ToFirebasePath)),
	GetDataAsync: (options, ...pathSegments)=>GetDataAsync(E(options, {inVersionRoot: false}), ...pathSegments.map(ToFirebasePath)),
	GetAsync,
	ShowSignInPopup,
	GetUserID,
	GetUser,
	GetUserPermissionGroups,

	ApplyDBUpdates: (rootPath: string, dbUpdates)=> {
		/*for (let {name: localPath, value} of dbUpdates.Props()) {
			//dbUpdates[ToFirebasePath(rootPath + "/" + localPath)] = value;
			dbUpdates[ToFirebasePath(localPath)] = value;
			delete dbUpdates[localPath];
		}
		ApplyDBUpdates(rootPath, dbUpdates);*/
		ApplyDBUpdates(rootPath, dbUpdates.Props().ToMap(prop=>ToFirebasePath(prop.name), prop=>prop.value));
	},

	MarkdownRenderer: VReactMarkdown_Remarkable,
};

Manager_Forum.VSet(sharedData.Extended({
	storePath_mainData: "forum",
	storePath_dbData: DBPath("forum"),
}));
Manager_Feedback.VSet(sharedData.Extended({
	storePath_mainData: "feedback",
	storePath_dbData: DBPath("feedback"),
}));

// uncomment this if you want to load the source-maps and such ahead of time (making-so the first actual call can get it synchronously)
//StackTrace.get();

// temp
/*let oldReplace = require("redux-little-router").replace;
require("redux-little-router").replace = function() {
	Log("Test:" + arguments[0], true);
	return oldReplace.apply(this, arguments);
}
let oldPush = require("redux-little-router").push;
require("redux-little-router").push = function() {
	Log("Test2:" + arguments[0], true);
	return oldPush.apply(this, arguments);
}*/

let createStore = require("./Frame/Store/CreateStore").default;

declare global { var store: Store<RootState> & {firebase: FirebaseApp}; }
var store = createStore(g.__InitialState__, {}) as Store<RootState>;
G({store});

Manager_Forum.store = store;
Manager_Feedback.store = store;

//setTimeout(()=> {
const mountNode = document.getElementById(`root`);
let {RootUIWrapper} = require(`./UI/Root`);
ReactDOM.render(<RootUIWrapper store={store}/>, mountNode);
//});

if (devEnv) {
	SetUpRR();
} else {
	G({RR: SetUpRR()})
}

function SetUpRR() {
	setTimeout(()=> {
		ParseModuleData();
		G({R: Require});
		let RR = {};
		for (let {name: moduleName, value: moduleExports} of (Require as any).Props()) {
			try {
				for (let key in moduleExports) {
					let finalKey = key;
					while (finalKey in RR) finalKey += `_`;
					RR[finalKey] = moduleExports[key];
				}
				if (moduleExports.default) {
					let finalKey = moduleName;
					while (finalKey in RR) finalKey += `_`;
					RR[finalKey] = moduleExports.default;
				}
			} catch (ex) {}
		}
		G({RR});
	});
}

// patch React.createElement to do early prop validation
// ==========
let createElement_old = React.createElement;
React.createElement = function(componentClass, props) {
	if (componentClass.ValidateProps) {
		componentClass.ValidateProps(props);
	}
	return createElement_old.apply(this, arguments);
};