import Markdown from "react-remarkable";
import Remarkable from "remarkable";
import RemarkableReactRenderer from "remarkable-react";
import {BaseComponent, ShallowChanged} from "../UI/ReactGlobals";
//import {Component as BaseComponent} from "react";
import {Segment, ParseSegmentsForPatterns} from "../General/RegexHelpers";
import {URL, GetCurrentURL} from "../General/URLs";
import Link from "./Link";
import {ReplacementFunc} from "./VReactMarkdown";

/*export default class VReactMarkdown_Remarkable extends BaseComponent
		<{source: string, replacements?: {[key: string]: ReplacementFunc}, style?},
		{}> {
	render() {
		let {source, replacements, style, containerProps, renderers, ...rest} = this.props;

		function OnMarkdownMountOrUnmount(comp: Markdown) {
			if (!comp) return;
			//let oldRules = {...c.md.renderer.rules};
			comp.md.renderer.rules.link_open = function(tokens, idx, options, env) {
				//let result = oldRules.link_open(tokens, idx, options, env);
				let url = URL.Parse(tokens[idx].href);
				let openInNewTab = url.domain != GetCurrentURL().domain;

				var title = tokens[idx].title ? ` title="${encodeURIComponent(tokens[idx].title)}"` : "";
				var target = openInNewTab ? ` target="_blank"` : "";
				return `<a href="${encodeURI(tokens[idx].href)}"${title}${target}>`;
			};
			comp.forceUpdate();
		}
		
		if (replacements) {
			let patterns = replacements.VKeys().map((regexStr, index)=>({name: index+"", regex: new RegExp(regexStr)}));
			let segments = ParseSegmentsForPatterns(source, patterns);
			return (
				<div>
					{segments.map((segment, index)=> {
						if (segment.patternMatched == null) {
							if (replacements.default) {
								return replacements.default(segment, index).VAct(a=>a.key = index);
							}
							return <Markdown {...rest} key={index} container="div" source={segment.textParts[0]} ref={OnMarkdownMountOrUnmount}/>;
						}
						let renderFuncForReplacement = replacements.VValues()[segment.patternMatched];
						return renderFuncForReplacement(segment, index).VAct(a=>a.key = index);
					})}
				</div>
			);
		}

		return <Markdown {...rest} container="dev" source={source} ref={OnMarkdownMountOrUnmount}/>;
	}
}*/

type Props = {
	source: string, markdownOptions?, rendererOptions?,
	replacements?: {[key: string]: ReplacementFunc}, extraInfo?, containerType?, style?
} & React.HTMLProps<HTMLDivElement>;
export default class VReactMarkdown_Remarkable extends BaseComponent<Props, {}> {
	static defaultProps = {containerType: "div"};
	
	markdown: Remarkable;
	InitMarkdown(props) {
		let {extraInfo, markdownOptions, rendererOptions} = props;
		this.markdown = new Remarkable(markdownOptions);

		let rendererOptions_final = {...rendererOptions};
		rendererOptions_final.components = {...rendererOptions_final.components};
		if (rendererOptions_final.components.a == null) rendererOptions_final.components.a = (props=> {
			let {href, target, ...rest} = props;
			let toURL = URL.Parse(href);
			if (target == null && toURL.domain != GetCurrentURL().domain) {
				target = "_blank";
			}
			return <Link {...rest} to={href} target={target}/>;
		});
		/*if (rendererOptions_final.components.htmlblock == null) rendererOptions_final.components.htmlblock = (props=> {
			let {content} = props;
			return <div dangerouslySetInnerHTML={{__html: content}}/>;
		});
		if (rendererOptions_final.components.htmltag == null) rendererOptions_final.components.htmltag = (props=> {
			let {content} = props;
			return <span dangerouslySetInnerHTML={{__html: content}}/>;
		});
		rendererOptions_final.tokens = {...rendererOptions_final.tokens};
		if (rendererOptions_final.tokens.htmlblock == null) rendererOptions_final.tokens.htmlblock = "htmlblock";
		if (rendererOptions_final.tokens.htmltag == null) rendererOptions_final.tokens.htmltag = "htmltag";*/

		this.markdown.renderer = new RemarkableReactRenderer(rendererOptions_final);
	}

	ComponentWillReceiveProps(props) {
		if (ShallowChanged(props.markdownOptions, this.props.markdownOptions) || ShallowChanged(props.rendererOptions, this.props.rendererOptions)) {
			this.InitMarkdown(props);
		}
	}

	render() {
		let {source, extraInfo, markdownOptions, rendererOptions, replacements, containerType, style, ...rest} = this.props;
		//source = source || this.FlattenedChildren.join("\n\n");

		if (this.markdown == null) {
			this.InitMarkdown(this.props);
		}

		if (replacements) {
			let patterns = replacements.VKeys().map((regexStr, index)=>({name: index+"", regex: new RegExp(regexStr)}));
			let segments = ParseSegmentsForPatterns(source, patterns);
			let segmentUIs = segments.map((segment, index)=> {
				if (segment.patternMatched == null) {
					if (replacements.default) {
						return replacements.default(segment, index, extraInfo).VAct(a=>a.key = index);
					}
					let text = segment.textParts[0].replace(/\r/g, "");
					return (
						<VReactMarkdown_Remarkable key={index} source={text} extraInfo={extraInfo}
							markdownOptions={markdownOptions} rendererOptions={rendererOptions}
							style={E({
								marginTop: text.startsWith("\n\n") ? 15 : text.startsWith("\n") ? 5 : 0,
								marginBottom: text.endsWith("\n\n") ? 15 : text.endsWith("\n") ? 5 : 0,
							})}/>
					);
				}
				let renderFuncForReplacement= replacements.VValues()[segment.patternMatched] as ReplacementFunc;
				return renderFuncForReplacement(segment, index, extraInfo).VAct(a=>a.key = index);
			});
			return React.createElement(containerType, {style}, segmentUIs);
		}

		let markdownResult = this.markdown.render(source);
		return React.createElement(containerType, {...rest, style}, markdownResult);
	}
}