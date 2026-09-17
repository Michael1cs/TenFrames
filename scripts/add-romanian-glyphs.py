#!/usr/bin/env python3
"""
Build the Romanian letters into the bundled Fredoka files.

Fredoka ships without ă Ă ș Ș ț Ț — upstream too, not just our copy — so
Romanian text fell back to the system font for exactly those letters and
every word with a diacritic mixed two typefaces. This composes them the way
the font composes its own accented letters: the base letter plus an accent
already in the file (the breve placed like the circumflex, a comma-below
centred under the letter). The legacy cedilla codepoints map to the same
glyphs, because older Romanian text uses them.

Run it again after replacing a font with a fresh upstream copy:

    python3 scripts/add-romanian-glyphs.py assets/fonts/Fredoka.ttf assets/fonts/Fredoka_bold.ttf

Untouched originals live in assets/fonts-source/.
"""
import sys
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import Glyph, GlyphComponent
from fontTools.pens.boundsPen import BoundsPen


def add_romanian(path):
    font = TTFont(path)
    glyf, hmtx = font['glyf'], font['hmtx']
    gs = font.getGlyphSet()

    def bounds(name):
        pen = BoundsPen(gs)
        gs[name].draw(pen)
        return pen.bounds

    def accent_offset(sample, accent):
        for c in glyf[sample].components:
            if c.glyphName == accent:
                return c.x, c.y
        raise SystemExit(f'{sample} has no {accent} component')

    def centered_below(base, mark):
        bx, mx = bounds(base), bounds(mark)
        return round((bx[0] + bx[2]) / 2 - (mx[0] + mx[2]) / 2), 0

    plan = [
        ('Abreve', 0x102, 'A', 'uni0306', accent_offset('Acircumflex', 'uni0302')),
        ('abreve', 0x103, 'a', 'uni0306', accent_offset('acircumflex', 'uni0302')),
        ('Scommaaccent', 0x218, 'S', 'quotesinglbase', None),
        ('scommaaccent', 0x219, 's', 'quotesinglbase', None),
        ('Tcommaaccent', 0x21A, 'T', 'quotesinglbase', None),
        ('tcommaaccent', 0x21B, 't', 'quotesinglbase', None),
    ]
    legacy = {0x15E: 'Scommaaccent', 0x15F: 'scommaaccent',
              0x162: 'Tcommaaccent', 0x163: 'tcommaaccent'}

    order = list(glyf.glyphOrder)
    added = []
    for name, cp, base, mark, off in plan:
        if name in glyf.glyphs:
            continue
        x, y = off if off else centered_below(base, mark)
        g = Glyph()
        g.numberOfContours = -1
        g.components = []
        for comp_name, cx, cy in ((base, 0, 0), (mark, x, y)):
            c = GlyphComponent()
            c.glyphName, c.x, c.y = comp_name, cx, cy
            c.flags = 0x4 | 0x1  # ROUND_XY_TO_GRID | ARGS_ARE_XY_VALUES
            g.components.append(c)
        glyf.glyphs[name] = g
        order.append(name)
        hmtx.metrics[name] = hmtx.metrics[base]
        added.append((name, cp))

    glyf.glyphOrder = order
    font.setGlyphOrder(order)
    font.glyphOrder = order
    for table in font['cmap'].tables:
        if table.isUnicode():
            for name, cp in added:
                table.cmap[cp] = name
            for cp, name in legacy.items():
                table.cmap[cp] = name
    font.save(path)
    return [n for n, _ in added]


if __name__ == '__main__':
    paths = sys.argv[1:] or ['assets/fonts/Fredoka.ttf', 'assets/fonts/Fredoka_bold.ttf']
    for p in paths:
        print(p, '->', add_romanian(p) or 'already had them')
