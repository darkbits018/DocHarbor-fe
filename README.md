# Doc Harbour Frontend

React frontend scaffold for Doc Harbour.

## Status

Folder structure only. Components are placeholders. Dependencies, run/build commands, API integration, and styling will be added with the working implementation. This scaffold does not yet render a usable app.

## Structure

- `src/App.jsx`: main screen and shared state.
- `src/main.jsx`: React entry point.
- `src/api.js`: Python backend requests.
- `src/styles.css`: application styling.
- `src/components/`: document upload/list, chat, source references, settings, and owner contact.
- `vite.config.js`: development server configuration placeholder.

API keys will be submitted to the local backend and retained there only for the running session, not saved in browser storage. No login, billing, multi-tenancy, or website crawling is planned.

A real package lock will be generated when dependencies are installed. Setup and deployment instructions will follow with the implementation.
