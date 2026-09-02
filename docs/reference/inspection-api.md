# Inspection API Reference

## Base URL

## Authentication

Currently uses JWT tokens from the dashboard authentication system.

## Endpoints

### Create Inspection Result

**POST** `/api/inspections/`

Create a new inspection result in the database.

**Request Body:**
```json
{
  "robot_id": 1,
  "defect_type": "crack",
  "confidence": 0.99,
  "sensor_source": "camera",
  "inspection_type": "visual",
  "message": "Inspection complete."
}
```

## Error Responses

**404 Not Found:**
```json
{
  "detail": "Inspection not found"
}
```
