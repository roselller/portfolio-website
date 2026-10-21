# Signpost architecture

The homepage passes a `Project[]` collection and a `sample` flag to `SignpostHero`. `SignpostScene` derives one board per project through `getSignpostLayout`; stable, unique project slugs serve as React keys.

## Layout and sizing

- `src/lib/signpost-layout.ts` defines board dimensions, alternating directions, numbering, spacing, colors, and responsive presentation scale.
- `src/lib/signpost-fit.ts` constrains each board to the available horizontal space, using the introduction card's measured edge and the viewport's right gutter. It projects board bounds across the pointer rotation range and accounts for hover and scroll movement. Phones (up to 599 px wide) are the exception, described below.
- `SignpostScene` lifts the complete stack to the top of the extended pole, preserving the authored 0.71-unit board spacing. The pole extends with the document rather than spreading the signs apart.
- `SignArm` reuses bundled Blender geometry and renders project labels on both faces. Titles pass through `toSignText()`, which uppercases them and replaces characters missing from the subset sign font with `?`. Width and font size adapt individually; board height and thickness remain consistent.

The presentation multiplier is `0.612 * 0.85`. The orthographic camera sits at `[0, 0, 20]`; the assembly keeps a `-Math.PI / 10` resting yaw offset and `-Math.PI / 16` pitch. Desktop and compact lean values are `0.1` and `0.08`, respectively. These settings are independent of individual board fitting.

The component supports an empty collection and a single board, although the default data policy fills the portfolio to six projects. Geometry tests cover empty, one-, three-, and six-board collections at widths from 320 to 1920 pixels, with sampled pointer angles and scroll positions.

## Phones

At 599 px and narrower, `getSignpostPlacement` in `signpost-fit.ts` replaces the standard zoom and pole position. It measures where the signs sit at rest and picks the zoom and pole x so the outermost signs meet the left and right edges of the introduction card (measured in `SignpostHero` and passed down as `phoneEdges`). The two sides are unequal, because the right-hand signs swing further from the viewer, so the pole sits off-centre. Signs keep their natural widths. The zoom is capped at twice the standard value so a collection with only one or two signs does not balloon. Widths above 599 px return exactly the previous zoom and pole position; a test covers this.

Because the signs are fitted at rest, pointer tilt is disabled at phone widths (`signpost-pointer.ts`), and resizing down to a phone width returns the signpost to rest. CSS (`@media (max-width: 599px)`) lifts the context card so it covers the foot of the pole, as on desktop. The overlap is `32px + 12vw`: the foot sits 32 px above the stage bottom, and its height grows with the zoom, which grows with the screen width.

The pole box (`.hero-work`) is also `16vw` taller than `--signpost-height`, which leaves bare pole under the last sign before the card starts; the pole's length follows the box's height. The canvas (`.scene-stage`) must be exactly as tall as the box, and is deliberately not capped by the screen height. If the canvas were shorter, `fitSignpostBoards` would count the difference as scroll drift (`documentHeight - height`) and trim the outer signs, which on a short screen would pull them off the card edges. Both heights come from one CSS rule so they cannot diverge, and a test covers the fit with the lengthened box.

## Interaction and accessibility

`signpost-pointer.ts` bounds reversed cursor rotation to +10°/−20° around the resting orientation. GSAP smooths updates over 0.18 seconds. Inactive windows and hidden tabs pause interaction; touch movement does not rotate the object, and neither does a mouse in a phone-width window.

Hovering a sign with a mouse (any hovering fine pointer; not touch, pens or reduced motion) gives it the button hover on top of the existing slide-out: it lifts 3 px, grows 3% about its middle, and gets a rose halo and drifting ASCII characters. The numbers are the `.button` ones, shared in `src/lib/hover-effect.ts` and `src/lib/ascii-burst.ts`. Lift and pop live in `SignArm`. The halo and characters are drawn by `SignHoverFx` on a 2D canvas (`.sign-fx`) that sits behind the WebGL canvas, from the board's projected outline (`sign-outline.ts`), so they pass behind the sign as they do behind a button. After a scroll, `Assembly` asks the scene to look under the pointer again (`events.update`), because it otherwise only looks when the pointer moves and a sign that has scrolled away would keep its hover.

The scene renders on demand when input, hover, scrolling, or resizing requires an update. Event listeners, observers, and tweens clean up when the view changes. The explicit card view, reduced-motion preference, keyboard project navigation, and WebGL fallback all provide access to the same project collection.

## Presentation

Google Sans supplies all text, including the sign titles and numbers. Accent lines use Fraunces Italic (the `--font-display` token). Font licenses live beside the bundled assets.

The shader background runs only on the home page, at about 30 fps; other pages keep the themed CSS gradient behind `.site-background` and never load the shader code. It supports both themes and pauses animation for reduced motion or hidden tabs. Camera position, assembly rotation, font assets, and theme tokens do not need to change when adding projects or adjusting label fitting.

Project detail covers measure the rendered title after fonts load and on resize, shrinking text as needed to keep the complete name on one line. README tables use intrinsic column sizing and normal word boundaries; wide tables scroll within their container.
