# OWNER: Zeyneb (architecture) : high-level robot state for dashboard/telemetry
uint8 MODE_IDLE=0
uint8 MODE_NAVIGATION=1
uint8 MODE_MANIPULATION=2
uint8 MODE_COMBINED=3
std_msgs/Header header
uint8 mode                # one of MODE_*
geometry_msgs/Pose base_pose
geometry_msgs/Twist base_velocity
ModuleStatus[] modules    # every attached module
bool localized
bool safe                 # mirror of SafetyState.safe_to_move
