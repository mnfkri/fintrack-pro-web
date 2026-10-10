# FinTrack Pro Media Manager setup

This branch adds a Media Manager page to the GitHub Pages website. GitHub Pages is static hosting, so image uploads require external storage such as Supabase Storage.

## Configure uploads
1. Create a Supabase project and a Storage bucket named `fintrack-media`. Set it to **public** if uploaded images should be publicly viewable.
2. Enable Email/Password authentication and create an admin user manually. Disable public signups.
3. In `index.html`, replace `https://YOUR_PROJECT_ID.supabase.co` and `YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY` with your Supabase Project URL and public anon/publishable key. Never put a `service_role` key in frontend code.
4. Run this SQL in Supabase SQL Editor:

```sql
create policy "Authenticated users can list FinTrack media"
on storage.objects for select to authenticated
using (bucket_id = 'fintrack-media');

create policy "Authenticated users can upload FinTrack media"
on storage.objects for insert to authenticated
with check (bucket_id = 'fintrack-media');

create policy "Authenticated users can delete FinTrack media"
on storage.objects for delete to authenticated
using (bucket_id = 'fintrack-media');
```

5. After merging this branch into `main` and configuring Supabase, open `https://fintrack.digital/#media` and sign in using the admin account.
6. The gallery shows uploaded files and lets you copy each public URL. Uploading does not automatically replace a homepage image; update the corresponding HTML image `src` if you want to display it on the homepage.

## Existing website images
The HTML references these asset paths:
- `assets/icon.png`
- `assets/ss-dashboard.png`
- `assets/ss-ai.png`
- `assets/emtitra.jpg`

The repository root currently does not contain an `assets/` directory. Add the real image files to an `assets/` folder beside `index.html`, preserving exact filenames and capitalization, otherwise those image references will return 404.

## Security notes
A public bucket means uploaded images are publicly readable. Do not upload private or sensitive files. The anon/publishable key is designed for frontend use; never expose the `service_role` key. Access to list/upload/delete should be restricted through the policies above and authentication.
