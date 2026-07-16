#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import LaserScan
import math

class ScanFilter(Node):
    def __init__(self):
        super().__init__('scan_filter')
        self.declare_parameter('min_range', 0.70)
        self.declare_parameter('input_topic', '/scan')
        self.declare_parameter('output_topic', '/scan_clean')

        self.min_range = self.get_parameter('min_range').value
        in_topic = self.get_parameter('input_topic').value
        out_topic = self.get_parameter('output_topic').value

        self.sub = self.create_subscription(LaserScan, in_topic, self.cb, 10)
        self.pub = self.create_publisher(LaserScan, out_topic, 10)
        self.get_logger().info(
            f'Filtering {in_topic} -> {out_topic}, dropping < {self.min_range} m')

    def cb(self, msg):
        out = LaserScan()
        out.header = msg.header
        out.angle_min = msg.angle_min
        out.angle_max = msg.angle_max
        out.angle_increment = msg.angle_increment
        out.time_increment = msg.time_increment
        out.scan_time = msg.scan_time
        out.range_min = self.min_range
        out.range_max = msg.range_max
        out.ranges = [r if r >= self.min_range else math.inf for r in msg.ranges]
        out.intensities = msg.intensities
        self.pub.publish(out)

def main():
    rclpy.init()
    rclpy.spin(ScanFilter())
    rclpy.shutdown()

if __name__ == '__main__':
    main()