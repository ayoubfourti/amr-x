# OWNER: Iyed (mission manager) : overall mission progress
uint8 STATE_PENDING=0
uint8 STATE_RUNNING=1
uint8 STATE_COMPLETED=2
uint8 STATE_FAILED=3
uint8 STATE_CANCELLED=4
uint8 STATE_WAITING=5
uint8 STATE_BLOCKED=6

std_msgs/Header header
string mission_id
uint8 state
MissionStep current_step
uint32 steps_total
uint32 steps_completed
