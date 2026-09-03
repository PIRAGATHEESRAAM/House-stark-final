**Vision-Based Autonomous Navigation for Outdoor UGVs**

&#x09;An end-to-end, infrastructure-free autonomous navigation system developed for the Smart India Hackathon (SIH 2026, Problem Statement ID: 26126). Designed specifically for GPS-denied, unstructured outdoor environments—such as dense forests, post-disaster zones, agricultural fields, and subterranean facilities—this system enables Unmanned Ground Vehicles (UGVs) to map, navigate, and dynamically replan paths strictly using onboard edge compute and computer vision without relying on external satellite signals or network connectivity.



**Key Architecture \& Highlights**

* **GPS-Denied \& Fully Offline Localization: Employs Visual SLAM (ORB-SLAM3) and visual odometry to estimate local robot pose $(X, Y, \\theta)$ and build real-time 2D local occupancy grid maps without external beacons or cloud services.** 

&#x20;

* **Perception \& Semantic Detection: Integrates lightweight YOLO models (YOLOv8 / YOLOv5) with OpenCV to detect dynamic obstacles, classify traversable corridors, and identify terrain hazards in real time.**  



* **Optimal Path Planning \& Dynamic Replanning: Uses an A\* algorithm for global route calculation alongside costmap-based Dynamic Window Approach (DWA) for dynamic local obstacle avoidance.**

&#x20; 

* **Fail-Safe "Safety Hold": Continuously monitors pose estimation confidence and covariance; automatically halts drive motors if visual tracking degrades or unexpected blockages occur.**  



* **Simulation-First to Hardware Architecture: Built on ROS 2 (Humble/Iron) using modular lifecycle nodes to allow seamless transition between simulation (Gazebo/RViz) and physical hardware deployment (NVIDIA Jetson / Raspberry Pi).**



**Technical Stack**

* **Robotics Middleware: ROS 2 (Humble / Iron), Nav2, tf2, geometry\_msgs**  



* **Visual SLAM \& Estimation: ORB-SLAM3, OpenCV, Eigen, Sophus**  



* **AI Perception: PyTorch, Ultralytics YOLO (Object Detection \& Semantic Segmentation)**  

* **Path Planning: A\* Graph Trajectory, Dynamic Window Approach (DWA)** 

&#x20;

* **Hardware Interface: NVIDIA Jetson Nano / Raspberry Pi 4, CSI/Stereo Camera, MPU6050 6-DOF IMU, Wheel Encoders, Dual DC Motor Drivers**  

