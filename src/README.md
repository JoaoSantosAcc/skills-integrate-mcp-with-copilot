# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Sign up for activities in teacher mode
- Unregister students in teacher mode

## Getting Started

1. Configure the teacher credentials in the environment where the API will run:

   ```
   export TEACHER_USERNAME="teacher"
   export TEACHER_PASSWORD="use-a-unique-secret"
   ```

   Do not commit credentials to the repository. Set these values through your deployment's secret-management system in production.

2. From the repository root, install the dependencies with `pip install -r requirements.txt` and start the API with `uvicorn app:app --app-dir src --reload`.

3. Open your browser and go to:
   - Activities page: http://localhost:8000
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                                          | Description                                                        |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| GET    | `/activities`                                                     | Publicly view activities and their current participants            |
| POST   | `/auth/login`                                                     | Validate teacher credentials using HTTP Basic authentication       |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Teacher-only: sign up a student                                     |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Teacher-only: unregister a student                                |

The browser sends teacher credentials only for the current page session; signing out clears them. HTTP Basic authentication must be used over HTTPS outside local development.

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

All data is stored in memory, which means data will be reset when the server restarts.
