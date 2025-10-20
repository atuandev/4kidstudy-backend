# Hướng dẫn Import CSV cho Exercise và ExerciseOptions

## ⚠️ LƯU Ý QUAN TRỌNG

**ID trong file CSV chỉ dùng để matching giữa Exercise và ExerciseOptions, KHÔNG phải ID thực tế trong database!**

- Database sẽ **tự động tạo ID mới** (auto-increment)
- Hệ thống tự động **map CSV ID → Database ID**
- Cột `id` trong Exercise.csv: Chỉ để liên kết với ExerciseOptions
- Cột `exerciseId` trong ExerciseOptions.csv: Phải khớp với `id` trong Exercise.csv

## Quy trình Import

### Bước 1: Import Exercises
```
Exercise.csv (id=1) → Database creates Exercise (id=168)
Exercise.csv (id=2) → Database creates Exercise (id=169)

Mapping Table:
CSV ID 1 → DB ID 168
CSV ID 2 → DB ID 169
```

### Bước 2: Import Options
```
ExerciseOptions.csv (exerciseId=1) → Tìm trong mapping → Dùng DB ID 168
ExerciseOptions.csv (exerciseId=2) → Tìm trong mapping → Dùng DB ID 169
```

## Ví dụ cụ thể

### Exercise.csv
```csv
id,type,order,prompt,imageUrl,audioUrl,targetText,points,difficulty,hintEn,hintVi
1,SELECT_IMAGE,0,Look and match: 'Bike',\N,\N,\N,10,1,\N,\N
2,SELECT_IMAGE,1,Look and match: 'Book',\N,\N,\N,10,1,\N,\N
3,LISTENING,2,Listen and choose,\N,https://example.com/audio.mp3,Ball,10,1,\N,\N
```

**Giải thích:**
- `id=1,2,3`: ID tạm trong CSV (chỉ để match với options)
- Database sẽ tạo ID mới: ví dụ `168, 169, 170`

### ExerciseOptions.csv
```csv
exerciseId,text,imageUrl,audioUrl,isCorrect,order,matchKey
1,\N,https://example.com/bike.png,\N,TRUE,0,\N
1,\N,https://example.com/book.png,\N,FALSE,1,\N
2,Ball,\N,\N,TRUE,0,\N
2,Book,\N,\N,FALSE,1,\N
3,A,\N,\N,FALSE,0,\N
3,B,\N,\N,TRUE,1,\N
```

**Giải thích:**
- `exerciseId=1`: Tìm Exercise có CSV id=1 → Lấy DB id (168) → Tạo option với exerciseId=168
- `exerciseId=2`: Tìm Exercise có CSV id=2 → Lấy DB id (169) → Tạo option với exerciseId=169
- `exerciseId=3`: Tìm Exercise có CSV id=3 → Lấy DB id (170) → Tạo option với exerciseId=170

### Kết quả trong Database

**Exercise Table:**
```
id  | type          | order | prompt
----|---------------|-------|---------------------------
168 | SELECT_IMAGE  | 0     | Look and match: 'Bike'
169 | SELECT_IMAGE  | 1     | Look and match: 'Book'
170 | LISTENING     | 2     | Listen and choose
```

**ExerciseOption Table:**
```
id  | exerciseId | text  | imageUrl           | order | isCorrect
----|------------|-------|-------------------|-------|----------
500 | 168        | \N    | .../bike.png      | 0     | TRUE
501 | 168        | \N    | .../book.png      | 1     | FALSE
502 | 169        | Ball  | \N                | 0     | TRUE
503 | 169        | Book  | \N                | 1     | FALSE
504 | 170        | A     | \N                | 0     | FALSE
505 | 170        | B     | \N                | 1     | TRUE
```

## API Endpoint

**POST** `/exercises/import`

### Request

**Content-Type:** `multipart/form-data`

**Parameters:**
- `lessonId` (number, required): ID của lesson
- `exercisesFile` (file, optional): File CSV Exercise
- `optionsFile` (file, optional): File CSV Options

*Phải cung cấp ít nhất 1 file*

### Response Success

```json
{
  "success": true,
  "exercises": {
    "created": 9,
    "skipped": 0,
    "failed": 0,
    "errors": []
  },
  "options": {
    "created": 32,
    "skipped": 0,
    "failed": 0,
    "errors": []
  },
  "message": "Import completed. Exercises: 9 created, 0 skipped, 0 failed. Options: 32 created, 0 skipped, 0 failed."
}
```

## Cấu trúc CSV

### Exercise.csv

**Cột bắt buộc:**
- `id`: ID tạm (số nguyên) để match với ExerciseOptions
- `type`: Loại bài tập (SELECT_IMAGE, MULTIPLE_CHOICE, MATCHING, LISTENING, PRONUNCIATION)
- `order`: Thứ tự trong lesson (không trùng)

**Cột tùy chọn:**
- `prompt`: Câu hỏi
- `imageUrl`, `audioUrl`, `targetText`: URLs và nội dung
- `hintEn`, `hintVi`: Gợi ý
- `points`: Điểm (mặc định 10)
- `difficulty`: Độ khó 1-3 (mặc định 1)

**Các cột khác:** `createdAt`, `updatedAt` sẽ bị bỏ qua

### ExerciseOptions.csv

**Cột bắt buộc:**
- `exerciseId`: ID tạm từ Exercise.csv (phải khớp với cột `id` trong Exercise.csv)
- `order`: Thứ tự trong exercise (không trùng)
- `isCorrect`: TRUE/FALSE

**Cột tùy chọn:**
- `text`: Nội dung text
- `imageUrl`, `audioUrl`: URLs
- `matchKey`: Key ghép cặp (cho MATCHING type)

## Sử dụng với cURL

```bash
# Import cả 2 file cùng lúc
curl -X POST http://localhost:3000/exercises/import \
  -F "lessonId=11" \
  -F "exercisesFile=@Exercise.csv" \
  -F "optionsFile=@ExerciseOptions.csv"

# Chỉ import exercises
curl -X POST http://localhost:3000/exercises/import \
  -F "lessonId=11" \
  -F "exercisesFile=@Exercise.csv"

# Chỉ import options (cần có exercises đã tồn tại)
curl -X POST http://localhost:3000/exercises/import \
  -F "lessonId=11" \
  -F "optionsFile=@ExerciseOptions.csv"
```

## Sử dụng với Postman

1. Method: **POST**
2. URL: `http://localhost:3000/exercises/import`
3. Body → **form-data**
4. Thêm fields:
   - `lessonId`: Text, value: `11`
   - `exercisesFile`: File, chọn Exercise.csv
   - `optionsFile`: File, chọn ExerciseOptions.csv
5. Click **Send**

## Xử lý lỗi

### Lỗi phổ biến

**1. Options không tìm thấy Exercise:**
```json
{
  "errors": [
    "Exercise with CSV ID 5 not found in imported exercises. Option at order 0 skipped."
  ]
}
```
**Nguyên nhân:** `exerciseId` trong ExerciseOptions.csv không khớp với `id` nào trong Exercise.csv

**Giải pháp:** Kiểm tra lại cột `exerciseId` trong ExerciseOptions.csv phải khớp với cột `id` trong Exercise.csv

**2. Trùng order:**
```json
{
  "errors": [
    "Exercise with order 3 already exists in lesson 11"
  ]
}
```
**Nguyên nhân:** Đã có exercise với `order=3` trong lesson này

**Giải pháp:** Thay đổi giá trị `order` trong CSV hoặc xóa exercise cũ

**3. Type không hợp lệ:**
```json
{
  "errors": [
    "Exercise at order 2 has invalid type 'INVALID_TYPE'. Valid types: SELECT_IMAGE, MULTIPLE_CHOICE, MATCHING, LISTENING, PRONUNCIATION"
  ]
}
```

## Workflow khuyến nghị

### Option 1: Import cả 2 file cùng lúc (Khuyên dùng)

```bash
curl -X POST http://localhost:3000/exercises/import \
  -F "lessonId=11" \
  -F "exercisesFile=@Exercise.csv" \
  -F "optionsFile=@ExerciseOptions.csv"
```

**Ưu điểm:**
- Tự động map ID
- Đảm bảo tính toàn vẹn dữ liệu
- Nhanh chóng, 1 request duy nhất

### Option 2: Import từng file riêng

**Bước 1:** Import exercises
```bash
curl -X POST http://localhost:3000/exercises/import \
  -F "lessonId=11" \
  -F "exercisesFile=@Exercise.csv"
```

**Bước 2:** Lấy danh sách exercises vừa tạo
```bash
curl http://localhost:3000/exercises?lessonId=11
```

**Bước 3:** Cập nhật file ExerciseOptions.csv
- Thay `exerciseId` bằng ID thực tế từ database

**Bước 4:** Import options
```bash
curl -X POST http://localhost:3000/exercises/import \
  -F "lessonId=11" \
  -F "optionsFile=@ExerciseOptions.csv"
```

## Tips & Best Practices

1. **Luôn import cả 2 file cùng lúc** để tự động map ID
2. **Kiểm tra file CSV** trước khi import:
   - Đảm bảo `id` trong Exercise.csv là duy nhất
   - Đảm bảo `exerciseId` trong Options khớp với `id` trong Exercise
3. **Sử dụng UTF-8 encoding** cho file CSV
4. **Dùng `\N` cho NULL values**
5. **Test với dữ liệu nhỏ** trước khi import hàng loạt
6. **Backup database** trước khi import số lượng lớn

## Dependencies

```json
{
  "csv-parser": "^3.0.0",
  "multer": "^1.4.5-lts.1",
  "@types/multer": "^1.4.12"
}
```

Cài đặt: `pnpm add csv-parser multer @types/multer`
