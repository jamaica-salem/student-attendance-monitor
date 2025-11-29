# 🎓 AI Student Detection System

A **real-time student attendance monitoring system** using **face detection** powered by **TensorFlow.js** and **BlazeFace**. This system detects and counts students in a classroom using a webcam and logs attendance events automatically.

---

## 🚀 Features

- 👁️ Real-time face detection with **TensorFlow.js** and **BlazeFace**.
- 🎥 Webcam integration for live classroom monitoring.
- 📊 Dynamic attendance tracking:
  - Logs when students **appear** or **disappear**.
  - Maintains a history of attendance events.
- ✨ Visual overlays on detected faces with bounding boxes and corner highlights.
- ⚡ Real-time statistics:
  - Detection **FPS**
  - Average number of students detected
  - Camera **status indicator**
- 👆 Toggleable overlays for better visualization.
- 🖥️ Interactive UI built with **React** and **TailwindCSS**.

---

## 🛠️ Technologies Used

- **Frontend:** React, TypeScript, TailwindCSS
- **Machine Learning:** TensorFlow.js, BlazeFace
- **Icons:** Lucide React
- **UI Components:** Custom components with TailwindCSS
- **State & Hooks:** React Hooks for state management

---

## 🎮 Usage

1. Click **Start Camera** 🎥 to initialize the webcam.
2. Wait for the **BlazeFace model** ⚡ to load.
3. Toggle **Attendance Mode** ⏱️ to start logging events.
4. Optionally toggle the **Overlay** 👁️ to show or hide face detection bounding boxes.
5. Monitor real-time statistics and attendance logs in the insights panel 📊.

---

## 🧩 Components

- **Webcam Video:** Displays live video feed from the webcam 🎥
- **Canvas Overlay:** Draws bounding boxes and corner highlights on detected faces ✨
- **Controls:**
  - Start/Stop Camera 🔴🟢
  - Show/Hide Overlay 👁️
  - Enable/Disable Attendance Logging ⏱️
- **Insights Panel:**
  - Detection FPS ⚡
  - Average student count 👥
  - Camera status indicator 🎥
  - Attendance log history 📋 (if enabled)

---

## 📝 Attendance Logging

- Logs **three types of events**:
  - `appeared` ➕ Student(s) detected entering the frame.
  - `disappeared` ➖ Student(s) leaving the frame.
  - `change` 🔄 Any change in student count.
- Only tracks the **last 10 events** for easy monitoring.
- Timestamped for **accurate attendance tracking** ⏰

---

## 📈 Insights Panel

Displays real-time metrics including:

- **FPS:** Frames per second of detection loop ⚡
- **Average Count:** Average number of students detected over recent frames 👥
- **Status:** Camera status indicator 🎥 (active/inactive)
- **Attendance Log:** Shows recent attendance events if Attendance Mode ⏱️ is active

---

## 🌟 Future Improvements

- Integrate with a **backend database** for persistent attendance records 🗄️
- Add **student identification** using facial recognition for automatic roll call 🆔
- Support multiple classrooms with **user authentication** 👨‍🏫
- Export attendance logs as **CSV or PDF** 📄
- Add advanced analytics and **charts for attendance trends** 📊


**AI Detection Team** | Real-time student monitoring using AI 🤖
