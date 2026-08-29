/**
 * The family name for the bundled app font, on both platforms.
 *
 * Verified by registering the real files through CoreText and by reading
 * ReactFontManager.kt — not assumed:
 *
 *   iOS     — assets/fonts/Fredoka.ttf is a VARIABLE font, and CoreText
 *             exposes its five fvar named instances as real members of the
 *             family "Fredoka": Light (-0.23), Regular (0.0), Medium (0.2),
 *             SemiBold (0.3), Bold (0.4). RCTFontUtils then picks the member
 *             closest to the requested fontWeight, so 500/600/700 all resolve
 *             correctly. Passing the PostScript name "Fredoka-Light" instead
 *             does NOT work: it is not a family name, so RN takes its
 *             single-member fallback branch and every weight collapses.
 *
 *   Android — resolves an asset font by FILENAME: ReactFontManager builds
 *             "fonts/" + family + one of ["", "_bold", "_italic",
 *             "_bold_italic"] + ".ttf". It cannot select a named instance of a
 *             variable font, so a static assets/fonts/Fredoka_bold.ttf is
 *             bundled for weights >= 700; without that file Typeface.create
 *             falls through to the SYSTEM font and bold text renders in
 *             Roboto next to Fredoka body text. Weights below 700 use
 *             Fredoka.ttf at its wght=300 default.
 *
 * Fredoka_bold.ttf is deliberately NOT in Info.plist UIAppFonts: iOS already
 * has Bold from the variable font, and registering it only adds a duplicate
 * Fredoka-Bold member to the family.
 */
export const FREDOKA_FAMILY = 'Fredoka';
