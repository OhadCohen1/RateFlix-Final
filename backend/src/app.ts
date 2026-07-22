// טוען env ממש בהתחלה כדי שכל המודולים יקבלו משתנים בזמן.
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import connectDB, { gracefulShutdown } from './utils/db.services.ts';
import { logger } from './middlewares/logger.ts';
import { notFound, errorHandler } from './middlewares/errorHandler.ts';
import apiRouter from './router.ts';

const app = express();

// מאפשר קריאות מהקליינטים בדפדפן.
app.use(cors());

// JSON + לוגים לבקשות
app.use(express.json());
app.use(logger);

// בדיקת חיים מהירה
app.get('/', (_req, res) => {
  res.json({ message: 'RateFlix API is running' });
});

// כל הראוטים מרוכזים ב-router.ts
app.use('/api', apiRouter);

// הנדלר 404 + שגיאות גלובלי בסוף השרשרת
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT ?? 5050;

// מעלים שרת ואז מתחברים ל-DB
app.listen(PORT, async () => {
  try {
    await connectDB();
    console.log(
      `Server running in ${process.env.NODE_ENV ?? 'development'} mode on http://localhost:${PORT}/`
    );
  } catch (error) {
    console.error('Failed to start server due to DB connection error:', error);
    process.exit(1);
  }
});

// סוגרים DB נקי בסיגנלי סיום
process.on('SIGINT', () => void gracefulShutdown('SIGINT')); // Ctrl+C
process.on('SIGTERM', () => void gracefulShutdown('SIGTERM')); // hosting/docker stop
