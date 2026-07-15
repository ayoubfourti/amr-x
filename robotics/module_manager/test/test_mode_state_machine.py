"""Unit tests for the pure-Python mode state machine."""
from module_manager.mode_state_machine import (
    ModeStateMachine, IDLE, NAVIGATION, MANIPULATION, COMBINED)


def test_starts_idle():
    assert ModeStateMachine().mode == IDLE


def test_legal_transition():
    sm = ModeStateMachine()
    ok, _ = sm.transition(NAVIGATION)
    assert ok and sm.mode == NAVIGATION


def test_illegal_transition_blocked():
    sm = ModeStateMachine(NAVIGATION)
    ok, reason = sm.transition(MANIPULATION)   # nav -> manip not direct
    assert not ok and sm.mode == NAVIGATION


def test_unsafe_blocks_transition():
    sm = ModeStateMachine()
    ok, reason = sm.transition(NAVIGATION, safe=False)
    assert not ok and "safety" in reason


def test_moving_blocks_manipulation_from_nav():
    sm = ModeStateMachine(COMBINED)
    sm.transition(NAVIGATION)
    ok, reason = sm.transition(MANIPULATION, moving=True)
    assert not ok


def test_unknown_mode_rejected():
    ok, _ = ModeStateMachine().transition("flying")
    assert not ok
