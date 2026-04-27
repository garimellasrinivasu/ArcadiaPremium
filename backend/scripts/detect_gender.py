#!/usr/bin/env python3
"""
Face detection + gender classification using ENSEMBLE approach.

Combines multiple AI models for maximum accuracy:
  1. DeepFace (RetinaFace detector + VGG gender classifier)
  2. DeepFace (RetinaFace detector + OpenCV DNN gender backup)
  3. InsightFace (buffalo_l model with ArcFace + genderage)

Each detected face is classified by all available models.
Final gender is decided by weighted majority vote.

Install:
  pip3 install deepface tf-keras insightface onnxruntime opencv-python-headless

Usage:
  python3 detect_gender.py <base64_image_file>
"""

import sys
import os
import json
import base64
import warnings

# ====================================================================
# STDOUT PROTECTION
# ====================================================================
_real_stdout_fd = os.dup(1)
os.dup2(2, 1)
_real_stdout = os.fdopen(_real_stdout_fd, "w")

warnings.filterwarnings("ignore")
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["ONNXRUNTIME_LOG_SEVERITY_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import numpy as np

try:
    import cv2
except ImportError:
    _real_stdout.write(json.dumps({"error": "OpenCV not installed"}) + "\n")
    sys.exit(1)

# Try importing both libraries
_has_deepface = False
_has_insightface = False

try:
    from deepface import DeepFace
    _has_deepface = True
except ImportError:
    pass

try:
    from insightface.app import FaceAnalysis
    _has_insightface = True
except ImportError:
    pass

if not _has_deepface and not _has_insightface:
    _real_stdout.write(json.dumps({"error": "No AI model available. Run: pip3 install deepface tf-keras insightface onnxruntime"}) + "\n")
    sys.exit(1)


# ====================================================================
# InsightFace setup
# ====================================================================
_insight_app = None

def get_insight_app():
    global _insight_app
    if _insight_app is None and _has_insightface:
        _insight_app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
        _insight_app.prepare(ctx_id=-1, det_size=(640, 640))
    return _insight_app


# ====================================================================
# Helper: compute IoU between two boxes [x1,y1,x2,y2]
# ====================================================================
def iou(a, b):
    xa, ya = max(a[0], b[0]), max(a[1], b[1])
    xb, yb = min(a[2], b[2]), min(a[3], b[3])
    inter = max(0, xb - xa) * max(0, yb - ya)
    if inter == 0:
        return 0.0
    aa = (a[2] - a[0]) * (a[3] - a[1])
    ab = (b[2] - b[0]) * (b[3] - b[1])
    return inter / float(aa + ab - inter)


def merge_faces(all_faces, iou_thresh=0.4):
    """Merge face detections from multiple models using IoU matching.

    Each face accumulates gender votes from all models that detected it.
    Final gender is decided by weighted vote.
    """
    merged = []

    for face in all_faces:
        matched = False
        for m in merged:
            if iou(face["bbox"], m["bbox"]) > iou_thresh:
                # Same face — add this model's vote
                m["votes"].append({
                    "gender": face["gender"],
                    "weight": face["weight"],
                    "source": face["source"]
                })
                matched = True
                break
        if not matched:
            merged.append({
                "bbox": face["bbox"],
                "votes": [{
                    "gender": face["gender"],
                    "weight": face["weight"],
                    "source": face["source"]
                }]
            })

    # Resolve gender by weighted vote
    results = []
    for m in merged:
        male_score = sum(v["weight"] for v in m["votes"] if v["gender"] == "Male")
        female_score = sum(v["weight"] for v in m["votes"] if v["gender"] == "Female")
        total_weight = male_score + female_score

        if male_score > female_score:
            gender = "Male"
            confidence = round((male_score / total_weight) * 100, 1) if total_weight > 0 else 50.0
        else:
            gender = "Female"
            confidence = round((female_score / total_weight) * 100, 1) if total_weight > 0 else 50.0

        sources = list(set(v["source"] for v in m["votes"]))

        results.append({
            "gender": gender,
            "confidence": confidence,
            "bbox": m["bbox"],
            "models_agreed": len(m["votes"]),
            "sources": sources
        })

    return results


# ====================================================================
# DeepFace detection
# ====================================================================
def detect_with_deepface(frame, temp_path):
    """Run DeepFace gender detection. Returns list of face dicts."""
    faces = []
    if not _has_deepface:
        return faces

    cv2.imwrite(temp_path, frame)

    # Try multiple detector backends for better coverage
    for detector in ["retinaface", "opencv", "ssd"]:
        try:
            results = DeepFace.analyze(
                img_path=temp_path,
                actions=["gender"],
                detector_backend=detector,
                enforce_detection=False,
                silent=True
            )
            if not isinstance(results, list):
                results = [results]

            for face_data in results:
                fc = face_data.get("face_confidence", 1.0)
                if fc < 0.5:
                    continue

                gender_info = face_data.get("gender", {})
                man_pct = float(gender_info.get("Man", 0))
                woman_pct = float(gender_info.get("Woman", 0))

                gender = "Male" if man_pct > woman_pct else "Female"
                conf = max(man_pct, woman_pct) / 100.0  # normalize to 0-1

                region = face_data.get("region", {})
                x = int(region.get("x", 0))
                y = int(region.get("y", 0))
                w = int(region.get("w", 0))
                h = int(region.get("h", 0))

                faces.append({
                    "bbox": [x, y, x + w, y + h],
                    "gender": gender,
                    "weight": conf,
                    "source": f"deepface_{detector}"
                })

            # If we found faces with this detector, no need to try others
            if faces:
                break

        except Exception as e:
            sys.stderr.write(f"[detect_gender] DeepFace {detector} failed: {e}\n")
            continue

    return faces


# ====================================================================
# InsightFace detection
# ====================================================================
def detect_with_insightface(frame):
    """Run InsightFace gender detection. Returns list of face dicts."""
    faces = []
    if not _has_insightface:
        return faces

    try:
        app = get_insight_app()
        results = app.get(frame)

        for face in results:
            gender_val = int(face.gender)
            gender = "Male" if gender_val == 1 else "Female"
            det_score = float(face.det_score)
            bbox = face.bbox.astype(int).tolist()

            faces.append({
                "bbox": bbox,
                "gender": gender,
                "weight": det_score,
                "source": "insightface"
            })

    except Exception as e:
        sys.stderr.write(f"[detect_gender] InsightFace failed: {e}\n")

    return faces


# ====================================================================
# Main detection function
# ====================================================================
def detect_gender(image_base64: str) -> dict:
    """Ensemble gender detection using all available models."""

    # Decode image
    try:
        if "," in image_base64:
            image_base64 = image_base64.split(",", 1)[1]
        img_bytes = base64.b64decode(image_base64)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            return {"error": "Could not decode image"}
    except Exception as e:
        return {"error": f"Image decode error: {str(e)}"}

    temp_path = "/tmp/_detect_gender_temp.jpg"
    all_faces = []

    # Run all available models
    sys.stderr.write("[detect_gender] Running DeepFace...\n")
    all_faces.extend(detect_with_deepface(frame, temp_path))
    sys.stderr.write(f"[detect_gender] DeepFace found {len(all_faces)} faces\n")

    insight_faces = detect_with_insightface(frame)
    sys.stderr.write(f"[detect_gender] InsightFace found {len(insight_faces)} faces\n")
    all_faces.extend(insight_faces)

    # Also run DeepFace with a horizontally flipped image for extra votes
    if _has_deepface:
        try:
            flipped = cv2.flip(frame, 1)
            flip_w = flipped.shape[1]
            flip_faces = detect_with_deepface(flipped, temp_path)
            # Mirror bounding boxes back
            for f in flip_faces:
                x1, y1, x2, y2 = f["bbox"]
                f["bbox"] = [flip_w - x2, y1, flip_w - x1, y2]
                f["source"] = f["source"] + "_flip"
                f["weight"] *= 0.8  # slightly lower weight for flipped
            all_faces.extend(flip_faces)
            sys.stderr.write(f"[detect_gender] DeepFace flipped found {len(flip_faces)} faces\n")
        except Exception as e:
            sys.stderr.write(f"[detect_gender] Flipped detection failed: {e}\n")

    # Clean up temp file
    try:
        os.remove(temp_path)
    except:
        pass

    if not all_faces:
        return {"total": 0, "male": 0, "female": 0, "faces": []}

    # Merge detections from all models and resolve gender by vote
    merged = merge_faces(all_faces)

    male_count = sum(1 for f in merged if f["gender"] == "Male")
    female_count = sum(1 for f in merged if f["gender"] == "Female")

    return {
        "total": len(merged),
        "male": male_count,
        "female": female_count,
        "faces": merged
    }


# ====================================================================
# JSON encoder that handles numpy types
# ====================================================================
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.integer,)):
            return int(obj)
        if isinstance(obj, (np.floating,)):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)


def write_result(data: dict):
    _real_stdout.write(json.dumps(data, cls=NumpyEncoder) + "\n")
    _real_stdout.flush()


if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            write_result({"error": "Usage: detect_gender.py <base64_file_path>"})
            sys.exit(1)

        input_path = sys.argv[1]
        try:
            with open(input_path, "r") as f:
                image_data = f.read().strip()
        except Exception as e:
            write_result({"error": f"Could not read input file: {str(e)}"})
            sys.exit(1)

        result = detect_gender(image_data)
        write_result(result)

    except Exception as e:
        import traceback
        err_msg = str(e) + " | " + traceback.format_exc().replace('"', "'").replace("\n", " ")
        write_result({"error": err_msg})
