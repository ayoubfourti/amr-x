#!/usr/bin/env python3
"""
scan_merger_node.py  -  Merge two LaserScans into one.

Subscribes:  /scan_clean   (Lidar1, front corner)
             /scan_2_clean (Lidar2, opposite corner)
Publishes:   /scan_merged  (combined, expressed in `target_frame`)

Each incoming scan is converted to (angle, range) points, transformed into
the common `target_frame` (default base_link) using TF, and re-binned into a
single 360-degree output scan. SLAM then reads /scan_merged.

Run:
  python3 scan_merger_node.py --ros-args -p use_sim_time:=true

Params:
  target_frame   (str)   frame to express the merged scan in   [base_link]
  output_topic   (str)   merged scan topic                      [/scan_merged]
  scan1_topic    (str)                                           [/scan_clean]
  scan2_topic    (str)                                           [/scan_2_clean]
  num_bins       (int)   angular resolution of merged scan       [360]
  range_min      (float)                                         [0.05]
  range_max      (float)                                         [12.0]
"""
import math
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import LaserScan
from tf2_ros import Buffer, TransformListener
import tf2_ros


class ScanMerger(Node):
    def __init__(self):
        super().__init__('scan_merger')
        self.declare_parameter('target_frame', 'base_link')
        self.declare_parameter('output_topic', '/scan_merged')
        self.declare_parameter('scan1_topic', '/scan_clean')
        self.declare_parameter('scan2_topic', '/scan_2_clean')
        self.declare_parameter('num_bins', 360)
        self.declare_parameter('range_min', 0.05)
        self.declare_parameter('range_max', 12.0)

        self.target = self.get_parameter('target_frame').value
        out = self.get_parameter('output_topic').value
        s1 = self.get_parameter('scan1_topic').value
        s2 = self.get_parameter('scan2_topic').value
        self.nbins = int(self.get_parameter('num_bins').value)
        self.rmin = self.get_parameter('range_min').value
        self.rmax = self.get_parameter('range_max').value

        self.tf_buffer = Buffer()
        TransformListener(self.tf_buffer, self)

        self.latest = {s1: None, s2: None}
        self.create_subscription(LaserScan, s1, lambda m: self._store(s1, m), 10)
        self.create_subscription(LaserScan, s2, lambda m: self._store(s2, m), 10)
        self.pub = self.create_publisher(LaserScan, out, 10)
        # publish merged at a fixed rate
        self.create_timer(0.1, self._publish)
        self.get_logger().info(
            f'Merging {s1} + {s2} -> {out} in frame {self.target}')

    def _store(self, topic, msg):
        self.latest[topic] = msg

    def _transform_points(self, scan):
        """Return list of (x, y) points from a scan, in target frame."""
        if scan is None:
            return []
        try:
            tf = self.tf_buffer.lookup_transform(
                self.target, scan.header.frame_id, rclpy.time.Time())
        except (tf2_ros.LookupException, tf2_ros.ExtrapolationException,
                tf2_ros.ConnectivityException):
            return []
        # extract yaw + translation from the transform
        q = tf.transform.rotation
        yaw = math.atan2(2.0 * (q.w * q.z + q.x * q.y),
                         1.0 - 2.0 * (q.y * q.y + q.z * q.z))
        tx = tf.transform.translation.x
        ty = tf.transform.translation.y
        pts = []
        ang = scan.angle_min
        for r in scan.ranges:
            if r == float('inf') or r != r or r < scan.range_min or r > scan.range_max:
                ang += scan.angle_increment
                continue
            # point in sensor frame
            px = r * math.cos(ang)
            py = r * math.sin(ang)
            # rotate + translate into target frame
            gx = tx + px * math.cos(yaw) - py * math.sin(yaw)
            gy = ty + px * math.sin(yaw) + py * math.cos(yaw)
            pts.append((gx, gy))
            ang += scan.angle_increment
        return pts

    def _publish(self):
        s1 = self.latest[self.get_parameter('scan1_topic').value]
        s2 = self.latest[self.get_parameter('scan2_topic').value]
        if s1 is None and s2 is None:
            return

        pts = self._transform_points(s1) + self._transform_points(s2)
        if not pts:
            return

        # bin points into a 360-degree scan around target-frame origin
        binsize = 2.0 * math.pi / self.nbins
        ranges = [float('inf')] * self.nbins
        for gx, gy in pts:
            d = math.hypot(gx, gy)
            if d < self.rmin or d > self.rmax:
                continue
            a = math.atan2(gy, gx)  # -pi..pi
            idx = int((a + math.pi) / binsize)
            if idx < 0:
                idx = 0
            if idx >= self.nbins:
                idx = self.nbins - 1
            if d < ranges[idx]:
                ranges[idx] = d

        out = LaserScan()
        # use the most recent header stamp available
        src = s1 if s1 is not None else s2
        out.header.stamp = src.header.stamp
        out.header.frame_id = self.target
        out.angle_min = -math.pi
        out.angle_max = math.pi
        out.angle_increment = binsize
        out.time_increment = 0.0
        out.scan_time = 0.1
        out.range_min = self.rmin
        out.range_max = self.rmax
        out.ranges = ranges
        out.intensities = []
        self.pub.publish(out)


def main():
    rclpy.init()
    node = ScanMerger()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
