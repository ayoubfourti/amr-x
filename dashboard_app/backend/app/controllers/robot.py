from sqlalchemy.orm import Session
from app.models.robot import Robot

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
    for key, value in data.items():
        setattr(robot, key, value)
    db.commit()
    db.refresh(robot)
    return robot
