# AI APPS: A Portable AI Universe

Welcome to AI APPS, a creative suite and digital playground packed with AI-powered tools, mini-games, and utilities. This application is a demonstration of the versatile capabilities of the Google Gemini API, wrapped in a retro-inspired, pixel-art user interface.

This project is designed as a Progressive Web App (PWA), offering a fast, installable, and reliable experience with offline capabilities for non-AI features.

## ✨ Features

The application is divided into several creative zones:

*   **🎨 Art Gallery & Image Generation**:
    *   Generate pixel art, GIFs, spritesheets, and even short videos from text prompts using `imagen-4.0-generate-001` and `veo-2.0-generate-001`.
    *   Analyze an uploaded image to generate a descriptive prompt.
    *   Save, share, and manage your creations in a local gallery.

*   **🎵 Music & Sound Suite**:
    *   **Text to Song**: Convert stories, poems, or ideas into 8-bit chiptune songs.
    *   **Media to Song**: Upload a video or audio file and let AI compose a theme song based on its mood.
    *   **Sound Library**: Generate unique 8-bit sound effects from a simple description.
    *   **Pixel Sequencer**: A powerful 16-step sequencer for composing your own chiptune melodies.

*   **💬 AI Chat & Assistants**:
    *   Chat with a diverse roster of specialized AI assistants, each with a unique personality and expertise, powered by `gemini-2.5-flash`.
    *   Enable Google Search for up-to-date, grounded responses.
    *   **File Q&A**: Upload an image, audio, or video file and ask questions about its content.
    *   **Talking Cat**: Have a real-time voice conversation with a sassy AI cat, powered by the Gemini Live API.

*   **🕹️ AI Zone (Mini-Games & Tools)**:
    *   A hub of classic games (Snake, Brick Breaker, Minesweeper), AI-powered challenges (Smart Tic-Tac-Toe, Guess The Prompt), and creative utilities (AI Oracle, Word Match).

*   **🔧 Offline AI Tools**:
    *   A collection of creative tools that run entirely in the browser without needing an internet connection or spending credits.
    *   Transform images into sounds, songs, or ASCII/Emoji art based on pixel data.
    *   Reverse audio from video files or convert audio to MIDI locally.

## 🚀 Technology Stack

*   **Frontend**: React, TypeScript, Tailwind CSS
*   **AI Engine**: Google Gemini API (`@google/genai`)
    *   **Text & Chat**: `gemini-2.5-flash`
    *   **Image Generation**: `imagen-4.0-generate-001`
    *   **Video Generation**: `veo-2.0-generate-001`
    *   **Real-time Voice**: `gemini-2.5-flash-native-audio-preview-09-2025` (Live API)
*   **Audio Synthesis**: Web Audio API for generating sounds and music.
*   **Offline Functionality**: Service Worker and Cache API for PWA capabilities.

## 🛠️ Getting Started

### Prerequisites

1.  A modern web browser (Chrome, Firefox, Safari, Edge).
2.  A Google Gemini API Key. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Running the Application

This project is set up as a static web application with no build step required.

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Set up your API Key**:
    This application requires the Gemini API key to be available as an environment variable named `API_KEY`. The method for setting this depends on your local development server. For simple servers, you may need to replace `process.env.API_KEY` in the code with your actual key for testing purposes.

    **Note:** Never commit your API key directly into your source code.

3.  **Serve the project**:
    You need a local web server to run the application due to ES module imports. A simple way to do this is using `npx`:
    ```bash
    npx serve
    ```
    This will start a server, and you can open the provided `localhost` URL in your browser.

## PWA Installation

This app is a Progressive Web App (PWA) and can be installed on your device for a native-like experience.

*   **Desktop (Chrome/Edge)**: Look for the install icon in the address bar.
*   **iOS (Safari)**: Tap the "Share" button, then select "Add to Home Screen".
*   **Android (Chrome)**: Tap the menu (three dots) and select "Install app".

This provides quick access from your home screen and enables offline access for non-AI features.
