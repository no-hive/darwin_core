"""Deterministic social cards using the site's original logo mask and fonts."""
import json,sys
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageColor
batch=json.load(sys.stdin)
assets=Path(batch['root'])/'src/site/assets'
logo=Image.open(assets/'dwc-crab-crystal-v2.png').convert('RGBA').getchannel('A')
for spec in batch['specs']:
    canvas=Image.new('RGB',(1200,630),spec['bg']);draw=ImageDraw.Draw(canvas)
    size=68
    while True:
        heading=ImageFont.truetype(str(assets/'fonts/albert-sans-500.ttf'),size)
        if draw.textlength(spec['title'],font=heading)<=1040 or size<=42:break
        size-=2
    draw.text((80,73),spec['title'],font=heading,fill=spec['ink'])
    width=draw.textlength(spec['title'],font=heading)
    draw.line((80,170,80+width,170),fill=spec['accent'],width=2)
    mask=logo.resize((round(191*logo.width/logo.height),191),Image.Resampling.LANCZOS)
    canvas.paste(ImageColor.getrgb(spec['accent']),(80+(152-mask.width)//2,278),mask)
    name=ImageFont.truetype(str(assets/'fonts/cormorant-garamond-400.ttf'),80)
    for i,word in enumerate(['Darwin','Core','Protocol']):draw.text((270,266+i*63),word,font=name,fill=spec['accent'])
    target=Path(batch['output'])/spec['file'].lstrip('/');target.parent.mkdir(parents=True,exist_ok=True)
    canvas.save(target,optimize=True)
