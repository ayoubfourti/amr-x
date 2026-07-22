# OWNER: Safety manager (unassigned) : may the robot move?
std_msgs/Header header
bool estop                # emergency stop engaged
bool safe_to_move
bool bumper_triggered
string reason             # why not safe, if applicable
