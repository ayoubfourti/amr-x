<<<<<<< HEAD
import { useMemo } from 'react';
import * as ROSLIB from "roslib";


export function useTeleopControl(ros) {
    const cmdVelTopic = useMemo(() => {
        if (!ros) return null;
        return new ROSLIB.Topic({
            ros,
            name: '/cmd_vel',
            messageType: 'geometry_msgs/Twist',
        });
    }, [ros]);

    const sendCommand = (linear, angular) => {
    if (!cmdVelTopic) return;
    cmdVelTopic.publish({
        linear: { x: linear, y: 0, z: 0 },
        angular: { x: 0, y: 0, z: angular },
        });
    };

    const emergencyStop = () => {
        sendCommand(0, 0);
    };

    return { sendCommand, emergencyStop };
}
=======
import { useMemo } from 'react';
import * as ROSLIB from "roslib";


export function useTeleopControl(ros) {
    const cmdVelTopic = useMemo(() => {
        if (!ros) return null;
        return new ROSLIB.Topic({
            ros,
            name: '/cmd_vel',
            messageType: 'geometry_msgs/Twist',
        });
    }, [ros]);

    const sendCommand = (linear, angular) => {
    if (!cmdVelTopic) return;
    cmdVelTopic.publish({
        linear: { x: linear, y: 0, z: 0 },
        angular: { x: 0, y: 0, z: angular },
        });
    };

    const emergencyStop = () => {
        sendCommand(0, 0);
    };

    return { sendCommand, emergencyStop };
}
>>>>>>> 32cc58492a1462bb4746e3b8ce7ae7f59057e107
