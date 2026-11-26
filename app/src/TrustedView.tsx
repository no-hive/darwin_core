import {createElement,Fragment} from 'react';
import parse,{attributesToProps,domToReact,Element,type HTMLReactParserOptions,type DOMNode} from 'html-react-parser';
import type {ReactNode} from 'react';

interface Props {html:string;query:string;setQuery:(value:string)=>void;selected:string[];onCategories:(types:string[])=>void;suggestions:ReactNode}
/** Compatibility renderer: trusted, escaped application templates become real
 * React elements. Never pass CMS markup or unescaped user HTML to this bridge. */
export function TrustedView({html,query,setQuery,selected,onCategories,suggestions}:Props){
  const options:HTMLReactParserOptions={replace(node,index){
    if(!(node instanceof Element))return;
    if(['script','iframe','object'].includes(node.name))return <Fragment/>;
    const a=node.attribs,props=attributesToProps(a) as Record<string,any>;
    const key=a.id||a['data-id']&&`${a['data-entity']}:${a['data-id']}`||index;
    props.key=key;
    // The document assembler trims class lists. Use the same representation
    // before SSR and hydration, including omission of empty class attributes.
    if(typeof props.className==='string'){props.className=props.className.trim().replace(/\s+/g,' ');if(!props.className)delete props.className;}
    if(node.name==='input'&&a.type==='radio'){
      props.defaultChecked=Object.hasOwn(a,'checked');delete props.checked;
      props.key=String(key)+':'+Boolean(props.defaultChecked);
    }
    if(node.name==='option')delete props.selected;
    if(node.name==='select'){
      const choices=node.children.filter(child=>child instanceof Element&&child.name==='option') as Element[];
      const value=choices.find(option=>Object.hasOwn(option.attribs,'selected'))?.attribs.value||choices[0]?.attribs.value||'';
      props.defaultValue=value;props.key=String(key)+':'+value;
    }
    if(node.name==='input'&&a.name==='q'){
      delete props.defaultValue;props.value=query;props.onChange=(event:any)=>setQuery(event.target.value);
      if(Object.hasOwn(a,'data-scan-query'))props['aria-expanded']=Boolean(suggestions);
    }
    if(node.name==='input'&&Object.hasOwn(a,'data-category')){
      delete props.defaultChecked;props.checked=selected.includes(a['data-category']);
      props.onChange=(event:any)=>onCategories(event.target.checked?[...selected,a['data-category']]:selected.filter(type=>type!==a['data-category']));
    }
    if(a.id==='scan-suggestions'){
      props.hidden=!suggestions;props['aria-label']=a['aria-label'];
      return createElement(node.name,props,suggestions);
    }
    return node.children.length?createElement(node.name,props,domToReact(node.children as DOMNode[],options)):createElement(node.name,props);
  }};
  return <>{parse(html,options)}</>;
}
