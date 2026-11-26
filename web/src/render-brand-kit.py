"""Export the approved brand artwork as opaque PNGs, plus a reproducible ZIP.

Run from the checkout with Python, Pillow and fontTools. The mascot's source
luminance is the same tonal mask used in navigation; no AI redraw is involved.
"""
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

from fontTools.ttLib import TTFont
from PIL import Image, ImageColor, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'src/site/assets'
OUTPUT = ASSETS / 'brand-kit'
ETHEREUM = '#627eea'
exported = []

font = TTFont(ASSETS / 'fonts/cormorant-garamond-600.woff')
font.flavor = None
font_bytes = BytesIO()
font.save(font_bytes)


def face(size):
    return ImageFont.truetype(BytesIO(font_bytes.getvalue()), size)


source = Image.open(ASSETS / 'dwc-crab-crystal-tonal.png').convert('RGBA')
source = source.crop((223, 126, 1100, 1115))
# CSS luminance masking uses the sRGB components, multiplied by source alpha.
mask = Image.new('L', source.size)
mask.putdata([
    round((.2125 * r + .7154 * g + .0721 * b) * a / 255)
    for r, g, b, a in source.get_flattened_data()
])


def mascot(color, height):
    size = (round(mask.width * height / mask.height), height)
    image = Image.new('RGBA', size, ImageColor.getrgb(color))
    image.putalpha(mask.resize(size, Image.Resampling.LANCZOS))
    return image


def lettering(words, size, multiline=False):
    """Render the navigation font, weight and tracking with real glyph metrics."""
    font = face(size)
    lines = words.split(' ') if multiline else [words]
    canvas = Image.new('L', (size * 15, size * 5))
    draw = ImageDraw.Draw(canvas)
    for row, line in enumerate(lines):
        baseline = size + row * round(size * .87)
        for index, letter in enumerate(line):
            x = size + draw.textlength(line[:index], font=font) - index * size * .025
            draw.text((x, baseline), letter, fill=255, font=font, anchor='ls')
    return canvas.crop(canvas.getbbox())


def paste_text(canvas, text, color, xy):
    canvas.paste(ImageColor.getrgb(color), xy, text)


def save(canvas, group, name):
    target = OUTPUT / group / name
    target.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert('RGB').save(target, optimize=True)
    exported.append(target)


def centered(canvas, image, center):
    xy = (round(center[0] - image.width / 2), round(center[1] - image.height / 2))
    canvas.paste(image, xy, image if image.mode == 'RGBA' else None)


canvas = Image.new('RGB', (2400, 400), '#000000')
text = lettering('Darwin Core Protocol', 240)
paste_text(canvas, text, ETHEREUM, ((2400-text.width)//2, (400-text.height)//2))
save(canvas, 'core', 'darwin-core-protocol-wordmark-2400x400.png')

canvas = Image.new('RGB', (2400, 400), '#000000')
logo = mascot(ETHEREUM, 300)
text = lettering('Darwin Core Protocol', 165)
gap = 48
left = (canvas.width - logo.width - gap - text.width) // 2
centered(canvas, logo, (left + logo.width / 2, 200))
paste_text(canvas, text, ETHEREUM, (left + logo.width + gap, (400-text.height)//2))
save(canvas, 'core', 'darwin-core-protocol-lockup-2400x400.png')

# Logo 1 uses the approved supplied composition, without changing its crop.
canvas = Image.open(ASSETS / 'brand-logo-1-approved.png').convert('RGB')
if canvas.size != (1000, 1000):
    canvas = canvas.resize((1000, 1000), Image.Resampling.LANCZOS)
save(canvas, 'core', 'darwin-core-protocol-mark-1000x1000.png')

# This approved composition includes its own square, ground and overhanging shell.
canvas = Image.open(ASSETS / 'footer-mascot-frame.png').convert('RGB')
canvas = canvas.resize((1000, 1000), Image.Resampling.LANCZOS)
save(canvas, 'core', 'darwin-core-protocol-framed-mark-1000x1000.png')

themes = [
    ('concept', '#bacb79', '#08150d'),
    ('community', '#ed7b2d', '#1b0b06'),
    ('future', '#51baff', '#000000'),
    ('ethereum', ETHEREUM, '#000000'),
    ('app', '#c7ff00', '#020f08'),
]
text = lettering('Darwin Core Protocol', 168, multiline=True)
for name, color, background in themes:
    canvas = Image.new('RGB', (1600, 900), background)
    artwork = mascot(color, 560)
    text_color = color
    centered(canvas, artwork, (480, 450))
    paste_text(canvas, text, text_color, (860, (900-text.height)//2))
    # All artwork lies inside x=200..1400, y=90..810.
    save(canvas, 'social', f'darwin-core-protocol-{name}-1600x900.png')

# Previous exports keep their public URLs; the archive contains only this run.
files = sorted(exported)
with ZipFile(OUTPUT / 'darwin-core-protocol-brand-kit.zip', 'w') as archive:
    for file in files:
        entry = ZipInfo(str(file.relative_to(OUTPUT)), (2026, 1, 1, 0, 0, 0))
        entry.compress_type = ZIP_DEFLATED
        entry.external_attr = 0o644 << 16
        archive.writestr(entry, file.read_bytes())
    license_entry = ZipInfo('IMAGE-LICENSE.txt', (2026, 1, 1, 0, 0, 0))
    license_entry.compress_type = ZIP_DEFLATED
    license_entry.external_attr = 0o644 << 16
    archive.writestr(license_entry, (OUTPUT / 'IMAGE-LICENSE.txt').read_bytes())
print(f'Exported {len(files)} opaque PNGs and the Brand Kit ZIP.')
