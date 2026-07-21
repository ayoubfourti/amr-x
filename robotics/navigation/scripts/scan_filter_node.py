#!/usr/bin/env python3
"""
scan_filter_node.py  -  Remove a LiDAR's self-hits by ANGLE.

The robot's body sits in fixed angular wedges of each LiDAR's view. This blanks
up to TWO wedges (the body can wrap around the +/-180 deg boundary, giving two
separate clusters), leaving every other direction at full range so close walls
in corridors stay visible.

Measured self-hit wedges:
  Lidar1 (/scan):   -180..-92 deg  AND  +173..+180 deg  (body wraps +/-180)
  Lidar2 (/scan_2):   -8..+88 deg

Params:
  input_topic    (str)   [/scan]
  output_topic   (str)   [/scan_clean]
  blank_min_deg  (float) wedge 1 start [-180.0]
  blank_max_deg  (float) wedge 1 end   [-92.0]
  blank2_min_deg (float) wedge 2 start [173.0]   (set == blank2_max to disable)
  blank2_max_deg (float) wedge 2 end   [180.0]
  min_range      (float) drop point-blank noise below [0.12]
"""
import math
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import LaserScan


class ScanFilter(Node):
    def __init__(self):
        super().__init__('scan_filter')
        self.declare_parameter('input_topic', '/scan')
        self.declare_parameter('output_topic', '/scan_clean')
        self.declare_parameter('blank_min_deg', -180.0)
        self.declare_parameter('blank_max_deg', -92.0)
        self.declare_parameter('blank2_min_deg', 1.0)
        self.declare_parameter('blank2_max_deg', -1.0)
        self.declare_parameter('min_range', 0.12)

        in_topic = self.get_parameter('input_topic').value
        out_topic = self.get_parameter('output_topic').value
        self.b1min = math.radians(float(self.get_parameter('blank_min_deg').value))
        self.b1max = math.radians(float(self.get_parameter('blank_max_deg').value))
        self.b2min = math.radians(float(self.get_parameter('blank2_min_deg').value))
        self.b2max = math.radians(float(self.get_parameter('blank2_max_deg').value))
        self.min_range = float(self.get_parameter('min_range').value)

        self.sub = self.create_subscription(LaserScan, in_topic, self.cb, 10)
        self.pub = self.create_publisher(LaserScan, out_topic, 10)
        self.get_logger().info(
            f'{in_topic} -> {out_topic}: blank '
            f'[{math.degrees(self.b1min):.0f}..{math.degrees(self.b1max):.0f}] and '
            f'[{math.degrees(self.b2min):.0f}..{math.degrees(self.b2max):.0f}] deg.')

    def cb(self, msg):
        out = LaserScan()
        out.header = msg.header
        out.angle_min = msg.angle_min
        out.angle_max = msg.angle_max
        out.angle_increment = msg.angle_increment
        out.time_increment = msg.time_increment
        out.scan_time = msg.scan_time
        out.range_min = msg.range_min
        out.range_max = msg.range_max

        new_ranges = list(msg.ranges)
        ang = msg.angle_min
        for i, r in enumerate(msg.ranges):
            in_w1 = self.b1min <= ang <= self.b1max
            in_w2 = self.b2min <= ang <= self.b2max
            if in_w1 or in_w2:
                new_ranges[i] = float('inf')
            elif r < self.min_range:
                new_ranges[i] = float('inf')
            ang += msg.angle_increment

        out.ranges = new_ranges
        out.intensities = msg.intensities
        self.pub.publish(out)


def main():
    rclpy.init()
    rclpy.spin(ScanFilter())
    rclpy.shutdown()


if __name__ == '__main__':
    main()