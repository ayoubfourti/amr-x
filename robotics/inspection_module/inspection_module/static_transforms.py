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
        t.header.frame_id = 'base_link'
        t.child_frame_id = child_frame
        t.transform.translation.x = x
        t.transform.translation.y = y
        t.transform.translation.z = z
        t.transform.rotation.x = 0.0
        t.transform.rotation.y = 0.0
        t.transform.rotation.z = 0.0
        t.transform.rotation.w = 1.0
        return t

    def make_transform_with_parent(self, child_frame, parent_frame, x, y, z):
        t = TransformStamped()
        t.header.stamp = self.get_clock().now().to_msg()
        t.header.frame_id = parent_frame
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
        # Real sensor positions from mechanical team URDF (amr_inspection.urdf.xacro)
        transforms = [
            # Mount bracket position (from URDF: cameras_mount_joint, relative to base_link)
            self.make_transform('module_mount_top', 0.51252, -0.0115, 0.13975),
            
            # RGB Camera - at bracket origin (relative to module_mount_top)
            self.make_transform_with_parent('inspection_camera_link', 'module_mount_top', 0.0, 0.0, 0.0),
            
            # Thermal Camera - on bracket (relative to module_mount_top)
            self.make_transform_with_parent('inspection_thermal_link', 'module_mount_top', 0.018405, 0.0095726, 0.02568),
            
            # Gas Sensor - on base_link
            self.make_transform('inspection_gas_link', 0.23945, -0.30074, -0.235),
        ]
        self.broadcaster.sendTransform(transforms)
        self.get_logger().info('Published static transforms for 3 inspection sensors with real mechanical positions')

def main():
    rclpy.init()
    node = InspectionStaticTransforms()
    rclpy.spin(node)
    rclpy.shutdown()

if __name__ == '__main__':
    main()
