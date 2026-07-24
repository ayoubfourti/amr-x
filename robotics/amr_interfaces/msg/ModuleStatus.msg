# OWNER: Zeyneb (transition/module) : status of ONE attached module
uint8 STATE_ABSENT=0
uint8 STATE_ATTACHING=1
uint8 STATE_ATTACHED=2
uint8 STATE_DETACHING=3
uint8 STATE_ERROR=4

string module_name        # e.g. "dual_arm"
string mount_point        # frame it attaches to, e.g. "module_mount_top"
bool attached
uint8 state               # one of STATE_*
string detail             # free-text status / error reason
