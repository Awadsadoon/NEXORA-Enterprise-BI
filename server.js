const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = 3000;

const db = new Database(path.join(__dirname, 'database', 'eduvision.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  school TEXT NOT NULL,
  attendance INTEGER DEFAULT 0,
  average REAL DEFAULT 0,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

const count = db.prepare('SELECT COUNT(*) AS c FROM students').get().c;
if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO students (name, grade, school, attendance, average, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const seed = [
    ['Ahmed Alqahtani','10th Grade','Al-Nour High School',96,91.5,'Active'],
    ['Sara Alharbi','11th Grade','Al-Nour High School',94,95.2,'Active'],
    ['Omar Alotaibi','12th Grade','Al-Farabi High School',88,82.7,'Active'],
    ['Nora Alshammari','10th Grade','Al-Farabi High School',98,97.1,'Active'],
    ['Fahad Alanazi','11th Grade','Al-Najah High School',91,87.4,'Active']
  ];
  const transaction = db.transaction(rows => rows.forEach(r => insert.run(...r)));
  transaction(seed);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/dashboard', (req, res) => {
  const students = db.prepare('SELECT * FROM students ORDER BY id DESC').all();
  const stats = db.prepare(`
    SELECT
      COUNT(*) AS students,
      ROUND(AVG(average),1) AS average,
      ROUND(AVG(attendance),1) AS attendance,
      SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END) AS active
    FROM students
  `).get();

  res.json({ stats, students });
});

app.post('/api/students', (req, res) => {
  const { name, grade, school, attendance, average } = req.body;
  if (!name || !grade || !school) {
    return res.status(400).json({ error: 'Name, grade and school are required.' });
  }

  const result = db.prepare(`
    INSERT INTO students (name, grade, school, attendance, average, status)
    VALUES (?, ?, ?, ?, ?, 'Active')
  `).run(
    name.trim(),
    grade.trim(),
    school.trim(),
    Number(attendance) || 0,
    Number(average) || 0
  );

  res.status(201).json(db.prepare('SELECT * FROM students WHERE id=?').get(result.lastInsertRowid));
});

app.delete('/api/students/:id', (req, res) => {
  db.prepare('DELETE FROM students WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`EduVision is running at http://localhost:${PORT}`);
});
