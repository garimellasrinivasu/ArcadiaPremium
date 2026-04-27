#!/bin/bash
# Download pre-trained models for face detection + gender classification
# Run once: cd backend/scripts && bash setup_models.sh

MODELS_DIR="$(dirname "$0")/models"
mkdir -p "$MODELS_DIR"
cd "$MODELS_DIR"

echo "=== Downloading Face Detection model (OpenCV DNN - ~10MB) ==="
curl -LO "https://raw.githubusercontent.com/opencv/opencv_3rdparty/dnn_samples_face_detector_20170830/res10_300x300_ssd_iter_140000.caffemodel"
curl -LO "https://raw.githubusercontent.com/opencv/opencv/master/samples/dnn/face_detector/deploy.prototxt"

echo ""
echo "=== Downloading Gender Classification model (~44MB) ==="
curl -LO "https://github.com/spmallick/learnopencv/raw/master/AgeGender/gender_net.caffemodel"
curl -LO "https://github.com/spmallick/learnopencv/raw/master/AgeGender/gender_deploy.prototxt"

echo ""
echo "=== All models downloaded ==="
ls -lh "$MODELS_DIR"
echo ""
echo "Done! You can now use the gender detection API."
