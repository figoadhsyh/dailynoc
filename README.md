# NOC VAULT CONTROL

Dashboard prototype for NOC PT BALI TOWER. Next.js app, designed for deployment to Vercel.

## What is included
- Responsive operations dashboard inspired by the supplied NMT Smart AI reference.
- Sidebar navigation for all core workbook tabs.
- Search, basic status filter, pagination, sample table rows and interactive daily checklist.
- Add-data modal for Update Template, Log Swab Modem, and Log Pergantian Modem (also available on other data pages).
- Optional Google Apps Script endpoint integration for POST create actions.
- Starter Apps Script API in `apps-script/Code.gs`.

## Run locally
Requirements: Node.js 18.17+.

```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Deploy to Vercel
1. Extract this ZIP and push the `noc-vault-control` folder to a GitHub repository.
2. In Vercel choose **Add New → Project**, import the repository.
3. Framework preset: Next.js. Build command `npm run build`, output defaults.
4. Deploy. No environment variables are needed for preview mode.

## Data mode
The project currently includes **sample rows** from the workbook in `public/sample-data.json` (up to 40 rows per tab, template up to 100). It does not expose the complete 3.8 MB workbook to the browser. Counts and some dashboard cards are reference values from the example dashboard and should be validated against the live source.

## Connect Google Sheets
1. Upload/convert the workbook to Google Sheets.
2. Open **Extensions → Apps Script**, copy `apps-script/Code.gs`, and replace `PASTE_GOOGLE_SPREADSHEET_ID_HERE`.
3. Deploy as a Web App. Configure access according to your organization's security requirements.
4. Copy the Web App URL into Vercel Project → Settings → Environment Variables as:
   `NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/.../exec`
5. Redeploy Vercel.

### Important integration notes
- The UI will POST `{ action: "create", sheet: "LOG_SWAB_MODEM", row: {...} }` or the corresponding sheet name.
- The Apps Script currently supports create/append and a simple list endpoint. The frontend sample data is not automatically replaced with full live data yet; implement authenticated live loading and schema-specific validation before operational use.
- Browser calls to Apps Script may be blocked by CORS or organizational policy depending on deployment. Test the deployed endpoint. For a robust production setup, use a protected server-side Next.js Route Handler / database rather than public write access.
- Do not publish sensitive CAC values, access credentials, or user information to an unauthenticated web app. Review `USER_ACCESS` and company access rules before go-live.
- AppSheet and the website can share the same Google Sheet data source, but configure AppSheet table permissions and keys carefully. Use stable unique IDs rather than row numbers for editable production records.

## Workbook sheets represented
`SITE_MASTER`, `VENDOR_MASTER`, `SITE_REGULER_DOWN`, `HUB_MASTER`, `CAC_DATABASE`, `RCA_DATABASE`, `UPDATE_TEMPLATE`, `LOG_SWAB_MODEM`, `LOG_PERGANTIAN_MODEM`, `DAILY_CHECKLIST`, `EDDUCATION_ASSET`, `USER_ACCESS`.
