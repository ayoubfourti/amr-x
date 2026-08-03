"""Synchronize registered robot state from rosbridge into the database."""

import logging
import math
import os

import roslibpy

from app.controllers.robot import update_robot_status
from app.db.database import SessionLocal
from app.models.robot import Robot

logger = logging.getLogger(__name__)

ROSBRIDGE_HOST = os.getenv("ROSBRIDGE_HOST", "localhost")
ROSBRIDGE_PORT = int(os.getenv("ROSBRIDGE_PORT", "9090"))
ROBOT_NAME = os.getenv("ROSBRIDGE_ROBOT_NAME", "amr_x")

MODE_NAMES = {
    0: "idle",
    1: "navigation",
    2: "manipulation",
    3: "combined",
}


def quaternion_to_yaw(x, y, z, w):
    """Convert a quaternion into a yaw angle in degrees."""
    siny_cosp = 2 * (w * z + x * y)
    cosy_cosp = 1 - 2 * (y * y + z * z)
    return math.degrees(math.atan2(siny_cosp, cosy_cosp))


def get_robot_or_none(db, name):
    return db.query(Robot).filter(Robot.name == name).first()


def handle_robot_state(message):
    db = SessionLocal()
    try:
        robot = get_robot_or_none(db, ROBOT_NAME)
        if robot is None:
            logger.warning(
                "No registered robot named %s; register it through POST /api/robots/",
                ROBOT_NAME,
            )
            return

        position = message["base_pose"]["position"]
        orientation = message["base_pose"]["orientation"]
        velocity = message["base_velocity"]["linear"]

        yaw = quaternion_to_yaw(
            orientation["x"],
            orientation["y"],
            orientation["z"],
            orientation["w"],
        )
        speed = math.sqrt(
            velocity["x"] ** 2 + velocity["y"] ** 2 + velocity["z"] ** 2
        )

        update_robot_status(
            db,
            robot.id,
            {
                "status": "online",
                "position_x": position["x"],
                "position_y": position["y"],
                "orientation": yaw,
                "speed": speed,
                "mode": MODE_NAMES.get(message["mode"], "unknown"),
            },
        )
    except (KeyError, TypeError, ValueError):
        logger.exception("Invalid robot-state message")
    except Exception:
        logger.exception("Failed to update robot state")
    finally:
        db.close()


class RosBridgeClient:
    def __init__(self):
        self.ros = roslibpy.Ros(host=ROSBRIDGE_HOST, port=ROSBRIDGE_PORT)
        self.listener = roslibpy.Topic(
            self.ros,
            "/robot_state",
            "amr_interfaces/msg/RobotState",
        )

    def start(self):
        self.ros.on_ready(self.on_ready)
        # roslibpy owns its event-loop thread and signal handling.
        self.ros.factory.manager.run()
        logger.info(
            "Connecting to rosbridge at %s:%s",
            ROSBRIDGE_HOST,
            ROSBRIDGE_PORT,
        )

    def on_ready(self):
        logger.info("Connected to rosbridge")
        self.listener.subscribe(handle_robot_state)

    def stop(self):
        if self.ros.is_connected:
            self.listener.unsubscribe()
            self.ros.close()
            logger.info("Disconnected from rosbridge")


ros_bridge_client = RosBridgeClient()
