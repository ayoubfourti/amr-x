#!/usr/bin/env python3

"""
Programmatic MoveItPy demo for the AMR-X dual-arm robot.

The script:
  1. Plans and executes a lift motion.
  2. Plans and executes a base rotation.
  3. Plans and executes a left-arm joint motion.
  4. Plans and executes a right-arm joint motion.
  5. Returns both arms, the base, and the lift to home.

MoveIt performs the planning, collision checking, trajectory generation,
and trajectory execution. This script only provides the goals.
"""

import os
import sys
import time
import yaml
import numpy as np

import rclpy

from ament_index_python.packages import get_package_share_directory

from moveit_configs_utils import MoveItConfigsBuilder
from moveit.planning import MoveItPy, PlanRequestParameters
from moveit.core.robot_state import RobotState

# ---------------------------------------------------------------------------
# YAML helper
# ---------------------------------------------------------------------------

def load_yaml(package_name, file_path):
    """
    Load a YAML file from a ROS 2 package share directory.
    """
    package_path = get_package_share_directory(package_name)
    absolute_path = os.path.join(package_path, file_path)

    with open(absolute_path, "r") as file:
        return yaml.safe_load(file)


# ---------------------------------------------------------------------------
# MoveIt configuration
# ---------------------------------------------------------------------------

def build_moveit_config():
    """
    Build the complete MoveIt configuration used by MoveItPy.
    """

    # Robot description
    xacro_path = os.path.join(
        get_package_share_directory("dual_arm_description"),
        "urdf",
        "dual_arm.urdf.xacro",
    )

    # Explicit paths
    moveit_config_package = get_package_share_directory(
        "dual_arm_moveit_config"
    )

    joint_limits_path = os.path.join(
        moveit_config_package,
        "config",
        "joint_limits.yaml",
    )

    kinematics_path = os.path.join(
        moveit_config_package,
        "config",
        "kinematics.yaml",
    )

    srdf_path = os.path.join(
        moveit_config_package,
        "config",
        "dual_arm.srdf",
    )

    controllers_path = os.path.join(
        moveit_config_package,
        "config",
        "moveit_controllers.yaml",
    )

    # -----------------------------------------------------------------------
    # Build the normal MoveIt configuration
    # -----------------------------------------------------------------------

    moveit_config = (
        MoveItConfigsBuilder(
            "dual_arm",
            package_name="dual_arm_moveit_config",
        )
        .robot_description(file_path=xacro_path)
        .robot_description_semantic(file_path=srdf_path)
        .robot_description_kinematics(file_path=kinematics_path)
        .joint_limits(file_path=joint_limits_path)
        .trajectory_execution(file_path=controllers_path)
        .planning_pipelines(pipelines=["ompl"])
        .to_moveit_configs()
    )

    config_dict = moveit_config.to_dict()

    # -----------------------------------------------------------------------
    # IMPORTANT:
    #
    # Explicitly load joint_limits.yaml into robot_description_planning.
    #
    # This makes sure MoveItPy receives the limits in exactly the namespace
    # expected by MoveIt's trajectory processing.
    # -----------------------------------------------------------------------

    joint_limits_yaml = load_yaml(
        "dual_arm_moveit_config",
        "config/joint_limits.yaml",
    )

    if joint_limits_yaml is None:
        raise RuntimeError(
            "joint_limits.yaml could not be loaded."
        )

    if "joint_limits" not in joint_limits_yaml:
        raise RuntimeError(
            "joint_limits.yaml must contain a top-level 'joint_limits:' key."
        )

    config_dict["robot_description_planning"] = joint_limits_yaml

    # -----------------------------------------------------------------------
    # Planning pipeline configuration
    # -----------------------------------------------------------------------

    config_dict["planning_pipelines"] = {
        "pipeline_names": ["ompl"],
    }

    config_dict.setdefault("ompl", {})

    config_dict["ompl"]["plan_request_params"] = {
        "planning_pipeline": "ompl",
        "planner_id": "",
        "planning_time": 5.0,
        "planning_attempts": 5,
        "max_velocity_scaling_factor": 0.5,
        "max_acceleration_scaling_factor": 0.5,
    }

    # -----------------------------------------------------------------------
    # Simulation time
    # -----------------------------------------------------------------------

    config_dict["use_sim_time"] = True

    # -----------------------------------------------------------------------
    # Gazebo / ROS clock QoS
    # -----------------------------------------------------------------------

    config_dict["qos_overrides"] = {
        "/clock": {
            "subscription": {
                "reliability": "best_effort",
                "durability": "volatile",
                "history": "keep_last",
                "depth": 1,
            }
        }
    }

    # -----------------------------------------------------------------------
    # DEBUG: verify that the limits actually reached MoveItPy
    # -----------------------------------------------------------------------

    print("\n========================================")
    print("MOVEIT CONFIGURATION CHECK")
    print("========================================")

    planning_config = config_dict.get(
        "robot_description_planning",
        {},
    )

    print(
        "robot_description_planning present:",
        bool(planning_config),
    )

    limits = planning_config.get("joint_limits", {})

    print(
        "Number of joint limits loaded:",
        len(limits),
    )

    for joint_name in [
        "pinion_joint",
        "robot_base_joint",
        "shoulder1_joint",
        "shoulderR_joint",
    ]:
        joint_limit = limits.get(joint_name)

        if joint_limit is None:
            print(
                f"WARNING: limits NOT FOUND for {joint_name}"
            )
        else:
            print(
                f"{joint_name}: "
                f"acceleration_limits="
                f"{joint_limit.get('has_acceleration_limits')}, "
                f"max_acceleration="
                f"{joint_limit.get('max_acceleration')}"
            )

    print("========================================\n")

    return config_dict


# ---------------------------------------------------------------------------
# Planning helper
# ---------------------------------------------------------------------------

def plan_joint_goal(moveit, planning_component, group_name, joint_values, label):
    print("\n----------------------------------------")
    print(f"{label}")
    print("----------------------------------------")

    planning_component.set_start_state_to_current_state()

    robot_state = planning_component.get_start_state()

    if robot_state is None:
        print(f"ERROR: Could not obtain current robot state for '{label}'.")
        return None

    robot_state.set_joint_group_positions(
        group_name,
        np.asarray(joint_values, dtype=float),
    )

    planning_component.set_goal_state(robot_state=robot_state)

    plan_parameters = PlanRequestParameters(moveit, "ompl")

    print(f"Planning: {label}")

    plan_result = planning_component.plan(single_plan_parameters=plan_parameters)

    if not plan_result:
        print(f"ERROR: Planning FAILED for '{label}'.")
        return None

    print(f"SUCCESS: Planning succeeded for '{label}'.")
    return plan_result

# ---------------------------------------------------------------------------
# Execution helper
# ---------------------------------------------------------------------------

def execute_plan(moveit, plan_result, label):
    if plan_result is None:
        return False

    print(f"Executing: {label}")

    result = moveit.execute(
        plan_result.trajectory,
        controllers=[],
    )

    if result:
        print(f"SUCCESS: Execution completed for '{label}'.")
        return True

    print(f"ERROR: Execution FAILED for '{label}'.")
    return False


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():

    rclpy.init(args=sys.argv)

    try:

        # ================================================================
        # Build MoveIt configuration
        # ================================================================

        moveit_config_dict = build_moveit_config()

        # ================================================================
        # Start MoveItPy
        # ================================================================

        dual_arm = MoveItPy(
            node_name="pick_place_demo",
            config_dict=moveit_config_dict,
        )

        print("\nMoveItPy initialized successfully.")

        # ================================================================
        # Planning groups
        # ================================================================

        lift = dual_arm.get_planning_component("lift")
        base = dual_arm.get_planning_component("base")
        both_arms = dual_arm.get_planning_component("both_arms")

        print("Planning groups loaded:")
        print("  - lift")
        print("  - base")
        print("  - both_arms")

        # ================================================================
        # Joint-space poses
        #
        # Order must match the joint order defined by the 'both_arms' group
        # in dual_arm.srdf (left_arm joints first, then right_arm joints,
        # in the same order as your original left_arm_joints/right_arm_joints
        # lists). Verify against the SRDF if the arms don't move as expected.
        # ================================================================

        home_pose = [0.0] * 14

        reach_pose = [
            0.3, 0.4, -0.2, 0.3, -0.3, 0.2, 0.0,      # left arm - reach forward
            -0.3, 0.4, -0.2, 0.3, -0.3, 0.2, 0.0,     # right arm - reach forward
        ]

        catch_pose = [
            0.15, 0.45, -0.1, 0.25, -0.15, 0.1, 0.0,   # left arm - converge inward
            -0.15, 0.45, -0.1, 0.25, -0.15, 0.1, 0.0,  # right arm - converge inward
        ]

        release_pose = [
            0.25, 0.35, -0.15, 0.3, -0.25, 0.15, 0.0,   # left arm - open again at new spot
            -0.25, 0.35, -0.15, 0.3, -0.25, 0.15, 0.0,  # right arm - open again at new spot
        ]

        # ================================================================
        # STEP 1 — Lift up
        # ================================================================

        plan = plan_joint_goal(dual_arm, lift, "lift", [3.57], "Lift up")
        if plan:
            execute_plan(dual_arm, plan, "Lift up")
        time.sleep(1.0)

        # ================================================================
        # STEP 2 — Rotate base toward the object
        # ================================================================

        plan = plan_joint_goal(dual_arm, base, "base", [0.5], "Rotate base to object")
        if plan:
            execute_plan(dual_arm, plan, "Rotate base to object")
        time.sleep(1.0)

        # ================================================================
        # STEP 3 — Both arms reach forward together
        # ================================================================

        plan = plan_joint_goal(dual_arm, both_arms, "both_arms", reach_pose, "Both arms reach forward")
        if plan:
            execute_plan(dual_arm, plan, "Both arms reach forward")
        time.sleep(1.0)

        # ================================================================
        # STEP 4 — Both arms converge together ("catch")
        # ================================================================

        plan = plan_joint_goal(dual_arm, both_arms, "both_arms", catch_pose, "Catch object")
        if plan:
            execute_plan(dual_arm, plan, "Catch object")
        time.sleep(1.0)

        # ================================================================
        # STEP 5 — Rotate base to the place location, arms still holding
        # ================================================================

        plan = plan_joint_goal(dual_arm, base, "base", [1.2], "Rotate to place location")
        if plan:
            execute_plan(dual_arm, plan, "Rotate to place location")
        time.sleep(1.0)

        # ================================================================
        # STEP 6 — Both arms open together ("release")
        # ================================================================

        plan = plan_joint_goal(dual_arm, both_arms, "both_arms", release_pose, "Release object")
        if plan:
            execute_plan(dual_arm, plan, "Release object")
        time.sleep(1.0)

        # ================================================================
        # STEP 7 — Both arms return home together
        # ================================================================

        plan = plan_joint_goal(dual_arm, both_arms, "both_arms", home_pose, "Arms to home")
        if plan:
            execute_plan(dual_arm, plan, "Arms to home")
        time.sleep(1.0)

        # ================================================================
        # STEP 8 — Base home
        # ================================================================

        plan = plan_joint_goal(dual_arm, base, "base", [0.0], "Base to home")
        if plan:
            execute_plan(dual_arm, plan, "Base to home")
        time.sleep(1.0)

        # ================================================================
        # STEP 9 — Lift home
        # ================================================================

        plan = plan_joint_goal(dual_arm, lift, "lift", [0.0], "Lift to home")
        if plan:
            execute_plan(dual_arm, plan, "Lift to home")

        print("\n========================================")
        print("        DEMO COMPLETE")
        print("========================================")

    except Exception as error:

        print("\n========================================")
        print("FATAL ERROR")
        print("========================================")
        print(error)
        raise

    finally:

        rclpy.shutdown()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    main()