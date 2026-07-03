Electrical and data connectors:

Use a **pogo-pin** or **spring contact block** for power and low-speed signal across a docking interface, since it self-cleans on mating and suits frequent connect/disconnect cycles.

Use an **M8 or M12 circular industrial connector** as a general-purpose robotics dock combining power and a data pair, since it is locking, rugged, off-the-shelf, and a good default choice.

Use **CAN bus** with a **twisted differential pair** for real-time joint control involving multiple motor and sensor nodes on one bus, since it resists noise near motor drivers.

Use **RS-485** with a differential pair as a simpler alternative to CAN when multi-master arbitration is not needed, suited to sensor modules or slower control loops.

Use **EtherCAT** or **industrial Ethernet** for high-bandwidth, tightly synchronized multi-axis motion control, though this is generally overkill for a simple hobby arm.

Use **USB-C** for prototyping or bench setups needing both power and high-speed data in one cheap standard connector, though it is not built for high mating-cycle industrial use.

Use a **screw terminal** or **barrel jack** for simple, permanent power-only connections such as feeding a supplemental battery module, since it is not meant for frequent swapping.

Use a **slip ring** for any joint that needs continuous rotation, such as a rotating base or wrist, since it passes power and data across a rotating interface without twisting the wires.
