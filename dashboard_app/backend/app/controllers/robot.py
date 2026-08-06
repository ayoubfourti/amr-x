from datetime import datetime
from sqlalchemy.orm import Session
from app.models.robot import Robot
from app.models.telemetry_log import TelemetryLog
from app.models.alert import Alert

def get_all_robots(db: Session):
    return db.query(Robot).all()

def get_robot_by_id(db: Session, robot_id: int):
    return db.query(Robot).filter(Robot.id == robot_id).first()

def create_robot(db: Session, name: str, ip_address: str):
    robot = Robot(
        name=name,
        ip_address=ip_address,
        status="offline"
    )
    db.add(robot)
    db.commit()
    db.refresh(robot)
    return robot

def update_robot_status(db: Session, robot_id: int, data: dict):
    robot = db.query(Robot).filter(Robot.id == robot_id).first()
    if not robot:
        return None
    for key, value in data.items():
        setattr(robot, key, value)
    db.commit()
    db.refresh(robot)
    return robot

def update_telemetry(db: Session, robot_id: int, data):
    robot = db.query(Robot).filter(Robot.id == robot_id).first()
    if not robot:
        return None

    # Update robot fields
    if data.battery is not None:
        robot.battery = data.battery
    if data.speed is not None:
        robot.speed = data.speed
    if data.position_x is not None:
        robot.position_x = data.position_x
    if data.position_y is not None:
        robot.position_y = data.position_y
    if data.orientation is not None:
        robot.orientation = data.orientation
    if data.mode is not None:
        robot.mode = data.mode
    if data.wifi_latency is not None:
        robot.wifi_latency = data.wifi_latency

    robot.status = 'online'
    robot.last_seen = datetime.utcnow()

    # Insert telemetry log
    log = TelemetryLog(
        robot_id=robot_id,
        battery=data.battery,
        speed=data.speed,
        position_x=data.position_x,
        position_y=data.position_y,
        orientation=data.orientation,
        mode=data.mode,
        mission_id=data.mission_id,
    )
    db.add(log)

    # Auto-create critical battery alert
    if data.battery is not None and data.battery < 15:
        existing = db.query(Alert).filter(
            Alert.robot_id == robot_id,
            Alert.type == 'critical',
            Alert.is_resolved.is_(False),
            Alert.message.like('%battery%')
        ).first()
        if not existing:
            alert = Alert(
                robot_id=robot_id,
                type='critical',
                message=f'Critical battery: {data.battery:.0f}% — {robot.name}',
                is_resolved=False,
            )
            db.add(alert)

    db.commit()
    db.refresh(robot)
    return robot

def get_telemetry_history(db: Session, robot_id: int, limit: int = 20):
    logs = db.query(TelemetryLog).filter(
        TelemetryLog.robot_id == robot_id
    ).order_by(
        TelemetryLog.recorded_at.desc()
    ).limit(limit).all()
    return list(reversed(logs))
