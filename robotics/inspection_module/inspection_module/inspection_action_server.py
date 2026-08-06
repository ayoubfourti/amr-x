import time
import random

import rclpy
from rclpy.action import ActionServer
from rclpy.node import Node

from amr_interfaces.action import RunInspection
from amr_interfaces.msg import InspectionResult
from geometry_msgs.msg import Point


class InspectionActionServer(Node):
    def __init__(self):
        super().__init__('inspection_action_server')

        self.declare_parameter('scan_duration_seconds', 3.0)
        self.declare_parameter('fake_defect_probability', 0.3)

        self._action_server = ActionServer(
            self,
            RunInspection,
            'run_inspection',
            self.execute_callback
        )
        self.get_logger().info('Inspection action server ready.')

    def execute_callback(self, goal_handle):
        self.get_logger().info(f'Received inspection request: {goal_handle.request.inspection_type}')

        scan_duration = self.get_parameter('scan_duration_seconds').value
        defect_prob = self.get_parameter('fake_defect_probability').value

        steps = ['aligning_sensors', 'scanning', 'analyzing']
        feedback_msg = RunInspection.Feedback()

        for i, step in enumerate(steps):
            feedback_msg.current_step = step
            feedback_msg.progress = (i + 1) / len(steps)
            goal_handle.publish_feedback(feedback_msg)
            self.get_logger().info(f'Step: {step} ({feedback_msg.progress:.0%})')
            time.sleep(scan_duration / len(steps))

        result = RunInspection.Result()
        result.success = True
        result.message = 'Inspection complete (simulated data).'

        inspection_result = InspectionResult()
        if random.random() < defect_prob:
            inspection_result.defect_type = random.choice([
                InspectionResult.DEFECT_CRACK,
                InspectionResult.DEFECT_GAS_LEAK,
                InspectionResult.DEFECT_OVERHEATING,
            ])
            inspection_result.confidence = round(random.uniform(0.6, 0.99), 2)
        else:
            inspection_result.defect_type = InspectionResult.DEFECT_NONE
            inspection_result.confidence = 1.0

        inspection_result.location = Point(x=0.0, y=0.0, z=0.0)

        source_map = {
            InspectionResult.DEFECT_CRACK: 'camera',
            InspectionResult.DEFECT_OVERHEATING: 'thermal',
            InspectionResult.DEFECT_GAS_LEAK: 'gas',
            InspectionResult.DEFECT_NONE: 'camera',
        }
        inspection_result.sensor_source = source_map[inspection_result.defect_type]

        result.result = inspection_result

        goal_handle.succeed()
        return result


def main():
    rclpy.init()
    node = InspectionActionServer()
    rclpy.spin(node)
    rclpy.shutdown()


if __name__ == '__main__':
    main()
