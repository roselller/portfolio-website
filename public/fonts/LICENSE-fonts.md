# Bundled fonts

Monocraft and Miracode are by Idrees Hassan / IdreesInc and are licensed under the SIL Open Font License 1.1. The original copyright notices and complete license texts are preserved in `Monocraft-OFL.txt` and `Miracode-OFL.txt` alongside the fonts.

The interface uses WOFF2 conversions of the official TTF files, made with FontTools 4.65.0 and Brotli 1.2.0, with no glyphs removed or altered.

The 3D signpost uses `Monocraft-SemiBold.ttf` and `Miracode.ttf` for dynamic labels. These two TTF files were reduced with FontTools 4.67.0 (`pyftsubset`) to keep the home page light: SemiBold keeps Basic Latin, Latin-1 Supplement, and common punctuation (curly quotes, en/em dash, ellipsis); Miracode keeps Basic Latin (it only draws the sign numbers). `toSignText()` in `src/lib/signpost-layout.ts` replaces any other character with `?`. Do not shrink Miracode to digits only: the 3D text library then fails to match its characters and the scene stays blank. Glyph outlines are unchanged, and the OFL (which declares no Reserved Font Name for these fonts) allows this. Re-subset from the official releases below if the signs ever need other characters, and update `toSignText()` to match.

- [Monocraft v4.2.1](https://github.com/IdreesInc/Monocraft/releases/tag/v4.2.1): Regular (400), SemiBold (600), Bold (700), and Black (900). CSS requests between those weights use the browser's nearest matching cut.
- [Miracode v1.0](https://github.com/IdreesInc/Miracode/releases/tag/v1.0): Regular (400).

The site enables `"liga" 1, "calt" 1` through the shared font feature token. Both fonts include `liga` substitutions; these releases do not include a separate `calt` feature.

PP Kyoto is **not bundled**. The italic display role falls back to Georgia / Times New Roman. Adding PP Kyoto requires an appropriate webfont license and a font declaration in `src/styles/fonts.css`.
