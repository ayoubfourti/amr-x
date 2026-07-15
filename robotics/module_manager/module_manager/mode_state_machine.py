#!/usr/bin/env python3
"""Robot mode state machine for AMR-X.

Pure Python (no ROS deps) so it can be unit-tested in isolation.
Owns the legal transitions between operating modes and the safety gate.

Modes:
    idle          - robot parked, nothing active
    navigation    - base is driving (Nav2 in control)
    manipulation  - arm is moving (MoveIt in control), base stationary
    combined      - both at once (mobile manipulation)

The point of a state machine here: switching modes is NOT free. You must not,
e.g., swing the arm while the base is driving at speed unless 'combined' mode
explicitly allows it. Every transition goes through one audited path.
"""

IDLE = "idle"
NAVIGATION = "navigation"
MANIPULATION = "manipulation"
COMBINED = "combined"

ALL_MODES = (IDLE, NAVIGATION, MANIPULATION, COMBINED)

# Which transitions are allowed. From -> set(To).
_LEGAL = {
    IDLE: {NAVIGATION, MANIPULATION, COMBINED},
    NAVIGATION: {IDLE, COMBINED},
    MANIPULATION: {IDLE, COMBINED},
    COMBINED: {IDLE, NAVIGATION, MANIPULATION},
}


class ModeStateMachine:
    """Tracks the current mode and validates/executes transitions."""

    def __init__(self, initial=IDLE):
        if initial not in ALL_MODES:
            raise ValueError("unknown initial mode: %s" % initial)
        self._mode = initial

    @property
    def mode(self):
        return self._mode

    def is_valid_mode(self, mode):
        return mode in ALL_MODES

    def can_transition(self, target, *, safe=True, moving=False):
        """Return (ok, reason). Does not change state.

        safe   - is the robot in a safe state (from SafetyState)?
        moving - is the base currently moving? (blocks arm-activating modes)
        """
        if target not in ALL_MODES:
            return False, "unknown mode '%s'" % target
        if target == self._mode:
            return True, "already in %s" % target
        if not safe:
            return False, "safety state not valid"
        if target not in _LEGAL[self._mode]:
            return False, "illegal transition %s -> %s" % (self._mode, target)
        # Do not activate the arm while the base is physically moving,
        # unless entering 'combined' which is designed for it.
        if moving and target in (MANIPULATION,) and self._mode == NAVIGATION:
            return False, "cannot enter manipulation while base is moving"
        return True, "ok"

    def transition(self, target, *, safe=True, moving=False):
        """Attempt the transition. Returns (ok, reason)."""
        ok, reason = self.can_transition(target, safe=safe, moving=moving)
        if ok and target != self._mode:
            self._mode = target
        return ok, reason
