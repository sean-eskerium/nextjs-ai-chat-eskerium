# Cursor Rules for Project Eskerium Hub

## Project Overview

*   **Project Name:** Eskerium Hub

*   **Description:** Eskerium Hub is a centralized platform that integrates communication, task management, collaboration tools, and AI-driven assistance to streamline workflows for professional teams. The app leverages a modular, agent-driven architecture and modern hosting solutions to provide a seamless and efficient user experience. The Hub empowers users to manage tasks, notes, meetings, and organizational knowledge effectively through an intuitive interface enhanced by AI.

*   **Tech Stack:**

    *   Frontend: Next.js, Material-UI, Fuse React Template
    *   Backend: Vercel Edge Functions, Neon PostgreSQL with PGVector
    *   AI Integration: Vercel AI SDK, ChatGPT
    *   Communication: SDKs like Mux, Daily, or Twilio for video and audio

*   **Key Features:**

    1.  Centralized productivity management
    2.  AI-assisted task and meeting coordination
    3.  Scalable architecture supporting AI and real-time interactions
    4.  User-centric design with accessibility focus
    5.  Robust security with GDPR compliance

## Project Structure

### Root Directory:

Contains main configuration files and documentation, including README.md, package.json, and environment configuration.

### /frontend:

Contains all frontend-related code, including components, styles, and assets.

*   **/components:**

    *   TaskManager.jsx: Component for managing and viewing tasks
    *   ChatInterface.jsx: Real-time chat components
    *   MeetingScheduler.jsx: Interface for scheduling and managing meetings

*   **/assets:**

    *   Logo.png: Company branding logo
    *   Icons/: Directory for UI icons

*   **/styles:**

    *   GlobalStyles.css: General styling rules
    *   Theme.js: Material-UI theme definitions

### /backend:

Contains all backend-related code, including API routes and database models.

*   **/controllers:**

    *   TasksController.js: Logic for task management
    *   MeetingsController.js: Logic for meeting-related functionalities

*   **/models:**

    *   TaskModel.js: Database schema for tasks
    *   UserModel.js: Schema for user information and settings

*   **/routes:**

    *   apiRoutes.js: Define RESTful API endpoints

### /config:

Configuration files for environment variables and application settings.

*   **Environment settings:** environment.js
*   **Database connection:** dbConfig.js

### /tests:

Contains unit and integration tests for both frontend and backend.

*   **Frontend Tests:** Using Jest and React Testing Library

    *   TaskManager.test.js

*   **Backend Tests:** Using Jest

    *   TaskRoute.test.js

## Development Guidelines

*   **Coding Standards:**

    *   Follow modular design principles for reusability and maintainability.
    *   Use ESLint and Prettier for code formatting and linting.

*   **Component Organization:**

    *   Components should be organized by feature within the /components directory.
    *   Ensure consistent naming conventions and functionality splitting.

## Cursor IDE Integration

*   **Setup Instructions:**

    1.  Clone the repository from the version control system.
    2.  Install dependencies using `npm install` in both the root and /frontend directories.
    3.  Ensure environment variables are appropriately configured in /config.

*   **Key Commands:**

    *   `npm run dev`: Start development server for both frontend and backend.
    *   `npm test`: Run all tests in the /tests directory.

## Additional Context

*   **User Roles:**

    *   Administrator: Full access to all features and settings
    *   Manager: Access to manage teams and oversee projects
    *   Team Member: Access to communication tools and personal tasks

*   **Accessibility Considerations:**

    *   Ensure all UI components pass WCAG 2.1 AA standards
    *   Conduct accessibility testing regularly with tools like Axe

This document provides a comprehensive framework and guidelines for developing Eskerium Hub, ensuring alignment with project goals and facilitating efficient use of the Cursor IDE and related tools.
