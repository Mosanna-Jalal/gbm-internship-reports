# GBM Internship Report Portal

Students of Gautam Buddha Mahila College, Gaya enter their university roll number (or registration
number) and download their internship report (Karuna Swayam Sevi Sansthan, 120 hours). Reports are
stored as PDFs in MongoDB.

## Setup

```bash
cp .env.example .env.local   # then fill in MONGODB_URI
npm install
npm run dev
```

| Variable | Value |
|---|---|
| `MONGODB_URI` | Atlas connection string |
| `MONGODB_DB` | `gbm-internship-reports` (collection `reports`) |

On Vercel, add both variables under Project → Settings → Environment Variables, and allow Vercel's
IPs in Atlas → Network Access (`0.0.0.0/0`, since Vercel has no fixed IPs).

## API

| Route | Returns |
|---|---|
| `GET /api/status` | Database health and report counts per domain |
| `GET /api/reports/:roll` | Student and file details for a university roll or registration number (no PDF) |
| `GET /api/reports/:roll/pdf` | The PDF (`?download=1` to save instead of view) |

Lookups are rate limited per IP (120 requests / 10 min per server instance). Responses carry a
`Server-Timing` header; the PDF route also sends `X-Content-SHA256`, which the page checks after download.

## Adding or updating reports

Reports are built and uploaded from `../generator`:

```bash
cd ../generator
node build.mjs --only <id>                                          # rebuild a PDF
node --env-file=../gbm-internship-reports/.env.local upload.mjs     # upload all (or --only <id>)
```

Each document holds the student's details, the PDF as binary data, its size, page count and SHA-256.
Unique indexes: `studentId_1`, `universityRoll_1`, `registrationNo_1`.

---

Designed & developed by [Mosanna Jalal](https://me-mj.vercel.app) · MJX Web Studio
