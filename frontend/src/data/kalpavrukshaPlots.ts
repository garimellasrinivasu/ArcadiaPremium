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
 *   Col 3L (left of pair)      — Plot 70 + 69->60,59->51 — faces East
 *   Col 3R (right of pair)     — Plots 71->80,81->90 — faces West
 *   Col 4  (single, far right) — Plots 111->101,100->91 — faces West
 *
 * Upper section: above "30' WIDE ROAD"
 * Lower section: below "30' WIDE ROAD"
 *
 * Coordinates measured from the plot fill colours in the actual PNG
 * (re-measured Oct 2026 — earlier values were offset from the image).
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
// Upper: Plots 1 (top) -> 8 (bottom)   x: 30.16%  width: 4.9%
// Lower: Plots 9 (top) -> 16 (bottom)  x: 30.16%  width: 4.9%
// ---------------------------------------------------------------------------
const COL1_FACING = "East";

const col1Upper: PlotDef[] = [
  { villa: 1, left: 32.16, top: 9.29, width: 2.9, height: 2.98, sqYards: 166, facing: COL1_FACING },
  { villa: 2, left: 32.16, top: 12.6, width: 2.9, height: 3.18, sqYards: 167, facing: COL1_FACING },
  { villa: 3, left: 30.16, top: 16.11, width: 4.9, height: 1.79, sqYards: 167, facing: COL1_FACING },
  { villa: 4, left: 30.16, top: 18.52, width: 4.9, height: 1.75, sqYards: 167, facing: COL1_FACING },
  { villa: 5, left: 30.16, top: 20.64, width: 4.9, height: 1.75, sqYards: 167, facing: COL1_FACING },
  { villa: 6, left: 30.16, top: 22.76, width: 4.9, height: 1.75, sqYards: 167, facing: COL1_FACING },
  { villa: 7, left: 30.16, top: 24.85, width: 4.9, height: 1.75, sqYards: 167, facing: COL1_FACING },
  { villa: 8, left: 30.16, top: 27.03, width: 4.9, height: 2.1, sqYards: 200, facing: COL1_FACING },
];

const col1Lower: PlotDef[] = [
  { villa: 9, left: 30.16, top: 32.33, width: 4.9, height: 2.1, sqYards: 200, facing: COL1_FACING },
  { villa: 10, left: 30.16, top: 34.79, width: 4.9, height: 1.75, sqYards: 167, facing: COL1_FACING },
  { villa: 11, left: 30.16, top: 36.91, width: 4.9, height: 1.75, sqYards: 167, facing: COL1_FACING },
  { villa: 12, left: 30.16, top: 39.02, width: 4.9, height: 1.73, sqYards: 167, facing: COL1_FACING },
  { villa: 13, left: 30.16, top: 41.12, width: 4.9, height: 1.75, sqYards: 167, facing: COL1_FACING },
  { villa: 14, left: 30.16, top: 43.24, width: 4.9, height: 1.75, sqYards: 167, facing: COL1_FACING },
  { villa: 15, left: 30.16, top: 45.35, width: 4.9, height: 1.75, sqYards: 167, facing: COL1_FACING },
  { villa: 16, left: 30.16, top: 47.47, width: 4.9, height: 1.75, sqYards: 167, facing: COL1_FACING },
];

// ---------------------------------------------------------------------------
// Column 2L — Left side of pair — Facing: East
// Upper: Plots 33 (top) -> 25 (bottom)
// Lower: Plots 24 (top) -> 17 (bottom)
// ---------------------------------------------------------------------------
const COL2L_FACING = "East";

const col2LUpper: PlotDef[] = [
  { villa: 33, left: 38.11, top: 10.08, width: 4.56, height: 1.75, sqYards: 167, facing: COL2L_FACING },
  { villa: 32, left: 38.11, top: 12.2, width: 4.56, height: 1.75, sqYards: 167, facing: COL2L_FACING },
  { villa: 31, left: 38.11, top: 14.31, width: 4.56, height: 1.75, sqYards: 167, facing: COL2L_FACING },
  { villa: 30, left: 38.11, top: 16.43, width: 4.56, height: 1.73, sqYards: 167, facing: COL2L_FACING },
  { villa: 29, left: 38.11, top: 18.52, width: 4.56, height: 1.75, sqYards: 167, facing: COL2L_FACING },
  { villa: 28, left: 38.11, top: 20.64, width: 4.56, height: 1.75, sqYards: 167, facing: COL2L_FACING },
  { villa: 27, left: 38.11, top: 22.76, width: 4.56, height: 1.75, sqYards: 167, facing: COL2L_FACING },
  { villa: 26, left: 38.11, top: 24.85, width: 4.56, height: 1.75, sqYards: 167, facing: COL2L_FACING },
  { villa: 25, left: 38.11, top: 27.03, width: 4.56, height: 2.44, sqYards: 223, facing: COL2L_FACING },
];

const col2LLower: PlotDef[] = [
  { villa: 24, left: 38.11, top: 31.63, width: 4.56, height: 2.54, sqYards: 223, facing: COL2L_FACING },
  { villa: 23, left: 38.11, top: 34.79, width: 4.56, height: 1.75, sqYards: 167, facing: COL2L_FACING },
  { villa: 22, left: 38.11, top: 36.91, width: 4.56, height: 1.75, sqYards: 167, facing: COL2L_FACING },
  { villa: 21, left: 38.11, top: 39.02, width: 4.56, height: 1.73, sqYards: 167, facing: COL2L_FACING },
  { villa: 20, left: 38.11, top: 41.12, width: 4.56, height: 1.75, sqYards: 167, facing: COL2L_FACING },
  { villa: 19, left: 38.11, top: 43.24, width: 4.56, height: 1.75, sqYards: 167, facing: COL2L_FACING },
  { villa: 18, left: 38.11, top: 45.35, width: 4.56, height: 1.75, sqYards: 167, facing: COL2L_FACING },
  { villa: 17, left: 38.11, top: 47.47, width: 4.56, height: 1.75, sqYards: 167, facing: COL2L_FACING },
];

// ---------------------------------------------------------------------------
// Column 2R — Right side of pair — Facing: West
// Upper: Plots 34 (top) -> 42 (bottom)
// Lower: Plots 43 (top) -> 50 (bottom)
// ---------------------------------------------------------------------------
const COL2R_FACING = "West";

const col2RUpper: PlotDef[] = [
  { villa: 34, left: 43.07, top: 10.08, width: 4.56, height: 1.75, sqYards: 167, facing: COL2R_FACING },
  { villa: 35, left: 43.07, top: 12.2, width: 4.56, height: 1.75, sqYards: 167, facing: COL2R_FACING },
  { villa: 36, left: 43.07, top: 14.31, width: 4.56, height: 1.75, sqYards: 167, facing: COL2R_FACING },
  { villa: 37, left: 43.07, top: 16.43, width: 4.56, height: 1.73, sqYards: 167, facing: COL2R_FACING },
  { villa: 38, left: 43.07, top: 18.52, width: 4.56, height: 1.75, sqYards: 167, facing: COL2R_FACING },
  { villa: 39, left: 43.07, top: 20.64, width: 4.56, height: 1.75, sqYards: 167, facing: COL2R_FACING },
  { villa: 40, left: 43.07, top: 22.76, width: 4.56, height: 1.75, sqYards: 167, facing: COL2R_FACING },
  { villa: 41, left: 43.07, top: 24.85, width: 4.56, height: 1.75, sqYards: 167, facing: COL2R_FACING },
  { villa: 42, left: 43.07, top: 27.03, width: 4.56, height: 2.44, sqYards: 223, facing: COL2R_FACING },
];

const col2RLower: PlotDef[] = [
  { villa: 43, left: 43.07, top: 31.63, width: 4.56, height: 2.54, sqYards: 223, facing: COL2R_FACING },
  { villa: 44, left: 43.07, top: 34.79, width: 4.56, height: 1.75, sqYards: 167, facing: COL2R_FACING },
  { villa: 45, left: 43.07, top: 36.91, width: 4.56, height: 1.75, sqYards: 167, facing: COL2R_FACING },
  { villa: 46, left: 43.07, top: 39.02, width: 4.56, height: 1.73, sqYards: 167, facing: COL2R_FACING },
  { villa: 47, left: 43.07, top: 41.12, width: 4.56, height: 1.75, sqYards: 167, facing: COL2R_FACING },
  { villa: 48, left: 43.07, top: 43.24, width: 4.56, height: 1.75, sqYards: 167, facing: COL2R_FACING },
  { villa: 49, left: 43.07, top: 45.35, width: 4.56, height: 1.75, sqYards: 167, facing: COL2R_FACING },
  { villa: 50, left: 43.07, top: 47.47, width: 4.56, height: 1.75, sqYards: 167, facing: COL2R_FACING },
];

// ---------------------------------------------------------------------------
// Column 3L — Left side of pair — Facing: East
// Upper: Plots 69 (top) -> 60 (bottom)
// Lower: Plots 59 (top) -> 51 (bottom)
// ---------------------------------------------------------------------------
const COL3L_FACING = "East";

const col3LUpper: PlotDef[] = [
  { villa: 69, left: 51.05, top: 8.22, width: 4.57, height: 1.75, sqYards: 167, facing: COL3L_FACING },
  { villa: 68, left: 51.05, top: 10.34, width: 4.57, height: 1.75, sqYards: 167, facing: COL3L_FACING },
  { villa: 67, left: 51.05, top: 12.44, width: 4.57, height: 1.75, sqYards: 167, facing: COL3L_FACING },
  { villa: 66, left: 51.05, top: 14.55, width: 4.57, height: 1.75, sqYards: 167, facing: COL3L_FACING },
  { villa: 65, left: 51.05, top: 16.67, width: 4.57, height: 1.75, sqYards: 167, facing: COL3L_FACING },
  { villa: 64, left: 51.05, top: 18.77, width: 4.57, height: 1.75, sqYards: 167, facing: COL3L_FACING },
  { villa: 63, left: 51.05, top: 20.88, width: 4.57, height: 1.75, sqYards: 167, facing: COL3L_FACING },
  { villa: 62, left: 51.05, top: 23.0, width: 4.57, height: 1.75, sqYards: 167, facing: COL3L_FACING },
  { villa: 61, left: 51.05, top: 25.12, width: 4.57, height: 1.75, sqYards: 167, facing: COL3L_FACING },
  { villa: 60, left: 51.05, top: 26.91, width: 4.57, height: 2.56, sqYards: 204, facing: COL3L_FACING },
];

const col3LLower: PlotDef[] = [
  { villa: 59, left: 51.05, top: 31.63, width: 4.57, height: 2.1, sqYards: 190, facing: COL3L_FACING },
  { villa: 58, left: 51.05, top: 34.37, width: 4.57, height: 1.75, sqYards: 167, facing: COL3L_FACING },
  { villa: 57, left: 51.05, top: 36.48, width: 4.57, height: 1.75, sqYards: 167, facing: COL3L_FACING },
  { villa: 56, left: 51.05, top: 38.6, width: 4.57, height: 1.73, sqYards: 167, facing: COL3L_FACING },
  { villa: 55, left: 51.05, top: 40.7, width: 4.57, height: 1.75, sqYards: 167, facing: COL3L_FACING },
  { villa: 54, left: 51.05, top: 42.81, width: 4.57, height: 1.75, sqYards: 167, facing: COL3L_FACING },
  { villa: 53, left: 51.05, top: 44.93, width: 4.57, height: 1.75, sqYards: 167, facing: COL3L_FACING },
  { villa: 52, left: 51.05, top: 47.05, width: 4.57, height: 1.75, sqYards: 167, facing: COL3L_FACING },
  { villa: 51, left: 51.05, top: 49.14, width: 4.57, height: 1.75, sqYards: 167, facing: COL3L_FACING },
];

// ---------------------------------------------------------------------------
// Column 3R — Right side of pair — Facing: West
// Plot 70 at very top (special wider plot, 199 SQYD) — sits above 69 in the 3L column on the image
// Upper: Plots 71 (top) -> 80 (bottom)
// Lower: Plots 81 (top) -> 90 (bottom)
// ---------------------------------------------------------------------------
const COL3R_FACING = "West";

const col3RSpecial: PlotDef[] = [
  { villa: 70, left: 51.05, top: 5.34, width: 4.57, height: 2.52, sqYards: 199, facing: COL3R_FACING },
];

const col3RUpper: PlotDef[] = [
  { villa: 71, left: 56.01, top: 8.22, width: 4.57, height: 1.75, sqYards: 167, facing: COL3R_FACING },
  { villa: 72, left: 56.01, top: 10.34, width: 4.57, height: 1.75, sqYards: 167, facing: COL3R_FACING },
  { villa: 73, left: 56.01, top: 12.44, width: 4.57, height: 1.75, sqYards: 167, facing: COL3R_FACING },
  { villa: 74, left: 56.01, top: 14.55, width: 4.57, height: 1.75, sqYards: 167, facing: COL3R_FACING },
  { villa: 75, left: 56.01, top: 16.67, width: 4.57, height: 1.75, sqYards: 167, facing: COL3R_FACING },
  { villa: 76, left: 56.01, top: 18.77, width: 4.57, height: 1.75, sqYards: 167, facing: COL3R_FACING },
  { villa: 77, left: 56.01, top: 20.88, width: 4.57, height: 1.75, sqYards: 167, facing: COL3R_FACING },
  { villa: 78, left: 56.01, top: 23.0, width: 4.57, height: 1.75, sqYards: 167, facing: COL3R_FACING },
  { villa: 79, left: 56.01, top: 25.12, width: 4.57, height: 1.75, sqYards: 167, facing: COL3R_FACING },
  { villa: 80, left: 56.01, top: 26.91, width: 4.57, height: 2.56, sqYards: 204, facing: COL3R_FACING },
];

const col3RLower: PlotDef[] = [
  { villa: 81, left: 56.01, top: 31.63, width: 4.57, height: 2.1, sqYards: 190, facing: COL3R_FACING },
  { villa: 82, left: 56.01, top: 34.37, width: 4.57, height: 1.75, sqYards: 167, facing: COL3R_FACING },
  { villa: 83, left: 56.01, top: 36.48, width: 4.57, height: 1.75, sqYards: 167, facing: COL3R_FACING },
  { villa: 84, left: 56.01, top: 38.6, width: 4.57, height: 1.73, sqYards: 167, facing: COL3R_FACING },
  { villa: 85, left: 56.01, top: 40.7, width: 4.57, height: 1.75, sqYards: 167, facing: COL3R_FACING },
  { villa: 86, left: 56.01, top: 42.81, width: 4.57, height: 1.75, sqYards: 167, facing: COL3R_FACING },
  { villa: 87, left: 56.01, top: 44.93, width: 4.57, height: 1.75, sqYards: 167, facing: COL3R_FACING },
  { villa: 88, left: 56.01, top: 47.05, width: 4.57, height: 1.75, sqYards: 167, facing: COL3R_FACING },
  { villa: 89, left: 56.01, top: 49.14, width: 4.57, height: 1.77, sqYards: 167, facing: COL3R_FACING },
  { villa: 90, left: 56.01, top: 51.26, width: 4.57, height: 1.75, sqYards: 167, facing: COL3R_FACING },
];

// ---------------------------------------------------------------------------
// Column 4 — Single column, far right — Facing: West
// Upper: Plots 111 (top) -> 101 (bottom)
// Lower: Plots 100 (top) -> 91 (bottom)
// ---------------------------------------------------------------------------
const COL4_FACING = "West";

const col4Upper: PlotDef[] = [
  { villa: 111, left: 64.99, top: 5.54, width: 4.54, height: 2.32, sqYards: 187, facing: COL4_FACING },
  { villa: 110, left: 64.99, top: 8.22, width: 4.54, height: 1.75, sqYards: 167, facing: COL4_FACING },
  { villa: 109, left: 64.99, top: 10.34, width: 4.54, height: 1.75, sqYards: 167, facing: COL4_FACING },
  { villa: 108, left: 64.99, top: 12.44, width: 4.54, height: 1.75, sqYards: 167, facing: COL4_FACING },
  { villa: 107, left: 64.99, top: 14.55, width: 4.54, height: 1.75, sqYards: 167, facing: COL4_FACING },
  { villa: 106, left: 64.99, top: 16.67, width: 4.54, height: 1.75, sqYards: 167, facing: COL4_FACING },
  { villa: 105, left: 64.99, top: 18.77, width: 4.54, height: 1.75, sqYards: 167, facing: COL4_FACING },
  { villa: 104, left: 64.99, top: 20.88, width: 4.54, height: 1.75, sqYards: 167, facing: COL4_FACING },
  { villa: 103, left: 64.99, top: 23.0, width: 4.54, height: 1.75, sqYards: 167, facing: COL4_FACING },
  { villa: 102, left: 64.99, top: 25.12, width: 4.54, height: 1.75, sqYards: 167, facing: COL4_FACING },
  { villa: 101, left: 64.99, top: 26.91, width: 4.54, height: 2.22, sqYards: 180, facing: COL4_FACING },
];

const col4Lower: PlotDef[] = [
  { villa: 100, left: 64.99, top: 32.27, width: 4.54, height: 1.73, sqYards: 167, facing: COL4_FACING },
  { villa: 99, left: 64.99, top: 34.37, width: 4.54, height: 1.75, sqYards: 167, facing: COL4_FACING },
  { villa: 98, left: 64.99, top: 36.48, width: 4.54, height: 1.75, sqYards: 167, facing: COL4_FACING },
  { villa: 97, left: 64.99, top: 38.6, width: 4.54, height: 1.73, sqYards: 167, facing: COL4_FACING },
  { villa: 96, left: 64.99, top: 40.7, width: 4.54, height: 1.75, sqYards: 167, facing: COL4_FACING },
  { villa: 95, left: 64.99, top: 42.81, width: 4.54, height: 1.75, sqYards: 167, facing: COL4_FACING },
  { villa: 94, left: 64.99, top: 44.93, width: 4.54, height: 1.75, sqYards: 167, facing: COL4_FACING },
  { villa: 93, left: 64.99, top: 47.05, width: 4.54, height: 1.75, sqYards: 167, facing: COL4_FACING },
  { villa: 92, left: 64.99, top: 49.14, width: 4.54, height: 1.77, sqYards: 167, facing: COL4_FACING },
  { villa: 91, left: 64.99, top: 51.26, width: 4.54, height: 1.75, sqYards: 167, facing: COL4_FACING },
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
