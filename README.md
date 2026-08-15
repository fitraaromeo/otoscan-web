# OtoScan Web 🚗🔍

OtoScan Web is a modern, premium web application designed for automated **4-side AI vehicle inspection sessions**. Powered by YOLOv12 AI model detection, OtoScan identifies and classifies physical damages on vehicles in real time.

---

## 🚀 Key Features

*   **Interactive Dashboard Overview**: Track key metrics such as Total Clients, Total Fleet Vehicles, Total Inspection Sessions, and Total AI Findings.
*   **Inspection Session Trends**: View visual charts of inspection activity trends and breakdown of AI damage types.
*   **4-Side Scan Results**: Manage inspections with dedicated slots for **Front, Rear, Left, and Right** vehicle angles.
*   **Real-time YOLOv12 Detection**: Automatically detect physical car damages, including:
    *   🔵 **Dent**
    *   🟡 **Scratch**
    *   🔴 **Crack**
    *   🟣 **Glass Shatter**
    *   🟠 **Broken Light**
    *   ⚪ **Flat / Damaged Tire**
*   **Client & Fleet Management**: Keep track of registered clients and their vehicles.
*   **Inspector Notes & Metadata**: Store inspection metadata such as the inspector officer in charge, client details, logs, and custom text notes.

---

## 🛠️ Technology Stack

*   **Framework**: [Next.js](https://nextjs.org/) (App Router)
*   **Language**: TypeScript
*   **Styling**: Modern CSS variables, Tailwind CSS
*   **Icons**: Lucide React
*   **Database & API Backend**: Integrates with PostgreSQL and OtoScan Go API

---

## 📦 Getting Started

### 1. Installation

Clone the repository and install the dependencies:

```bash
# Clone the repository
git clone https://github.com/fitraaromeo/otoscan-web.git

# Navigate into the project folder
cd otoscan-web

# Install package dependencies
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory and define the connection configurations if required:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 3. Run Development Server

Launch the local development environment:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 📁 Project Structure

```text
otoscan-web/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/       # Dashboard main view
│   │   │   ├── inspections/     # Inspection sessions list & detail view
│   │   │   └── master/          # Settings and status definitions
│   │   ├── _components/         # Reusable UI components (Modal, Badge, Topbar, Sidebar)
│   │   ├── _lib/                # API fetch helper functions and TypeScript interfaces
│   │   ├── globals.css          # Design token definitions and custom styles
│   │   └── layout.tsx           # Global layouts and wrappers
└── public/                      # Static assets
```

---

## 📄 License

This project is licensed under the MIT License.
