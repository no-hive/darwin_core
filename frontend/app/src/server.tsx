import {renderToString} from 'react-dom/server';
import {Application} from './Application';
import type {Bootstrap} from './types';
export function renderApp(bootstrap:Bootstrap){return renderToString(<Application bootstrap={bootstrap}/>);}
