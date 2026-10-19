# Bundled fonts

## Google Sans

Google Sans is by Google and is licensed under the SIL Open Font License 1.1. The copyright notice and license text are in `GoogleSans-OFL.txt`; Google's trademark notice is in `GoogleSans-TRADEMARKS.md`. The OFL declares no Reserved Font Name, which allows the subsets below to keep the name. "Google" and "Google Sans" are trademarks of Google LLC. This site is not affiliated with or sponsored by Google.

Both files below were built from the official [Google Sans v14.000](https://github.com/googlefonts/googlesans/releases/tag/v14.000) variable font (`GoogleSans[GRAD,opsz,wght].ttf`) with FontTools 4.60.1 (`fontTools.varLib.instancer` and `fontTools.subset`) and Brotli. Glyph outlines are unchanged.

- `GoogleSans.woff2` is used for all interface text: headings, body copy, labels, and the wordmark. The optical size axis is fixed at 18 and the grade axis at 0; the weight axis stays variable (400-700). It keeps Basic Latin, Latin-1 Supplement, Latin Extended-A, general punctuation, and a few symbols (euro, trademark, arrows, minus, bullet).
- `GoogleSans-SemiBold.ttf` is used only by the 3D signpost, for the project titles and the sign numbers. It is a static instance at weight 600 with no variation tables, because the 3D text library (troika) cannot read variable fonts. It keeps Basic Latin, Latin-1 Supplement, and common punctuation (curly quotes, en/em dash, ellipsis). `toSignText()` in `src/lib/signpost-layout.ts` replaces any other character with `?`, because a missing character makes the 3D text library request a fallback font from a CDN, which the Content Security Policy blocks, and the scene then stays blank. Re-subset from the official release if the signs ever need other characters, and update `toSignText()` to match.

The sign layout sizes each title as if every character were 0.7 em wide. Google Sans is proportional, and the widest current title measures about 0.68 em per character, so every pinned project fits its board. A future title with many wide capitals (M, W, G, O) could run past the board edge.

## PP Kyoto

PP Kyoto is **not bundled**. The italic display role falls back to Georgia / Times New Roman. Adding PP Kyoto requires an appropriate webfont license and a font declaration in `src/styles/fonts.css`.
