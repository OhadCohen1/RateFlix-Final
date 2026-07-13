# 🎬 RateFlix

**מערכת המלצות סרטים מבוססת אלגוריתם KNN** — פרויקט גמר בהנדסת תוכנה, שנקר הנדסאים 2026.

פלטפורמת Full-Stack המדמה שירות סרטים מסחרי: קטלוג דינמי, מערכת דירוגים, ומנוע המלצות
עצמאי המיישם **K-Nearest Neighbors** בגישת סינון שיתופי מבוסס-משתמשים
(User-Based Collaborative Filtering) — ללא תלות בספריות למידת מכונה חיצוניות.

| | |
|---|---|
| **מגישים** | אוהד כהן, מתן הכהן |
| **מנחה** | שי אברהם |

---

## ארכיטקטורה

```
FinalProject/
├── backend/   REST API — Node.js + Express 5 + TypeScript (ESM) + MongoDB
├── web/       אתר — React 19 + Vite + Tailwind CSS (RTL, עברית)
└── mobile/    אפליקציה — React Native + Expo (SDK 54)
```

ארכיטקטורת קליינט-שרת מופרדת (Decoupled): שני הקליינטים צורכים את אותו REST API
מאובטח ב-JWT. צד השרת בנוי במבנה feature folders (לפי תבנית הקורס):

```
backend/src/
├── features/        תיקייה לכל פיצ'ר עם ctrl / router / model / types:
│   ├── auth/            הרשמה והתחברות (JWT)
│   ├── users/           סכמת User (bcrypt hooks) + סיכום משתמשים
│   ├── movies/          קטלוג, יצירה עם העשרת AI, מחיקה
│   ├── categories/      קטגוריות
│   ├── ratings/         סכמת Rating
│   ├── favorites/       מועדפים
│   ├── recommendations/ פיד המלצות KNN + לוג ביצועים
│   ├── profiles/        פרופיל אישי וסטטיסטיקות
│   └── admin/           דשבורד מנהל
├── middlewares/     JWT auth, הרשאות לפי תפקיד, errorHandler מרכזי, logger,
│                    files (multer + Cloudinary)
├── services/        KNNService (מנוע ההמלצות), matrixCache, AIService (Gemini)
├── utils/           response.builder (מעטפת תגובה אחידה), db.services (MongoDB)
├── router.ts        ראוטר מרכזי שמאגד את כל הפיצ'רים תחת /api
└── app.ts           נקודת הכניסה - אתחול השרת, חיבור DB וכיבוי מסודר
```

## מנוע ההמלצות (KNN)

הליבה האלגוריתמית של הפרויקט — מימוש עצמאי ב-`services/KNNService.ts`:

- **מטריצה דלילה** — `matrix[userId][itemId] = score` כאובייקט מקונן: רק דירוגים
  שקיימים בפועל נשמרים בזיכרון, גישה בזמן קבוע O(1)
- **דמיון קוסינוס** — `cos(A,B) = (A·B) / (‖A‖·‖B‖)` בין וקטורי הדירוג של המשתמשים
- **חיזוי** — איתור K השכנים הדומים ביותר ושקלול ציוניהם לפי משקל הדמיון
  לפריטים שהמשתמש טרם דירג
- **Caching** (NFR-01) — המטריצה נבנית פעם ב-5 דקות לכל היותר ונשמרת בזיכרון,
  עם invalidation מיידי בכל שינוי דירוג; זמני חישוב נמדדים ונרשמים
  ל-`RecommendationLog` (בפועל: מילישניות בודדות)
- **Cold Start** — משתמש ללא דירוגים מקבל את הסרטים המדורגים ביותר גלובלית

## פיצ'רים

- 🔐 הרשמה והתחברות מאובטחת — bcrypt + JWT, הפרדת תפקידים User/Admin
- 🎞️ קטלוג דינמי — חיפוש חי עם השלמה אוטומטית, סינון לפי קטגוריה, מיון (חדש/דירוג/פופולרי)
- ⭐ דירוגים 1—5 — יצירה, עדכון ומחיקה, עם ממוצע ומונה על כל כרטיס
- 🎯 "מומלץ עבורך" — פיד אישי בזמן אמת מה-KNN עם אחוזי התאמה
- ❤️ מועדפים ופרופיל אישי עם סטטיסטיקות והיסטוריית דירוגים
- 🖼️ העלאת פוסטרים ל-**Cloudinary** (סטרימינג מהזיכרון, ללא כתיבה לדיסק)
- 🤖 יצירת תקציר ותגיות אוטומטית בעברית עם **Google Gemini**
- 📊 דשבורד אנליטיקות לאדמין — סטטיסטיקות, סרטים מובילים, וביצועי המנוע הנמדדים

## הרצה מקומית

**דרישות מוקדמות:** Node.js 22+, MongoDB רץ מקומית (פורט 27017).

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # ולמלא ערכים אמיתיים
npm run dev               # http://localhost:5000
```

משתני סביבה (`backend/.env`):

| משתנה | תיאור |
|---|---|
| `PORT` | פורט השרת (ברירת מחדל 5000) |
| `MONGO_URI` | חיבור MongoDB, למשל `mongodb://localhost:27017/rateflix` |
| `JWT_SECRET` | סוד לחתימת אסימוני JWT |
| `CLOUDINARY_URL` | מהדשבורד של Cloudinary (להעלאת פוסטרים) |
| `GEMINI_API_KEY` | מ-Google AI Studio (ליצירת תקצירים) |

### 2. Web

```bash
cd web
npm install
npm run dev               # http://localhost:5173
```

### 3. Mobile (Expo Go)

```bash
cd mobile
npm install
npx expo start            # לסרוק את ה-QR עם אפליקציית Expo Go
```

הטלפון והמחשב חייבים להיות באותה רשת; האפליקציה מזהה אוטומטית את כתובת ה-IP
של השרת מתוך חיבור ה-Metro.

## בדיקות

```bash
cd backend
npm test                  # בדיקות יחידה: דיוק מתמטי של דמיון קוסינוס מול ערכים
                          # ידועים מראש + אימות גיבוב סיסמאות (bcrypt)
```

בנוסף, `backend/tests/rateflix.rest` מכיל את כל קריאות ה-API להרצה ידנית
עם תוסף REST Client ב-VS Code.

### Postman

`postman/RateFlix.postman_collection.json` - קולקציה מלאה של כל ה-routes,
מתועדת וניתנת להרצה בלחיצה אחת:

1. Import לקובץ ב-Postman (או `npx newman run postman/RateFlix.postman_collection.json`)
2. ודאו שהשרת רץ, ואז **Run Collection**

ההרצה מתחברת, לוכדת טוקנים אוטומטית, מריצה 24 בקשות עם 49 בדיקות
(כולל בדיקות שליליות: 401 ללא טוקן, 403 למשתמש שאינו מנהל, סיסמה שגויה)
ומנקה אחרי עצמה - כך שאפשר להריץ שוב ושוב.

## סטאק טכנולוגי

| שכבה | טכנולוגיות |
|---|---|
| Backend | Node.js, Express 5, TypeScript (ESM), Mongoose 9, JWT, bcryptjs, Multer |
| Web | React 19, Vite, TypeScript, Tailwind CSS 4, React Router, Axios |
| Mobile | React Native, Expo SDK 54, Expo Router, AsyncStorage |
| DB & Cloud | MongoDB, Cloudinary (מדיה), Google Gemini (AI) |
