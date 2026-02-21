<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Say Apply — Your Job Application Assistant

Say Apply is a powerful suite designed to streamline the job application process using Gemini AI. It consists of a web dashboard for management and a robust Chrome Extension that automates form filling on major job platforms.

---

## 🚀 Features

### Smart Browser Extension
- **Intelligent Form Filling**: Automatically detects and fills application fields on LinkedIn, Greenhouse, Lever, and Workday using your profile data and Gemini AI.
- **Dynamic Question Bank**: Learns from your previous answers to frequently asked questions, progressively becoming faster and more accurate.
- **Resume Injection**: Seamlessly handles resume uploads by injecting your stored profile/resume into the application form.
- **Side Panel Interface**: A sleek, non-intrusive side panel that stays with you as you navigate job boards.

### Web Dashboard
- **Profile Management**: Centrally manage your professional details, experience, and skills.
- **AI Configuration**: Simple setup for your Gemini API credentials.
- **Application Tracking**: (Coming Soon) Keep track of where you've applied and the status of each application.

---

## 🛠 Technology Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4
- **AI Core**: Google Gemini AI (@google/genai)
- **Browser Extension**: Manifest V3, Webpack, PostCSS
- **Animations**: Framer Motion
- **Icons**: Lucide React

---

## 💻 Setup & Installation

### 1. Web Application

**Prerequisites:** Node.js (v18+)

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Configure Environment**:
    Create a `.env.local` file in the root directory and add your Gemini API key:
    ```env
    GEMINI_API_KEY="your_api_key_here"
    ```
3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:3000`.

### 2. Chrome Extension

1.  **Navigate to extension directory**:
    ```bash
    cd extension
    ```
2.  **Install & Build**:
    ```bash
    npm install
    ```
    To build for production:
    ```bash
    npm run build
    ```
    To watch for changes during development:
    ```bash
    npm run dev
    ```
3.  **Load into Chrome**:
    - Open Chrome and go to `chrome://extensions/`.
    - Enable **Developer mode** (toggle in the top right).
    - Click **Load unpacked**.
    - Select the `extension/dist` folder from this project.

---

## 📖 Usage Guide

1.  **Setup your Profile**: Use the Web Dashboard or the Extension's Profile tab to fill in your professional details.
2.  **Configure API**: Ensure your Gemini API Key is set in the Extension settings.
3.  **Navigate to a Job**: Go to a job posting on LinkedIn (e.g., an "Easy Apply" job).
4.  **Open Say Apply**: Click the extension icon to open the side panel.
5.  **Let AI Work**: Click "Automate" or "Fill Form" and watch as Say Apply handles the tedious parts of the application.

---

<div align="center">
Built with ❤️ by the Say Apply Team
</div>
