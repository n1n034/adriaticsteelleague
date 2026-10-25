"""Podskup Font Awesome 6.5.1 samo s ikonama koje koristi index.html.

Pokreni nakon dodavanja ili uklanjanja ikone (class="fas fa-..." / "fab fa-..."):
    pip install fonttools brotli
    python tools/fa-subset.py
Piše fonts/fa-solid.woff2 i fonts/fa-brands.woff2 te prepisuje blokove IKONE:preload i IKONE:css u index.html.
Mapa tools/ se ne objavljuje (firebase.json -> hosting.ignore).
"""
import hashlib, pathlib, re, tempfile, urllib.request
from fontTools import subset
from fontTools.ttLib import TTFont

FA = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/'
# prefiks klase -> (naziv, font-family, težina, izvorna datoteka)
STYLES = {'fas': ('solid', 'FA Solid', 900, 'fa-solid-900.woff2'), 'fab': ('brands', 'FA Brands', 400, 'fa-brands-400.woff2')}
root = pathlib.Path(__file__).resolve().parent.parent
page = root / 'index.html'
html = page.read_bytes().decode('utf-8')  # bajtovi: Windows ne smije pretvoriti LF u CRLF


def get(name):
    return urllib.request.urlopen(FA + name).read()


# ime ikone (i aliasi) -> kodna točka, iz originalnog FA css-a
code = {}
for sel, c in re.findall(r'([^{}]+)\{content:"\\([0-9a-f]+)"\}', get('css/all.min.css').decode()):
    for n in re.findall(r'\.fa-([a-z0-9-]+):before', sel):
        code[n] = c

# generirani blokovi se ne računaju kao korištenje
src = re.sub(r'IKONE:css.*?/IKONE:css|IKONE:preload.*?/IKONE:preload', '', html, flags=re.S)
used = {k: set() for k in STYLES}
for k, n in re.findall(r'\b(fas|fab)\b[^"\'`<>]*?\bfa-([a-z0-9-]+)', src):
    used[k].add(n)
tokens = set(re.findall(r'\bfa-([a-z0-9-]+)', src))
covered = set().union(*used.values())
assert tokens == covered, f'fa- oznake bez fas/fab ispred: {tokens - covered}'
assert covered <= set(code), f'nepoznate ikone: {covered - set(code)}'

fonts_css, preload, icons, sizes = [], [], [], []
for k, (kind, family, weight, srcname) in STYLES.items():
    if not used[k]:
        continue
    cps = sorted({code[n] for n in used[k]})
    out = root / 'fonts' / f'fa-{kind}.woff2'
    out.parent.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as d:
        font = pathlib.Path(d) / srcname
        font.write_bytes(get('webfonts/' + srcname))
        subset.main([str(font), '--unicodes=' + ','.join('U+' + c for c in cps), '--flavor=woff2',
                     '--layout-features=', '--no-hinting', '--output-file=' + str(out)])
    assert {int(c, 16) for c in cps} <= set(TTFont(out).getBestCmap()), f'u {out.name} nedostaju glifovi'
    url = f'fonts/fa-{kind}.woff2?v=' + hashlib.sha1(out.read_bytes()).hexdigest()[:8]
    fonts_css.append(f'@font-face{{font-family:"{family}";font-style:normal;font-weight:{weight};font-display:swap;src:url({url}) format("woff2")}}')
    fonts_css.append(f'.{k}{{font-family:"{family}";font-weight:{weight}}}')
    preload.append(f'  <link rel="preload" href="{url}" as="font" type="font/woff2" crossorigin>')
    icons += [f'.fa-{n}:before{{content:"\\{code[n]}"}}' for n in sorted(used[k])]
    sizes.append(f'{out.name} {out.stat().st_size} B ({len(cps)} ikona)')

base = '.fas,.fab{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;display:inline-block;font-style:normal;font-variant:normal;line-height:1;text-rendering:auto}'
css_body = ''.join('    ' + r + '\n' for r in fonts_css + [base] + icons)
html = re.sub(r'(<!-- IKONE:preload[^>]*-->\n).*?(  <!-- /IKONE:preload -->)',
              lambda m: m.group(1) + '\n'.join(preload) + '\n' + m.group(2), html, flags=re.S)
html = re.sub(r'(    /\* IKONE:css.*?\*/\n).*?(    /\* /IKONE:css \*/)',
              lambda m: m.group(1) + css_body + m.group(2), html, flags=re.S)
page.write_bytes(html.encode('utf-8'))
print('\n'.join(sizes))
