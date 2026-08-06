import { useCallback, useMemo, useState } from "react";
import * as ROSLIB from "roslib";

export function useModuleDocking(ros, moduleName = "dual_arm") {
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);

  const dockAction = useMemo(() => {
    if (!ros) return null;
    return new ROSLIB.Action({
      ros,
      name: "/dock_module",
      actionType: "amr_interfaces/action/DockModule",
    });
  }, [ros]);

  const undockAction = useMemo(() => {
    if (!ros) return null;
    return new ROSLIB.Action({
      ros,
      name: "/undock_module",
      actionType: "amr_interfaces/action/UndockModule",
    });
  }, [ros]);

  const dock = useCallback(
    (dockId = "dock_1") => {
      if (!dockAction) return;
      setProgress({ stage: "starting", progress: 0 });
      setResult(null);

      dockAction.sendGoal(
        { module_name: moduleName, dock_id: dockId },
        (res) => {
          setResult({ success: res.success, message: res.message });
          setProgress(null);
        },
        (fb) => {
          setProgress({ stage: fb.stage, progress: fb.progress });
        }
      );
    },
    [dockAction, moduleName]
  );

  const undock = useCallback(() => {
    if (!undockAction) return;
    setProgress({ stage: "starting", progress: 0 });
    setResult(null);

    undockAction.sendGoal(
      { module_name: moduleName },
      (res) => {
        setResult({ success: res.success, message: res.message });
        setProgress(null);
      },
      (fb) => {
        setProgress({ stage: fb.stage, progress: fb.progress });
      }
    );
  }, [undockAction, moduleName]);

  return { dock, undock, progress, result };
}