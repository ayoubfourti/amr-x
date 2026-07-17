# OWNER: Safety / embedded (unassigned) : a single fault report
uint8 SEVERITY_INFO=0
uint8 SEVERITY_WARN=1
uint8 SEVERITY_ERROR=2
uint8 SEVERITY_CRITICAL=3

std_msgs/Header header
uint16 code
uint8 severity
string source             # node/subsystem that raised it
string message
