# Authentication

Handled by Supabase Auth. V1 uses email magic links, protected routes, and Row Level Security policies for user-owned data. V2 should keep that foundation and prepare auth for public discovery, hosted environments, and a larger set of protected learner activity tables.

## Current baseline

- Email magic-link sign-in.
- Auth callback route that exchanges the Supabase code for a session.
- Server-side session access in SvelteKit load functions and actions.
- Public routes for landing pages.
- Protected routes for the app shell, lessons, quizzes, attempts, progress, and account state.
- Logout flow.
- Basic account/profile row creation after first sign-in.
- RLS policies that prevent users from reading or modifying another user's private progress or attempt data.

## V2 additions

- Hosted staging and production auth callback URLs.
- Public discovery and topic preview routes that work for signed-out users.
- Protected learner activity routes for XP, streaks, daily goals, review sessions, and activity history.
- Account/profile settings needed for learner-facing preferences, starting with daily goal.
- RLS policies for new user-owned v2 tables.
- Server-side writes for derived activity data such as XP events, streak events, review sessions, and progress updates.

## Public vs protected access

Public:

- home and marketing/discovery pages
- subject/topic landing pages, such as English and Literary Devices
- future limited lesson/module previews

Protected:

- active learning paths
- full lesson progress
- quiz/practice sessions
- quiz attempts
- streaks
- XP events
- daily goal settings
- review sessions
- activity history
- spaced repetition state
- user settings and profile data

## RLS rule

User-owned tables must include a `user_id` column referencing the authenticated Supabase user. RLS policies should ensure users can read only their own private rows.

Writes need stricter per-table rules. Quiz attempts, attempt answers, progress, streaks, XP, review sessions, and activity history are derived or historical data, so the client should not be allowed to arbitrarily insert, update, or delete them. Attempt, progress, XP, streak, and review writes should go through SvelteKit server actions or API routes. Server-side code should validate the authenticated user, verify the content belongs to the latest published release, compute outcomes, and write derived records.

Content tables are read-only to normal authenticated users. Content import and publishing should use a service role or controlled admin path, not client-side writes.

## Open decisions

- Whether to support OAuth providers after magic links.
- Whether public preview content should include complete lesson bodies, partial lesson bodies, or only summaries.
- Whether anonymous practice is useful later. V2 does not include it unless explicitly reprioritized.
- Whether daily goal settings should live in profile data or a dedicated goal settings table.
