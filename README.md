# IntelliCourse

IntelliCourse is a full-stack learning management system with course creation, media uploads, course enrollment, lesson playback, progress tracking, AI lesson helpers, and separate learner and creator experiences.

## Project Structure

```text
IntelliCourse/
├── backend/          # Express API, MongoDB models, auth, media, payments, AI routes
├── backend/client/   # React + Vite web client
├── mobile/           # Expo React Native mobile app
├── reports/          # Project report assets and generated documentation
├── package.json      # Root convenience scripts
└── README.md
```

## Features

- JWT authentication with student, instructor, and admin roles
- Course creation, editing, deletion, and creator-only media management
- Presigned S3 uploads for lecture videos and course thumbnails
- Secure lesson playback for enrolled learners and course creators
- Course enrollment and Razorpay payment workflow
- Progress tracking per lecture
- AI summary, Q&A, quiz, and recommendation flows
- React web dashboard for learners and course creators
- Expo mobile app with themed learner and creator tabs

## Tech Stack

- Backend: Node.js, Express, MongoDB, Mongoose
- Web: React, Vite, Axios, Lucide React
- Mobile: Expo, React Native, Expo Router, Zustand
- Media: AWS S3 presigned upload and playback URLs
- Payments: Razorpay integration

## Prerequisites

- Node.js 18+
- npm
- MongoDB connection string
- AWS S3 bucket credentials for media upload flows
- Razorpay keys for payment flows

## Setup

Install root tooling:

```bash
npm install
```

Install backend dependencies:

```bash
cd backend
npm install
cp env.example .env
```

Install web client dependencies:

```bash
cd backend/client
npm install
```

Install mobile dependencies:

```bash
cd mobile
npm install
```

## Environment

Create `backend/.env` from `backend/env.example` and fill in the required values:

```env
PORT=8001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=your_aws_region
AWS_S3_BUCKET_NAME=your_s3_bucket
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

## Run Locally

Start the backend API:

```bash
cd backend
npm run start
```

Start the web client:

```bash
cd backend/client
npm run dev
```

Start the mobile app:

```bash
cd mobile
npm run start
```

Or start backend and mobile from the root:

```bash
npm run dev
```

## Validation

Mobile lint:

```bash
cd mobile
npm run lint
```

Web build:

```bash
cd backend/client
npm run build
```

Backend syntax checks can be run with Node:

```bash
node --check backend/controllers/course.controller.js
node --check backend/controllers/media.controller.js
```

## Notes

- Dependency folders, local environment files, build output, uploads, and generated native folders are intentionally ignored.
- Only the user who created a course can edit it, delete it, upload thumbnails, upload videos, or confirm media uploads.
