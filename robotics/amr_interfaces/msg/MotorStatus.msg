# OWNER: Embedded feedback (unassigned) : per-actuator health
std_msgs/Header header
string[] joint_names
float64[] velocities
float64[] currents        # amps
float64[] temperatures    # deg C
bool[] ok
