/**
 * Kalpavruksha Evara Master Plan — Plot Coordinates
 *
 * Image dimensions: 3508 x 4961 pixels
 * All coordinates are percentage-based (% of image width/height).
 *
 * Layout: 6 column groups separated by 30' wide roads
 *   Col 1  (single, far left)  — Plots 1-16      — faces East
 *   Col 2L (left of pair)      — Plots 33->25,24->17 — faces East
 *   Col 2R (right of pair)     — Plots 34->42,43->50 — faces West
 *   Col 3L (left of pair)      — Plots 69->60,59->51 — faces East
 *   Col 3R (right of pair)     — Plot 70 + 71->80,81->90 — faces West
 *   Col 4  (single, far right) — Plots 111->101,100->91 — faces West
 *
 * Upper section: above "30' WIDE ROAD"
 * Lower section: below "30' WIDE ROAD"
 *
 * Coordinates derived from pixel-level edge detection on the actual PNG.
 */

export interface PlotDef {
  villa: number;
  left: number;   // % of image width
  top: number;    // % of image height
  width: number;  // % of image width
  height: number; // % of image height
  sqYards: number;
  facing: string;
}

// ---------------------------------------------------------------------------
// Column 1 — Single column, far left — Facing: East
// Upper: Plots 1 (top) -> 8 (bottom)   x: 29.0%  width: 6.0%
// Lower: Plots 9 (top) -> 16 (bottom)  x: 26.5%  width: 3.5%
// ---------------------------------------------------------------------------
const COL1U_LEFT = 29.0;
const COL1U_WIDTH = 6.0;
const COL1L_LEFT = 26.5;
const COL1L_WIDTH = 3.5;
const COL1_FACING = "East";

const col1Upper: PlotDef[] = [
  { villa: 1,  left: COL1U_LEFT, top: 6.5,  width: COL1U_WIDTH, height: 2.1, sqYards: 166, facing: COL1_FACING },
  { villa: 2,  left: COL1U_LEFT, top: 8.6,  width: COL1U_WIDTH, height: 2.1, sqYards: 167, facing: COL1_FACING },
  { villa: 3,  left: COL1U_LEFT, top: 10.7, width: COL1U_WIDTH, height: 2.1, sqYards: 167, facing: COL1_FACING },
  { villa: 4,  left: COL1U_LEFT, top: 12.8, width: COL1U_WIDTH, height: 2.1, sqYards: 167, facing: COL1_FACING },
  { villa: 5,  left: COL1U_LEFT, top: 14.9, width: COL1U_WIDTH, height: 2.1, sqYards: 167, facing: COL1_FACING },
  { villa: 6,  left: COL1U_LEFT, top: 17.0, width: COL1U_WIDTH, height: 2.1, sqYards: 167, facing: COL1_FACING },
  { villa: 7,  left: COL1U_LEFT, top: 19.1, width: COL1U_WIDTH, height: 2.1, sqYards: 167, facing: COL1_FACING },
  { villa: 8,  left: COL1U_LEFT, top: 21.2, width: COL1U_WIDTH, height: 2.5, sqYards: 200, facing: COL1_FACING },
];

const col1Lower: PlotDef[] = [
  { villa: 9,  left: COL1L_LEFT, top: 30.5, width: COL1L_WIDTH, height: 2.5, sqYards: 200, facing: COL1_FACING },
  { villa: 10, left: COL1L_LEFT, top: 33.1, width: COL1L_WIDTH, height: 2.1, sqYards: 167, facing: COL1_FACING },
  { villa: 11, left: COL1L_LEFT, top: 35.2, width: COL1L_WIDTH, height: 2.1, sqYards: 167, facing: COL1_FACING },
  { villa: 12, left: COL1L_LEFT, top: 37.3, width: COL1L_WIDTH, height: 2.1, sqYards: 167, facing: COL1_FACING },
  { villa: 13, left: COL1L_LEFT, top: 39.4, width: COL1L_WIDTH, height: 2.1, sqYards: 167, facing: COL1_FACING },
  { villa: 14, left: COL1L_LEFT, top: 41.5, width: COL1L_WIDTH, height: 2.1, sqYards: 167, facing: COL1_FACING },
  { villa: 15, left: COL1L_LEFT, top: 43.6, width: COL1L_WIDTH, height: 2.1, sqYards: 167, facing: COL1_FACING },
  { villa: 16, left: COL1L_LEFT, top: 45.7, width: COL1L_WIDTH, height: 2.1, sqYards: 167, facing: COL1_FACING },
];

// ---------------------------------------------------------------------------
// Column 2L — Left side of pair — Facing: East
// Upper: Plots 33 (top) -> 25 (bottom)
// Lower: Plots 24 (top) -> 17 (bottom)
// ---------------------------------------------------------------------------
const COL2L_LEFT = 37.8;
const COL2L_WIDTH = 5.2;
const COL2L_FACING = "East";

const col2LUpper: PlotDef[] = [
  { villa: 33, left: COL2L_LEFT, top: 9.1,  width: COL2L_WIDTH, height: 1.9, sqYards: 167, facing: COL2L_FACING },
  { villa: 32, left: COL2L_LEFT, top: 11.0, width: COL2L_WIDTH, height: 2.1, sqYards: 167, facing: COL2L_FACING },
  { villa: 31, left: COL2L_LEFT, top: 13.1, width: COL2L_WIDTH, height: 2.1, sqYards: 167, facing: COL2L_FACING },
  { villa: 30, left: COL2L_LEFT, top: 15.2, width: COL2L_WIDTH, height: 2.1, sqYards: 167, facing: COL2L_FACING },
  { villa: 29, left: COL2L_LEFT, top: 17.4, width: COL2L_WIDTH, height: 2.1, sqYards: 167, facing: COL2L_FACING },
  { villa: 28, left: COL2L_LEFT, top: 19.4, width: COL2L_WIDTH, height: 2.1, sqYards: 167, facing: COL2L_FACING },
  { villa: 27, left: COL2L_LEFT, top: 21.6, width: COL2L_WIDTH, height: 2.1, sqYards: 167, facing: COL2L_FACING },
  { villa: 26, left: COL2L_LEFT, top: 23.7, width: COL2L_WIDTH, height: 2.1, sqYards: 167, facing: COL2L_FACING },
  { villa: 25, left: COL2L_LEFT, top: 25.8, width: COL2L_WIDTH, height: 2.2, sqYards: 223, facing: COL2L_FACING },
];

const col2LLower: PlotDef[] = [
  { villa: 24, left: COL2L_LEFT, top: 30.5, width: COL2L_WIDTH, height: 2.4, sqYards: 223, facing: COL2L_FACING },
  { villa: 23, left: COL2L_LEFT, top: 33.0, width: COL2L_WIDTH, height: 2.4, sqYards: 167, facing: COL2L_FACING },
  { villa: 22, left: COL2L_LEFT, top: 35.3, width: COL2L_WIDTH, height: 2.1, sqYards: 167, facing: COL2L_FACING },
  { villa: 21, left: COL2L_LEFT, top: 37.4, width: COL2L_WIDTH, height: 2.1, sqYards: 167, facing: COL2L_FACING },
  { villa: 20, left: COL2L_LEFT, top: 39.5, width: COL2L_WIDTH, height: 2.1, sqYards: 167, facing: COL2L_FACING },
  { villa: 19, left: COL2L_LEFT, top: 41.7, width: COL2L_WIDTH, height: 2.1, sqYards: 167, facing: COL2L_FACING },
  { villa: 18, left: COL2L_LEFT, top: 43.8, width: COL2L_WIDTH, height: 2.1, sqYards: 167, facing: COL2L_FACING },
  { villa: 17, left: COL2L_LEFT, top: 45.9, width: COL2L_WIDTH, height: 2.1, sqYards: 167, facing: COL2L_FACING },
];

// ---------------------------------------------------------------------------
// Column 2R — Right side of pair — Facing: West
// Upper: Plots 34 (top) -> 42 (bottom)
// Lower: Plots 43 (top) -> 50 (bottom)
// ---------------------------------------------------------------------------
const COL2R_LEFT = 43.0;
const COL2R_WIDTH = 5.2;
const COL2R_FACING = "West";

const col2RUpper: PlotDef[] = [
  { villa: 34, left: COL2R_LEFT, top: 9.1,  width: COL2R_WIDTH, height: 1.9, sqYards: 167, facing: COL2R_FACING },
  { villa: 35, left: COL2R_LEFT, top: 11.0, width: COL2R_WIDTH, height: 2.1, sqYards: 167, facing: COL2R_FACING },
  { villa: 36, left: COL2R_LEFT, top: 13.1, width: COL2R_WIDTH, height: 2.1, sqYards: 167, facing: COL2R_FACING },
  { villa: 37, left: COL2R_LEFT, top: 15.2, width: COL2R_WIDTH, height: 2.1, sqYards: 167, facing: COL2R_FACING },
  { villa: 38, left: COL2R_LEFT, top: 17.4, width: COL2R_WIDTH, height: 2.1, sqYards: 167, facing: COL2R_FACING },
  { villa: 39, left: COL2R_LEFT, top: 19.4, width: COL2R_WIDTH, height: 2.1, sqYards: 167, facing: COL2R_FACING },
  { villa: 40, left: COL2R_LEFT, top: 21.6, width: COL2R_WIDTH, height: 2.1, sqYards: 167, facing: COL2R_FACING },
  { villa: 41, left: COL2R_LEFT, top: 23.7, width: COL2R_WIDTH, height: 2.1, sqYards: 167, facing: COL2R_FACING },
  { villa: 42, left: COL2R_LEFT, top: 25.8, width: COL2R_WIDTH, height: 2.2, sqYards: 223, facing: COL2R_FACING },
];

const col2RLower: PlotDef[] = [
  { villa: 43, left: COL2R_LEFT, top: 30.5, width: COL2R_WIDTH, height: 2.4, sqYards: 223, facing: COL2R_FACING },
  { villa: 44, left: COL2R_LEFT, top: 33.0, width: COL2R_WIDTH, height: 2.4, sqYards: 167, facing: COL2R_FACING },
  { villa: 45, left: COL2R_LEFT, top: 35.3, width: COL2R_WIDTH, height: 2.1, sqYards: 167, facing: COL2R_FACING },
  { villa: 46, left: COL2R_LEFT, top: 37.4, width: COL2R_WIDTH, height: 2.1, sqYards: 167, facing: COL2R_FACING },
  { villa: 47, left: COL2R_LEFT, top: 39.5, width: COL2R_WIDTH, height: 2.1, sqYards: 167, facing: COL2R_FACING },
  { villa: 48, left: COL2R_LEFT, top: 41.7, width: COL2R_WIDTH, height: 2.1, sqYards: 167, facing: COL2R_FACING },
  { villa: 49, left: COL2R_LEFT, top: 43.8, width: COL2R_WIDTH, height: 2.1, sqYards: 167, facing: COL2R_FACING },
  { villa: 50, left: COL2R_LEFT, top: 45.9, width: COL2R_WIDTH, height: 2.1, sqYards: 167, facing: COL2R_FACING },
];

// ---------------------------------------------------------------------------
// Column 3L — Left side of pair — Facing: East
// Upper: Plots 69 (top) -> 60 (bottom)
// Lower: Plots 59 (top) -> 51 (bottom)
// ---------------------------------------------------------------------------
const COL3L_LEFT = 50.9;
const COL3L_WIDTH = 5.1;
const COL3L_FACING = "East";

const col3LUpper: PlotDef[] = [
  { villa: 69, left: COL3L_LEFT, top: 5.0,  width: COL3L_WIDTH, height: 3.8, sqYards: 167, facing: COL3L_FACING },
  { villa: 68, left: COL3L_LEFT, top: 8.8,  width: COL3L_WIDTH, height: 2.1, sqYards: 167, facing: COL3L_FACING },
  { villa: 67, left: COL3L_LEFT, top: 10.9, width: COL3L_WIDTH, height: 2.1, sqYards: 167, facing: COL3L_FACING },
  { villa: 66, left: COL3L_LEFT, top: 13.0, width: COL3L_WIDTH, height: 2.1, sqYards: 167, facing: COL3L_FACING },
  { villa: 65, left: COL3L_LEFT, top: 15.1, width: COL3L_WIDTH, height: 2.1, sqYards: 167, facing: COL3L_FACING },
  { villa: 64, left: COL3L_LEFT, top: 17.2, width: COL3L_WIDTH, height: 2.1, sqYards: 167, facing: COL3L_FACING },
  { villa: 63, left: COL3L_LEFT, top: 19.4, width: COL3L_WIDTH, height: 2.1, sqYards: 167, facing: COL3L_FACING },
  { villa: 62, left: COL3L_LEFT, top: 21.5, width: COL3L_WIDTH, height: 2.1, sqYards: 167, facing: COL3L_FACING },
  { villa: 61, left: COL3L_LEFT, top: 23.6, width: COL3L_WIDTH, height: 2.1, sqYards: 167, facing: COL3L_FACING },
  { villa: 60, left: COL3L_LEFT, top: 25.7, width: COL3L_WIDTH, height: 2.3, sqYards: 204, facing: COL3L_FACING },
];

const col3LLower: PlotDef[] = [
  { villa: 59, left: COL3L_LEFT, top: 30.5, width: COL3L_WIDTH, height: 2.3, sqYards: 190, facing: COL3L_FACING },
  { villa: 58, left: COL3L_LEFT, top: 32.8, width: COL3L_WIDTH, height: 2.2, sqYards: 167, facing: COL3L_FACING },
  { villa: 57, left: COL3L_LEFT, top: 35.0, width: COL3L_WIDTH, height: 2.1, sqYards: 167, facing: COL3L_FACING },
  { villa: 56, left: COL3L_LEFT, top: 37.1, width: COL3L_WIDTH, height: 2.1, sqYards: 167, facing: COL3L_FACING },
  { villa: 55, left: COL3L_LEFT, top: 39.2, width: COL3L_WIDTH, height: 2.1, sqYards: 167, facing: COL3L_FACING },
  { villa: 54, left: COL3L_LEFT, top: 41.3, width: COL3L_WIDTH, height: 2.1, sqYards: 167, facing: COL3L_FACING },
  { villa: 53, left: COL3L_LEFT, top: 43.4, width: COL3L_WIDTH, height: 2.1, sqYards: 167, facing: COL3L_FACING },
  { villa: 52, left: COL3L_LEFT, top: 45.5, width: COL3L_WIDTH, height: 2.1, sqYards: 167, facing: COL3L_FACING },
  { villa: 51, left: COL3L_LEFT, top: 47.6, width: COL3L_WIDTH, height: 2.1, sqYards: 167, facing: COL3L_FACING },
];

// ---------------------------------------------------------------------------
// Column 3R — Right side of pair — Facing: West
// Plot 70 at very top (special wider plot, 199 SQYD)
// Upper: Plots 71 (top) -> 80 (bottom)
// Lower: Plots 81 (top) -> 90 (bottom)
// ---------------------------------------------------------------------------
const COL3R_LEFT = 56.0;
const COL3R_WIDTH = 5.1;
const COL3R_FACING = "West";

const col3RSpecial: PlotDef[] = [
  { villa: 70, left: COL3R_LEFT, top: 3.0, width: COL3R_WIDTH, height: 2.7, sqYards: 199, facing: COL3R_FACING },
];

const col3RUpper: PlotDef[] = [
  { villa: 71, left: COL3R_LEFT, top: 5.6,  width: COL3R_WIDTH, height: 2.2, sqYards: 167, facing: COL3R_FACING },
  { villa: 72, left: COL3R_LEFT, top: 7.8,  width: COL3R_WIDTH, height: 2.2, sqYards: 167, facing: COL3R_FACING },
  { villa: 73, left: COL3R_LEFT, top: 10.0, width: COL3R_WIDTH, height: 2.2, sqYards: 167, facing: COL3R_FACING },
  { villa: 74, left: COL3R_LEFT, top: 12.2, width: COL3R_WIDTH, height: 2.2, sqYards: 167, facing: COL3R_FACING },
  { villa: 75, left: COL3R_LEFT, top: 14.4, width: COL3R_WIDTH, height: 2.2, sqYards: 167, facing: COL3R_FACING },
  { villa: 76, left: COL3R_LEFT, top: 16.6, width: COL3R_WIDTH, height: 2.2, sqYards: 167, facing: COL3R_FACING },
  { villa: 77, left: COL3R_LEFT, top: 18.8, width: COL3R_WIDTH, height: 2.2, sqYards: 167, facing: COL3R_FACING },
  { villa: 78, left: COL3R_LEFT, top: 21.0, width: COL3R_WIDTH, height: 2.2, sqYards: 167, facing: COL3R_FACING },
  { villa: 79, left: COL3R_LEFT, top: 23.1, width: COL3R_WIDTH, height: 2.2, sqYards: 167, facing: COL3R_FACING },
  { villa: 80, left: COL3R_LEFT, top: 25.3, width: COL3R_WIDTH, height: 2.7, sqYards: 204, facing: COL3R_FACING },
];

const col3RLower: PlotDef[] = [
  { villa: 81, left: COL3R_LEFT, top: 30.5, width: COL3R_WIDTH, height: 2.3, sqYards: 190, facing: COL3R_FACING },
  { villa: 82, left: COL3R_LEFT, top: 32.8, width: COL3R_WIDTH, height: 2.2, sqYards: 167, facing: COL3R_FACING },
  { villa: 83, left: COL3R_LEFT, top: 35.0, width: COL3R_WIDTH, height: 2.1, sqYards: 167, facing: COL3R_FACING },
  { villa: 84, left: COL3R_LEFT, top: 37.0, width: COL3R_WIDTH, height: 2.1, sqYards: 167, facing: COL3R_FACING },
  { villa: 85, left: COL3R_LEFT, top: 39.2, width: COL3R_WIDTH, height: 2.1, sqYards: 167, facing: COL3R_FACING },
  { villa: 86, left: COL3R_LEFT, top: 41.3, width: COL3R_WIDTH, height: 2.1, sqYards: 167, facing: COL3R_FACING },
  { villa: 87, left: COL3R_LEFT, top: 43.4, width: COL3R_WIDTH, height: 2.1, sqYards: 167, facing: COL3R_FACING },
  { villa: 88, left: COL3R_LEFT, top: 45.5, width: COL3R_WIDTH, height: 2.1, sqYards: 167, facing: COL3R_FACING },
  { villa: 89, left: COL3R_LEFT, top: 47.6, width: COL3R_WIDTH, height: 2.1, sqYards: 167, facing: COL3R_FACING },
  { villa: 90, left: COL3R_LEFT, top: 49.8, width: COL3R_WIDTH, height: 2.1, sqYards: 167, facing: COL3R_FACING },
];

// ---------------------------------------------------------------------------
// Column 4 — Single column, far right — Facing: West
// Upper: Plots 111 (top) -> 101 (bottom)
// Lower: Plots 100 (top) -> 91 (bottom)
// ---------------------------------------------------------------------------
const COL4_LEFT = 64.8;
const COL4_WIDTH = 5.1;
const COL4_FACING = "West";

const col4Upper: PlotDef[] = [
  { villa: 111, left: COL4_LEFT, top: 4.6,  width: COL4_WIDTH, height: 2.4, sqYards: 187, facing: COL4_FACING },
  { villa: 110, left: COL4_LEFT, top: 7.0,  width: COL4_WIDTH, height: 2.1, sqYards: 167, facing: COL4_FACING },
  { villa: 109, left: COL4_LEFT, top: 9.1,  width: COL4_WIDTH, height: 2.1, sqYards: 167, facing: COL4_FACING },
  { villa: 108, left: COL4_LEFT, top: 11.2, width: COL4_WIDTH, height: 2.1, sqYards: 167, facing: COL4_FACING },
  { villa: 107, left: COL4_LEFT, top: 13.2, width: COL4_WIDTH, height: 2.1, sqYards: 167, facing: COL4_FACING },
  { villa: 106, left: COL4_LEFT, top: 15.3, width: COL4_WIDTH, height: 2.1, sqYards: 167, facing: COL4_FACING },
  { villa: 105, left: COL4_LEFT, top: 17.4, width: COL4_WIDTH, height: 2.1, sqYards: 167, facing: COL4_FACING },
  { villa: 104, left: COL4_LEFT, top: 19.5, width: COL4_WIDTH, height: 2.1, sqYards: 167, facing: COL4_FACING },
  { villa: 103, left: COL4_LEFT, top: 21.6, width: COL4_WIDTH, height: 2.1, sqYards: 167, facing: COL4_FACING },
  { villa: 102, left: COL4_LEFT, top: 23.6, width: COL4_WIDTH, height: 2.1, sqYards: 167, facing: COL4_FACING },
  { villa: 101, left: COL4_LEFT, top: 25.7, width: COL4_WIDTH, height: 2.3, sqYards: 180, facing: COL4_FACING },
];

const col4Lower: PlotDef[] = [
  { villa: 100, left: COL4_LEFT, top: 30.5, width: COL4_WIDTH, height: 2.3, sqYards: 167, facing: COL4_FACING },
  { villa: 99,  left: COL4_LEFT, top: 32.8, width: COL4_WIDTH, height: 2.1, sqYards: 167, facing: COL4_FACING },
  { villa: 98,  left: COL4_LEFT, top: 34.9, width: COL4_WIDTH, height: 2.1, sqYards: 167, facing: COL4_FACING },
  { villa: 97,  left: COL4_LEFT, top: 37.0, width: COL4_WIDTH, height: 2.1, sqYards: 167, facing: COL4_FACING },
  { villa: 96,  left: COL4_LEFT, top: 39.1, width: COL4_WIDTH, height: 2.1, sqYards: 167, facing: COL4_FACING },
  { villa: 95,  left: COL4_LEFT, top: 41.2, width: COL4_WIDTH, height: 2.1, sqYards: 167, facing: COL4_FACING },
  { villa: 94,  left: COL4_LEFT, top: 43.4, width: COL4_WIDTH, height: 2.1, sqYards: 167, facing: COL4_FACING },
  { villa: 93,  left: COL4_LEFT, top: 45.5, width: COL4_WIDTH, height: 2.1, sqYards: 167, facing: COL4_FACING },
  { villa: 92,  left: COL4_LEFT, top: 47.6, width: COL4_WIDTH, height: 2.1, sqYards: 167, facing: COL4_FACING },
  { villa: 91,  left: COL4_LEFT, top: 49.7, width: COL4_WIDTH, height: 2.1, sqYards: 167, facing: COL4_FACING },
];

// ---------------------------------------------------------------------------
// Combined array — all 111 plots
// ---------------------------------------------------------------------------
export const KALPAVRUKSHA_PLOTS: PlotDef[] = [
  // Column 1 (villas 1-16)
  ...col1Upper,
  ...col1Lower,
  // Column 2L (villas 33->25, 24->17)
  ...col2LUpper,
  ...col2LLower,
  // Column 2R (villas 34->42, 43->50)
  ...col2RUpper,
  ...col2RLower,
  // Column 3L (villas 69->60, 59->51)
  ...col3LUpper,
  ...col3LLower,
  // Column 3R (villa 70 special + 71->80, 81->90)
  ...col3RSpecial,
  ...col3RUpper,
  ...col3RLower,
  // Column 4 (villas 111->101, 100->91)
  ...col4Upper,
  ...col4Lower,
];

// ---------------------------------------------------------------------------
// Praneeth (Developer) Share — all 111 villas belong to the developer for now
// ---------------------------------------------------------------------------
export const KALPAVRUKSHA_PRANEETH_SHARE: Set<number> = new Set(
  Array.from({ length: 111 }, (_, i) => i + 1)
);
