# Attempt Module

The Attempt module handles lesson attempts and exercise submissions, tracking student progress through lessons.

## Features

- Start and complete lesson attempts
- Submit individual exercise answers
- Track pronunciation scores for pronunciation exercises
- Calculate attempt statistics (score, accuracy, correct/incorrect counts)
- Award XP based on performance
- View attempt history and best attempts

## API Endpoints

### Start Attempt
```
POST /attempts
```
Start a new lesson attempt.

**Body:**
```json
{
  "lessonId": 1
}
```

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "lessonId": 1,
  "totalScore": 0,
  "maxScore": 100,
  "accuracyPct": 0,
  "correctCount": 0,
  "incorrectCount": 0,
  "skipCount": 0,
  "attemptNumber": 1,
  "isCompleted": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Submit Exercise
```
POST /attempts/:id/submit
```
Submit an answer for an exercise within an attempt.

**Body:**
```json
{
  "exerciseId": 1,
  "isCorrect": true,
  "selectedOptionId": 2,
  "timeSec": 15,
  "points": 10,
  "pronunciation": {
    "accuracy": 0.95,
    "fluency": 0.90,
    "completeness": 0.98,
    "prosody": 0.88,
    "overall": 0.93,
    "audioUrl": "https://..."
  }
}
```

### Complete Attempt
```
PATCH /attempts/:id/complete
```
Complete an attempt and calculate final statistics.

**Body:**
```json
{
  "durationSec": 300
}
```

### Get Attempt
```
GET /attempts/:id
```
Get a specific attempt with all details.

### Get Attempts
```
GET /attempts?lessonId=1&userId=1&page=1&limit=10
```
Get attempts with pagination and filters.

### Get Best Attempt
```
GET /attempts/lesson/:lessonId/best
```
Get user's best attempt for a specific lesson.

### Get Attempt History
```
GET /attempts/lesson/:lessonId/history
```
Get all user's attempts for a specific lesson.

## Service Methods

### `startAttempt(userId, createAttemptDto)`
Creates a new attempt for a lesson.

### `submitExercise(attemptId, submitExerciseDto)`
Records an exercise submission and updates attempt statistics.

### `completeAttempt(attemptId, completeAttemptDto)`
Marks an attempt as completed and calculates final statistics.

### `getAttemptById(attemptId)`
Retrieves an attempt with all exercise details.

### `getAttempts(query)`
Retrieves paginated attempts with optional filters.

### `getBestAttempt(userId, lessonId)`
Gets the user's highest-scoring completed attempt for a lesson.

### `getUserLessonAttempts(userId, lessonId)`
Gets all attempts by a user for a specific lesson.

## Statistics Calculation

The module automatically calculates:
- **totalScore**: Sum of points earned
- **maxScore**: Maximum possible points
- **accuracyPct**: Percentage of correct answers
- **correctCount**: Number of correct exercises
- **incorrectCount**: Number of incorrect exercises
- **skipCount**: Number of skipped exercises

## Notes

- XP awarding is handled separately by the application logic
- Attempt statistics are recalculated automatically after each exercise submission

