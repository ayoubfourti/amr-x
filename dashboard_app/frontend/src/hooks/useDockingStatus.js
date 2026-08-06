import { useEffect, useState } from "react";
import * as ROSLIB from "roslib";

const STATE_NAMES = {
  0: "undocked",
  1: "docking",
  2: "docked",
  3: "undocking",
};

export function useDockingStatus(ros) {
    const [dockingStatus, setDocking] = useState({
        state: "undocked",
        mechanicalLock: false,
        moduleDetected: false,
    });

    useEffect(() => {
        if (!ros) return;

        const dockingTopic = new ROSLIB.Topic({
            ros,
            name: "/docking_status",
            messageType: "amr_interfaces/msg/DockingStatus",
        });

        const callback = (message) => {
            setDocking({
                state: STATE_NAMES[message.state] ?? "unknown",
                mechanicalLock: message.mechanical_lock,
                moduleDetected: message.module_detected,
            });
        };

        dockingTopic.subscribe(callback);
        return () => {
            dockingTopic.unsubscribe(callback);
        };
    }, [ros]);

    return dockingStatus;
}   
