# Email Processing Application

A modern web application for processing and managing emails with client tracking.

## Features

- Email fetching and processing
- Client management
- Domain tracking
- Form type classification
- Real-time updates
- Modern UI with responsive design

## Tech Stack

- **Frontend**: Next.js 14 with App Router, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time subscriptions)
- **Email Processing**: Gmail API
- **State Management**: TanStack Query (React Query)
- **UI Components**: Shadcn/ui
- **Forms**: React Hook Form with Zod validation
- **Testing**: Jest, React Testing Library
- **CI/CD**: GitHub Actions

## Project Structure

```
src/
├── app/                    # Next.js app router pages
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── emails/           # Email-related components
│   ├── clients/          # Client management components
│   └── forms/            # Form-related components
├── lib/                  # Shared utilities
│   ├── supabase/        # Supabase client and types
│   ├── gmail/           # Gmail API integration
│   └── utils/           # Helper functions
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
└── styles/              # Global styles and Tailwind config

supabase/
├── migrations/          # Database migrations
└── types/              # Generated Supabase types

tests/                  # Test files
```

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and fill in the environment variables
4. Run database migrations: `npm run migrate`
5. Start the development server: `npm run dev`

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL=your_database_url

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token
```

## Database Migrations

Run migrations:
```bash
npm run migrate
```

## Development

Start the development server:
```bash
npm run dev
```

## Testing

Run tests:
```bash
npm test
```

## Deployment

The application is automatically deployed via GitHub Actions when changes are pushed to the main branch.

## Email Processor Script

The application includes a script to automatically process recent emails from Gmail. The script:
- Fetches unprocessed emails from Gmail
- Downloads and processes attachments
- Converts PDFs to images for viewing
- Updates email tracks (WOTC Machine or Forms Admin)
- Applies Gmail labels based on tracks

### Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
- Copy `.env.local.example` to `.env.local`
- Fill in the required values:
  - Supabase URL and service role key
  - Google OAuth credentials (client ID, secret, refresh token)
  - PDF server URL if running locally

3. Run the script:
```bash
npm run process-emails
```

### Automatic Processing

The script can be set up to run automatically using a cron job or a task scheduler:

```bash
# Example cron job (runs every 5 minutes)
*/5 * * * * cd /path/to/project && /usr/local/bin/npm run process-emails
```

### Troubleshooting

If you encounter issues:
1. Check the environment variables are set correctly
2. Ensure the Google OAuth tokens are valid
3. Verify the Supabase connection is working
4. Check the PDF server is running if processing PDFs

For detailed error messages, check the console output when running the script.

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request

## License

MIT License
