# 🎓 CampusHub – Campus Service Platform

CampusHub is a **full-stack campus service management platform** designed to simplify everyday student services in a university environment.
The application integrates multiple campus utilities into a **single modern dashboard**, allowing students to manage services such as food orders, library seat booking, certificates, exam alerts, and complaints.

This project demonstrates a **real-world full-stack architecture** using a modern frontend, API backend, and cloud database deployment.

---

# 🌐 Live Application

**Frontend (Vercel):**
https://campus-service-app.vercel.app

**Backend API (Render):**
https://campus-service-app.onrender.com


---

# 🧠 Project Goal

Most university systems are fragmented across multiple portals.
CampusHub aims to create **one unified digital campus platform** where students can:

* Order food from campus canteens
* Reserve library seats
* Track certificate requests
* Receive exam alerts
* Submit complaints
* View activity through a central dashboard

The system focuses on **clean UI/UX, API-driven architecture, and real-time service management**.

---

# 🏗 System Architecture

Frontend and backend are deployed separately following modern web architecture.

```
Frontend (React + Vite + Tailwind)
        │
        │  REST API
        ▼
Backend (FastAPI)
        │
        ▼
Database (MongoDB Atlas)
```

### Deployment Stack

| Layer             | Technology                  |
| ----------------- | --------------------------- |
| Frontend          | React + Vite + Tailwind CSS |
| Backend           | FastAPI (Python)            |
| Database          | MongoDB Atlas               |
| Frontend Hosting  | Vercel                      |
| Backend Hosting   | Render                      |
| API Communication | REST                        |

---

# ✨ Features

## 📊 Dashboard

A centralized dashboard showing real-time platform activity.

Includes:

* Total food orders
* Active library bookings
* Pending certificate requests
* Open complaints
* Weekly activity chart
* Quick service actions

Dashboard statistics are now **fully dynamic and connected to MongoDB**.

---

## 🍔 Food Ordering System

Students can browse campus canteens and order food directly through the platform.

Features:

* Dynamic food menu
* Order placement
* Database storage of orders
* Dashboard integration

---

## 📚 Library Seat Booking

Allows students to reserve study seats in the campus library.

Features:

* Seat availability display
* Seat booking
* Seat cancellation
* Booking data stored in MongoDB

---

## 📜 Certificate Requests

Students can request official documents such as:

* Bonafide certificates
* Academic certificates
* Administrative documents

Requests are stored and tracked in the system.

---

## 📢 Exam Alerts

Provides reminders and updates about upcoming exams.

Students can view schedules and prepare accordingly.

---

## ⚠ Complaint System

Students can submit complaints related to campus services.

Examples include:

* Infrastructure issues
* Service delays
* Administrative concerns

---

## 🤖 AI Assistant (Experimental)

An integrated chatbot assistant designed to help students interact with the platform.

Capabilities include:

* Checking service information
* Providing guidance
* Assisting with platform usage

This feature is still under development.

---

# 🔐 Authentication

The platform includes user authentication with:

* User registration
* Login system
* Secure access to personal dashboard
* Token-based authentication

---

# 🗄 Database Design

The MongoDB database includes collections such as:

```
users
food_orders
library_bookings
certificates
complaints
canteens
```

Each module stores its own data while the dashboard aggregates statistics dynamically.

---

# 🚀 Running the Project Locally

### Clone the repository

```
git clone https://github.com/pdineshsampathram-spec/campus-service-app.git
cd campus-service-app
```

---

### Install backend dependencies

```
cd backend
pip install -r requirements.txt
```

---

### Configure environment variables

Create a `.env` file:

```
MONGODB_URL=your_mongodb_connection_string
DATABASE_NAME=campus_service_db
SECRET_KEY=your_secret_key
```

---

### Run backend

```
uvicorn main:app --reload
```

Backend runs on:

```
http://localhost:8000
```

---

### Install frontend dependencies

```
cd frontend
npm install
```

---

### Run frontend

```
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

# ⚠ Known Issues (Honest Status)

This project is still under development. Some issues remain:

### Library Booking Error

Occasional errors occur while booking seats in the library module.

### Render Cold Start Delay

The backend is hosted on the **Render free tier**, which can take **30–60 seconds to start after inactivity**.

### AI Assistant Stability

The AI assistant feature is still experimental and may not always respond correctly.

---

# 🧪 Project Status

This project is currently an **active development project and portfolio demonstration**.

Future improvements include:

* Fixing remaining booking issues
* Improving backend query efficiency
* Enhancing AI assistant capabilities
* Adding admin controls
* Improving UI responsiveness

---

# 👨‍💻 Author

**Dinesh Sampathram**

GitHub:
https://github.com/pdineshsampathram-spec

---

# 📄 License

This project is intended for **educational and portfolio purposes**.

---

⭐ If you found this project useful, consider giving the repository a star.
