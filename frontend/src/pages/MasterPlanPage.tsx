import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { villaBlockingService } from "../services/villaBlockingService";
import type { VillaBlockingDto } from "../services/villaBlockingService";
import { useDownloadEnabled } from "../components/ViewOnlyWrapper";
import { KALPAVRUKSHA_PLOTS, KALPAVRUKSHA_PRANEETH_SHARE } from "../data/kalpavrukshaPlots";
import type { PlotDef } from "../data/kalpavrukshaPlots";
import { ARAVINDHAM_PLOTS, ARAVINDHAM_PRANEETH_SHARE } from "../data/aravindhamPlots";
import { projectService } from "../services/projectService";
import type { ProjectDto } from "../services/projectService";

// Praneeth Share villas (Yellow in the master plan)
const ARCADIA_PRANEETH_SHARE = new Set([
  2,3,4,5,7,11,12,13,14,15,16,17,18,19,20,21,24,25,26,28,29,30,31,32,34,35,
  38,40,47,50,51,53,54,60,61,65,67,68,69,70,71,72,73,76,77,79,80,81,83,84,
  87,88,89,90,91,92,94,95,96,97,98,99,104,109,115,116,119,120,123,124,130,
  131,132,133,143,144,145,146,147,148,154,155,156,157,167,168,169,170,172,
  173,174,184,185,187,194,195,196,197,198,199,200,211,212,213,214,215,216,
  217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,
  235,236,237
]);

// Red villas removed — all villas are now blockable via the blocking feature
// Villa 17's red fill was replaced with yellow directly in the PNG image

export const ARCADIA_PLOTS: PlotDef[] = [
  { villa: 1, left: 21.81, top: 27.19, width: 4.44, height: 2.22, sqYards: 200, facing: "West" },
  { villa: 2, left: 21.81, top: 29.5, width: 4.44, height: 2.25, sqYards: 200, facing: "West" },
  { villa: 3, left: 21.81, top: 31.83, width: 4.44, height: 2.22, sqYards: 200, facing: "West" },
  { villa: 4, left: 21.81, top: 34.17, width: 4.44, height: 3.99, sqYards: 350, facing: "West" },
  { villa: 5, left: 26.37, top: 68.05, width: 4.44, height: 1.85, sqYards: 167, facing: "East" },
  { villa: 6, left: 26.37, top: 66.12, width: 4.44, height: 1.85, sqYards: 167, facing: "East" },
  { villa: 7, left: 26.37, top: 64.18, width: 4.44, height: 1.85, sqYards: 167, facing: "East" },
  { villa: 8, left: 26.37, top: 61.53, width: 4.44, height: 2.56, sqYards: 227, facing: "East" },
  { villa: 9, left: 26.37, top: 56.63, width: 4.44, height: 2.22, sqYards: 200, facing: "East" },
  { villa: 10, left: 26.37, top: 54.52, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 11, left: 26.37, top: 52.41, width: 4.44, height: 2.02, sqYards: 180, facing: "East" },
  { villa: 12, left: 26.37, top: 50.33, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 13, left: 26.37, top: 48.22, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 14, left: 26.37, top: 46.11, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 15, left: 26.37, top: 43.8, width: 4.44, height: 2.22, sqYards: 200, facing: "East" },
  { villa: 16, left: 26.37, top: 40.87, width: 4.44, height: 2.82, sqYards: 250, facing: "East" },
  { villa: 17, left: 26.37, top: 34.17, width: 4.44, height: 3.99, sqYards: 350, facing: "East" },
  { villa: 18, left: 26.37, top: 30.69, width: 4.44, height: 3.19, sqYards: 302, facing: "East" },
  { villa: 19, left: 26.37, top: 28.3, width: 4.44, height: 2.25, sqYards: 200, facing: "East" },
  { villa: 20, left: 26.37, top: 25.94, width: 4.44, height: 2.25, sqYards: 200, facing: "East" },
  { villa: 21, left: 34.6, top: 24.08, width: 4.44, height: 1.85, sqYards: 167, facing: "West" },
  { villa: 22, left: 34.6, top: 26.02, width: 4.44, height: 2.22, sqYards: 200, facing: "West" },
  { villa: 23, left: 34.6, top: 28.36, width: 4.44, height: 2.22, sqYards: 200, facing: "West" },
  { villa: 24, left: 34.6, top: 30.69, width: 4.44, height: 2.22, sqYards: 200, facing: "West" },
  { villa: 25, left: 34.6, top: 33.0, width: 4.44, height: 2.22, sqYards: 200, facing: "West" },
  { villa: 26, left: 34.6, top: 35.34, width: 4.44, height: 2.82, sqYards: 250, facing: "West" },
  { villa: 27, left: 34.6, top: 46.11, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 28, left: 34.6, top: 48.22, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 29, left: 34.6, top: 50.33, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 30, left: 34.6, top: 52.41, width: 4.44, height: 2.02, sqYards: 180, facing: "West" },
  { villa: 31, left: 34.6, top: 54.52, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 32, left: 34.6, top: 56.63, width: 4.44, height: 1.99, sqYards: 198, facing: "West" },
  { villa: 33, left: 34.6, top: 61.5, width: 4.44, height: 2.56, sqYards: 225, facing: "West" },
  { villa: 34, left: 34.6, top: 64.18, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 35, left: 34.6, top: 66.29, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 36, left: 34.6, top: 68.4, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 37, left: 34.6, top: 70.48, width: 4.44, height: 1.85, sqYards: 167, facing: "West" },
  { villa: 38, left: 34.6, top: 72.44, width: 4.44, height: 1.82, sqYards: 167, facing: "West" },
  { villa: 39, left: 34.6, top: 74.38, width: 4.44, height: 1.82, sqYards: 167, facing: "West" },
  { villa: 40, left: 34.6, top: 76.31, width: 4.44, height: 1.99, sqYards: 199, facing: "West" },
  { villa: 41, left: 39.19, top: 76.31, width: 4.44, height: 1.99, sqYards: 302, facing: "East" },
  { villa: 42, left: 39.19, top: 74.38, width: 4.44, height: 1.82, sqYards: 167, facing: "East" },
  { villa: 43, left: 39.19, top: 72.44, width: 4.44, height: 1.82, sqYards: 167, facing: "East" },
  { villa: 44, left: 39.19, top: 70.48, width: 4.44, height: 1.82, sqYards: 167, facing: "East" },
  { villa: 45, left: 39.19, top: 68.4, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 46, left: 39.19, top: 66.29, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 47, left: 39.19, top: 64.18, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 48, left: 39.19, top: 61.53, width: 4.44, height: 2.56, sqYards: 225, facing: "East" },
  { villa: 49, left: 39.19, top: 56.63, width: 4.44, height: 2.22, sqYards: 198, facing: "East" },
  { villa: 50, left: 39.19, top: 54.52, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 51, left: 39.19, top: 52.41, width: 4.44, height: 2.02, sqYards: 180, facing: "East" },
  { villa: 52, left: 39.19, top: 50.33, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 53, left: 39.19, top: 48.22, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 54, left: 39.19, top: 46.11, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 55, left: 39.19, top: 35.34, width: 4.44, height: 2.82, sqYards: 250, facing: "East" },
  { villa: 56, left: 39.19, top: 33.0, width: 4.44, height: 2.22, sqYards: 200, facing: "East" },
  { villa: 57, left: 39.19, top: 30.69, width: 4.44, height: 2.22, sqYards: 200, facing: "East" },
  { villa: 58, left: 39.19, top: 28.36, width: 4.44, height: 2.22, sqYards: 200, facing: "East" },
  { villa: 59, left: 39.19, top: 26.02, width: 4.44, height: 2.22, sqYards: 200, facing: "East" },
  { villa: 60, left: 39.19, top: 23.11, width: 4.44, height: 2.82, sqYards: 250, facing: "East" },
  { villa: 61, left: 46.49, top: 21.38, width: 4.44, height: 2.22, sqYards: 180, facing: "West" },
  { villa: 62, left: 46.49, top: 23.71, width: 4.44, height: 2.22, sqYards: 200, facing: "West" },
  { villa: 63, left: 46.49, top: 26.02, width: 4.44, height: 2.22, sqYards: 200, facing: "West" },
  { villa: 64, left: 46.49, top: 28.36, width: 4.44, height: 2.22, sqYards: 200, facing: "West" },
  { villa: 65, left: 46.49, top: 30.69, width: 4.44, height: 2.22, sqYards: 200, facing: "West" },
  { villa: 66, left: 46.49, top: 33.0, width: 4.44, height: 2.22, sqYards: 200, facing: "West" },
  { villa: 67, left: 46.49, top: 35.34, width: 4.44, height: 2.82, sqYards: 250, facing: "West" },
  { villa: 68, left: 46.49, top: 46.11, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 69, left: 46.49, top: 48.22, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 70, left: 46.49, top: 50.33, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 71, left: 46.49, top: 52.41, width: 4.44, height: 2.02, sqYards: 180, facing: "West" },
  { villa: 72, left: 46.49, top: 54.52, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 73, left: 46.49, top: 56.63, width: 4.44, height: 2.22, sqYards: 198, facing: "West" },
  { villa: 74, left: 46.49, top: 61.73, width: 4.44, height: 2.56, sqYards: 225, facing: "West" },
  { villa: 75, left: 46.49, top: 64.18, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 76, left: 46.49, top: 66.29, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 77, left: 46.49, top: 68.4, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 78, left: 46.49, top: 70.48, width: 4.44, height: 2.02, sqYards: 180, facing: "West" },
  { villa: 79, left: 46.49, top: 72.58, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 80, left: 46.49, top: 74.69, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 81, left: 46.49, top: 76.8, width: 4.44, height: 1.82, sqYards: 167, facing: "West" },
  { villa: 82, left: 46.49, top: 78.74, width: 4.44, height: 1.82, sqYards: 167, facing: "West" },
  { villa: 83, left: 46.49, top: 80.68, width: 4.48, height: 1.82, sqYards: 167, facing: "West" },
  { villa: 84, left: 51.09, top: 80.68, width: 4.4, height: 1.99, sqYards: 302, facing: "East" },
  { villa: 85, left: 51.09, top: 78.74, width: 4.4, height: 1.82, sqYards: 167, facing: "East" },
  { villa: 86, left: 51.09, top: 76.8, width: 4.4, height: 1.82, sqYards: 167, facing: "East" },
  { villa: 87, left: 51.09, top: 74.69, width: 4.4, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 88, left: 51.09, top: 72.58, width: 4.4, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 89, left: 51.09, top: 70.48, width: 4.4, height: 2.02, sqYards: 180, facing: "East" },
  { villa: 90, left: 51.09, top: 68.4, width: 4.4, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 91, left: 51.09, top: 66.29, width: 4.4, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 92, left: 51.09, top: 64.18, width: 4.4, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 93, left: 51.09, top: 61.53, width: 4.4, height: 2.56, sqYards: 225, facing: "East" },
  { villa: 94, left: 51.09, top: 56.63, width: 4.4, height: 2.22, sqYards: 198, facing: "East" },
  { villa: 95, left: 51.09, top: 54.52, width: 4.4, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 96, left: 51.09, top: 52.41, width: 4.4, height: 2.02, sqYards: 180, facing: "East" },
  { villa: 97, left: 51.09, top: 50.33, width: 4.4, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 98, left: 51.09, top: 48.22, width: 4.4, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 99, left: 51.09, top: 46.11, width: 4.4, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 100, left: 51.09, top: 35.34, width: 4.4, height: 2.82, sqYards: 250, facing: "East" },
  { villa: 101, left: 51.09, top: 33.0, width: 4.4, height: 2.22, sqYards: 200, facing: "East" },
  { villa: 102, left: 51.09, top: 30.69, width: 4.4, height: 2.22, sqYards: 200, facing: "East" },
  { villa: 103, left: 51.09, top: 28.36, width: 4.4, height: 2.22, sqYards: 200, facing: "East" },
  { villa: 104, left: 51.09, top: 26.02, width: 4.4, height: 2.22, sqYards: 200, facing: "East" },
  { villa: 105, left: 51.09, top: 23.71, width: 4.4, height: 2.22, sqYards: 200, facing: "East" },
  { villa: 106, left: 51.09, top: 20.78, width: 4.4, height: 2.82, sqYards: 250, facing: "East" },
  { villa: 107, left: 58.39, top: 19.04, width: 4.44, height: 2.22, sqYards: 200, facing: "West" },
  { villa: 108, left: 58.39, top: 21.37, width: 4.44, height: 2.22, sqYards: 200, facing: "West" },
  { villa: 109, left: 58.39, top: 23.71, width: 4.44, height: 2.22, sqYards: 200, facing: "West" },
  { villa: 110, left: 58.39, top: 26.02, width: 4.44, height: 2.22, sqYards: 200, facing: "West" },
  { villa: 111, left: 58.39, top: 28.36, width: 4.44, height: 2.22, sqYards: 200, facing: "West" },
  { villa: 112, left: 58.39, top: 30.69, width: 4.44, height: 2.22, sqYards: 200, facing: "West" },
  { villa: 113, left: 58.39, top: 33.0, width: 4.44, height: 2.22, sqYards: 200, facing: "West" },
  { villa: 114, left: 58.39, top: 35.34, width: 4.44, height: 2.82, sqYards: 250, facing: "West" },
  { villa: 115, left: 58.39, top: 46.11, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 116, left: 58.39, top: 48.22, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 117, left: 58.39, top: 50.33, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 118, left: 58.39, top: 52.41, width: 4.44, height: 2.02, sqYards: 180, facing: "West" },
  { villa: 119, left: 58.39, top: 54.52, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 120, left: 58.39, top: 56.63, width: 4.44, height: 2.22, sqYards: 198, facing: "West" },
  { villa: 121, left: 58.39, top: 61.73, width: 4.44, height: 2.56, sqYards: 225, facing: "West" },
  { villa: 122, left: 58.39, top: 64.18, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 123, left: 58.39, top: 66.29, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 124, left: 58.39, top: 68.4, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 125, left: 58.39, top: 70.48, width: 4.44, height: 2.02, sqYards: 180, facing: "West" },
  { villa: 126, left: 58.39, top: 72.58, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 127, left: 58.39, top: 74.69, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 128, left: 58.39, top: 76.8, width: 4.44, height: 1.82, sqYards: 167, facing: "West" },
  { villa: 129, left: 58.39, top: 78.74, width: 4.44, height: 1.82, sqYards: 167, facing: "West" },
  { villa: 130, left: 58.39, top: 80.68, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 131, left: 58.39, top: 82.79, width: 4.44, height: 2.79, sqYards: 250, facing: "West" },
  { villa: 132, left: 62.94, top: 82.62, width: 4.44, height: 2.99, sqYards: 250, facing: "East" },
  { villa: 133, left: 62.94, top: 80.68, width: 4.44, height: 1.82, sqYards: 167, facing: "East" },
  { villa: 134, left: 62.94, top: 78.74, width: 4.44, height: 1.82, sqYards: 167, facing: "East" },
  { villa: 135, left: 62.94, top: 76.8, width: 4.44, height: 1.82, sqYards: 167, facing: "East" },
  { villa: 136, left: 62.94, top: 74.69, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 137, left: 62.94, top: 72.58, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 138, left: 62.94, top: 70.48, width: 4.44, height: 2.02, sqYards: 180, facing: "East" },
  { villa: 139, left: 62.94, top: 68.4, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 140, left: 62.94, top: 66.29, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 141, left: 62.94, top: 64.18, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 142, left: 62.94, top: 61.53, width: 4.44, height: 2.56, sqYards: 225, facing: "East" },
  { villa: 143, left: 62.94, top: 56.63, width: 4.44, height: 2.22, sqYards: 198, facing: "East" },
  { villa: 144, left: 62.94, top: 54.52, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 145, left: 62.94, top: 52.41, width: 4.44, height: 2.02, sqYards: 180, facing: "East" },
  { villa: 146, left: 62.94, top: 50.33, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 147, left: 62.94, top: 48.22, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 148, left: 62.94, top: 46.11, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 149, left: 62.94, top: 35.34, width: 4.44, height: 2.82, sqYards: 250, facing: "East" },
  { villa: 150, left: 62.94, top: 33.0, width: 4.44, height: 2.22, sqYards: 200, facing: "East" },
  { villa: 151, left: 62.94, top: 30.69, width: 4.44, height: 2.22, sqYards: 200, facing: "East" },
  { villa: 152, left: 62.94, top: 28.36, width: 4.44, height: 2.22, sqYards: 200, facing: "East" },
  { villa: 153, left: 62.94, top: 26.02, width: 4.44, height: 2.22, sqYards: 200, facing: "East" },
  { villa: 154, left: 62.94, top: 23.4, width: 4.44, height: 2.54, sqYards: 225, facing: "East" },
  { villa: 155, left: 62.94, top: 20.78, width: 4.44, height: 2.54, sqYards: 225, facing: "East" },
  { villa: 156, left: 62.94, top: 18.13, width: 4.44, height: 2.82, sqYards: 250, facing: "East" },
  { villa: 157, left: 70.28, top: 16.41, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 158, left: 70.28, top: 18.52, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 159, left: 70.28, top: 20.63, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 160, left: 70.28, top: 22.71, width: 4.44, height: 2.02, sqYards: 180, facing: "West" },
  { villa: 161, left: 70.28, top: 24.82, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 162, left: 70.28, top: 26.93, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 163, left: 70.28, top: 29.04, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 164, left: 70.28, top: 31.12, width: 4.44, height: 2.02, sqYards: 180, facing: "West" },
  { villa: 165, left: 70.28, top: 33.23, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 166, left: 70.28, top: 35.34, width: 4.44, height: 2.82, sqYards: 250, facing: "West" },
  { villa: 167, left: 70.28, top: 40.87, width: 4.44, height: 2.82, sqYards: 250, facing: "West" },
  { villa: 168, left: 70.28, top: 43.8, width: 4.44, height: 2.22, sqYards: 200, facing: "West" },
  { villa: 169, left: 70.28, top: 46.11, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 170, left: 70.28, top: 48.22, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 171, left: 70.28, top: 50.33, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 172, left: 70.28, top: 52.41, width: 4.44, height: 2.02, sqYards: 180, facing: "West" },
  { villa: 173, left: 70.28, top: 54.52, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 174, left: 70.28, top: 56.63, width: 4.44, height: 2.22, sqYards: 198, facing: "West" },
  { villa: 175, left: 70.28, top: 61.73, width: 4.44, height: 2.56, sqYards: 225, facing: "West" },
  { villa: 176, left: 70.28, top: 64.18, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 177, left: 70.28, top: 66.29, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 178, left: 70.28, top: 68.4, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 179, left: 70.28, top: 70.48, width: 4.44, height: 2.02, sqYards: 180, facing: "West" },
  { villa: 180, left: 70.28, top: 72.58, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 181, left: 70.28, top: 74.69, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 182, left: 70.28, top: 76.8, width: 4.44, height: 1.82, sqYards: 167, facing: "West" },
  { villa: 183, left: 70.28, top: 78.74, width: 4.44, height: 1.82, sqYards: 167, facing: "West" },
  { villa: 184, left: 70.28, top: 80.68, width: 4.44, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 185, left: 74.84, top: 78.74, width: 4.44, height: 1.82, sqYards: 167, facing: "East" },
  { villa: 186, left: 74.84, top: 76.8, width: 4.44, height: 1.82, sqYards: 167, facing: "East" },
  { villa: 187, left: 74.84, top: 74.69, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 188, left: 74.84, top: 72.58, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 189, left: 74.84, top: 70.48, width: 4.44, height: 2.02, sqYards: 180, facing: "East" },
  { villa: 190, left: 74.84, top: 68.4, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 191, left: 74.84, top: 66.29, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 192, left: 74.84, top: 64.18, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 193, left: 74.84, top: 61.53, width: 4.44, height: 2.56, sqYards: 225, facing: "East" },
  { villa: 194, left: 74.84, top: 56.63, width: 4.44, height: 2.22, sqYards: 198, facing: "East" },
  { villa: 195, left: 74.84, top: 54.52, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 196, left: 74.84, top: 52.41, width: 4.44, height: 2.02, sqYards: 180, facing: "East" },
  { villa: 197, left: 74.84, top: 50.33, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 198, left: 74.84, top: 48.22, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 199, left: 74.84, top: 46.11, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 200, left: 74.84, top: 43.8, width: 4.44, height: 2.22, sqYards: 200, facing: "East" },
  { villa: 201, left: 74.84, top: 40.87, width: 4.44, height: 2.82, sqYards: 250, facing: "East" },
  { villa: 202, left: 74.84, top: 35.34, width: 4.44, height: 2.82, sqYards: 250, facing: "East" },
  { villa: 203, left: 74.84, top: 33.23, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 204, left: 74.84, top: 31.12, width: 4.44, height: 2.02, sqYards: 180, facing: "East" },
  { villa: 205, left: 74.84, top: 29.04, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 206, left: 74.84, top: 26.93, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 207, left: 74.84, top: 25.28, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 208, left: 74.84, top: 22.71, width: 4.44, height: 2.02, sqYards: 180, facing: "East" },
  { villa: 209, left: 74.84, top: 20.63, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 210, left: 74.84, top: 18.52, width: 4.44, height: 1.99, sqYards: 180, facing: "East" },
  { villa: 211, left: 74.84, top: 15.62, width: 4.44, height: 2.79, sqYards: 250, facing: "East" },
  { villa: 212, left: 82.18, top: 15.59, width: 4.48, height: 2.82, sqYards: 249, facing: "West" },
  { villa: 213, left: 82.18, top: 18.52, width: 4.48, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 214, left: 82.18, top: 20.63, width: 4.48, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 215, left: 82.18, top: 22.71, width: 4.48, height: 2.02, sqYards: 180, facing: "West" },
  { villa: 216, left: 82.18, top: 24.82, width: 4.48, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 217, left: 82.18, top: 26.93, width: 4.48, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 218, left: 82.18, top: 29.04, width: 4.48, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 219, left: 82.18, top: 31.12, width: 4.48, height: 2.02, sqYards: 180, facing: "West" },
  { villa: 220, left: 82.18, top: 33.23, width: 4.48, height: 2.02, sqYards: 180, facing: "West" },
  { villa: 221, left: 82.18, top: 35.34, width: 4.48, height: 2.82, sqYards: 252, facing: "West" },
  { villa: 222, left: 82.18, top: 40.87, width: 4.48, height: 1.99, sqYards: 252, facing: "West" },
  { villa: 223, left: 82.18, top: 43.8, width: 4.48, height: 1.99, sqYards: 200, facing: "West" },
  { villa: 224, left: 82.18, top: 46.11, width: 4.48, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 225, left: 82.18, top: 48.22, width: 4.48, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 226, left: 82.18, top: 50.33, width: 4.48, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 227, left: 82.18, top: 52.43, width: 4.48, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 228, left: 82.18, top: 54.52, width: 4.48, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 229, left: 82.18, top: 56.63, width: 4.48, height: 1.99, sqYards: 200, facing: "West" },
  { villa: 230, left: 82.18, top: 61.53, width: 4.48, height: 1.99, sqYards: 227, facing: "West" },
  { villa: 231, left: 82.18, top: 64.18, width: 4.48, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 232, left: 82.18, top: 66.29, width: 4.48, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 233, left: 82.18, top: 68.4, width: 4.48, height: 2.02, sqYards: 180, facing: "West" },
  { villa: 234, left: 82.18, top: 70.48, width: 4.48, height: 2.02, sqYards: 180, facing: "West" },
  { villa: 235, left: 82.18, top: 72.58, width: 4.48, height: 1.99, sqYards: 180, facing: "West" },
  { villa: 236, left: 82.18, top: 74.69, width: 4.48, height: 2.22, sqYards: 200, facing: "West" },
  { villa: 237, left: 82.18, top: 77.03, width: 4.48, height: 2.22, sqYards: 200, facing: "West" },
];

type VillaCategory = "praneeth" | "landlord";

/** Check if a project name contains a known keyword (case-insensitive) */
export function isKalpavruksha(name: string): boolean {
  return name.toLowerCase().includes("kalpavruksha");
}
export function isArcadia(name: string): boolean {
  return name.toLowerCase().includes("arcadia");
}
export function isAravindham(name: string): boolean {
  return name.toLowerCase().includes("arvindham");
}
export function hasMasterPlan(projectName: string): boolean {
  return isArcadia(projectName) || isKalpavruksha(projectName) || isAravindham(projectName);
}
/** Returns "Plot" for Aravindham, "Villa" for other projects */
export function plotLabel(projectName: string): string {
  return isAravindham(projectName) ? "Plot" : "Villa";
}

/* ------------------------------------------------------------------ */
/*  Construction Phase Definitions (paired tabs)                      */
/* ------------------------------------------------------------------ */
export const CONSTRUCTION_PHASES: { key: string; label: string; activity1: string; activity2: string; single?: boolean }[] = [
  { key: "EXCAVATION", label: "Excavation", activity1: "Excavation", activity2: "", single: true },
  { key: "PCC", label: "PCC", activity1: "PCC", activity2: "", single: true },
  { key: "FOOTINGS", label: "Footings", activity1: "Footings", activity2: "", single: true },
  { key: "NECK_COLUMNS", label: "Neck Columns", activity1: "Neck Columns", activity2: "", single: true },
  { key: "BACK_FILLING_COMPACTION", label: "Back Filling & Compaction", activity1: "Back Filling & Compaction", activity2: "", single: true },
  { key: "PLINTH_BEAM", label: "Plinth Beam", activity1: "Plinth Beam", activity2: "", single: true },
  { key: "COLUMNS", label: "Columns", activity1: "Columns", activity2: "", single: true },
  { key: "GROUND_FLOOR_SLAB", label: "Ground Floor Slab", activity1: "Ground Floor Slab", activity2: "", single: true },
  { key: "FIRST_FLOOR_SLAB", label: "First Floor Slab", activity1: "First Floor Slab", activity2: "", single: true },
  { key: "SECOND_FLOOR_SLAB", label: "Second Floor Slab", activity1: "Second Floor Slab", activity2: "", single: true },
];

export const ARCADIA_CLUSTERS: { name: string; villas: number[] }[] = [
  { name: "Cluster 1", villas: [1,2,3,4,17,18,19,20,21,22,23,24,25,26,55,56,57,58,59,60,61,62,63,64,65,66,67,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221] },
  { name: "Cluster 2", villas: [9,10,11,12,13,14,15,16,27,28,29,30,31,32,49,50,51,52,53,54,68,69,70,71,72,73,94,95,96,97,98,99,115,116,117,118,119,120,143,144,145,146,147,148,167,168,169,170,171,172,173,174,194,195,196,197,198,199,200,201,222,223,224,225,226,227,228,229] },
  { name: "Cluster 3", villas: [5,6,7,8,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93] },
  { name: "Cluster 4", villas: [121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,230,231,232,233,234,235,236,237] },
];

type BlockType = "hmda" | "installment" | "other";

/** Classify a blocked villa by the name it was blocked under (mortgage vs. customer). */
function getBlockType(customerName: string | undefined): BlockType {
  const n = (customerName || "").toUpperCase().replace(/\s+/g, "");
  if (n.includes("HMDA-GM")) return "hmda";
  if (n.includes("HMDA-IM")) return "installment";
  return "other";
}

const BLOCK_COLORS: Record<BlockType, { fill: string; stroke: string; solid: string; label: string }> = {
  hmda:        { fill: "rgba(37, 99, 235, 0.7)",  stroke: "#1d4ed8", solid: "#2563eb", label: "HMDA-GM" },
  installment: { fill: "rgba(147, 51, 234, 0.7)", stroke: "#7c3aed", solid: "#9333ea", label: "HMDA-IM" },
  other:       { fill: "rgba(220, 38, 38, 0.7)",  stroke: "#b91c1c", solid: "#ef4444", label: "Blocked" },
};

/** Share fills painted over plots whose master plan image isn't pre-coloured (Arcadia's is). */
const SHARE_FILLS: Record<VillaCategory, string> = {
  praneeth: "rgba(255, 242, 153, 0.92)", // #FFF299
  landlord: "rgba(249, 196, 203, 0.92)", // #f9c4cb
};

/** Sizes shown in the first "available by size" table; all other sizes go in the second. */
const MAIN_VILLA_SIZES = [167, 180];

function AvailableSizeTable({ rows }: { rows: { size: number; facing: string; villas: number[] }[] }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="max-h-28 overflow-y-scroll">
        <table className="w-full text-xs sm:text-[13px] border-collapse">
          <thead className="sticky top-0 z-10">
            <tr style={{ background: "#FFF299" }} className="text-gray-900">
              <th className="px-3 py-1 text-left font-semibold whitespace-nowrap border-b border-gray-300">Villa Size (Sq.Yd)</th>
              <th className="px-3 py-1 text-left font-semibold whitespace-nowrap border-b border-gray-300">Facing</th>
              <th className="px-3 py-1 text-center font-semibold whitespace-nowrap border-b border-gray-300">Available</th>
              <th className="px-3 py-1 text-left font-semibold border-b border-gray-300">Villa Numbers</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ size, facing, villas }, i) => (
              <tr key={`${size}-${facing}`} className={i % 2 ? "bg-gray-50" : "bg-white"}>
                <td className="px-3 py-1 font-semibold text-gray-900 whitespace-nowrap align-top border-b border-gray-100">{size}</td>
                <td className="px-3 py-1 text-gray-900 whitespace-nowrap align-top border-b border-gray-100">{facing}</td>
                <td className="px-3 py-1 text-center text-gray-900 align-top border-b border-gray-100">{villas.length}</td>
                <td className="px-3 py-1 text-gray-700 leading-snug border-b border-gray-100">{villas.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function MasterPlanPage() {
  const navigate = useNavigate();
  const downloadEnabled = useDownloadEnabled();
  const [selected, setSelected] = useState<PlotDef | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [blockedVillas, setBlockedVillas] = useState<Map<number, VillaBlockingDto>>(new Map());
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastError, setToastError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Project selection state
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");

  // Derive active data based on selected project
  const activePlots = isAravindham(selectedProject)
    ? ARAVINDHAM_PLOTS
    : isKalpavruksha(selectedProject)
      ? KALPAVRUKSHA_PLOTS
      : ARCADIA_PLOTS;
  const activeShare = isAravindham(selectedProject)
    ? ARAVINDHAM_PRANEETH_SHARE
    : isKalpavruksha(selectedProject)
      ? KALPAVRUKSHA_PRANEETH_SHARE
      : ARCADIA_PRANEETH_SHARE;
  const activeImage = isAravindham(selectedProject)
    ? "/aravindham_masterplan.png"
    : isKalpavruksha(selectedProject)
      ? "/kalpavruksha_masterplan.png"
      : "/masterplan_colored.png";

  function getVillaCategory(villaNum: number): VillaCategory {
    if (activeShare.has(villaNum)) return "praneeth";
    return "landlord";
  }

  // Kalpavruksha's image is the raw architect plan, so share colours are drawn in code
  const paintShareColors = isKalpavruksha(selectedProject);

  // Block form state
  const [blockName, setBlockName] = useState("");
  const [blockPhone, setBlockPhone] = useState("");
  const [blockEmail, setBlockEmail] = useState("");
  const [blockAmount, setBlockAmount] = useState("");
  const [blockNotes, setBlockNotes] = useState("");

  // Hover tooltip state
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Export dropdown state
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Refs for pinch-to-zoom
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const lastPinchDist = useRef<number | null>(null);
  const lastPinchZoom = useRef<number>(1);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  // Load projects on mount and auto-select the first Arcadia project
  useEffect(() => {
    projectService.getMyProjects().then((list) => {
      setProjects(list);
      if (list.length > 0 && !selectedProject) {
        // Prefer an Arcadia project as default, else first project
        const arcadiaProject = list.find((p) => isArcadia(p.name));
        setSelectedProject(arcadiaProject ? arcadiaProject.name : list[0].name);
      }
    }).catch(() => {});
  }, []);

  // Pinch-to-zoom (two-finger) + Ctrl+Scroll zoom via native listeners
  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDist.current = Math.hypot(dx, dy);
        lastPinchZoom.current = zoomRef.current;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastPinchDist.current !== null) {
        e.preventDefault(); // block native pinch only during our zoom gesture
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const scale = dist / lastPinchDist.current;
        const newZoom = Math.min(4, Math.max(0.5, lastPinchZoom.current * scale));
        setZoom(newZoom);
      }
      // single-finger moves are NOT prevented -> browser scrolls natively
    };

    const onTouchEnd = () => {
      lastPinchDist.current = null;
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom((z) => Math.min(4, Math.max(0.5, z + delta)));
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  // Load blocked villas from backend — reload when project changes
  useEffect(() => {
    if (!selectedProject) return; // wait for project to be set
    // CRITICAL: clear old project's blocking data immediately to prevent cross-project leakage
    setBlockedVillas(new Map());
    setLoading(true);
    setSelected(null);
    setShowBlockForm(false);
    setShowEditForm(false);
    villaBlockingService
      .getAll(selectedProject)
      .then((list) => {
        const map = new Map<number, VillaBlockingDto>();
        list.forEach((b) => map.set(b.villaNumber, b));
        setBlockedVillas(map);
      })
      .catch(() => {
        // On error, ensure blockedVillas stays empty (already cleared above)
        setBlockedVillas(new Map());
      })
      .finally(() => setLoading(false));
  }, [selectedProject]);

  const handlePlotClick = useCallback(
    (plot: PlotDef) => {
      setSelected(plot);
      setShowBlockForm(false);
    },
    []
  );

  const handleCreateSale = useCallback(() => {
    if (!selected) return;
    navigate(
      `/activities/sale-entry?villa=${selected.villa}&sqYards=${selected.sqYards}&facing=${selected.facing}`
    );
  }, [selected, navigate]);

  const handleBlockVilla = useCallback(async () => {
    if (!selected || !blockName.trim() || !blockPhone.trim()) return;
    try {
      const dto: VillaBlockingDto = {
        villaNumber: selected.villa,
        projectName: selectedProject,
        customerName: blockName.trim(),
        customerPhone: blockPhone.trim(),
        customerEmail: blockEmail.trim() || undefined,
        bookingAmount: parseFloat(blockAmount) || 0,
        notes: blockNotes.trim() || undefined,
      };
      const saved = await villaBlockingService.blockVilla(dto);
      setBlockedVillas((prev) => {
        const next = new Map(prev);
        next.set(selected.villa, saved);
        return next;
      });
      setToastError(false);
      setToast(`${plotLabel(selectedProject)} ${selected.villa} blocked for ${blockName.trim()}`);
      setTimeout(() => setToast(null), 3000);
      setBlockName("");
      setBlockPhone("");
      setBlockEmail("");
      setBlockAmount("");
      setBlockNotes("");
      setShowBlockForm(false);
      setSelected(null);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axErr = err as any;
      const msg =
        axErr?.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to block villa");
      setToastError(true);
      setToast(msg);
      setTimeout(() => setToast(null), 4000);
    }
  }, [selected, selectedProject, blockName, blockPhone, blockEmail, blockAmount, blockNotes]);

  const handleUnblock = useCallback(async (villaNum: number) => {
    if (!confirm(`Are you sure you want to unblock ${plotLabel(selectedProject)} ${villaNum}?`)) return;
    try {
      await villaBlockingService.unblockVilla(villaNum, selectedProject);
      setBlockedVillas((prev) => {
        const next = new Map(prev);
        next.delete(villaNum);
        return next;
      });
      setToastError(false);
      setToast(`${plotLabel(selectedProject)} ${villaNum} unblocked`);
      setTimeout(() => setToast(null), 3000);
      setSelected(null);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axErr = err as any;
      const msg =
        axErr?.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to unblock villa");
      setToastError(true);
      setToast(msg);
      setTimeout(() => setToast(null), 4000);
    }
  }, [selectedProject]);

  const handleEditBlocked = useCallback(() => {
    if (!selected) return;
    const info = blockedVillas.get(selected.villa);
    if (!info) return;
    setBlockName(info.customerName || "");
    setBlockPhone(info.customerPhone || "");
    setBlockEmail(info.customerEmail || "");
    setBlockAmount(info.bookingAmount ? String(info.bookingAmount) : "");
    setBlockNotes(info.notes || "");
    setShowEditForm(true);
  }, [selected, blockedVillas]);

  const handleUpdateBlocked = useCallback(async () => {
    if (!selected || !blockName.trim() || !blockPhone.trim()) return;
    try {
      const dto: VillaBlockingDto = {
        villaNumber: selected.villa,
        projectName: selectedProject,
        customerName: blockName.trim(),
        customerPhone: blockPhone.trim(),
        customerEmail: blockEmail.trim() || undefined,
        bookingAmount: parseFloat(blockAmount) || 0,
        notes: blockNotes.trim() || undefined,
      };
      const saved = await villaBlockingService.updateBlockedVilla(selected.villa, dto, selectedProject);
      setBlockedVillas((prev) => {
        const next = new Map(prev);
        next.set(selected.villa, saved);
        return next;
      });
      setToastError(false);
      setToast(`${plotLabel(selectedProject)} ${selected.villa} details updated`);
      setTimeout(() => setToast(null), 3000);
      setBlockName(""); setBlockPhone(""); setBlockEmail(""); setBlockAmount(""); setBlockNotes("");
      setShowEditForm(false);
    } catch (err: unknown) {
      const axErr = err as any;
      const msg = axErr?.response?.data?.message || (err instanceof Error ? err.message : "Failed to update");
      setToastError(true);
      setToast(msg);
      setTimeout(() => setToast(null), 4000);
    }
  }, [selected, selectedProject, blockName, blockPhone, blockEmail, blockAmount, blockNotes]);

  const zoomIn = useCallback(() => setZoom((z) => Math.min(4, z + 0.25)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(0.5, z - 0.25)), []);
  const resetView = useCallback(() => setZoom(1), []);

  /** Download the master plan image with current blocked-villa overlays rendered on top. */
  const handleDownloadMap = useCallback(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw background image at full resolution
      ctx.drawImage(img, 0, 0);

      // Draw blocked villa overlays
      activePlots.forEach((plot) => {
        const isBlocked = blockedVillas.has(plot.villa);
        const x = (plot.left / 100) * canvas.width;
        const y = (plot.top / 100) * canvas.height;
        const w = (plot.width / 100) * canvas.width;
        const h = (plot.height / 100) * canvas.height;

        if (!isBlocked) {
          if (paintShareColors) {
            ctx.fillStyle = SHARE_FILLS[getVillaCategory(plot.villa)];
            ctx.fillRect(x, y, w, h);
            // Redraw number + size in black (the fill hides the image's own labels)
            const numSize = Math.round(Math.min(h * 0.34, w * 0.22));
            const sizeSize = Math.round(Math.min(h * 0.24, w * 0.15));
            ctx.fillStyle = "#000";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = `bold ${numSize}px sans-serif`;
            ctx.fillText(String(plot.villa), x + w / 2, y + h / 2 - sizeSize * 0.6);
            ctx.font = `600 ${sizeSize}px sans-serif`;
            ctx.fillText(`${plot.sqYards} SQYD`, x + w / 2, y + h / 2 + numSize * 0.55);
          }
          return;
        }

        // Color based on customer name
        const info = blockedVillas.get(plot.villa);
        const colors = BLOCK_COLORS[getBlockType(info?.customerName)];

        ctx.fillStyle = colors.fill;
        ctx.fillRect(x, y, w, h);

        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = Math.max(2, canvas.width * 0.001);
        ctx.strokeRect(x, y, w, h);
        const ownerName = info?.customerName || "";
        if (ownerName) {
          let fontSize = Math.max(6, Math.round(Math.min(h * 0.28, w * 0.11)));
          ctx.font = `bold ${fontSize}px Arial`;
          let measured = ctx.measureText(ownerName).width;
          while (measured > w * 0.9 && fontSize > 5) {
            fontSize -= 1;
            ctx.font = `bold ${fontSize}px Arial`;
            measured = ctx.measureText(ownerName).width;
          }
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(ownerName, x + w / 2, y + h / 2);
        }
      });

      // Trigger download
      const projectSlug = selectedProject.replace(/\s+/g, "_");
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${projectSlug}_Master_Plan.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, "image/png");
    };
    img.src = activeImage;
  }, [blockedVillas, activePlots, activeImage, selectedProject]);

  /** Export villa data to Excel (.xls) using HTML-table approach */
  const handleExportExcel = useCallback(
    (mode: "full" | "blocked") => {
      setShowExportMenu(false);
      const plots =
        mode === "blocked"
          ? activePlots.filter((p) => blockedVillas.has(p.villa))
          : [...activePlots];

      plots.sort((a, b) => a.villa - b.villa);

      const rows = plots.map((p) => {
        const cat = getVillaCategory(p.villa);
        const isBlocked = blockedVillas.has(p.villa);
        const info = isBlocked ? blockedVillas.get(p.villa) : undefined;
        const allocBg = cat === "praneeth" ? "#FFF299" : "#f9c4cb";
        const blockColors = isBlocked ? BLOCK_COLORS[getBlockType(info?.customerName)] : undefined;
        const rowBg = isBlocked ? "#fecaca" : allocBg;
        return `<tr style="background:${rowBg}">
          <td style="border:1px solid #999;padding:4px;text-align:center">${p.villa}</td>
          <td style="border:1px solid #999;padding:4px">${p.facing}</td>
          <td style="border:1px solid #999;padding:4px;text-align:right">${p.sqYards}</td>
          <td style="border:1px solid #999;padding:4px;background:${allocBg}">${cat === "praneeth" ? "Praneeth" : "Landlord"}</td>
          <td style="border:1px solid #999;padding:4px;text-align:center;${blockColors ? `background:${blockColors.solid};color:#fff;font-weight:bold` : ""}">${blockColors ? blockColors.label : "Available"}</td>
          <td style="border:1px solid #999;padding:4px">${info?.customerName || ""}</td>
          <td style="border:1px solid #999;padding:4px">${info?.customerPhone || ""}</td>
          <td style="border:1px solid #999;padding:4px;text-align:right">${info?.bookingAmount ? info.bookingAmount.toLocaleString("en-IN") : ""}</td>
        </tr>`;
      });

      const projectSlug = selectedProject.replace(/\s+/g, "_");
      const pLabel = plotLabel(selectedProject);
      const title = mode === "blocked" ? `${selectedProject} - Blocked ${pLabel}s` : `${selectedProject} - Master Plan Full Data`;
      const html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office"
              xmlns:x="urn:schemas-microsoft-com:office:excel"
              xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="utf-8">
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>
        <x:ExcelWorksheet><x:Name>${title}</x:Name>
        <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
        </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        </head>
        <body>
        <table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;font-family:Arial;font-size:12px">
          <thead>
            <tr style="background:#1e3a5f;color:#fff;font-weight:bold">
              <th style="border:1px solid #999;padding:6px">${pLabel} No</th>
              <th style="border:1px solid #999;padding:6px">Facing</th>
              <th style="border:1px solid #999;padding:6px">${pLabel} Size (Sq.Yds)</th>
              <th style="border:1px solid #999;padding:6px">Allocation Type</th>
              <th style="border:1px solid #999;padding:6px">Status</th>
              <th style="border:1px solid #999;padding:6px">Customer Name</th>
              <th style="border:1px solid #999;padding:6px">Phone</th>
              <th style="border:1px solid #999;padding:6px">Booking Amount</th>
            </tr>
          </thead>
          <tbody>${rows.join("")}</tbody>
        </table>
        </body></html>`;

      const blob = new Blob([html], { type: "application/vnd.ms-excel" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        mode === "blocked"
          ? `${projectSlug}_Blocked_Villas.xls`
          : `${projectSlug}_Master_Plan_Data.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [blockedVillas, activePlots, selectedProject, activeShare]
  );

  // Close export menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Counts
  const praneethAvailable = activePlots.filter(
    (p) => getVillaCategory(p.villa) === "praneeth" && !blockedVillas.has(p.villa)
  ).length;
  const blockedCount = blockedVillas.size;
  const blockTypes = Array.from(blockedVillas.values()).map((v) => getBlockType(v.customerName));
  const hmdaBlockedCount = blockTypes.filter((t) => t === "hmda").length;
  const installmentBlockedCount = blockTypes.filter((t) => t === "installment").length;
  const otherBlockedCount = blockedCount - hmdaBlockedCount - installmentBlockedCount;
  const landlordCount = activePlots.filter((p) => getVillaCategory(p.villa) === "landlord").length;

  // Available (yellow) villas grouped by size + facing, smallest size first
  const availableBySize = (() => {
    const groups = new Map<string, { size: number; facing: string; villas: number[] }>();
    activePlots.forEach((p) => {
      if (getVillaCategory(p.villa) !== "praneeth" || blockedVillas.has(p.villa)) return;
      const key = `${p.sqYards}|${p.facing}`;
      const g = groups.get(key) || { size: p.sqYards, facing: p.facing, villas: [] };
      g.villas.push(p.villa);
      groups.set(key, g);
    });
    return Array.from(groups.values())
      .sort((a, b) => a.size - b.size || a.facing.localeCompare(b.facing))
      .map((g) => ({ ...g, villas: g.villas.sort((a, b) => a - b) }));
  })();

  // Whether the selected project has a master plan
  const projectHasMasterPlan = hasMasterPlan(selectedProject);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading master plan...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:top-6 z-[100] ${toastError ? "bg-red-600" : "bg-green-600"} text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg shadow-lg text-sm font-medium text-center sm:text-left`}>
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg sm:text-2xl font-bold text-arcadia-800">
            Master Plan &mdash; {selectedProject}
          </h1>
          {/* Project selector dropdown */}
          <select
            value={selectedProject}
            onChange={(e) => {
              setSelectedProject(e.target.value);
              setZoom(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium bg-white shadow-sm focus:ring-2 focus:ring-arcadia-400 focus:border-arcadia-400 outline-none cursor-pointer"
          >
            {/* Always show Arcadia and Kalpavruksha even if API hasn't loaded yet */}
            {projects.length === 0 ? (
              <>
                <option value="Arcadia">Arcadia</option>
                <option value="Kalpavruksha">Kalpavruksha</option>
              </>
            ) : (
              projects.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm text-gray-400">Pinch or Ctrl+Scroll to zoom</span>
          {/* Export to Excel */}
          {downloadEnabled && projectHasMasterPlan && (
            <div ref={exportMenuRef} className="relative">
              <button
                onClick={() => setShowExportMenu((v) => !v)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white shadow-sm transition"
                title="Export villa data to Excel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M6 20h12a2 2 0 002-2V8l-6-6H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Export Excel
                <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[200px]">
                  <button
                    onClick={() => handleExportExcel("full")}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span className="w-4 h-3 rounded border border-gray-300" style={{ background: "linear-gradient(135deg, #FFF299 50%, #f9c4cb 50%)" }} />
                    Full Data
                  </button>
                  <button
                    onClick={() => handleExportExcel("blocked")}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span className="w-4 h-3 rounded bg-red-500" />
                    Blocked Villas
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>


      {/* No master plan available message */}
      {!projectHasMasterPlan && (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-500 mb-1">Master plan not available</h2>
          <p className="text-sm text-gray-400">No master plan has been configured for <strong>{selectedProject}</strong>.</p>
        </div>
      )}

      {/* ===== SALES (colored map + blocking) ===== */}
      {projectHasMasterPlan && (
        <>
          {/* Legend — one box per colour with its purpose */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {[
              { color: "#FFF299", title: "Available", count: praneethAvailable, purpose: "Praneeth share — open for sale" },
              { color: BLOCK_COLORS.hmda.solid, title: BLOCK_COLORS.hmda.label, count: hmdaBlockedCount, purpose: "HMDA General Mortgage" },
              { color: BLOCK_COLORS.installment.solid, title: BLOCK_COLORS.installment.label, count: installmentBlockedCount, purpose: "HMDA Installment Mortgage" },
              { color: BLOCK_COLORS.other.solid, title: "Blocked", count: otherBlockedCount, purpose: "Reserved for a customer" },
              { color: "#f9c4cb", title: "Landlord", count: landlordCount, purpose: "Landlord share — not for sale by Praneeth" },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-2 rounded-lg border bg-white px-2 py-1 sm:px-3 sm:py-1.5 shadow-sm"
                style={{ borderColor: item.color, borderLeftWidth: 6 }}
              >
                <span className="mt-0.5 w-4 h-4 shrink-0 rounded border border-black/10" style={{ background: item.color }} />
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-gray-800">
                    {item.title} <span className="font-normal text-gray-500">({item.count})</span>
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500 leading-tight">{item.purpose}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Available villas by size — 167 & 180 in one table, other sizes in another */}
          {availableBySize.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-1">
              <div className="md:col-span-2 flex items-center justify-between rounded-md border border-gray-300 bg-gray-100 px-3 py-0.5 text-xs sm:text-[13px] font-semibold text-gray-900">
                <span>Available Villas by Size &amp; Facing</span>
                <span>Total: {praneethAvailable}</span>
              </div>
              {[
                availableBySize.filter((g) => MAIN_VILLA_SIZES.includes(g.size)),
                availableBySize.filter((g) => !MAIN_VILLA_SIZES.includes(g.size)),
              ]
                .filter((rows) => rows.length > 0)
                .map((rows, t) => (
                  <AvailableSizeTable key={t} rows={rows} />
                ))}
            </div>
          )}
          <p className="text-[10px] sm:text-xs text-gray-400">
            <span className="hidden sm:inline">Hover for details &bull; Click to block or create sale entry</span>
            <span className="sm:hidden">Tap villa for details</span>
          </p>

          {/* Map container */}
          <div
            ref={mapContainerRef}
            className="relative overflow-auto border border-arcadia-200 sm:border-2 rounded-lg sm:rounded-xl bg-white"
            style={{ height: "calc(100vh - 200px)" }}
          >
            {/* Floating zoom controls — always visible */}
            <div className="sticky top-2 left-0 z-30 flex justify-end px-2 pointer-events-none" style={{ marginBottom: "-44px" }}>
              <div className="pointer-events-auto flex items-center gap-1 bg-white/90 backdrop-blur rounded-full shadow-lg px-2 py-1 border border-gray-200">
                <button onClick={zoomOut} className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-full text-lg font-bold text-gray-700 transition">&minus;</button>
                <span className="text-xs font-medium text-gray-600 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={zoomIn} className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-full text-lg font-bold text-gray-700 transition">+</button>
                <div className="w-px h-5 bg-gray-300 mx-1" />
                <button onClick={() => setZoom(1.5)} className={`px-2 py-0.5 rounded-full text-xs font-medium transition ${zoom >= 1.4 && zoom <= 1.6 ? 'bg-arcadia-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>1.5x</button>
                <button onClick={() => setZoom(2)} className={`px-2 py-0.5 rounded-full text-xs font-medium transition ${zoom >= 1.9 && zoom <= 2.1 ? 'bg-arcadia-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>2x</button>
                <button onClick={resetView} className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 transition">Fit</button>
                {downloadEnabled && (
                  <>
                    <div className="w-px h-5 bg-gray-300 mx-1" />
                    <button
                      onClick={handleDownloadMap}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 hover:bg-blue-200 text-blue-700 transition"
                      title="Download Master Plan with current status"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </button>
                  </>
                )}
              </div>
            </div>

            <div style={{ position: "relative", width: `${zoom * 100}%` }}>
              {/* Colored master plan background */}
              <img
                src={activeImage}
                alt={`${selectedProject} Master Plan`}
                className="w-full h-auto select-none"
                draggable={false}
              />

              {/* Clickable plot overlays */}
              {activePlots.map((plot) => {
                const isBlocked = blockedVillas.has(plot.villa);
                const isHovered = hovered === plot.villa;
                const isSelected = selected?.villa === plot.villa;

                let bg = paintShareColors ? SHARE_FILLS[getVillaCategory(plot.villa)] : "rgba(255,255,255,0.01)";
                let border = paintShareColors ? "1px solid rgba(0,0,0,0.15)" : "1px solid rgba(0,0,0,0.04)";
                const cursor = "pointer";

                if (isBlocked) {
                  const colors = BLOCK_COLORS[getBlockType(blockedVillas.get(plot.villa)?.customerName)];
                  bg = colors.fill;
                  border = `2px solid ${colors.stroke}`;
                } else if (isSelected) {
                  bg = "rgba(37, 99, 235, 0.3)";
                  border = "2px solid #2563eb";
                } else if (isHovered) {
                  bg = "rgba(245, 158, 11, 0.25)";
                  border = "2px solid #f59e0b";
                }

                const statusLabel = isBlocked ? "BLOCKED" : "";

                return (
                  <div
                    key={plot.villa}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isBlocked) {
                        setSelected(plot);
                        setShowBlockForm(false);
                        return;
                      }
                      handlePlotClick(plot);
                    }}
                    onMouseEnter={(e) => {
                      setHovered(plot.villa);
                      const rect = (e.currentTarget.closest("[style*='position: relative']") as HTMLElement)?.getBoundingClientRect();
                      if (rect) {
                        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                      }
                    }}
                    onMouseMove={(e) => {
                      const rect = (e.currentTarget.closest("[style*='position: relative']") as HTMLElement)?.getBoundingClientRect();
                      if (rect) {
                        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                      }
                    }}
                    onMouseLeave={() => { setHovered(null); setTooltipPos(null); }}
                    onTouchStart={(e) => {
                      setHovered(plot.villa);
                      const touch = e.touches[0];
                      const rect = (e.currentTarget.closest("[style*='position: relative']") as HTMLElement)?.getBoundingClientRect();
                      if (rect && touch) {
                        setTooltipPos({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
                      }
                    }}
                    onTouchEnd={() => { setTimeout(() => { setHovered(null); setTooltipPos(null); }, 1500); }}
                    style={{
                      position: "absolute",
                      left: `${plot.left}%`,
                      top: `${plot.top}%`,
                      width: `${plot.width}%`,
                      height: `${plot.height}%`,
                      cursor,
                      border,
                      background: bg,
                      borderRadius: "2px",
                      transition: "border 0.15s, background 0.15s",
                      zIndex: isSelected ? 20 : isHovered ? 10 : 1,
                      boxSizing: "border-box",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {paintShareColors && !isBlocked && (
                      // The fill hides the image's own labels, so redraw number + size in black
                      <span
                        style={{
                          containerType: "size",
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#000",
                          pointerEvents: "none",
                          userSelect: "none",
                          lineHeight: 1.05,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span style={{ fontSize: "min(34cqh, 22cqw)", fontWeight: 700 }}>{plot.villa}</span>
                        <span style={{ fontSize: "min(24cqh, 15cqw)", fontWeight: 600 }}>{plot.sqYards} SQYD</span>
                      </span>
                    )}
                    {statusLabel && (
                      <span
                        style={{
                          fontSize: "clamp(4px, 0.5vw, 8px)",
                          fontWeight: 700,
                          color: "#dc2626",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          pointerEvents: "none",
                          userSelect: "none",
                          lineHeight: 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {statusLabel}
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Floating tooltip on hover */}
              {hovered !== null && tooltipPos && (() => {
                const hovPlot = activePlots.find(p => p.villa === hovered);
                if (!hovPlot) return null;
                const hovBlocked = blockedVillas.has(hovPlot.villa);
                const blocker = hovBlocked ? blockedVillas.get(hovPlot.villa) : null;
                return (
                  <div
                    style={{
                      position: "absolute",
                      left: `${tooltipPos.x + 14}px`,
                      top: `${tooltipPos.y - 10}px`,
                      background: "rgba(15, 23, 42, 0.95)",
                      color: "#fff",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      lineHeight: "1.4",
                      pointerEvents: "none",
                      zIndex: 50,
                      whiteSpace: "nowrap",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                      maxWidth: "200px",
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: "2px" }}>{plotLabel(selectedProject)} {hovPlot.villa}</div>
                    <div>{hovPlot.sqYards} Sq.Yards &bull; {hovPlot.facing} Facing</div>
                    {hovBlocked && blocker && (
                      <div style={{ color: "#fca5a5", marginTop: "3px", fontWeight: 600 }}>
                        Blocked: {blocker.customerName}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {/* Villa detail / action modal */}
      {selected && !showBlockForm && !showEditForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md p-4 sm:p-6 space-y-3 sm:space-y-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <h2 className="text-lg sm:text-xl font-bold text-arcadia-800">
                {plotLabel(selectedProject)} {selected.villa}
                {blockedVillas.has(selected.villa) && (
                  <span className="ml-2 text-xs sm:text-sm bg-red-100 text-red-700 px-2 py-0.5 rounded">BLOCKED</span>
                )}
              </h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                <div className="text-gray-500 text-[10px] sm:text-xs">Plot Area</div>
                <div className="font-semibold text-base sm:text-lg">{selected.sqYards} SqYd</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                <div className="text-gray-500 text-[10px] sm:text-xs">Facing</div>
                <div className="font-semibold text-base sm:text-lg">{selected.facing}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                <div className="text-gray-500 text-[10px] sm:text-xs">Category</div>
                <div className="font-semibold text-xs sm:text-sm text-yellow-700">Praneeth Share</div>
              </div>
            </div>

            {/* Show blocking details if blocked */}
            {blockedVillas.has(selected.villa) && (() => {
              const info = blockedVillas.get(selected.villa)!;
              return (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm space-y-2">
                  <div className="font-semibold text-red-800 text-base">{plotLabel(selectedProject)} Owner Details</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-500 text-xs">Customer Name</span>
                      <div className="font-medium">{info.customerName}</div>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Phone</span>
                      <div className="font-medium">{info.customerPhone}</div>
                    </div>
                    {info.customerEmail && (
                      <div>
                        <span className="text-gray-500 text-xs">Email</span>
                        <div className="font-medium">{info.customerEmail}</div>
                      </div>
                    )}
                    {(info.bookingAmount ?? 0) > 0 && (
                      <div>
                        <span className="text-gray-500 text-xs">Booking Amount</span>
                        <div className="font-medium">&#8377;{info.bookingAmount?.toLocaleString("en-IN")}</div>
                      </div>
                    )}
                  </div>
                  {info.notes && <div className="text-gray-500 italic mt-1">{info.notes}</div>}
                  {info.blockedAt && (
                    <div className="text-xs text-gray-400 mt-1">
                      Blocked on {new Date(info.blockedAt).toLocaleDateString("en-IN")}
                      {info.blockedBy ? ` by ${info.blockedBy}` : ""}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="flex flex-wrap gap-2 sm:gap-3 pt-2">
              {!blockedVillas.has(selected.villa) && (
                <>
                  <button
                    onClick={() => { setBlockName(""); setBlockPhone(""); setBlockEmail(""); setBlockAmount(""); setBlockNotes(""); setShowBlockForm(true); }}
                    className="flex-1 min-w-[100px] bg-amber-500 text-white py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium hover:bg-amber-600 active:bg-amber-700 transition"
                  >
                    Block {plotLabel(selectedProject)}
                  </button>
                  <button
                    onClick={handleCreateSale}
                    className="flex-1 min-w-[100px] bg-arcadia-600 text-white py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium hover:bg-arcadia-700 active:bg-arcadia-800 transition"
                  >
                    Sale Entry
                  </button>
                </>
              )}
              {blockedVillas.has(selected.villa) && (
                <>
                  <button
                    onClick={handleEditBlocked}
                    className="flex-1 min-w-[100px] bg-blue-500 text-white py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium hover:bg-blue-600 active:bg-blue-700 transition"
                  >
                    Edit Details
                  </button>
                  <button
                    onClick={() => handleUnblock(selected.villa)}
                    className="flex-1 min-w-[100px] bg-red-500 text-white py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium hover:bg-red-600 active:bg-red-700 transition"
                  >
                    Unblock
                  </button>
                </>
              )}
              <button
                onClick={() => setSelected(null)}
                className="flex-1 min-w-[80px] border border-gray-300 text-gray-700 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-50 active:bg-gray-100 transition"
              >
                Close
              </button>
            </div>
            {blockedVillas.has(selected.villa) && (
              <p className="text-xs text-gray-400 text-center">To create a Sale Entry, please unblock the {plotLabel(selectedProject).toLowerCase()} first.</p>
            )}
          </div>
        </div>
      )}

      {/* Block Villa form modal */}
      {selected && showBlockForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50" onClick={() => { setShowBlockForm(false); setBlockName(""); setBlockPhone(""); setBlockEmail(""); setBlockAmount(""); setBlockNotes(""); }}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md p-4 sm:p-6 space-y-3 sm:space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold text-amber-700">Block {plotLabel(selectedProject)} {selected.villa}</h2>
              <button
                onClick={() => {
                  setShowBlockForm(false);
                  setBlockName(""); setBlockPhone(""); setBlockEmail(""); setBlockAmount(""); setBlockNotes("");
                }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >&times;</button>
            </div>

            <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-2">
              {selected.sqYards} SqYd &bull; {selected.facing} Facing
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name <span className="text-red-500">*</span></label>
                <input type="text" value={blockName} onChange={(e) => setBlockName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none" placeholder="Enter customer name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                <input type="tel" value={blockPhone} onChange={(e) => setBlockPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none" placeholder="Enter phone number" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={blockEmail} onChange={(e) => setBlockEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none" placeholder="Enter email (optional)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Booking Amount (&#8377;)</label>
                <input type="number" value={blockAmount} onChange={(e) => setBlockAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none" placeholder="Enter booking amount" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={blockNotes} onChange={(e) => setBlockNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none" rows={2} placeholder="Any additional notes" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleBlockVilla} disabled={!blockName.trim() || !blockPhone.trim()}
                className="flex-1 bg-amber-500 text-white py-2.5 rounded-lg font-medium hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
                Confirm Blocking
              </button>
              <button onClick={() => setShowBlockForm(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition">
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Blocked Villa Details Modal */}
      {selected && showEditForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setShowEditForm(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Edit {plotLabel(selectedProject)} {selected.villa} Details</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                <input type="text" value={blockName} onChange={(e) => setBlockName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none" placeholder="Enter customer name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input type="tel" value={blockPhone} onChange={(e) => setBlockPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none" placeholder="Enter phone number" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={blockEmail} onChange={(e) => setBlockEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none" placeholder="Enter email (optional)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Booking Amount (&#8377;)</label>
                <input type="number" value={blockAmount} onChange={(e) => setBlockAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none" placeholder="Enter booking amount" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={blockNotes} onChange={(e) => setBlockNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none" rows={2} placeholder="Any additional notes" />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={handleUpdateBlocked} disabled={!blockName.trim() || !blockPhone.trim()}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                Update Details
              </button>
              <button onClick={() => setShowEditForm(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

