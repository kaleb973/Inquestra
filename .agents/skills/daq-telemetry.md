# DAQ Telemetry Skill

Documentation and procedures for DAQ telemetry integration.




# Skill: DAQ Telemetry Ingestion

## Context
Inquestra connects to external hardware (e.g., ESP32, Arduino) to stream live sensor data into the web environment.

## Execution Rules
- Real-time data streams must be handled efficiently to prevent memory leaks in the browser.
- Use WebSockets or Web Serial API for continuous data ingestion.
- Always buffer incoming telemetry data before updating the React state to ensure 60fps rendering on frontend charts.
- Validate all incoming JSON payloads from hardware to prevent malformed data from crashing the application.