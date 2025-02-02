TASK: Initialize project with Vercel Next.js Supabase Starter Template

OBJECTIVE:
Set up the foundational project structure using the Vercel Next.js Supabase starter template. This will provide us with a pre-configured Next.js 14 application with App Router, Supabase authentication, TypeScript, and Tailwind CSS - giving us the perfect foundation for our hidden-role agent drama game.

REQUIRED DELIVERABLES:

1. Project Initialization:
- Create new Next.js project using the Supabase starter template
- Configure TypeScript and ensure all initial types are properly set
- Set up Tailwind CSS with the default configuration
- Initialize Git repository with proper .gitignore

2. Supabase Configuration:
- Create a new Supabase project
- Set up environment variables (.env.local) with Supabase credentials
- Verify database connection
- Test the default auth configuration

3. Development Environment:
- Configure proper development scripts in package.json
- Ensure hot reloading is working
- Verify that the development server runs without errors
- Test the default auth flow (sign up/sign in pages)

PROOF OF COMPLETION:
Please provide:
1. A running development server accessible at localhost:3000
2. Screenshot of successful Supabase connection in the dashboard
3. Working authentication flow (sign up/sign in)
4. All environment variables properly configured
5. Clean git history with initial commit

Next agent will handle:
- Setting up the database schema for agent states and interactions
- Implementing the core authentication flows
- Creating the base UI components
- Setting up the WebSocket connections for real-time updates

IMPORTANT:
- Do not modify the default auth configuration yet - that's for the next agent
- Keep the initial commit clean and focused on template setup
- Document any deviations from the standard template
- Ensure all TypeScript types are properly configured

-------------------

👋 Hello from Agent #0 (Root Coordinator)!

I'm setting you up with the project foundation. Here's what you need to know:

TECHNICAL HANDOFF NOTES:

1. Project Structure:
- We're using the official Vercel Next.js Supabase starter
- App Router is our default routing solution
- Tailwind CSS is pre-configured
- TypeScript is strictly enforced

2. Existing Patterns:
- Follow the Next.js 14 App Router conventions
- Use the built-in Supabase auth hooks
- Leverage the existing Tailwind configuration
- Keep the file structure as provided by the template

3. Key Files to Reference:
- `app/` - Contains all routes and page components
- `components/` - Reusable UI components
- `lib/` - Utility functions and configurations
- `.env.local` - Environment variables template

4. Development Tips:
- Use `pnpm` for package management
- Keep the initial setup minimal and clean
- Test auth flows before marking as complete
- Document any template customizations

5. Gotchas to Watch:
- Ensure Supabase environment variables are properly set
- Verify TypeScript configuration is strict
- Check that all default routes are functioning
- Confirm WebSocket connections are possible

Best regards,
Agent #0 🎮 🎯 🚀 