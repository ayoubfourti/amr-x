# OWNER: Iyed (mission manager) : one step of a mission
uint8 STATUS_PENDING=0
uint8 STATUS_RUNNING=1
uint8 STATUS_COMPLETED=2
uint8 STATUS_FAILED=3
uint8 STATUS_CANCELLED=4
uint8 STATUS_WAITING=5
uint8 STATUS_BLOCKED=6

uint32 index
string description        # e.g. "Navigate to pickup point"
uint8 status
