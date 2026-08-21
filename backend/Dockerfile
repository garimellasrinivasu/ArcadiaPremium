# ── Stage 1: Build the Spring Boot JAR ──
FROM eclipse-temurin:21-jdk AS builder

WORKDIR /build

# Cache Maven dependencies first (layer caching)
COPY pom.xml .
RUN apt-get update && apt-get install -y --no-install-recommends maven && \
    mvn dependency:go-offline -B && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy source and build
COPY src/ src/
RUN mvn package -DskipTests -B

# ── Stage 2: Runtime with Java 21 + Python 3 for AI gender detection ──
FROM eclipse-temurin:21-jre

# Install Python 3, pip, and native libs needed by OpenCV
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3 python3-pip python3-venv \
        libgl1 libglib2.0-0 libsm6 libxrender1 libxext6 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Python AI packages (lightweight stack: insightface + onnxruntime, no TensorFlow)
COPY scripts/requirements.txt /tmp/requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages -r /tmp/requirements.txt && \
    rm /tmp/requirements.txt

WORKDIR /app

# Copy detection scripts
COPY scripts/ /app/scripts/

# Copy the built JAR from builder stage
COPY --from=builder /build/target/*.jar app.jar

# Tell Spring Boot where to find the detection script and Python
ENV DETECTION_SCRIPT_DIR=/app/scripts
ENV PYTHON_PATH=python3

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
