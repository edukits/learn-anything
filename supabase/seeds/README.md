# Supabase Seeds

Seeds are loaded by local Supabase database resets because `supabase/config.toml`
points `[db.seed].sql_paths` at this directory. Normal migration pushes do not
apply these files to cloud databases.

Do not put production or staging data here. These files are for local developer
fixtures that should not become migration history. Do not run these files
manually against staging or production, and do not use linked database reset
commands with seeds enabled.

## Local Content Admin

`001_local_content_admin.sql` guarantees a local content admin account exists:

- Email: `admin@example.com`
- Role: `owner`
- Sign-in: use the app's magic-link flow, then open the email in local Inbucket.

The seed creates the Supabase Auth user, the matching auth identity, the profile
row, and the `public.content_admin_users` row after every local database reset.
