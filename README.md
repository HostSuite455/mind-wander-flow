# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/caf224b1-42db-4e7f-9645-62d3c9a1b80f

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/caf224b1-42db-4e7f-9645-62d3c9a1b80f) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/caf224b1-42db-4e7f-9645-62d3c9a1b80f) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Supabase Configuration

### Environment Variables (Frontend)
The application requires these environment variables:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Supabase Secrets (Backend)
Configure these secrets in your Supabase project for edge functions:
1. **SB_URL** - Your Supabase project URL 
2. **SB_SERVICE_ROLE_KEY** - Your Supabase service role key

#### Setting Supabase Secrets:
1. Go to: https://supabase.com/dashboard/project/{project_id}/settings/functions
2. Add environment variables:
   - Name: `SB_URL`, Value: `https://your-project-ref.supabase.co`
   - Name: `SB_SERVICE_ROLE_KEY`, Value: `your_service_role_key`

Find your service role key: Supabase Dashboard → Settings → API → Service Role

### Edge Functions
- **ics-sync** - Synchronizes iCal data from external sources  
- **ics-export** - Exports property calendar as iCal (currently stub)

### Database Tables
Main tables used by the channel manager:
- `ical_configs` - Configuration for channel connections
- `ical_urls` - iCal URLs for each configuration  
- `properties` - Property information
- `calendar_blocks` - Availability blocks from synced data
