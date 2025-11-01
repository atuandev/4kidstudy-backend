# Learning Progress Module

Module này quản lý tiến trình học tập của người dùng cho flashcards và sentences.

## Tính năng

- Theo dõi tiến trình học tập của từng flashcard/sentence
- Đếm số lần ôn tập (review count)
- Đánh dấu nội dung đã thành thạo (mastered)
- Thống kê chi tiết về tiến trình học tập

## API Endpoints

### 1. Get or Create Learning Progress
**POST** `/learning-progress`

Tạo hoặc lấy tiến trình học tập cho một nội dung cụ thể.

**Request Body:**
```json
{
  "contentType": "FLASHCARD" | "SENTENCE",
  "flashcardId": 1, // Bắt buộc nếu contentType = FLASHCARD
  "sentenceId": 1   // Bắt buộc nếu contentType = SENTENCE
}
```

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "reviewCount": 0,
  "isMastered": false,
  "lastReviewedAt": null,
  "contentType": "FLASHCARD",
  "flashcardId": 1,
  "sentenceId": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "flashcard": {
    "id": 1,
    "term": "Hello",
    "meaningVi": "Xin chào",
    "imageUrl": "...",
    "audioUrl": "..."
  }
}
```

### 2. Review Content
**POST** `/learning-progress/review`

Ghi nhận một lần ôn tập (tăng review count).

**Request Body:**
```json
{
  "contentType": "FLASHCARD" | "SENTENCE",
  "flashcardId": 1,
  "sentenceId": null,
  "isMastered": true // Optional: đánh dấu đã thành thạo
}
```

**Response:** Giống như Get or Create

### 3. Get User Statistics
**GET** `/learning-progress/stats`

Lấy thống kê tổng quan về tiến trình học tập.

**Response:**
```json
{
  "totalReviewed": 50,
  "totalMastered": 20,
  "masteryRate": 40.0,
  "flashcardStats": {
    "total": 30,
    "mastered": 12,
    "inProgress": 18
  },
  "sentenceStats": {
    "total": 20,
    "mastered": 8,
    "inProgress": 12
  }
}
```

### 4. Get User Progress (Paginated)
**GET** `/learning-progress?page=1&limit=10&contentType=FLASHCARD&isMastered=false`

Lấy danh sách tiến trình học tập của người dùng.

**Query Parameters:**
- `page`: Số trang (mặc định: 1)
- `limit`: Số items mỗi trang (mặc định: 10)
- `contentType`: Lọc theo loại nội dung (FLASHCARD | SENTENCE)
- `flashcardId`: Lọc theo flashcard ID
- `sentenceId`: Lọc theo sentence ID
- `isMastered`: Lọc theo trạng thái thành thạo (true | false)

**Response:**
```json
{
  "data": [...],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

### 5. Get Progress by ID
**GET** `/learning-progress/:id`

Lấy chi tiết tiến trình học tập theo ID.

### 6. Update Progress
**PATCH** `/learning-progress/:id`

Cập nhật tiến trình học tập.

**Request Body:**
```json
{
  "reviewCount": 5,
  "isMastered": true,
  "lastReviewedAt": "2024-01-01T00:00:00.000Z"
}
```

### 7. Delete Progress
**DELETE** `/learning-progress/:id`

Xóa tiến trình học tập.

**Response:**
```json
{
  "message": "Learning progress deleted successfully"
}
```

## Database Schema

```prisma
model LearningProgress {
  id             Int                 @id @default(autoincrement())
  reviewCount    Int                 @default(0)
  isMastered     Boolean             @default(false)
  lastReviewedAt DateTime?
  contentType    LearningContentType

  userId      Int
  user        User       @relation(...)
  flashcardId Int?
  flashcard   Flashcard? @relation(...)
  sentenceId  Int?
  sentence    Sentence?  @relation(...)

  @@unique([userId, contentType, flashcardId])
  @@unique([userId, contentType, sentenceId])
}

enum LearningContentType {
  FLASHCARD
  SENTENCE
}
```

## Use Cases

1. **Học flashcard mới**: POST `/learning-progress` để tạo record mới
2. **Ôn tập flashcard**: POST `/learning-progress/review` để tăng reviewCount
3. **Đánh dấu đã thuộc**: POST `/learning-progress/review` với `isMastered: true`
4. **Xem tiến trình**: GET `/learning-progress` để xem danh sách đã học
5. **Xem thống kê**: GET `/learning-progress/stats` để xem overview
