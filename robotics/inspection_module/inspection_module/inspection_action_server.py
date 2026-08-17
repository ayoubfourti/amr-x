import time
import cv2
import numpy as np
import rclpy
from rclpy.action import ActionServer
from rclpy.node import Node
from rclpy.subscription import Subscription
from sensor_msgs.msg import Image
from std_msgs.msg import Float32
from cv_bridge import CvBridge
from amr_interfaces.action import RunInspection
from amr_interfaces.msg import InspectionResult
from geometry_msgs.msg import Point

class InspectionActionServer(Node):
    def __init__(self):
        super().__init__('inspection_action_server')
        self.declare_parameter('scan_duration_seconds', 3.0)
        self.declare_parameter('gas_threshold', 50.0)  # PPM threshold for gas leak
        
        self._action_server = ActionServer(
            self,
            RunInspection,
            'run_inspection',
            self.execute_callback
        )
        
        # Subscribe to RGB camera
        self.camera_subscriber = self.create_subscription(
            Image,
            '/inspection/camera',
            self.camera_callback,
            1
        )
        
        # Subscribe to thermal camera
        self.thermal_subscriber = self.create_subscription(
            Image,
            '/inspection/thermal',
            self.thermal_callback,
            1
        )
        
        # Subscribe to gas sensor
        self.gas_subscriber = self.create_subscription(
            Float32,
            '/inspection/gas',
            self.gas_callback,
            1
        )
        
        self.cv_bridge = CvBridge()
        self.latest_frame = None
        self.latest_thermal = None
        self.gas_concentration = 0.0
        self.get_logger().info('Inspection action server ready.')

    def camera_callback(self, msg):
        """Store latest RGB camera frame"""
        try:
            self.latest_frame = self.cv_bridge.imgmsg_to_cv2(msg, 'bgr8')
        except Exception as e:
            self.get_logger().error(f'Error converting RGB image: {e}')

    def thermal_callback(self, msg):
        """Store latest thermal camera frame"""
        try:
            self.latest_thermal = self.cv_bridge.imgmsg_to_cv2(msg, 'bgr8')
        except Exception as e:
            self.get_logger().error(f'Error converting thermal image: {e}')

    def gas_callback(self, msg):
        """Store latest gas sensor reading (PPM - parts per million)"""
        self.gas_concentration = msg.data
        self.get_logger().debug(f'Gas concentration: {self.gas_concentration:.2f} PPM')

    def detect_defects(self, frame):
        """Advanced defect detection on RGB camera using morphological operations"""
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
                if circularity < 0.3:
                    crack_count += 1
        
        # Calculate defect metrics
        defect_ratio = defect_area / frame_area
        
        # Determine defect type and confidence
        if defect_ratio > 0.05:
            defect_type = InspectionResult.DEFECT_CRACK
            confidence = min(defect_ratio * 2, 0.99)
        elif defect_ratio > 0.01:
            defect_type = InspectionResult.DEFECT_CRACK
            confidence = min(defect_ratio, 0.8)
        else:
            defect_type = InspectionResult.DEFECT_NONE
            confidence = 1.0
        
        self.get_logger().info(
            f'RGB analysis: area_ratio={defect_ratio:.2%}, '
            f'crack_count={crack_count}, confidence={confidence:.2f}'
        )
        
        return defect_type, confidence

    def detect_thermal_defects(self, frame):
        """Detect overheating using thermal camera"""
        if frame is None:
            return InspectionResult.DEFECT_NONE, 0.0
        
        # Convert thermal image to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # In thermal images, bright pixels = hot areas
        # Find pixels above a temperature threshold (>200 in 0-255 scale)
        threshold = 180
        hot_pixels = cv2.inRange(gray, threshold, 255)
        
        # Calculate percentage of hot area
        frame_area = gray.shape[0] * gray.shape[1]
        hot_area = cv2.countNonZero(hot_pixels)
        hot_ratio = hot_area / frame_area
        
        # Morphological operations to find connected hot regions
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        hot_regions = cv2.morphologyEx(hot_pixels, cv2.MORPH_CLOSE, kernel, iterations=2)
        
        # Find contours of hot regions
        contours, _ = cv2.findContours(hot_regions, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        significant_hot_spots = 0
        for contour in contours:
            if cv2.contourArea(contour) > 100:  # Significant hot spot
                significant_hot_spots += 1
        
        # Determine if overheating is detected
        if hot_ratio > 0.10 or significant_hot_spots > 2:  # 10% hot area or multiple hot spots
            defect_type = InspectionResult.DEFECT_OVERHEATING
            confidence = min(hot_ratio * 5, 0.99)
        elif hot_ratio > 0.02:  # Minor overheating
            defect_type = InspectionResult.DEFECT_OVERHEATING
            confidence = min(hot_ratio * 2, 0.7)
        else:
            defect_type = InspectionResult.DEFECT_NONE
            confidence = 1.0
        
        self.get_logger().info(
            f'Thermal analysis: hot_ratio={hot_ratio:.2%}, '
            f'hot_spots={significant_hot_spots}, confidence={confidence:.2f}'
        )
        
        return defect_type, confidence

    def detect_gas_defects(self):
        """Detect gas leaks using gas sensor"""
        gas_threshold = self.get_parameter('gas_threshold').value
        
        # Determine if gas leak is detected
        if self.gas_concentration > gas_threshold * 1.5:  # Critical gas level
            defect_type = InspectionResult.DEFECT_GAS_LEAK
            confidence = min(self.gas_concentration / (gas_threshold * 2), 0.99)
        elif self.gas_concentration > gas_threshold:  # Elevated gas level
            defect_type = InspectionResult.DEFECT_GAS_LEAK
            confidence = min((self.gas_concentration - gas_threshold) / gas_threshold, 0.8)
        else:
            defect_type = InspectionResult.DEFECT_NONE
            confidence = 1.0
        
        self.get_logger().info(
            f'Gas analysis: concentration={self.gas_concentration:.2f} PPM, '
            f'threshold={gas_threshold}, confidence={confidence:.2f}'
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
        
        # Analyze all three sensors
        result = RunInspection.Result()
        result.success = True
        
        inspection_result = InspectionResult()
        
        # Get defects from all sensors
        rgb_defect, rgb_confidence = self.detect_defects(self.latest_frame)
        thermal_defect, thermal_confidence = self.detect_thermal_defects(self.latest_thermal)
        gas_defect, gas_confidence = self.detect_gas_defects()
        
        # Determine final result (priority: overheating > gas_leak > crack > none)
        if thermal_defect == InspectionResult.DEFECT_OVERHEATING:
            defect_type = InspectionResult.DEFECT_OVERHEATING
            confidence = thermal_confidence
            sensor_source = 'thermal'
        elif gas_defect == InspectionResult.DEFECT_GAS_LEAK:
            defect_type = InspectionResult.DEFECT_GAS_LEAK
            confidence = gas_confidence
            sensor_source = 'gas'
        elif rgb_defect == InspectionResult.DEFECT_CRACK:
            defect_type = InspectionResult.DEFECT_CRACK
            confidence = rgb_confidence
            sensor_source = 'camera'
        else:
            defect_type = InspectionResult.DEFECT_NONE
            confidence = max(rgb_confidence, thermal_confidence, gas_confidence)
            sensor_source = 'camera'
        
        inspection_result.defect_type = defect_type
        inspection_result.confidence = round(confidence, 2)
        inspection_result.location = Point(x=0.0, y=0.0, z=0.0)
        inspection_result.sensor_source = sensor_source
        
        result.result = inspection_result
        result.message = f'Inspection complete. Defect type: {defect_type}, Confidence: {confidence:.2%}, Source: {sensor_source}'
        
        self.get_logger().info(f'Final result: {result.message}')
        
        goal_handle.succeed()
        return result

def main():
    rclpy.init()
    node = InspectionActionServer()
    rclpy.spin(node)
    rclpy.shutdown()

if __name__ == '__main__':
    main()
