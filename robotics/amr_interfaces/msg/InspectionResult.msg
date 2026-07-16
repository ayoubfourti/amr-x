# Result of an inspection scan (camera/thermal/gas). TODO(team): refine.
uint8 DEFECT_NONE = 0
uint8 DEFECT_CRACK = 1
uint8 DEFECT_GAS_LEAK = 2
uint8 DEFECT_OVERHEATING = 3

uint8 defect_type
float32 confidence
geometry_msgs/Point location
string sensor_source

