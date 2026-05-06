# FakiBuzz! ISTian - Frontend

A modern web application for managing, analyzing, and predicting exam questions. FakiBuzz! ISTian helps educators and students organize exam data, analyze question patterns, and generate insights about academic content.

## Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Installation & Setup](#installation--setup)
- [User Manual](#user-manual)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [API Integration](#api-integration)

---

## Project Overview

FakiBuzz! ISTian is an intelligent exam question management system designed to:

- **Upload & Organize**: Import exam data with questions, subjects, and metadata
- **Analyze**: Break down questions by topics and difficulty levels
- **Search**: Find similar questions based on content
- **Predict**: Get predictions about question patterns and topic frequency
- **Generate**: Automatically generate answers based on question content

This is the frontend application built with React and Vite, communicating with a backend API (running on localhost:8000).

---

## Technology Stack

- **React** (19.2.5) - UI library with hooks
- **Vite** (8.0.10) - Fast build tool and dev server
- **Tailwind CSS** (4.2.4) - Utility-first CSS framework
- **React Router** (7.14.2) - Client-side routing
- **Axios** (1.16.0) - HTTP client for API calls
- **ESLint** - Code quality and linting

---

## Project Architecture

### Directory Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── api.js                 # API endpoints configuration
│   ├── components/
│   │   └── Navbar.jsx             # Main navigation component
│   ├── pages/
│   │   ├── UploadPage.jsx         # Exam upload interface
│   │   ├── QuestionsPage.jsx      # Question listing and filtering
│   │   ├── SimilarQuestionsPage.jsx # Similar question search
│   │   ├── TopicsPage.jsx         # Topic analysis view
│   │   ├── PredictionsPage.jsx    # Question predictions
│   │   └── GenerateAnswerPage.jsx # Answer generation
│   ├── hooks/                     # Custom React hooks
│   ├── utils/                     # Utility functions
│   ├── assets/                    # Static assets
│   ├── App.jsx                    # Main app component with routing
│   ├── App.css                    # App-level styles
│   ├── main.jsx                   # Application entry point
│   └── index.css                  # Global styles
├── public/                        # Static files served as-is
├── index.html                     # HTML template
├── vite.config.js                 # Vite configuration
├── eslint.config.js               # ESLint rules
└── package.json                   # Dependencies and scripts
```

### Component Architecture

```
App (Main Router)
└── Navbar
    ├── UploadPage (/)
    ├── QuestionsPage (/questions)
    ├── SimilarQuestionsPage (/search)
    ├── TopicsPage (/analysis)
    ├── PredictionsPage (/predict)
    └── GenerateAnswerPage (/answers)
```

### Data Flow

1. **Upload Flow**: User submits exam data → API stores data → Confirmation
2. **Query Flow**: Page requests data → API processes query → Display results
3. **Analysis Flow**: User selects subject → API analyzes topics → Visual display

### API Layer

- **Location**: `src/api/api.js`
- **Base URL**: `http://localhost:8000`
- **Timeout**: 30 seconds
- **Method**: Axios for HTTP requests

**Available Endpoints**:
- `GET /health` - Server health check
- `POST /exams` - Submit exam data
- `GET /subjects` - List all subjects
- `GET /questions` - Get all questions
- `GET /questions/{subjectCode}` - Get questions by subject
- `POST /search` - Search similar questions
- `GET /analysis/{subjectCode}` - Analyze topics in subject
- `GET /predict/{subjectCode}` - Get predictions for subject
- `POST /answers/generate` - Generate answers

---

## Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Backend server running on localhost:8000

### Steps

1. **Clone and navigate to frontend directory**:
   ```bash
   cd "e:\sazzad\Projects\FakiBuzz! ISTian\frontend"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Ensure backend is running** on `http://localhost:8000`

4. **Start development server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

5. **Build for production**:
   ```bash
   npm run build
   ```

6. **Preview production build**:
   ```bash
   npm run preview
   ```

---

## User Manual

### Getting Started

1. **Open the application** in your web browser (typically `http://localhost:5173`)
2. You'll see the **Navbar** at the top with links to different features
3. The application checks the backend health on startup

### Features & How to Use

#### 1. Upload Exam (Home Page)

**Location**: `/` or `/subjects`

**What it does**:
- Create and submit new exam records with questions
- Define exam metadata: name, year, subject, duration, and total marks

**How to use**:
1. Click **"Upload"** in the navbar
2. Fill in exam details:
   - Exam Name (e.g., "Final Examination")
   - Exam Year (auto-filled with current year)
   - Subject Name and Code
   - Duration and Total Marks
3. Add questions one by one:
   - Question Number
   - Question Text
   - Marks (point value)
   - Topic (what it covers)
4. Click **"Submit"** to upload to the system
5. A confirmation message will appear on success

**Tips**:
- You can see the progress of question completion before submitting
- Click "Add Question" to add more questions
- Server health status is displayed (Online/Offline/Degraded)

#### 2. View Questions

**Location**: `/questions`

**What it does**:
- Browse all uploaded questions in the system
- Filter questions by subject

**How to use**:
1. Click **"Questions"** in the navbar
2. Select a subject from the dropdown to filter
3. View the list of questions with details
4. Each question shows: Question Text, Subject, Marks, and Topic

**Tips**:
- The page auto-loads available subjects and questions
- Use the subject dropdown to quickly find questions from a specific subject
- Questions are organized for easy reference

#### 3. Search Similar Questions

**Location**: `/search`

**What it does**:
- Find questions similar to a specific question
- Uses content analysis to match related questions

**How to use**:
1. Click **"Search"** in the navbar
2. Enter search criteria (question text or keywords)
3. View the matched similar questions
4. Review the similarity score and relevance

**Tips**:
- More specific search terms yield better results
- Results are ranked by relevance
- Useful for identifying duplicate or related questions

#### 4. Topic Analysis

**Location**: `/analysis`

**What it does**:
- Analyze the distribution of topics across questions in a subject
- See which topics appear most frequently
- Understand the exam's topic coverage

**How to use**:
1. Click **"Analysis"** in the navbar
2. Select a subject to analyze
3. View the topic breakdown with statistics
4. See how many questions cover each topic

**Tips**:
- Use this to understand exam structure
- Identify topics with high/low coverage
- Plan revision based on topic frequency

#### 5. Predictions

**Location**: `/predict`

**What it does**:
- Get AI-powered predictions about question patterns
- Forecast likely topics for future exams
- Analyze trends in question distribution

**How to use**:
1. Click **"Predictions"** in the navbar
2. Select a subject
3. Review the predicted topics and patterns
4. Use insights for exam planning

**Tips**:
- Predictions are based on historical data
- Helpful for estimating which topics might appear in future exams
- Use with analysis data for better insights

#### 6. Generate Answers

**Location**: `/answers`

**What it does**:
- Automatically generate answers to questions
- Provides quick reference answers based on question content

**How to use**:
1. Click **"Generate Answers"** in the navbar
2. Select or input a question
3. Click **"Generate"**
4. View the generated answer

**Tips**:
- Generated answers are AI-based suggestions
- Review and validate answers for accuracy
- Use as a starting point, not final answers

### Navigation

The **Navbar** at the top provides quick access to all features:

- **Upload** - Add new exams
- **Questions** - View and filter questions
- **Search** - Find similar questions
- **Analysis** - Analyze topics
- **Predictions** - View predictions
- **Answers** - Generate answers

Each navbar link is active and shows the current page.

### Status Indicators

- **Online** (green) - Backend is running normally
- **Degraded** (yellow) - Backend has reduced functionality
- **Offline** (red) - Backend is not accessible

### Error Handling

If you encounter errors:

1. **"Unable to load..."** - Check if backend is running
2. **Connection timeout** - Verify `localhost:8000` is accessible
3. **Empty data** - Ensure data has been uploaded first

### Tips & Best Practices

1. **Upload data first** - Use the Upload page to add exam questions
2. **Verify backend** - Ensure the backend server is running before using the app
3. **Use filters** - Take advantage of subject filtering for better organization
4. **Analyze trends** - Use Analysis and Predictions together for insights
5. **Validate generated content** - Always review AI-generated answers

---

## Available Scripts

In the project directory, you can run:

### `npm run dev`
Runs the app in development mode with hot module replacement (HMR).  
Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

### `npm run build`
Builds the app for production to the `dist/` folder.  
The build is optimized for the best performance.

### `npm run preview`
Preview the production build locally (requires `npm run build` first).

### `npm run lint`
Runs ESLint to check code quality and style.

---

## API Integration

### Configuration

The API is configured in `src/api/api.js`:

```javascript
const API = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 30000,
});
```

### Making API Calls

In your components, import and use the API:

```javascript
import { apiEndpoints } from "../api/api";

// Example: Get subjects
const response = await apiEndpoints.getSubjects();
```

### Common Patterns

**Loading with error handling**:
```javascript
const [loading, setLoading] = useState(true);
const [message, setMessage] = useState("");

useEffect(() => {
  apiEndpoints.getQuestions()
    .then(response => {
      setQuestions(response.data?.questions || []);
    })
    .catch(error => {
      setMessage("Unable to load questions");
    })
    .finally(() => setLoading(false));
}, []);
```

---

## Development Guide

### Code Style

- Follow ESLint configuration in `eslint.config.js`
- Run `npm run lint` to check code quality
- Use functional components with React hooks

### Styling

- Use Tailwind CSS utility classes in JSX
- Global styles in `src/index.css`
- Component-specific styles in `src/App.css`

### Adding New Features

1. Create new page in `src/pages/`
2. Add route in `App.jsx`
3. Add navbar link in `src/components/Navbar.jsx`
4. Update API endpoints in `src/api/api.js` if needed

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend connection error | Verify backend is running on localhost:8000 |
| No data displayed | Upload exam data through Upload page first |
| Slow performance | Check backend response time, may indicate processing |
| Styling issues | Clear browser cache and rebuild with `npm run build` |
| HMR not working | Restart dev server with `npm run dev` |

---

## License

This project is part of the FakiBuzz! ISTian suite.

## Support

For issues or questions, check the backend logs and ensure both frontend and backend servers are properly configured and running.
