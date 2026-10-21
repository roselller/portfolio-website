// The button hover, as numbers, for things that are not CSS buttons (the 3D
// signs). Keep equal to `.button:hover` and `.button::after` in globals.css:
// --lift -3px, --pop 1.03, --glow 0.65, the halo `0 0 16px 2px` at opacity
// calc(var(--glow) * 0.8). The characters' numbers are in ascii-burst.ts.
export const HOVER_LIFT_PX = 3;
export const HOVER_POP = 1.03;
export const HOVER_GLOW = 0.65;
export const GLOW_OPACITY_SCALE = 0.8;
export const GLOW_BLUR_PX = 16;
export const GLOW_SPREAD_PX = 2;
