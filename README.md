# Suraksha Setu

AI-enabled real-time mine subsidence monitoring and early warning dashboard for underground coal mines.

## Project Overview

This dashboard provides a real-time interface for monitoring ground conditions across a mine surface panel.

It visualizes:

- Ground tilt
- Ground displacement
- Micro vibration
- Crack opening
- Sensor node health
- Battery and signal strength
- AI-based risk assessment
- Anomaly scores
- Historical sensor trends
- Mine surface deformation zones

## Current Version

The current version uses controlled/synthetic sensor data to demonstrate the dashboard and monitoring workflow.

The system is being developed toward integration with:

**ESP32 → LoRa → Raspberry Pi → MQTT → Spring Boot → PostgreSQL → AI/ML → React Dashboard**

## Tech Stack

### Frontend
- React
- Vite
- JavaScript
- CSS
- Leaflet
- Recharts
- Lucide React

### Planned Backend
- Spring Boot
- REST APIs
- WebSocket
- PostgreSQL
- MQTT

### AI / ML
- Python
- Scikit-learn
- Isolation Forest

## Dashboard Features

- Real-time sensor monitoring
- Mine surface deformation map
- Sensor node visualization
- Panel health monitoring
- Risk classification
- AI anomaly detection
- Historical sensor trends
- Warning and critical alerts
- Operator acknowledgement
- Simulation mode for testing different risk conditions

## Risk Levels

The current prototype uses:

| Risk Score | Status |
|---|---|
| 0–30 | SAFE |
| 31–60 | WARNING |
| 61–100 | CRITICAL |

These ranges are prototype dashboard classifications and are not intended as validated regulatory thresholds.

## Project Status

🚧 **Under Development**

The frontend dashboard is currently being developed. Backend, MQTT, database, hardware and AI components will be integrated progressively.

## Team

V N Manjushree from team VYQENTRA 

Dr. Ambedkar Institute of Technology, Bengaluru
