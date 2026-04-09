# Automatic Timetable Generator 📅

A full-stack MERN (MongoDB, Express.js, React, Node.js) web application designed for educational institutions to automatically generate optimized, conflict-free academic timetables. 

This system acts as a "Real-World" University Admin dashboard, featuring algorithmic scheduling via Constraint Logic Programming (Backtracking) and Evolutionary Algorithms (Genetic Algorithm).

## 🚀 Key Features

* **Master Data Management**: Full CRUD interface for Departments, Faculties, Subjects, Classes, Classrooms, and Laboratories.
* **Auto-Calculated Constraints**: Subject credits automatically convert into required Theory and Lab sessions.
* **Conflict-Free Generation**: 
  * **Zero Free Slots**: Utilizes advanced Backtracking logic to guarantee dense, sequential, top-down scheduling.
  * **Global Non-Overlap**: Ensures no Faculty, Classroom, or Lab is double-booked across the entire university. 
  * **Continuous Labs**: Dynamically aggregates slots into continuous 1.5 to 2-hour lab blocks without crossing break boundaries.
* **Interactive Grid UI**: Features an intuitive Day-Time grid layout with multi-row spanning for continuous labs.
* **Drag-And-Drop Manual Editing**: Admin override allowed during the Draft phase with real-time UI swapping.
* **Export Utilities**: One-click exports of generated timetables to **PDF** and **MS Excel** formats.

## 🛠️ Technology Stack

* **Frontend**: React 18, Material UI (MUI), jsPDF, html2canvas, SheetJS (xlsx)
* **Backend**: Node.js, Express.js
* **Database**: MongoDB & Mongoose
* **Scheduling Engine**: Custom-built Node.js Genetic and Recursive Backtracking Algorithms

## 💻 Local Setup Instructions

1. **Clone the Repository** and navigate to the project folder.
2. **Setup Backend**:
   ```bash
   cd server
   npm install
   npm run seed  # Optional: Seed the database with sample departments and subjects
   npm run dev
   ```
3. **Setup Frontend**:
   ```bash
   cd client
   npm install
   npm start
   ```
4. Access the dashboard at `http://localhost:3000`.

## ⚙️ Scheduling Rules Enforced

* **🔴 Hard Constraints**:
  * A faculty member cannot be assigned to more than one class at the same time globally.
  * No classroom or lab should be simultaneously allocated to multiple batches.
  * Lab sessions must be continuous and respect dynamic hour blocks.
  * Every semester's timetable must avoid free periods/gaps during the working day.
* **🟡 Soft Constraints**:
  * Even subject distribution across the 5 working days.
  * Intelligent capacity matching (e.g., matching a 60-student class to a 60+ capacity room).
