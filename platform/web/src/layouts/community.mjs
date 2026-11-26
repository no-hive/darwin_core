import {community} from '../content/community.mjs';
import {renderAboutStory} from './about-story.mjs';

export function renderCommunity(lang){
  const copy=community[lang];
  return renderAboutStory(lang,copy,[2,3],{1:{after:1,image:copy.images[2]}});
}
