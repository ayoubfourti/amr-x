"""
Background service that connects to rosbridge_server and keeps registered
robots' live state (position, speed, mode) updated in the database.

Robots must already exist in the database (registered via POST /api/robots)
before this service will update them - it does not auto-create robots.
"""
import math
import threading

import roslibpy

from app.controllers.robot import update_robot_status
from app.db.database import SessionLocal
from app.models.robot import Robot

ROSBRIDGE_HOST = "localhost"
ROSBRIDGE_PORT = 9090
ROBOT_NAME = "amr_x" #hardcoded for now, but should be dynamic in the future

MODE_NAMES = {
    0: "idle",
    1: "navigation",
    2: "manipulation",
    3: "combined",
}

def quaternion_to_yaw(x, y, z, w):
    # Converts a quaternion (x, y, z, w) into a yaw angle in degrees
    siny_cosp = 2 * (w * z + x * y)
    cosy_cosp = 1 - 2 * (y * y + z * z)
    yaw = math.atan2(siny_cosp, cosy_cosp)
    return math.degrees(yaw)

def get_robot_or_none(db, name):
    return db.query(Robot).filter(Robot.name == name).first()

def handle_robot_state(message):
    db = SessionLocal()
    try:
        robot = get_robot_or_none(db, ROBOT_NAME)

        if robot is None:
            print(
                f"[ros_bridge_client] No registered robot named "
                f"'{ROBOT_NAME}' - skipping update. Register it via "
                f"POST /api/robots first."
            )
            return
        
        pos = message["base_pose"]["position"]
        ori = message["base_pose"]["orientation"]
        vel = message["base_velocity"]["linear"]

        yaw = quaternion_to_yaw(ori["x"], ori["y"], ori["z"], ori["w"])
        speed = math.sqrt(vel["x"] ** 2 + vel["y"] ** 2 + vel["z"] ** 2)
        mode_name = MODE_NAMES.get(message["mode"], "unknown")

        data = {
            "status": "online",
            "position_x": pos["x"],
            "position_y": pos["y"],
            "orientation": yaw,
            "speed": speed,
            "mode": mode_name,
        }

        update_robot_status(db, robot.id, data)

    except Exception as e:
        print(f"[ros_bridge_client] Error updating robot state: {e}")
    finally:
        db.close()
        
class RosBridgeClient:
    def __init__(self):
        self.ros = roslibpy.Ros(host=ROSBRIDGE_HOST, port=ROSBRIDGE_PORT)
        self.listener = roslibpy.Topic(
            self.ros, "/robot_state", "amr_interfaces/msg/RobotState"
        )
        self.thread = None

    def start(self):
        self.ros.on_ready(self.on_ready)
        self._thread = threading.Thread(target=self.ros.run_forever, daemon=True)
        self._thread.start()
        print("[ros_bridge_client] Starting connection to rosbridge...")

    def on_ready(self):
        print("[ros_bridge_client] Connected to rosbridge.")
        self.listener.subscribe(handle_robot_state)
    def stop(self):
        if self.ros.is_connected:
            self.listener.unsubscribe()
            self.ros.close()
            print("[ros_bridge_client] Disconnected from rosbridge.")

ros_bridge_client = RosBridgeClient()


