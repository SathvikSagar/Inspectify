#  INSPECTIFy - Road Damage Detection & Management Platform

An AI-powered full-stack web application designed to detect, classify, report, and manage road infrastructure damage using state-of-the-art Computer Vision and Geospatial Mapping technologies.

---

##  Introduction

INSPECTIFy is built to assist municipalities and road maintenance teams in identifying and prioritizing road repairs efficiently. It leverages modern web technologies and cutting-edge AI models like **YOLO** and **Vision Transformers (ViT)** to automate the road inspection process.

---

##  Core Features

### 1. AI-Powered Damage Detection
- **Vision Transformers (ViT):** Automatically detects various types of road damage including cracks, potholes, and surface degradation.
- **YOLO:** Localizes damage areas with bounding boxes.
- **Real-Time Feedback:** Quick image processing and analysis.
- **Damage Categorization:** Clear identification of damage types.

### 2. Severity Classification
- **Intelligent Scoring:** Classifies damage as low, medium, or severe.
- **Color-Coded Prioritization:** Highlights critical issues for fast response.

### 3. Smart Reporting
- **Auto-generated Reports:** Include severity, type, and repair suggestions.
- **Standardized Documentation:** Useful for record keeping and audits.

### 4. Geospatial Mapping
- **Leaflet Maps Integration:** Visualize damage location.
- **GPS Location Tracking:** Auto-detect coordinates on image upload.
- **Clustering:** Group nearby reports for efficient planning.

### 5. User Management System
- **Role-Based Access:**
  - Regular Users: Submit and track damage
  - Authorities: Prioritize and assign repairs
  - Admins: Manage platform and users
- **Authentication:** Secure login with email verification
- **Dashboards:** Customized views based on user roles

### 6. Analytics Dashboard
- **Stats & Trends:** Visualize frequency, locations, and types of damage
- **Charts & Graphs:** Built with Recharts
- **Resource Planning:** Helps in better budget and effort allocation

---

##  User Interfaces

###  Public Landing Page
- Hero section with purpose and benefits
- Feature highlights and user testimonials
- Call-to-action for platform signup

###  User Dashboard
- Upload new road damage reports
- View personal submission history and statuses
- Get real-time updates and notifications

###  Admin Dashboard
- System-wide analytics and usage reports
- Manage user accounts and access control
- Review and validate damage reports

###  Authority Dashboard
- See prioritized issues
- Manage work orders and resource allocation
- Track repair progress visually

---

##  Technical Architecture

###  Frontend
- **React 19** with **Tailwind CSS**
- **Framer Motion** for smooth animations
- **Socket.IO** for real-time updates
- **Leaflet** for maps
- **Recharts** for data visualizations

###  Backend
- **Node.js** with **Express.js** for API server
- **MongoDB** for database operations
- **Python ML Scripts** for image analysis
- **Geospatial Indexing** for optimized map queries
- **Secure Authentication** and session handling
- **Multer** for file uploads

---

##  AI Components

- **YOLOv5:** Object detection of road defects
- **Vision Transformer (ViT):** Image classification for damage types & severity
- **Road Classifier:** Filters images to validate if it contains road surface
- **HuggingFace Models:** Efficient inference with pre-trained weights

---

##  Workflow

1. **Image Upload:** User captures or uploads an image.
2. **Location Tagging:** GPS coordinates are auto-fetched.
3. **AI Processing:** Models detect and classify road issues.
4. **Report Generation:** Damage type, severity, and suggestions are compiled.
5. **Review & Action:** Authorities review and generate repair orders.
6. **Tracking:** Reports are tracked through to completion.
7. **Verification:** Follow-up images can verify repairs.

---

## Benefits

- ✅ **Efficiency:** Automates time-consuming inspection
- ✅ **Accuracy:** Objective and consistent damage detection
- ✅ **Prioritization:** Fix the most critical issues first
- ✅ **Documentation:** Maintain detailed history of road conditions
- ✅ **Cost Saving:** Enables preventive maintenance
- ✅ **Public Safety:** Safer roads for everyone
- ✅ **Data-Driven:** Smart resource allocation & planning

---

##  Deployment

- 🌐 **Live Site:** [safestreet-road-damage-detection-system.onrender.com](https://safestreet-road-damage-detection-system.onrender.com/)
- 💻 **GitHub Repository:** [View Source Code](https://github.com/SathvikSagar/Inspectify)

---

## 👨‍💻 Developed By

Team from **Keshav Memorial College Of Engineering**:
- Venkat Madhu Mohan  
- Satvik Sagar  
- Shivanandan  
- Rushika Anumula  
- Shanti Sri Parimi

---

## 📄 License

This project is for educational and demonstration purposes. For licensing or extended use, please contact the developers.

---

