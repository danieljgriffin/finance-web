# Finance Web

A modern Next.js frontend for the WealthTracker stack.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+
- `finance-api` running locally on port 8000 (default)

### Installation

1.  Navigate to the directory:
    ```bash
    cd finance-web
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure environment:
    - Copy `.env.example` to `.env.local` (if provided) or create `.env.local`:
    ```env
    NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
    ```
    *(Note: Default is set to localhost:8000 in code fallback)*

### Running Locally

1.  Start the **backend** (finance-api):
    ```bash
    cd ../finance-api
    uvicorn app.main:app --reload
    ```

2.  Start the **frontend**:
    ```bash
    npm run dev
    ```

3.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `app/`: App Router pages and layouts.
  - `page.tsx`: Dashboard
  - `investments/`: Investment manager
  - `tracker/`: Monthly/Yearly tracker
  - `goals/`: Goals management
- `components/`: Shared React components.
  - `dashboard/`: Dashboard-specific widgets (Charts, Stats).
  - `investments/`: Investment-specific components.
  - `Navbar.tsx`: Main navigation.
- `lib/`: Utilities and API clients.
  - `apiClient.ts`: Typed fetch wrapper for finance-api.

## Auth Note
Currently, the app assumes a simplified auth flow. The `apiClient.ts` checks for an `access_token` in `localStorage`, but for local dev with no auth enforced on GET endpoints (if user_id is stubbed/mocked), it should work out of the box. If the API requires auth, you will need to manually set `localStorage.setItem('access_token', 'YOUR_TOKEN')` or implement the login page.
