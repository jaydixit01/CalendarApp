# Law Bandit Internship Application Project

This is a project for the Law Bandit Software Engineering Internship. The application seamlessly parses a class syllabus and turns it into actionable tasks, increasing productivity. Additionally, it features a Google Calendar integration via OAuth2.

## Set Up Instructions

### Prerequisites
• Node.js (v18 or newer recommended)
• npm or another package manager (pnpm, yarn)

### Clone the Repo
```
git clone <your-repo-url>
cd <your-project-folder>
```

### Install Dependencies
```
npm install
```

### Run Server
```
npm run dev
```
Application will be available at: http://localhost:5173

## Explanation of Approach

### 1. Document Parsing
- A syllabus can be uploaded.
- The file is parsed, and assignment, reading, and exam dates are extracted into structured event data.
- The extracted tasks are available to be viewed in month view and also in a list view.

### 2. Temporary Storage
- Uploaded files are not permanently saved.
- Once parsing is complete, the original document is discarded, ensuring privacy.

### 3. Calendar Export
- Users can export parsed tasks to their Google Calendar using the Google OAuth2 process.
- No sensitive account information or calendar details are stored in the application.

## Key Features & Other Important Points

1. Upload any syllabus to automatically generate calendar events.
2. Uploaded documents are only used for parsing and discarded immediately afterward.
3. Click "Export to Google" to temporarily connect your Google Account.
4. During export, Google will display a message that the app is unverified — click Continue to proceed.
5. After OAuth2 authentication, events are exported directly to your Google Calendar.
6. No Google Account credentials or calendar details are stored by this application.