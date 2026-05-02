# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

# The artifact download step puts the jar in backend/target/
# In the Docker context (./backend), this looks like target/*.jar
COPY backend/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
