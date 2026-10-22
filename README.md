# Content Studio

Content Studio is a static dashboard with Vercel serverless API routes and private Vercel Blob storage. Once deployed and configured, the same workspace can be opened from different computers using the deployment URL and workspace password.

## Deploy and configure

1. Import this folder into a Vercel project and deploy it. Vercel serves `index.html` and builds the handlers in `api/` as Node.js Functions.
2. In the Vercel project, open **Storage**, create a **private Blob store**, and connect it to the project for the environments you use. This provides the `BLOB_READ_WRITE_TOKEN` environment variable used by the server routes.
3. Add these project environment variables for each deployment environment:
   - `TASKSME_PASSWORD` — the password everyone using this shared workspace will enter.
   - `TASKSME_SESSION_SECRET` — a long, random secret used to sign login sessions. Keep it private.
4. Redeploy after connecting storage and setting the environment variables.
5. Open the deployment URL and sign in with `TASKSME_PASSWORD`.

The Blob store is private. Its read/write token stays in Vercel environment variables and is used only by the server routes. The app saves the task board, editor list, projects, activity history, and studio name together in one JSON blob.

## Move the current local data to the cloud

Browser storage for `file://` and the Vercel URL is separate. Before switching, open the current local app and click **Export backup** in the bottom-left footer. After deploying, sign in and click **Import backup**, then select the downloaded `content-studio-backup.json`. This uploads the existing tasks, editors, projects, activity history, and studio name to cloud storage. Subsequent visits from any computer use that shared data.

Each task has a trash button. Deleting a task asks for confirmation, removes it from the board, and saves that change to the shared workspace.

The ellipsis menus on the Dashboard provide project navigation, CSV export, activity history, and activity clearing actions. Clearing activity removes that history from the shared workspace.

## Storage behavior

The browser loads the shared workspace when opened and writes changes to the shared store. If two people edit at once, the most recently saved full workspace replaces the prior version; this app does not currently merge simultaneous edits or refresh other open browsers in real time. Use **Export backup** periodically to keep a downloadable copy.
