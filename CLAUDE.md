# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a Next.js 15.3.4 application named "simpleldap" using the App Router pattern with TypeScript and Tailwind CSS v4.

## Development Commands
- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

## Architecture
- **Framework**: Next.js 15.3.4 with App Router
- **Language**: TypeScript with strict mode enabled
- **Styling**: Tailwind CSS v4 with PostCSS
- **React**: Version 19.0.0
- **Structure**: 
  - `/app` directory contains all pages and layouts
  - `/public` directory for static assets
  - `app/page.tsx` is the home page component
  - `app/layout.tsx` is the root layout with metadata configuration
  - `app/globals.css` contains global styles and Tailwind directives

## Key Configuration Files
- `tsconfig.json`: TypeScript configuration with ES2017 target and strict mode
- `next.config.ts`: Next.js configuration (currently minimal)
- `eslint.config.mjs`: ESLint with Next.js core-web-vitals and TypeScript rules
- `tailwind.config.ts`: Tailwind CSS configuration extending default theme

## Development Notes
- This is a fresh Next.js project created with create-next-app
- No testing framework is currently configured
- No LDAP-related functionality has been implemented yet despite the project name
- The project uses the Geist font family from Vercel