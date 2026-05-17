# Academic Management System

A comprehensive, serverless school administration platform designed for technical and primary education institutions. Built on Cloudflare's ecosystem for maximum performance and reliability.

## 🚀 Overview

This system streamlines administrative workflows, focusing on teacher attendance, license management, and institutional reporting. It provides a modern, responsive interface for school directors and administrative staff to manage the institution's daily operations.

## ✨ Key Features

- **Attendance Management**: Interactive grid for tracking daily teacher attendance with support for weekend toggling and holiday (suspended days) management.
- **License Control System**: 
    - Track various license types (nomenclatures).
    - Set annual day limits per license.
    - Automatic visual alerts when a teacher exceeds their allowed license quota.
- **Long-Duration Licenses**: Bulk assignment tool to project licenses over specific date ranges (Calendar vs. Working days calculation).
- **Teacher Profiles**: Detailed digital records including personal data, historical attendance summaries, and dynamic status-badge colors matching employment status: Active (Green), Baja y Reintegro (Yellow), Baja (Blue), Relevado (Red), and Tareas Pasivas (Orange).
- **Institutional Identity**: Dynamic configuration of school name, code, locality, and director, which automatically updates the UI and print headers.
- **Printable Reports**: One-click generation of institutional attendance sheets formatted for physical printing (A4 landscape) with automatic nomenclature keys and cell font auto-scaling.
- **Smart Print Highlights**: Automatic yellow and blue cell highlighting on the Cargo column during the discharge (Baja) or return (Reintegro) months, while keeping the interactive web panel clean.
- **Printed Column Color Legends**: Embedded color-coded yellow and blue sub-bands inside the "Cargo/Espacios Curriculares" printed table header.

## 🛠️ Technology Stack

- **Frontend**: React.js, Vite, Lucide React (Icons).
- **Styling**: Vanilla CSS with modern Glassmorphism aesthetics.
- **Backend**: Cloudflare Workers (Serverless Functions).
- **Database**: Cloudflare D1 (Serverless SQL).
- **Deployment**: Cloudflare Pages.
- **Media Storage**: ImgBB API integration for document and image attachments.


## 📜 Changelog

### [v1.3.0] - 2026-05-17
#### Added
- **Printed Column Color Legends**: Embedded color-coded yellow ("Baja y Reintegro") and blue ("Baja") sub-bands inside the "Cargo/Espacios Curriculares" printed table header cell, perfectly aligned to the bottom.
- **Print-Only Smart Fills**: Automatic yellow and blue Cargo cell highlights during the discharge (Baja) or return (Reintegro) months, utilizing a robust empty-date fallback to highlight even when exact dates are not set yet.
- **Dynamic Badge Styling**: React-controlled status badges in teacher profiles mapping employment status to a curated color scheme: Activo (Green), Baja y Reintegro (Yellow), Baja (Blue), Relevado (Red), and Tareas Pasivas (Orange).
- **Browser Print Color Adjustments**: Implemented full document-level `-webkit-print-color-adjust: exact` and `print-color-adjust: exact` styles in the print window to guarantee perfect background rendering.

#### Changed
- **Clean Interactive Panel**: Reverted temporary row background highlights inside the web app's interactive Attendance tab, keeping the UI clean and white for daily operational tasks.

### [v1.2.0] - 2026-05-15
#### Added
- **Long-Duration License Module**: New bulk projection tool for licenses with Calendar vs. Working days logic.
- **Session Persistence**: System now remembers selected month and weekend visibility across reloads.
- **Localized Date Pickers**: Native date inputs now default to Spanish (DD/MM/YYYY) via document locale.

#### Changed
- **Unified UI Controls**: Integrated `SaveStatusButton` across all administration panels for consistent change detection.
- **Streamlined Toolbar**: Simplified attendance header with icon-only actions.
- **Database Schema**: Updated `licencias` table to support `larga_duracion` flags.

### [v1.1.5] - 2026-05-14
#### Refined
- **Printing Nomenclatures**: Updated labels to "Codigo del Cargo/Horas" and "Cargo/Espacios Curriculares" for regulatory compliance.
- **Print Layout**: Increased font size for totals and balanced institutional code identifier (E233).
- **Visual Fixes**: Removed background coloring from weekend headers in the printable attendance sheet.

### [v1.1.0] - 2026-05-12
#### Added
- **License Quota System**: Implementation of annual day limits per license with automatic red-alert indicators for exceeded teachers.
- **Dynamic Institutional Identity**: Page title, login headers, and dashboard greetings now update dynamically based on school settings.
- **Manual Persistence Control**: Replaced auto-save with manual "Save Changes" triggers for institutional and API configuration.

### [v1.0.0] - 2026-05-10
#### Initial Release
- Core attendance grid and teacher management.
- Cloudflare D1 integration.
- Mobile login system.
- Printable attendance planillas.
