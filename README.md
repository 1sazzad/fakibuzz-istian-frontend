# FakiBuzz Frontend

FakiBuzz is an institution-ready exam preparation frontend for learners, admins, and education teams. It supports subject browsing, previous-question review, topic analysis, predictions, suggestions, answer generation, exports, feedback, donation/support information, and admin data workflows without assuming a single university or campus.

## Features

- Learner login and registration
- Optional institution metadata during registration and admin creation
- Admin login and protected admin routes
- Subject/course search by code or name
- Published question viewing by subject
- Topic analysis with repeated topics, marks, and appeared years
- Prediction result view for likely important topics or questions
- Suggested questions based on subject and query
- PDF and JSON export for suggestions
- Answer generation workflow
- Feedback, support/donation, and analytics screens when the backend enables them
- Responsive UI for mobile, tablet, and desktop

## Institution Fields

Registration and admin creation can send these optional fields:

- `institution_id`
- `institution_name`
- `department`
- `program`
- `batch_session`

For backward compatibility, the frontend also sends `university_name` with the same value as `institution_name` when an institution name is provided.

## Tech Stack

- React
- Tailwind CSS
- Vite
- React Router
- Axios
- Fetch API

## Folder Structure

```text
frontend/
  public/                 Static assets
  src/
    api/                  API clients and endpoint helpers
    assets/               Frontend image and media assets
    components/           Shared UI and layout components
      ui/                 Reusable Button, Card, Badge, states, and containers
    context/              Authentication context and hooks
    pages/                Learner and public pages
      admin/              Admin dashboard and management pages
    routes/               Protected route wrappers
    utils/                Shared frontend helpers
    App.jsx               Route definitions and app shell
    main.jsx              React app entry point
    index.css             Tailwind and global styles
  index.html              Vite HTML entry
  vite.config.js          Vite configuration
  package.json            Scripts and dependencies
```

## Environment Variables

Create a local `.env` file in the frontend project root. Use placeholders only in shared documentation and do not commit real environment values.

```env
VITE_APP_NAME=FakiBuzz
VITE_API_BASE_URL=http://localhost:8000
```

Shared examples may also include:

```env
APP_NAME=FakiBuzz
NEXT_PUBLIC_APP_NAME=FakiBuzz
SITE_NAME=FakiBuzz
```

## Local Development

```bash
npm install
npm run dev
```

The Vite development server usually runs at:

```text
http://localhost:5173
```

## Build

```bash
npm run build
```

## Preview

```bash
npm run preview
```

## API Configuration

Configure the backend base URL with `VITE_API_BASE_URL`. Avoid hardcoding backend URLs in components or pages. API calls should go through the shared helpers in `src/api/` whenever possible.

## Security Notes

- Never commit `.env` files.
- Never expose API keys, JWT secrets, database credentials, or production credentials in frontend code.
- Never store real admin credentials in the repository.
- Use `.env.example` for placeholder values only.
- Keep secrets on the backend or in a secure deployment environment.

## Development Guidelines

- Keep components reusable and easy to compose.
- Keep UI responsive across mobile, tablet, and desktop screens.
- Avoid hardcoded backend URLs.
- Use loading, error, and empty states for API-driven pages.
- Keep API endpoint names consistent with the backend.
- Prefer small, focused components over duplicated JSX.
- Test important learner and admin flows before submitting changes.
