import rclpy
from rclpy.node import Node
from tf2_ros import StaticTransformBroadcaster
from geometry_msgs.msg import TransformStamped


class InspectionStaticTransforms(Node):
    def __init__(self):
        super().__init__('inspection_static_transforms')
        self.broadcaster = StaticTransformBroadcaster(self)
        self.publish_all_transforms()

    def make_transform(self, child_frame, x, y, z):
        t = TransformStamped()
        t.header.stamp = self.get_clock().now().to_msg()
        t.header.frame_id = 'module_mount_top'
        t.child_frame_id = child_frame
        t.transform.translation.x = x
        t.transform.translation.y = y
        t.transform.translation.z = z
        t.transform.rotation.x = 0.0
        t.transform.rotation.y = 0.0
        t.transform.rotation.z = 0.0
        t.transform.rotation.w = 1.0
        return t

    def publish_all_transforms(self):
        # TODO(mechanical): placeholder positions, confirm real mounting specs
        transforms = [
            self.make_transform('inspection_camera_link', 0.0, 0.0, 0.15),
            self.make_transform('inspection_thermal_link', 0.05, 0.0, 0.15),
            self.make_transform('inspection_gas_link', -0.05, 0.0, 0.10),
        ]
        self.broadcaster.sendTransform(transforms)
        self.get_logger().info('Published static transforms for 3 inspection sensors (placeholder positions)')


def main():
    rclpy.init()
    node = InspectionStaticTransforms()
    rclpy.spin(node)
    rclpy.shutdown()


if __name__ == '__main__':
    main()
