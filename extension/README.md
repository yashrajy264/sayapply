# Say Apply Chrome Extension

This is a Chrome Extension that automatically fills LinkedIn Easy Apply job applications using your profile and Gemini AI.

## Installation

1. **Build the extension**:
   You need to build the extension from source.
   ```bash
   cd extension
   npm install
   npm run build
   ```
   This will create a `dist` folder.

2. **Load into Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner.
   - Click "Load unpacked".
   - Select the `extension/dist` folder.

## Usage

1. **Open the Side Panel**:
   Click the extension icon in the toolbar. This will open the side panel.

2. **Setup Profile**:
   Go to the "Profile" tab and fill in your details. Upload your resume (PDF).

3. **Configure API Key**:
   Go to "Settings" and enter your Google Gemini API Key. You can get one from [Google AI Studio](https://aistudio.google.com/).

4. **Start Applying**:
   Go to the "Apply" tab, enter a job keyword (e.g., "Frontend Developer") and location (e.g., "Remote"). Click "Start Applying".

## Features

- **Smart Form Filling**: Uses Gemini AI to answer questions based on your profile.
- **Question Bank**: Remembers your answers to avoid asking again.
- **Resume Injection**: Automatically uploads your resume.
- **Side Panel UI**: Stays open while you browse.

## Development

- Run `npm run dev` to watch for changes and rebuild automatically.
