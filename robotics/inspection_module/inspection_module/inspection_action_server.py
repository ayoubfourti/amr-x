import time
import cv2
import numpy as np
import rclpy
from rclpy.action import ActionServer
from rclpy.node import Node
from rclpy.subscription import Subscription
from sensor_msgs.msg import Image
from cv_bridge import CvBridge
from amr_interfaces.action import RunInspection
from amr_interfaces.msg import InspectionResult
from geometry_msgs.msg import Point

class InspectionActionServer(Node):
    def __init__(self):
        super().__init__('inspection_action_server')
        self.declare_parameter('scan_duration_seconds', 3.0)
        
        self._action_server = ActionServer(
            self,
            RunInspection,
            'run_inspection',
            self.execute_callback
        )
        
        # Subscribe to camera
        self.camera_subscriber = self.create_subscription(
            Image,
            '/inspection/camera',
            self.camera_callback,
            1
        )
        
        self.cv_bridge = CvBridge()
        self.latest_frame = None
        self.get_logger().info('Inspection action server ready.')

    def camera_callback(self, msg):
        """Store latest camera frame"""
        try:
            self.latest_frame = self.cv_bridge.imgmsg_to_cv2(msg, 'bgr8')
        except Exception as e:
            self.get_logger().error(f'Error converting image: {e}')

    def detect_defects(self, frame):
        """Advanced defect detection using morphological operations and contour analysis"""
        if frame is None:
            return InspectionResult.DEFECT_NONE, 0.0
        
        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Adaptive thresholding for better edge detection
        thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                        cv2.THRESH_BINARY, 11, 2)
        
        # Morphological operations to enhance cracks
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        morph = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)
        morph = cv2.morphologyEx(morph, cv2.MORPH_OPEN, kernel, iterations=1)
        
        # Find contours (potential defects)
        contours, _ = cv2.findContours(morph, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            return InspectionResult.DEFECT_NONE, 1.0
        
        # Analyze contours for defect characteristics
        frame_area = gray.shape[0] * gray.shape[1]
        defect_area = 0
        crack_count = 0
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if area < 50:  # Ignore very small noise
                continue
            
            defect_area += area
            
            # Check contour shape (cracks are elongated)
            perimeter = cv2.arcLength(contour, True)
            if perimeter > 0:
                circularity = 4 * np.pi * area / (perimeter ** 2)
                # Cracks have low circularity (not round)
                if circularity < 0.3:
                    crack_count += 1
        
        # Calculate defect metrics
        defect_ratio = defect_area / frame_area
        
        # Determine defect type and confidence
        if defect_ratio > 0.05:  # 5% of image is defects
            defect_type = InspectionResult.DEFECT_CRACK
            confidence = min(defect_ratio * 2, 0.99)  # Scale confidence
        elif defect_ratio > 0.01:  # 1% is minor defect
            defect_type = InspectionResult.DEFECT_CRACK
            confidence = min(defect_ratio, 0.8)
        else:
            defect_type = InspectionResult.DEFECT_NONE
            confidence = 1.0
        
        self.get_logger().info(
            f'Defect analysis: area_ratio={defect_ratio:.2%}, '
            f'crack_count={crack_count}, confidence={confidence:.2f}'
        )
        
        return defect_type, confidence

    def execute_callback(self, goal_handle):
        self.get_logger().info(f'Received inspection request: {goal_handle.request.inspection_type}')
        
        scan_duration = self.get_parameter('scan_duration_seconds').value
        steps = ['aligning_sensors', 'scanning', 'analyzing']
        feedback_msg = RunInspection.Feedback()
        
        for i, step in enumerate(steps):
            feedback_msg.current_step = step
            feedback_msg.progress = (i + 1) / len(steps)
            goal_handle.publish_feedback(feedback_msg)
            self.get_logger().info(f'Step: {step} ({feedback_msg.progress:.0%})')
            time.sleep(scan_duration / len(steps))
        
        # Process real camera data
        result = RunInspection.Result()
        result.success = True
        
        inspection_result = InspectionResult()
        defect_type, confidence = self.detect_defects(self.latest_frame)
        
        inspection_result.defect_type = defect_type
        inspection_result.confidence = round(confidence, 2)
        inspection_result.location = Point(x=0.0, y=0.0, z=0.0)
        
        source_map = {
            InspectionResult.DEFECT_CRACK: 'camera',
            InspectionResult.DEFECT_OVERHEATING: 'thermal',
            InspectionResult.DEFECT_GAS_LEAK: 'gas',
            InspectionResult.DEFECT_NONE: 'camera',
        }
        
        inspection_result.sensor_source = source_map[defect_type]
        result.result = inspection_result
        result.message = f'Inspection complete. Defect type: {defect_type}, Confidence: {confidence:.2%}'
        
        goal_handle.succeed()
        return result

def main():
    rclpy.init()
    node = InspectionActionServer()
    rclpy.spin(node)
    rclpy.shutdown()

if __name__ == '__main__':
    main()
