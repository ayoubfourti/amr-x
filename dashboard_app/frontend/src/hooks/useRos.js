<<<<<<< HEAD
// Requires: npm install roslib (already a dependency of this project)
import { useEffect, useRef, useState } from "react";
import * as ROSLIB from "roslib";

export function useRos(url = "ws://localhost:9090") {
    const rosRef = useRef(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const ros = new ROSLIB.Ros({ url });
        rosRef.current = ros;

        ros.on("connection", () => setConnected(true));
        ros.on("close", () => setConnected(false));
        ros.on("error", () => setConnected(false));

        return () => {
            ros.close();
        };
    }, [url]);
    return { ros: rosRef.current, connected };
}
=======
import { useEffect, useRef, useState } from "react";
import * as ROSLIB from "roslib";

export function useRos(url = "ws://localhost:9090") {
    const rosRef = useRef(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const ros = new ROSLIB.Ros({ url });
        rosRef.current = ros;

        ros.on("connection", () => setConnected(true));
        ros.on("close", () => setConnected(false));
        ros.on("error", (error) => setConnected(false));

        return () => {
            ros.close();
        };
    }, [url]);
    return { ros: rosRef.current, connected };
}
>>>>>>> 32cc58492a1462bb4746e3b8ce7ae7f59057e107
