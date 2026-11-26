"""Build lossless responsive WebP variants; never crop or upscale artwork."""
import hashlib, json, sys
from pathlib import Path
from PIL import Image, __version__ as pillow_version

request = json.load(sys.stdin)
root = Path(request['root'])
output = root / '.migration/media/files'
output.mkdir(parents=True, exist_ok=True)
manifest = {'schema': 1, 'images': {}}
for filename in request['files']:
    source = root / 'src/site/assets' / filename
    digest = hashlib.sha256(source.read_bytes() + ('responsive-webp-v1:' + pillow_version).encode()).hexdigest()[:20]
    with Image.open(source) as original:
        width, height = original.size
        widths = sorted(set([min(width, value) for value in (480, 768, 1200, 1600)]))
        variants = []
        for target_width in widths:
            name = f'{digest}-{target_width}.webp'
            target = output / name
            if not target.exists():
                mode = 'RGBA' if original.mode in ('RGBA', 'LA', 'P') else 'RGB'
                image = original.convert(mode)
                if target_width != width:
                    image = image.resize((target_width, max(1, round(height * target_width / width))), Image.Resampling.LANCZOS)
                options = {'lossless': True, 'method': 6}
                if original.info.get('icc_profile'):
                    options['icc_profile'] = original.info['icc_profile']
                temporary = target.with_suffix('.tmp')
                image.save(temporary, format='WEBP', **options)
                temporary.replace(target)
            variants.append({'src': '/assets/optimized/' + name, 'width': target_width, 'bytes': target.stat().st_size})
        # Keep the original as src: old clients and exact image provenance remain available.
        manifest['images'][filename] = {'src': '/assets/' + filename, 'width': width, 'height': height, 'variants': variants}
manifest_file = root / '.migration/media/manifest.json'
temporary = manifest_file.with_suffix('.tmp')
temporary.write_text(json.dumps(manifest, ensure_ascii=False, sort_keys=True) + '\n')
temporary.replace(manifest_file)
print(f'Prepared responsive variants for {len(manifest["images"])} images (cached by source hash).')
