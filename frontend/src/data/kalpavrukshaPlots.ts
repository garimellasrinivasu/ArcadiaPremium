/**
 * Kalpavruksha Evara Master Plan — Plot Coordinates
 *
 * Image dimensions: 3508 x 4961 pixels
 * All coordinates are percentage-based (% of image width/height).
 *
 * Layout: 6 column groups separated by 30' wide roads
 *   Col 1  (single, far left)  — Plots 1-16      — faces East
 *   Col 2L (left of pair)      — Plots 33->25,24->17 — faces West
 *   Col 2R (right of pair)     — Plots 34->42,43->50 — faces East
 *   Col 3L (left of pair)      — Plot 70 + 69->60,59->51 — faces West
 *   Col 3R (right of pair)     — Plots 71->80,81->90 — faces East
 *   Col 4  (single, far right) — Plots 111->101,100->91 — faces West
 *
 * Upper section: above "30' WIDE ROAD"
 * Lower section: below "30' WIDE ROAD"
 *
 * Coordinates measured from the plot fill colours in the actual PNG
 * (re-measured Oct 2026; boxes snapped to each plot's boundary lines so the fill covers the whole plot).
 */

export interface PlotDef {
  villa: number;
  left: number;   // % of image width
  top: number;    // % of image height
  width: number;  // % of image width
  height: number; // % of image height
  sqYards: number;
  facing: string;
  dimensions?: string; // plot width x depth, e.g. 30' x 50'
}

// ---------------------------------------------------------------------------
// Column 1 — Single column, far left — Facing: East
// Upper: Plots 1 (top) -> 8 (bottom)   x: 30.16%  width: 4.9%
// Lower: Plots 9 (top) -> 16 (bottom)  x: 30.16%  width: 4.9%
// ---------------------------------------------------------------------------
const COL1_FACING = "East";

const col1Upper: PlotDef[] = [
  { villa: 1, left: 32.18, top: 9.09, width: 2.85, height: 3.16, sqYards: 166, facing: COL1_FACING },
  { villa: 2, left: 32.18, top: 12.31, width: 2.85, height: 3.74, sqYards: 167, facing: COL1_FACING },
  { villa: 3, left: 30.19, top: 16.11, width: 4.85, height: 2.04, sqYards: 167, facing: COL1_FACING },
  { villa: 4, left: 30.19, top: 18.21, width: 4.85, height: 2.05, sqYards: 167, facing: COL1_FACING },
  { villa: 5, left: 30.19, top: 20.32, width: 4.85, height: 2.06, sqYards: 167, facing: COL1_FACING },
  { villa: 6, left: 30.19, top: 22.44, width: 4.85, height: 2.06, sqYards: 167, facing: COL1_FACING },
  { villa: 7, left: 30.19, top: 24.56, width: 4.85, height: 2.03, sqYards: 167, facing: COL1_FACING },
  { villa: 8, left: 30.19, top: 26.65, width: 4.85, height: 2.48, sqYards: 200, facing: COL1_FACING },
];

const col1Lower: PlotDef[] = [
  { villa: 9, left: 30.19, top: 31.97, width: 4.85, height: 2.46, sqYards: 200, facing: COL1_FACING },
  { villa: 10, left: 30.19, top: 34.49, width: 4.85, height: 2.05, sqYards: 167, facing: COL1_FACING },
  { villa: 11, left: 30.19, top: 36.6, width: 4.85, height: 2.07, sqYards: 167, facing: COL1_FACING },
  { villa: 12, left: 30.19, top: 38.73, width: 4.85, height: 2.03, sqYards: 167, facing: COL1_FACING },
  { villa: 13, left: 30.19, top: 40.82, width: 4.85, height: 2.05, sqYards: 167, facing: COL1_FACING },
  { villa: 14, left: 30.19, top: 42.93, width: 4.85, height: 2.06, sqYards: 167, facing: COL1_FACING },
  { villa: 15, left: 30.19, top: 45.05, width: 4.85, height: 2.06, sqYards: 167, facing: COL1_FACING },
  { villa: 16, left: 30.19, top: 47.17, width: 4.85, height: 2.03, sqYards: 167, facing: COL1_FACING },
];

// ---------------------------------------------------------------------------
// Column 2L — Left side of pair — Facing: East
// Upper: Plots 33 (top) -> 25 (bottom)
// Lower: Plots 24 (top) -> 17 (bottom)
// ---------------------------------------------------------------------------
const COL2L_FACING = "West";

const col2LUpper: PlotDef[] = [
  { villa: 33, left: 38.14, top: 9.78, width: 4.87, height: 2.03, sqYards: 167, facing: COL2L_FACING },
  { villa: 32, left: 38.14, top: 11.87, width: 4.87, height: 2.06, sqYards: 167, facing: COL2L_FACING },
  { villa: 31, left: 38.14, top: 13.99, width: 4.87, height: 2.06, sqYards: 167, facing: COL2L_FACING },
  { villa: 30, left: 38.14, top: 16.11, width: 4.87, height: 2.04, sqYards: 167, facing: COL2L_FACING },
  { villa: 29, left: 38.14, top: 18.21, width: 4.87, height: 2.05, sqYards: 167, facing: COL2L_FACING },
  { villa: 28, left: 38.14, top: 20.32, width: 4.87, height: 2.06, sqYards: 167, facing: COL2L_FACING },
  { villa: 27, left: 38.14, top: 22.44, width: 4.87, height: 2.06, sqYards: 167, facing: COL2L_FACING },
  { villa: 26, left: 38.14, top: 24.56, width: 4.87, height: 2.03, sqYards: 167, facing: COL2L_FACING },
  { villa: 25, left: 38.14, top: 26.65, width: 4.87, height: 2.8, sqYards: 223, facing: COL2L_FACING },
];

const col2LLower: PlotDef[] = [
  { villa: 24, left: 38.14, top: 31.65, width: 4.87, height: 2.78, sqYards: 223, facing: COL2L_FACING },
  { villa: 23, left: 38.14, top: 34.49, width: 4.87, height: 2.05, sqYards: 167, facing: COL2L_FACING },
  { villa: 22, left: 38.14, top: 36.6, width: 4.87, height: 2.07, sqYards: 167, facing: COL2L_FACING },
  { villa: 21, left: 38.14, top: 38.73, width: 4.87, height: 2.03, sqYards: 167, facing: COL2L_FACING },
  { villa: 20, left: 38.14, top: 40.82, width: 4.87, height: 2.05, sqYards: 167, facing: COL2L_FACING },
  { villa: 19, left: 38.14, top: 42.93, width: 4.87, height: 2.06, sqYards: 167, facing: COL2L_FACING },
  { villa: 18, left: 38.14, top: 45.05, width: 4.87, height: 2.06, sqYards: 167, facing: COL2L_FACING },
  { villa: 17, left: 38.14, top: 47.17, width: 4.87, height: 2.03, sqYards: 167, facing: COL2L_FACING },
];

// ---------------------------------------------------------------------------
// Column 2R — Right side of pair — Facing: West
// Upper: Plots 34 (top) -> 42 (bottom)
// Lower: Plots 43 (top) -> 50 (bottom)
// ---------------------------------------------------------------------------
const COL2R_FACING = "East";

const col2RUpper: PlotDef[] = [
  { villa: 34, left: 43.1, top: 9.78, width: 4.9, height: 2.03, sqYards: 167, facing: COL2R_FACING },
  { villa: 35, left: 43.1, top: 11.87, width: 4.9, height: 2.06, sqYards: 167, facing: COL2R_FACING },
  { villa: 36, left: 43.1, top: 13.99, width: 4.9, height: 2.06, sqYards: 167, facing: COL2R_FACING },
  { villa: 37, left: 43.1, top: 16.11, width: 4.9, height: 2.04, sqYards: 167, facing: COL2R_FACING },
  { villa: 38, left: 43.1, top: 18.21, width: 4.9, height: 2.05, sqYards: 167, facing: COL2R_FACING },
  { villa: 39, left: 43.1, top: 20.32, width: 4.9, height: 2.06, sqYards: 167, facing: COL2R_FACING },
  { villa: 40, left: 43.1, top: 22.44, width: 4.9, height: 2.06, sqYards: 167, facing: COL2R_FACING },
  { villa: 41, left: 43.1, top: 24.56, width: 4.9, height: 2.03, sqYards: 167, facing: COL2R_FACING },
  { villa: 42, left: 43.1, top: 26.65, width: 4.87, height: 2.8, sqYards: 223, facing: COL2R_FACING },
];

const col2RLower: PlotDef[] = [
  { villa: 43, left: 43.1, top: 31.65, width: 4.87, height: 2.78, sqYards: 223, facing: COL2R_FACING },
  { villa: 44, left: 43.1, top: 34.49, width: 4.9, height: 2.05, sqYards: 167, facing: COL2R_FACING },
  { villa: 45, left: 43.1, top: 36.6, width: 4.9, height: 2.07, sqYards: 167, facing: COL2R_FACING },
  { villa: 46, left: 43.1, top: 38.73, width: 4.9, height: 2.03, sqYards: 167, facing: COL2R_FACING },
  { villa: 47, left: 43.1, top: 40.82, width: 4.9, height: 2.05, sqYards: 167, facing: COL2R_FACING },
  { villa: 48, left: 43.1, top: 42.93, width: 4.9, height: 2.06, sqYards: 167, facing: COL2R_FACING },
  { villa: 49, left: 43.1, top: 45.05, width: 4.9, height: 2.06, sqYards: 167, facing: COL2R_FACING },
  { villa: 50, left: 43.1, top: 47.17, width: 4.9, height: 2.03, sqYards: 167, facing: COL2R_FACING },
];

// ---------------------------------------------------------------------------
// Column 3L — Left side of pair — Facing: East
// Upper: Plots 69 (top) -> 60 (bottom)
// Lower: Plots 59 (top) -> 51 (bottom)
// ---------------------------------------------------------------------------
const COL3L_FACING = "West";

const col3LUpper: PlotDef[] = [
  { villa: 69, left: 51.08, top: 7.9, width: 4.87, height: 2.06, sqYards: 167, facing: COL3L_FACING },
  { villa: 68, left: 51.08, top: 10.02, width: 4.87, height: 2.06, sqYards: 167, facing: COL3L_FACING },
  { villa: 67, left: 51.08, top: 12.14, width: 4.87, height: 2.03, sqYards: 167, facing: COL3L_FACING },
  { villa: 66, left: 51.08, top: 14.23, width: 4.87, height: 2.06, sqYards: 167, facing: COL3L_FACING },
  { villa: 65, left: 51.08, top: 16.35, width: 4.87, height: 2.06, sqYards: 167, facing: COL3L_FACING },
  { villa: 64, left: 51.08, top: 18.47, width: 4.87, height: 2.03, sqYards: 167, facing: COL3L_FACING },
  { villa: 63, left: 51.08, top: 20.56, width: 4.87, height: 2.06, sqYards: 167, facing: COL3L_FACING },
  { villa: 62, left: 51.08, top: 22.68, width: 4.87, height: 2.06, sqYards: 167, facing: COL3L_FACING },
  { villa: 61, left: 51.08, top: 24.8, width: 4.87, height: 2.05, sqYards: 167, facing: COL3L_FACING },
  { villa: 60, left: 51.08, top: 26.91, width: 4.87, height: 2.54, sqYards: 204, facing: COL3L_FACING },
];

const col3LLower: PlotDef[] = [
  { villa: 59, left: 51.08, top: 31.65, width: 4.87, height: 2.36, sqYards: 190, facing: COL3L_FACING },
  { villa: 58, left: 51.08, top: 34.07, width: 4.87, height: 2.05, sqYards: 167, facing: COL3L_FACING },
  { villa: 57, left: 51.08, top: 36.18, width: 4.87, height: 2.06, sqYards: 167, facing: COL3L_FACING },
  { villa: 56, left: 51.08, top: 38.3, width: 4.87, height: 2.04, sqYards: 167, facing: COL3L_FACING },
  { villa: 55, left: 51.08, top: 40.4, width: 4.87, height: 2.05, sqYards: 167, facing: COL3L_FACING },
  { villa: 54, left: 51.08, top: 42.51, width: 4.87, height: 2.05, sqYards: 167, facing: COL3L_FACING },
  { villa: 53, left: 51.08, top: 44.62, width: 4.87, height: 2.07, sqYards: 167, facing: COL3L_FACING },
  { villa: 52, left: 51.08, top: 46.75, width: 4.87, height: 2.03, sqYards: 167, facing: COL3L_FACING },
  { villa: 51, left: 51.08, top: 48.84, width: 4.87, height: 2.05, sqYards: 200, facing: COL3L_FACING },
];

// ---------------------------------------------------------------------------
// Column 3R — Right side of pair — Facing: West
// Plot 70 at very top (special wider plot, 199 SQYD) — sits above 69 in the 3L column on the image
// Upper: Plots 71 (top) -> 80 (bottom)
// Lower: Plots 81 (top) -> 90 (bottom)
// ---------------------------------------------------------------------------
const COL3R_FACING = "East";

const col3RSpecial: PlotDef[] = [
  { villa: 70, left: 51.08, top: 5.36, width: 4.87, height: 2.48, sqYards: 199, facing: COL3L_FACING },
];

const col3RUpper: PlotDef[] = [
  { villa: 71, left: 56.04, top: 7.9, width: 4.87, height: 2.06, sqYards: 200, facing: COL3R_FACING },
  { villa: 72, left: 56.04, top: 10.02, width: 4.87, height: 2.06, sqYards: 167, facing: COL3R_FACING },
  { villa: 73, left: 56.04, top: 12.14, width: 4.87, height: 2.03, sqYards: 167, facing: COL3R_FACING },
  { villa: 74, left: 56.04, top: 14.23, width: 4.87, height: 2.06, sqYards: 167, facing: COL3R_FACING },
  { villa: 75, left: 56.04, top: 16.35, width: 4.87, height: 2.06, sqYards: 167, facing: COL3R_FACING },
  { villa: 76, left: 56.04, top: 18.47, width: 4.87, height: 2.03, sqYards: 167, facing: COL3R_FACING },
  { villa: 77, left: 56.04, top: 20.56, width: 4.87, height: 2.06, sqYards: 167, facing: COL3R_FACING },
  { villa: 78, left: 56.04, top: 22.68, width: 4.87, height: 2.06, sqYards: 167, facing: COL3R_FACING },
  { villa: 79, left: 56.04, top: 24.8, width: 4.87, height: 2.05, sqYards: 167, facing: COL3R_FACING },
  { villa: 80, left: 56.04, top: 26.91, width: 4.87, height: 2.54, sqYards: 204, facing: COL3R_FACING },
];

const col3RLower: PlotDef[] = [
  { villa: 81, left: 56.04, top: 31.65, width: 4.87, height: 2.36, sqYards: 190, facing: COL3R_FACING },
  { villa: 82, left: 56.04, top: 34.07, width: 4.87, height: 2.05, sqYards: 167, facing: COL3R_FACING },
  { villa: 83, left: 56.04, top: 36.18, width: 4.87, height: 2.06, sqYards: 167, facing: COL3R_FACING },
  { villa: 84, left: 56.04, top: 38.3, width: 4.87, height: 2.04, sqYards: 167, facing: COL3R_FACING },
  { villa: 85, left: 56.04, top: 40.4, width: 4.87, height: 2.05, sqYards: 167, facing: COL3R_FACING },
  { villa: 86, left: 56.04, top: 42.51, width: 4.87, height: 2.05, sqYards: 167, facing: COL3R_FACING },
  { villa: 87, left: 56.04, top: 44.62, width: 4.87, height: 2.07, sqYards: 167, facing: COL3R_FACING },
  { villa: 88, left: 56.04, top: 46.75, width: 4.87, height: 2.03, sqYards: 167, facing: COL3R_FACING },
  { villa: 89, left: 56.04, top: 48.84, width: 4.87, height: 2.05, sqYards: 167, facing: COL3R_FACING },
  { villa: 90, left: 56.04, top: 50.95, width: 4.87, height: 2.05, sqYards: 167, facing: COL3R_FACING },
];

// ---------------------------------------------------------------------------
// Column 4 — Single column, far right — Facing: West
// Upper: Plots 111 (top) -> 101 (bottom)
// Lower: Plots 100 (top) -> 91 (bottom)
// ---------------------------------------------------------------------------
const COL4_FACING = "West";

const col4Upper: PlotDef[] = [
  { villa: 111, left: 64.99, top: 5.56, width: 4.85, height: 2.28, sqYards: 187, facing: COL4_FACING },
  { villa: 110, left: 64.99, top: 7.9, width: 4.87, height: 2.06, sqYards: 167, facing: COL4_FACING },
  { villa: 109, left: 64.99, top: 10.02, width: 4.87, height: 2.06, sqYards: 167, facing: COL4_FACING },
  { villa: 108, left: 64.99, top: 12.14, width: 4.87, height: 2.03, sqYards: 167, facing: COL4_FACING },
  { villa: 107, left: 64.99, top: 14.23, width: 4.87, height: 2.06, sqYards: 167, facing: COL4_FACING },
  { villa: 106, left: 64.99, top: 16.35, width: 4.87, height: 2.06, sqYards: 167, facing: COL4_FACING },
  { villa: 105, left: 64.99, top: 18.47, width: 4.87, height: 2.03, sqYards: 167, facing: COL4_FACING },
  { villa: 104, left: 64.99, top: 20.56, width: 4.87, height: 2.06, sqYards: 167, facing: COL4_FACING },
  { villa: 103, left: 64.99, top: 22.68, width: 4.87, height: 2.06, sqYards: 167, facing: COL4_FACING },
  { villa: 102, left: 64.99, top: 24.8, width: 4.87, height: 2.05, sqYards: 167, facing: COL4_FACING },
  { villa: 101, left: 64.99, top: 26.91, width: 4.87, height: 2.22, sqYards: 180, facing: COL4_FACING },
];

const col4Lower: PlotDef[] = [
  { villa: 100, left: 64.99, top: 31.97, width: 4.87, height: 2.04, sqYards: 167, facing: COL4_FACING },
  { villa: 99, left: 64.99, top: 34.07, width: 4.87, height: 2.05, sqYards: 167, facing: COL4_FACING },
  { villa: 98, left: 64.99, top: 36.18, width: 4.87, height: 2.06, sqYards: 167, facing: COL4_FACING },
  { villa: 97, left: 64.99, top: 38.3, width: 4.87, height: 2.04, sqYards: 167, facing: COL4_FACING },
  { villa: 96, left: 64.99, top: 40.4, width: 4.87, height: 2.05, sqYards: 167, facing: COL4_FACING },
  { villa: 95, left: 64.99, top: 42.51, width: 4.87, height: 2.05, sqYards: 167, facing: COL4_FACING },
  { villa: 94, left: 64.99, top: 44.62, width: 4.87, height: 2.07, sqYards: 167, facing: COL4_FACING },
  { villa: 93, left: 64.99, top: 46.75, width: 4.87, height: 2.03, sqYards: 167, facing: COL4_FACING },
  { villa: 92, left: 64.99, top: 48.84, width: 4.87, height: 2.05, sqYards: 167, facing: COL4_FACING },
  { villa: 91, left: 64.99, top: 50.95, width: 4.87, height: 2.05, sqYards: 167, facing: COL4_FACING },
];

// ---------------------------------------------------------------------------
// Combined array — all 111 plots
// ---------------------------------------------------------------------------
// Plot width x depth by size, as printed on the master plan image (51 and 71 per site update, Oct 2026)
const DIMENSIONS_BY_SQYARDS: Record<number, string> = {
  166: "30' x 50'",
  167: "30' x 50'",
  180: "32'6\" x 50'",
  187: "34' x 50'",
  190: "34'7\" x 50'",
  199: "36'7\" x 50'",
  200: "36' x 50'",
  204: "37'1\" x 50'",
  223: "40'7\" x 50'",
};

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
].map((p) => ({ ...p, dimensions: DIMENSIONS_BY_SQYARDS[p.sqYards] }));

// ---------------------------------------------------------------------------
// Praneeth (Developer) Share — all 111 villas belong to the developer for now
// ---------------------------------------------------------------------------
export const KALPAVRUKSHA_PRANEETH_SHARE: Set<number> = new Set(
  Array.from({ length: 111 }, (_, i) => i + 1)
);
