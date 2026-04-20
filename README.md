# After Dark Tales

## Deploy notes

1. Add your app icon as `public/icon_512x512.png`
2. In Vercel, add environment variable:
   - `OPENAI_API_KEY`
3. Install dependencies:
   - `npm install`
4. Run locally:
   - `npm run dev`
5. Deploy to Vercel.

## Included routes

- `/` main app
- `/privacy` privacy policy
- `/api/generate-story` story generation endpoint

## Notes

- Payment buttons are placeholders and need to be wired to your billing flow.
- The in-memory violation tracker resets on redeploy or server restart.
