import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface PlotDef {
  villa: number;
  left: number;
  top: number;
  width: number;
  height: number;
  sqYards: number;
  facing: string;
}

interface BlockingInfo {
  villaNumber: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  bookingAmount: number;
  notes: string;
  blockedAt: string;
}

const PLOTS: PlotDef[] = [
  { villa: 1, left: 29.04, top: 27.64, width: 4.39, height: 1.05, sqYards: 350, facing: "West" },
  { villa: 2, left: 29.04, top: 25.47, width: 4.39, height: 2.14, sqYards: 200, facing: "West" },
  { villa: 3, left: 29.04, top: 23.61, width: 4.39, height: 1.81, sqYards: 200, facing: "West" },
  { villa: 4, left: 29.04, top: 22.41, width: 4.39, height: 1.17, sqYards: 200, facing: "West" },
  { villa: 5, left: 28.01, top: 19.36, width: 5.41, height: 1.99, sqYards: 214, facing: "West" },
  { villa: 6, left: 29.04, top: 21.4, width: 4.39, height: 0.97, sqYards: 200, facing: "West" },
  { villa: 7, left: 29.04, top: 28.73, width: 4.39, height: 3.39, sqYards: 302, facing: "South" },
  { villa: 8, left: 33.46, top: 28.73, width: 4.39, height: 3.39, sqYards: 350, facing: "South" },
  { villa: 9, left: 33.46, top: 34.62, width: 4.39, height: 2.86, sqYards: 250, facing: "West" },
  { villa: 10, left: 33.46, top: 37.48, width: 4.39, height: 1.77, sqYards: 200, facing: "West" },
  { villa: 11, left: 33.46, top: 39.73, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 12, left: 33.46, top: 41.77, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 13, left: 33.46, top: 43.8, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 14, left: 33.46, top: 45.84, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 15, left: 33.46, top: 47.87, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 16, left: 33.46, top: 49.91, width: 4.39, height: 2.24, sqYards: 198, facing: "East" },
  { villa: 17, left: 33.46, top: 54.66, width: 4.39, height: 2.56, sqYards: 227, facing: "East" },
  { villa: 18, left: 33.46, top: 57.24, width: 4.39, height: 2.01, sqYards: 167, facing: "East" },
  { villa: 19, left: 33.46, top: 59.28, width: 4.39, height: 2.01, sqYards: 167, facing: "East" },
  { villa: 20, left: 33.46, top: 61.31, width: 4.39, height: 2.01, sqYards: 167, facing: "East" },
  { villa: 21, left: 33.46, top: 63.35, width: 4.39, height: 4.05, sqYards: 199, facing: "East" },
  { villa: 22, left: 41.44, top: 67.42, width: 4.39, height: 2.01, sqYards: 167, facing: "East" },
  { villa: 23, left: 41.44, top: 65.38, width: 4.39, height: 2.01, sqYards: 167, facing: "East" },
  { villa: 24, left: 41.44, top: 63.35, width: 4.39, height: 2.01, sqYards: 167, facing: "East" },
  { villa: 25, left: 41.44, top: 61.31, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 26, left: 41.44, top: 59.28, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 27, left: 41.44, top: 57.24, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 28, left: 41.44, top: 54.66, width: 4.39, height: 2.56, sqYards: 225, facing: "East" },
  { villa: 29, left: 41.44, top: 49.91, width: 4.39, height: 2.24, sqYards: 198, facing: "East" },
  { villa: 30, left: 41.44, top: 47.87, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 31, left: 41.44, top: 45.84, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 32, left: 41.44, top: 43.8, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 33, left: 41.44, top: 41.77, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 34, left: 41.44, top: 39.73, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 35, left: 41.44, top: 27.04, width: 4.39, height: 2.24, sqYards: 250, facing: "South" },
  { villa: 36, left: 41.44, top: 24.78, width: 4.39, height: 2.24, sqYards: 200, facing: "South" },
  { villa: 37, left: 41.44, top: 22.53, width: 4.39, height: 2.24, sqYards: 200, facing: "South" },
  { villa: 38, left: 41.44, top: 20.27, width: 4.39, height: 2.24, sqYards: 200, facing: "South" },
  { villa: 39, left: 41.44, top: 18.03, width: 4.39, height: 2.22, sqYards: 200, facing: "South" },
  { villa: 40, left: 17.53, top: 21.4, width: 4.39, height: 2.18, sqYards: 167, facing: "East" },
  { villa: 41, left: 33.46, top: 18.03, width: 4.39, height: 3.32, sqYards: 250, facing: "South" },
  { villa: 42, left: 45.85, top: 18.03, width: 4.39, height: 2.22, sqYards: 200, facing: "South" },
  { villa: 43, left: 45.85, top: 20.27, width: 4.39, height: 2.24, sqYards: 200, facing: "South" },
  { villa: 44, left: 45.85, top: 22.53, width: 4.39, height: 2.24, sqYards: 200, facing: "South" },
  { villa: 45, left: 45.85, top: 24.78, width: 4.39, height: 2.24, sqYards: 200, facing: "South" },
  { villa: 46, left: 45.85, top: 27.04, width: 4.39, height: 2.24, sqYards: 250, facing: "South" },
  { villa: 47, left: 45.85, top: 39.73, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 48, left: 45.85, top: 41.77, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 49, left: 45.85, top: 43.8, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 50, left: 45.85, top: 45.84, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 51, left: 45.85, top: 47.87, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 52, left: 45.85, top: 49.91, width: 4.39, height: 2.24, sqYards: 198, facing: "West" },
  { villa: 53, left: 45.85, top: 54.66, width: 4.39, height: 2.56, sqYards: 225, facing: "West" },
  { villa: 54, left: 45.85, top: 57.24, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 55, left: 45.85, top: 59.28, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 56, left: 45.85, top: 61.31, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 57, left: 45.85, top: 63.35, width: 4.39, height: 2.01, sqYards: 167, facing: "West" },
  { villa: 58, left: 45.85, top: 65.38, width: 4.39, height: 2.01, sqYards: 167, facing: "West" },
  { villa: 59, left: 45.85, top: 67.42, width: 4.39, height: 2.01, sqYards: 167, facing: "West" },
  { villa: 60, left: 45.85, top: 69.45, width: 4.39, height: 3.73, sqYards: 302, facing: "West" },
  { villa: 61, left: 52.95, top: 73.2, width: 4.39, height: 1.85, sqYards: 167, facing: "East" },
  { villa: 62, left: 52.95, top: 71.33, width: 4.39, height: 1.85, sqYards: 167, facing: "East" },
  { villa: 63, left: 52.95, top: 69.45, width: 4.39, height: 1.85, sqYards: 167, facing: "East" },
  { villa: 64, left: 52.95, top: 67.42, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 65, left: 52.95, top: 65.38, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 66, left: 52.95, top: 63.35, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 67, left: 52.95, top: 61.31, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 68, left: 52.95, top: 59.28, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 69, left: 52.95, top: 57.24, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 70, left: 52.95, top: 54.66, width: 4.39, height: 2.56, sqYards: 225, facing: "East" },
  { villa: 71, left: 52.95, top: 49.91, width: 4.39, height: 2.24, sqYards: 198, facing: "East" },
  { villa: 72, left: 52.95, top: 47.87, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 73, left: 52.95, top: 45.84, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 74, left: 52.95, top: 43.8, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 75, left: 52.95, top: 41.77, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 76, left: 52.95, top: 39.73, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 77, left: 52.95, top: 27.04, width: 4.39, height: 2.24, sqYards: 250, facing: "South" },
  { villa: 78, left: 52.95, top: 24.78, width: 4.39, height: 2.24, sqYards: 200, facing: "South" },
  { villa: 79, left: 52.95, top: 22.53, width: 4.39, height: 2.24, sqYards: 200, facing: "South" },
  { villa: 80, left: 52.95, top: 20.27, width: 4.39, height: 2.24, sqYards: 200, facing: "South" },
  { villa: 81, left: 52.95, top: 18.03, width: 4.39, height: 2.22, sqYards: 200, facing: "South" },
  { villa: 82, left: 52.95, top: 16.0, width: 4.39, height: 1.99, sqYards: 200, facing: "South" },
  { villa: 83, left: 52.95, top: 13.52, width: 2.19, height: 2.46, sqYards: 180, facing: "South" },
  { villa: 84, left: 55.17, top: 13.52, width: 2.17, height: 2.46, sqYards: 250, facing: "South" },
  { villa: 85, left: 52.95, top: 11.28, width: 4.39, height: 2.22, sqYards: 200, facing: "South" },
  { villa: 86, left: 57.37, top: 18.03, width: 4.39, height: 2.22, sqYards: 200, facing: "South" },
  { villa: 87, left: 57.37, top: 20.27, width: 4.39, height: 2.24, sqYards: 200, facing: "South" },
  { villa: 88, left: 57.37, top: 22.53, width: 4.39, height: 2.24, sqYards: 200, facing: "South" },
  { villa: 89, left: 57.37, top: 24.78, width: 4.39, height: 2.24, sqYards: 200, facing: "South" },
  { villa: 90, left: 57.37, top: 27.04, width: 4.39, height: 2.24, sqYards: 250, facing: "South" },
  { villa: 91, left: 57.37, top: 39.73, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 92, left: 57.37, top: 41.77, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 93, left: 57.37, top: 43.8, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 94, left: 57.37, top: 45.84, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 95, left: 57.37, top: 47.87, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 96, left: 57.37, top: 49.91, width: 4.39, height: 2.24, sqYards: 198, facing: "West" },
  { villa: 97, left: 57.37, top: 54.66, width: 4.39, height: 2.56, sqYards: 225, facing: "West" },
  { villa: 98, left: 57.37, top: 57.24, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 99, left: 57.37, top: 59.28, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 100, left: 57.37, top: 61.31, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 101, left: 57.37, top: 63.35, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 102, left: 57.37, top: 65.38, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 103, left: 57.37, top: 67.42, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 104, left: 57.37, top: 69.45, width: 4.39, height: 1.85, sqYards: 167, facing: "West" },
  { villa: 105, left: 57.37, top: 71.33, width: 4.39, height: 1.85, sqYards: 167, facing: "West" },
  { villa: 106, left: 57.37, top: 73.2, width: 4.39, height: 3.24, sqYards: 302, facing: "West" },
  { villa: 107, left: 57.37, top: 76.47, width: 4.39, height: 2.78, sqYards: 250, facing: "West" },
  { villa: 108, left: 64.46, top: 73.2, width: 4.39, height: 1.85, sqYards: 180, facing: "East" },
  { villa: 109, left: 64.46, top: 71.33, width: 4.39, height: 1.85, sqYards: 167, facing: "East" },
  { villa: 110, left: 64.46, top: 69.45, width: 4.39, height: 1.85, sqYards: 167, facing: "East" },
  { villa: 111, left: 64.46, top: 67.42, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 112, left: 64.46, top: 65.38, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 113, left: 64.46, top: 63.35, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 114, left: 64.46, top: 61.31, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 115, left: 64.46, top: 59.28, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 116, left: 64.46, top: 57.24, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 117, left: 64.46, top: 54.66, width: 4.39, height: 2.56, sqYards: 225, facing: "East" },
  { villa: 118, left: 64.46, top: 49.91, width: 4.39, height: 2.24, sqYards: 198, facing: "East" },
  { villa: 119, left: 64.46, top: 47.87, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 120, left: 64.46, top: 45.84, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 121, left: 64.46, top: 43.8, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 122, left: 64.46, top: 41.77, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 123, left: 64.46, top: 39.73, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 124, left: 64.46, top: 27.04, width: 4.39, height: 2.24, sqYards: 250, facing: "South" },
  { villa: 125, left: 64.46, top: 24.78, width: 4.39, height: 2.24, sqYards: 200, facing: "South" },
  { villa: 126, left: 64.46, top: 22.53, width: 4.39, height: 2.24, sqYards: 200, facing: "South" },
  { villa: 127, left: 64.46, top: 20.27, width: 4.39, height: 2.24, sqYards: 200, facing: "South" },
  { villa: 128, left: 64.46, top: 18.03, width: 4.39, height: 2.22, sqYards: 200, facing: "South" },
  { villa: 129, left: 64.46, top: 16.0, width: 4.39, height: 1.99, sqYards: 200, facing: "South" },
  { villa: 130, left: 64.46, top: 13.52, width: 2.19, height: 2.46, sqYards: 200, facing: "South" },
  { villa: 131, left: 64.46, top: 11.28, width: 2.19, height: 2.22, sqYards: 200, facing: "South" },
  { villa: 132, left: 66.69, top: 13.52, width: 2.17, height: 2.46, sqYards: 250, facing: "South" },
  { villa: 133, left: 68.88, top: 13.52, width: 4.39, height: 2.46, sqYards: 225, facing: "South" },
  { villa: 134, left: 68.88, top: 16.0, width: 4.39, height: 1.99, sqYards: 225, facing: "South" },
  { villa: 135, left: 68.88, top: 18.03, width: 4.39, height: 2.22, sqYards: 200, facing: "South" },
  { villa: 136, left: 68.88, top: 20.27, width: 4.39, height: 2.24, sqYards: 200, facing: "South" },
  { villa: 137, left: 68.88, top: 22.53, width: 4.39, height: 2.24, sqYards: 200, facing: "South" },
  { villa: 138, left: 68.88, top: 24.78, width: 4.39, height: 2.24, sqYards: 200, facing: "South" },
  { villa: 139, left: 68.88, top: 27.04, width: 4.39, height: 2.24, sqYards: 250, facing: "South" },
  { villa: 140, left: 68.88, top: 39.73, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 141, left: 68.88, top: 41.77, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 142, left: 68.88, top: 43.8, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 143, left: 68.88, top: 45.84, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 144, left: 68.88, top: 47.87, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 145, left: 68.88, top: 49.91, width: 4.39, height: 2.24, sqYards: 198, facing: "West" },
  { villa: 146, left: 68.88, top: 54.66, width: 4.39, height: 2.56, sqYards: 225, facing: "West" },
  { villa: 147, left: 68.88, top: 57.24, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 148, left: 68.88, top: 59.28, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 149, left: 68.88, top: 61.31, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 150, left: 68.88, top: 63.35, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 151, left: 68.88, top: 65.38, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 152, left: 68.88, top: 67.42, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 153, left: 68.88, top: 69.45, width: 4.39, height: 1.85, sqYards: 167, facing: "West" },
  { villa: 154, left: 68.88, top: 71.33, width: 4.39, height: 1.85, sqYards: 167, facing: "West" },
  { villa: 155, left: 68.88, top: 73.2, width: 4.39, height: 1.85, sqYards: 167, facing: "West" },
  { villa: 156, left: 68.88, top: 75.08, width: 4.39, height: 2.9, sqYards: 180, facing: "West" },
  { villa: 157, left: 75.98, top: 73.2, width: 4.39, height: 1.85, sqYards: 180, facing: "East" },
  { villa: 158, left: 75.98, top: 71.33, width: 4.39, height: 1.85, sqYards: 167, facing: "East" },
  { villa: 159, left: 75.98, top: 69.45, width: 4.39, height: 1.85, sqYards: 167, facing: "East" },
  { villa: 160, left: 75.98, top: 67.42, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 161, left: 75.98, top: 65.38, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 162, left: 75.98, top: 63.35, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 163, left: 75.98, top: 61.31, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 164, left: 75.98, top: 59.28, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 165, left: 75.98, top: 57.24, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 166, left: 75.98, top: 54.66, width: 4.39, height: 2.56, sqYards: 225, facing: "East" },
  { villa: 167, left: 75.98, top: 49.91, width: 4.39, height: 2.24, sqYards: 198, facing: "East" },
  { villa: 168, left: 75.98, top: 47.87, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 169, left: 75.98, top: 45.84, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 170, left: 75.98, top: 43.8, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 171, left: 75.98, top: 41.77, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 172, left: 75.98, top: 39.73, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 173, left: 75.98, top: 36.41, width: 4.39, height: 1.91, sqYards: 200, facing: "West" },
  { villa: 174, left: 75.98, top: 30.99, width: 4.39, height: 4.8, sqYards: 250, facing: "West" },
  { villa: 175, left: 75.98, top: 27.04, width: 4.39, height: 2.24, sqYards: 250, facing: "South" },
  { villa: 176, left: 75.98, top: 24.78, width: 4.39, height: 2.24, sqYards: 180, facing: "South" },
  { villa: 177, left: 75.98, top: 22.53, width: 4.39, height: 2.24, sqYards: 180, facing: "South" },
  { villa: 178, left: 75.98, top: 20.27, width: 4.39, height: 2.24, sqYards: 180, facing: "South" },
  { villa: 179, left: 75.98, top: 18.03, width: 4.39, height: 2.22, sqYards: 180, facing: "South" },
  { villa: 180, left: 75.98, top: 16.0, width: 4.39, height: 1.99, sqYards: 180, facing: "South" },
  { villa: 181, left: 75.98, top: 13.52, width: 4.39, height: 2.46, sqYards: 180, facing: "South" },
  { villa: 182, left: 75.98, top: 11.28, width: 4.39, height: 2.22, sqYards: 180, facing: "South" },
  { villa: 183, left: 75.98, top: 9.05, width: 2.19, height: 2.22, sqYards: 180, facing: "South" },
  { villa: 184, left: 75.98, top: 6.81, width: 2.19, height: 2.22, sqYards: 180, facing: "South" },
  { villa: 185, left: 78.2, top: 6.81, width: 6.58, height: 4.45, sqYards: 250, facing: "South" },
  { villa: 186, left: 80.39, top: 9.05, width: 4.39, height: 2.22, sqYards: 180, facing: "South" },
  { villa: 187, left: 80.39, top: 11.28, width: 4.39, height: 2.22, sqYards: 180, facing: "South" },
  { villa: 188, left: 80.39, top: 13.52, width: 4.39, height: 2.46, sqYards: 180, facing: "South" },
  { villa: 189, left: 80.39, top: 16.0, width: 4.39, height: 1.99, sqYards: 180, facing: "South" },
  { villa: 190, left: 80.39, top: 18.03, width: 4.39, height: 2.22, sqYards: 180, facing: "South" },
  { villa: 191, left: 80.39, top: 20.27, width: 4.39, height: 2.24, sqYards: 180, facing: "South" },
  { villa: 192, left: 80.39, top: 22.53, width: 4.39, height: 2.24, sqYards: 180, facing: "South" },
  { villa: 193, left: 80.39, top: 24.78, width: 4.39, height: 2.24, sqYards: 180, facing: "South" },
  { villa: 194, left: 80.39, top: 27.04, width: 4.39, height: 2.24, sqYards: 250, facing: "South" },
  { villa: 195, left: 80.39, top: 30.99, width: 4.39, height: 4.8, sqYards: 250, facing: "West" },
  { villa: 196, left: 80.39, top: 36.41, width: 4.39, height: 1.91, sqYards: 200, facing: "West" },
  { villa: 197, left: 80.39, top: 39.73, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 198, left: 80.39, top: 41.77, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 199, left: 80.39, top: 43.8, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 200, left: 80.39, top: 45.84, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 201, left: 80.39, top: 47.87, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 202, left: 80.39, top: 49.91, width: 4.39, height: 2.24, sqYards: 198, facing: "West" },
  { villa: 203, left: 80.39, top: 54.66, width: 4.39, height: 2.56, sqYards: 225, facing: "West" },
  { villa: 204, left: 80.39, top: 57.24, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 205, left: 80.39, top: 59.28, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 206, left: 80.39, top: 61.31, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 207, left: 80.39, top: 63.35, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 208, left: 80.39, top: 65.38, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 209, left: 80.39, top: 67.42, width: 4.39, height: 2.01, sqYards: 180, facing: "West" },
  { villa: 210, left: 80.39, top: 69.45, width: 4.39, height: 1.85, sqYards: 167, facing: "West" },
  { villa: 211, left: 80.39, top: 71.33, width: 4.39, height: 1.85, sqYards: 167, facing: "West" },
  { villa: 212, left: 87.49, top: 69.45, width: 4.39, height: 1.85, sqYards: 200, facing: "East" },
  { villa: 213, left: 87.49, top: 67.42, width: 4.39, height: 2.01, sqYards: 200, facing: "East" },
  { villa: 214, left: 87.49, top: 65.38, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 215, left: 87.49, top: 63.35, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 216, left: 87.49, top: 61.31, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 217, left: 87.49, top: 59.28, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 218, left: 87.49, top: 57.24, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 219, left: 87.49, top: 54.66, width: 4.39, height: 2.56, sqYards: 227, facing: "East" },
  { villa: 220, left: 87.49, top: 49.91, width: 4.39, height: 2.24, sqYards: 198, facing: "East" },
  { villa: 221, left: 87.49, top: 47.87, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 222, left: 87.49, top: 45.84, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 223, left: 87.49, top: 43.8, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 224, left: 87.49, top: 41.77, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 225, left: 87.49, top: 39.73, width: 4.39, height: 2.01, sqYards: 180, facing: "East" },
  { villa: 226, left: 87.49, top: 36.41, width: 4.39, height: 1.91, sqYards: 200, facing: "West" },
  { villa: 227, left: 87.49, top: 30.99, width: 4.39, height: 4.8, sqYards: 252, facing: "West" },
  { villa: 228, left: 87.49, top: 27.04, width: 4.39, height: 2.24, sqYards: 252, facing: "South" },
  { villa: 229, left: 87.49, top: 24.78, width: 4.39, height: 2.24, sqYards: 180, facing: "South" },
  { villa: 230, left: 87.49, top: 22.53, width: 4.39, height: 2.24, sqYards: 180, facing: "South" },
  { villa: 231, left: 87.49, top: 20.27, width: 4.39, height: 2.24, sqYards: 180, facing: "South" },
  { villa: 232, left: 87.49, top: 18.03, width: 4.39, height: 2.22, sqYards: 180, facing: "South" },
  { villa: 233, left: 87.49, top: 16.0, width: 4.39, height: 1.99, sqYards: 180, facing: "South" },
  { villa: 234, left: 87.49, top: 13.52, width: 4.39, height: 2.46, sqYards: 180, facing: "South" },
  { villa: 235, left: 87.49, top: 11.28, width: 4.39, height: 2.22, sqYards: 180, facing: "South" },
  { villa: 236, left: 87.49, top: 9.05, width: 4.39, height: 2.22, sqYards: 180, facing: "South" },
  { villa: 237, left: 87.49, top: 6.81, width: 4.39, height: 2.22, sqYards: 249, facing: "South" },
  { villa: 238, left: 14.42, top: 28.73, width: 6.36, height: 3.36, sqYards: 300, facing: "South" },
  { villa: 239, left: 17.53, top: 25.91, width: 3.25, height: 2.78, sqYards: 200, facing: "East" },
  { villa: 240, left: 14.39, top: 22.97, width: 6.38, height: 2.9, sqYards: 260, facing: "East" },
  { villa: 241, left: 20.8, top: 21.18, width: 5.5, height: 2.56, sqYards: 180, facing: "East" },
  { villa: 242, left: 20.8, top: 23.78, width: 5.5, height: 2.1, sqYards: 180, facing: "East" },
  { villa: 243, left: 20.8, top: 25.91, width: 5.5, height: 2.78, sqYards: 180, facing: "East" },
  { villa: 244, left: 20.8, top: 28.73, width: 5.5, height: 3.36, sqYards: 300, facing: "South" },
];

export default function MasterPlanPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<PlotDef | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [blockedVillas, setBlockedVillas] = useState<Map<number, BlockingInfo>>(new Map());
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Block form state
  const [blockName, setBlockName] = useState("");
  const [blockPhone, setBlockPhone] = useState("");
  const [blockEmail, setBlockEmail] = useState("");
  const [blockAmount, setBlockAmount] = useState("");
  const [blockNotes, setBlockNotes] = useState("");

  const handlePlotClick = useCallback((plot: PlotDef) => {
    setSelected(plot);
    setShowBlockForm(false);
  }, []);

  const handleCreateSale = useCallback(() => {
    if (!selected) return;
    navigate(
      `/activities/sale-entry?villa=${selected.villa}&sqYards=${selected.sqYards}&facing=${selected.facing}`
    );
  }, [selected, navigate]);

  const handleBlockVilla = useCallback(() => {
    if (!selected || !blockName.trim() || !blockPhone.trim()) return;
    const info: BlockingInfo = {
      villaNumber: selected.villa,
      customerName: blockName.trim(),
      customerPhone: blockPhone.trim(),
      customerEmail: blockEmail.trim(),
      bookingAmount: parseFloat(blockAmount) || 0,
      notes: blockNotes.trim(),
      blockedAt: new Date().toISOString(),
    };
    setBlockedVillas((prev) => {
      const next = new Map(prev);
      next.set(selected.villa, info);
      return next;
    });
    setToast(`Villa ${selected.villa} blocked for ${blockName.trim()}`);
    setTimeout(() => setToast(null), 3000);
    // Reset form
    setBlockName("");
    setBlockPhone("");
    setBlockEmail("");
    setBlockAmount("");
    setBlockNotes("");
    setShowBlockForm(false);
    setSelected(null);
  }, [selected, blockName, blockPhone, blockEmail, blockAmount, blockNotes]);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(3, z + 0.25));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.5, z - 0.25));
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
  }, []);

  return (
    <div className="space-y-4">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-arcadia-800">
          Master Plan &mdash; Praneeth Arcadia Premium
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            Zoom: {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="px-3 py-1.5 bg-arcadia-100 text-arcadia-700 rounded text-sm font-bold hover:bg-arcadia-200 transition"
          >
            +
          </button>
          <button
            onClick={zoomOut}
            className="px-3 py-1.5 bg-arcadia-100 text-arcadia-700 rounded text-sm font-bold hover:bg-arcadia-200 transition"
          >
            &minus;
          </button>
          <button
            onClick={resetView}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-4 h-3 rounded" style={{ background: "#f2eb9f" }} />
          200 SqYd
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-3 rounded" style={{ background: "#dcc9e4" }} />
          180 SqYd
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-3 rounded" style={{ background: "#adddf7" }} />
          250+ SqYd
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-3 rounded" style={{ background: "#a3d576" }} />
          167 SqYd
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-3 rounded" style={{ background: "#c8c92d" }} />
          225 SqYd
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-3 rounded" style={{ background: "#e3bfbf" }} />
          198 SqYd
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-3 rounded border border-red-400" style={{ background: "#fecaca" }} />
          Blocked
        </span>
        <span className="text-gray-400 ml-2">
          Click any plot to view details
        </span>
      </div>

      {/* Map container */}
      <div
        className="relative overflow-auto border-2 border-arcadia-200 rounded-xl bg-gray-100"
        style={{ height: "calc(100vh - 280px)" }}
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            position: "relative",
            width: "100%",
          }}
        >
          {/* Master plan background image */}
          <img
            src="/masterplan_bg.png"
            alt="Arcadia Premium Master Plan"
            className="w-full h-auto select-none"
            draggable={false}
          />

          {/* Clickable plot overlays */}
          {PLOTS.map((plot) => {
            const isHovered = hovered === plot.villa;
            const isSelected = selected?.villa === plot.villa;
            const isBlocked = blockedVillas.has(plot.villa);
            return (
              <div
                key={plot.villa}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlotClick(plot);
                }}
                onMouseEnter={() => setHovered(plot.villa)}
                onMouseLeave={() => setHovered(null)}
                title={`Villa ${plot.villa} — ${plot.sqYards} SqYd — ${plot.facing}${isBlocked ? " [BLOCKED]" : ""}`}
                style={{
                  position: "absolute",
                  left: `${plot.left}%`,
                  top: `${plot.top}%`,
                  width: `${plot.width}%`,
                  height: `${plot.height}%`,
                  cursor: "pointer",
                  border: isBlocked
                    ? "2px solid #ef4444"
                    : isSelected
                    ? "2px solid #2563eb"
                    : isHovered
                    ? "2px solid #f59e0b"
                    : "1px solid rgba(0,0,0,0.08)",
                  background: isBlocked
                    ? "rgba(239, 68, 68, 0.25)"
                    : isSelected
                    ? "rgba(37, 99, 235, 0.25)"
                    : isHovered
                    ? "rgba(245, 158, 11, 0.18)"
                    : "rgba(255, 255, 255, 0.01)",
                  borderRadius: "2px",
                  transition: "border 0.15s, background 0.15s",
                  zIndex: isSelected ? 20 : isHovered ? 10 : 1,
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isBlocked && (
                  <span
                    style={{
                      fontSize: "7px",
                      fontWeight: 700,
                      color: "#dc2626",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                  >
                    BLOCKED
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected plot modal */}
      {selected && !showBlockForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold text-arcadia-800">
                Villa {selected.villa}
                {blockedVillas.has(selected.villa) && (
                  <span className="ml-2 text-sm bg-red-100 text-red-700 px-2 py-0.5 rounded">
                    BLOCKED
                  </span>
                )}
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs">Plot Area</div>
                <div className="font-semibold text-lg">
                  {selected.sqYards} SqYd
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs">Facing</div>
                <div className="font-semibold text-lg">{selected.facing}</div>
              </div>
            </div>

            {/* Show blocking details if blocked */}
            {blockedVillas.has(selected.villa) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm space-y-1">
                <div className="font-semibold text-red-800">Blocked By:</div>
                <div>{blockedVillas.get(selected.villa)!.customerName}</div>
                <div className="text-gray-600">{blockedVillas.get(selected.villa)!.customerPhone}</div>
                {blockedVillas.get(selected.villa)!.customerEmail && (
                  <div className="text-gray-600">{blockedVillas.get(selected.villa)!.customerEmail}</div>
                )}
                {blockedVillas.get(selected.villa)!.bookingAmount > 0 && (
                  <div className="text-gray-600">
                    Amount: &#8377;{blockedVillas.get(selected.villa)!.bookingAmount.toLocaleString("en-IN")}
                  </div>
                )}
                {blockedVillas.get(selected.villa)!.notes && (
                  <div className="text-gray-500 italic">{blockedVillas.get(selected.villa)!.notes}</div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {!blockedVillas.has(selected.villa) && (
                <button
                  onClick={() => setShowBlockForm(true)}
                  className="flex-1 bg-amber-500 text-white py-2.5 rounded-lg font-medium hover:bg-amber-600 transition"
                >
                  Block the Villa
                </button>
              )}
              <button
                onClick={handleCreateSale}
                className="flex-1 bg-arcadia-600 text-white py-2.5 rounded-lg font-medium hover:bg-arcadia-700 transition"
              >
                Sale Entry
              </button>
              <button
                onClick={() => setSelected(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Villa form modal */}
      {selected && showBlockForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold text-amber-700">
                Block Villa {selected.villa}
              </h2>
              <button
                onClick={() => {
                  setShowBlockForm(false);
                  setBlockName("");
                  setBlockPhone("");
                  setBlockEmail("");
                  setBlockAmount("");
                  setBlockNotes("");
                }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={blockName}
                  onChange={(e) => setBlockName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={blockPhone}
                  onChange={(e) => setBlockPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={blockEmail}
                  onChange={(e) => setBlockEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
                  placeholder="Enter email (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Amount (&#8377;)
                </label>
                <input
                  type="number"
                  value={blockAmount}
                  onChange={(e) => setBlockAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
                  placeholder="Enter booking amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={blockNotes}
                  onChange={(e) => setBlockNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
                  rows={2}
                  placeholder="Any additional notes"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleBlockVilla}
                disabled={!blockName.trim() || !blockPhone.trim()}
                className="flex-1 bg-amber-500 text-white py-2.5 rounded-lg font-medium hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Blocking
              </button>
              <button
                onClick={() => setShowBlockForm(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
