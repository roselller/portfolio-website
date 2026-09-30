# Signpost architecture

The homepage passes a `Project[]` collection and a `sample` flag to `SignpostHero`. `SignpostScene` derives one board per project through `getSignpostLayout`; stable, unique project slugs serve as React keys.

## Layout and sizing

- `src/lib/signpost-layout.ts` defines board dimensions, alternating directions, numbering, spacing, colors, and responsive presentation scale.
- `src/lib/signpost-fit.ts` constrains each board to the available horizontal space, using the introduction card's measured edge and the viewport's right gutter. It projects board bounds across the pointer rotation range and accounts for hover and scroll movement.
- `SignpostScene` lifts the complete stack to the top of the extended pole, preserving the authored 0.71-unit board spacing. The pole extends with the document rather than spreading the signs apart.
- `SignArm` reuses bundled Blender geometry and renders project labels on both faces. Width and font size adapt individually; board height and thickness remain consistent.

The presentation multiplier is `0.612 * 0.85`. The orthographic camera sits at `[0, 0, 20]`; the assembly keeps a `-Math.PI / 10` resting yaw offset and `-Math.PI / 16` pitch. Desktop and compact lean values are `0.1` and `0.08`, respectively. These settings are independent of individual board fitting.

The component supports an empty collection and a single board, although the default data policy fills the portfolio to six projects. Geometry tests cover empty, one-, three-, and six-board collections at widths from 320 to 1920 pixels, with sampled pointer angles and scroll positions.

## Interaction and accessibility

`signpost-pointer.ts` bounds reversed cursor rotation to +10°/−20° around the resting orientation. GSAP smooths updates over 0.18 seconds. Inactive windows and hidden tabs pause interaction; touch movement does not rotate the object.

The scene renders on demand when input, hover, scrolling, or resizing requires an update. Event listeners, observers, and tweens clean up when the view changes. The explicit card view, reduced-motion preference, keyboard project navigation, and WebGL fallback all provide access to the same project collection.

## Presentation

Monocraft supplies headings and sign labels; Miracode supplies body text and number labels. The italic display role uses the existing Georgia fallback. Font licenses live beside the bundled assets.

The shared shader background supports both themes and pauses animation for reduced motion or hidden tabs. Camera position, assembly rotation, font assets, and theme tokens do not need to change when adding projects or adjusting label fitting.

Project detail covers measure the rendered title after fonts load and on resize, shrinking text as needed to keep the complete name on one line. README tables use intrinsic column sizing and normal word boundaries; wide tables scroll within their container.
