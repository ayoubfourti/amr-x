# OWNER: Zeyneb (transition/docking) : live docking state
uint8 STATE_UNDOCKED=0
uint8 STATE_DOCKING=1
uint8 STATE_DOCKED=2
uint8 STATE_UNDOCKING=3
uint8 STATE_ERROR=4

std_msgs/Header header
uint8 state
string dock_id
bool mechanical_lock      # confirmation sensor: locked
bool module_detected      # confirmation sensor: module present
