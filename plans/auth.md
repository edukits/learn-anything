# Authentication

Handled by Supabase Auth. The first milestone uses email magic links and includes real protected routes plus Row Level Security policies for user-owned data.

## First milestone

- Email magic-link sign-in.
- Auth callback route that exchanges the Supabase code for a session.
- Server-side session access in SvelteKit load functions and actions.
- Public routes for landing and discovery pages.
- Protected routes for the app shell, lessons, quizzes, attempts, progress, streaks, XP, and account state.
- Logout flow.
- Basic account/profile row creation after first sign-in.
- RLS policies that prevent users from reading or modifying another user's private progress or attempt data.

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
- spaced repetition state
- user settings and profile data

## RLS rule

User-owned tables must include a `user_id` column referencing the authenticated Supabase user. RLS policies should ensure users can read only their own private rows.

Writes need stricter per-table rules. Quiz attempts, attempt answers, progress, streaks, and XP are derived or historical data, so the client should not be allowed to arbitrarily insert, update, or delete them. For v1, attempt and progress writes should go through SvelteKit server actions or API routes. Server-side code should validate the authenticated user, verify the quiz and answers belong to the latest published content, compute the score, and update progress.

Content tables are read-only to normal authenticated users. Content import and publishing should use a service role or controlled admin path, not client-side writes.

## Open decisions

- Whether to support OAuth providers after magic links.
- Whether public preview content should include complete lesson bodies or only summaries.
- Whether anonymous practice is useful later. The first milestone does not support it.
