const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const db = new sqlite3.Database('menu.db');
const menu1db = new sqlite3.Database('menu1.db');

// DB構造
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS vender_menu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stock INTEGER NOT NULL
    );
  `);
});

menu1db.serialize(() => {
  menu1db.run(`
    CREATE TABLE IF NOT EXISTS vender_menu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      day TEXT NOT NULL,
      kcal REAL,
      protein REAL,
      fat REAL,
      salt REAL,
      is_sample INTEGER DEFAULT 0
    );
  `);
});

// ルーティング
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/menu', (req, res) => res.sendFile(path.join(__dirname, 'views', 'menu.html')));
app.get('/menu1', (req, res) => res.sendFile(path.join(__dirname, 'views', 'menu1.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin.html')));

// ✅ サンプルデータ登録
app.post('/set', (req, res) => {
  const sampleMenus = [
    { name: 'Aランチ', price: 480 },
    { name: 'カツカレー', price: 450 },
    { name: 'カレーライス', price: 380 },
    { name: 'カツ丼', price: 400 },
    { name: 'うどん', price: 250 },
    { name: 'ライス', price: 120 },
    { name: '味噌汁', price: 50 }
  ];

  const stockStmt = db.prepare('INSERT INTO vender_menu (stock) VALUES (?)');
  const infoStmt = menu1db.prepare(`
    INSERT INTO vender_menu (name, type, day, kcal, protein, fat, salt, is_sample)
    VALUES (?, "A", "月", 0, 0, 0, 0, 1)
  `);

  sampleMenus.forEach(menu => {
    stockStmt.run(10);
    infoStmt.run(menu.name);
  });

  stockStmt.finalize();
  infoStmt.finalize();

  res.redirect('/admin');
});

// ✅ 手動登録（栄養情報のみ、is_sample=0）
app.post('/add', (req, res) => {
  const { name, type, day, kcal, protein, fat, salt } = req.body;

  if (!['月', '火', '水', '木', '金'].includes(day) || !['A', 'B'].includes(type)) {
    return res.status(400).send('不正な入力です');
  }

  menu1db.get(
  'SELECT * FROM vender_menu WHERE type = ? AND day = ? AND is_sample = 0',
  [type, day],
  (err, row) => {
    if (err) return res.status(500).send('検索エラー');

    if (row) {
      menu1db.run(
        'UPDATE vender_menu SET name = ?, kcal = ?, protein = ?, fat = ?, salt = ? WHERE id = ?',
        [name, kcal, protein, fat, salt, row.id],
        err => {
          if (err) return res.status(500).send('更新エラー');
          res.redirect('/admin');
        }
      );
    } else {
      menu1db.run(
        'INSERT INTO vender_menu (name, type, day, kcal, protein, fat, salt, is_sample) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
        [name, type, day, kcal, protein, fat, salt],
        err => {
          if (err) return res.status(500).send('登録エラー');
          res.redirect('/admin');
        }
      );
    }
  });
});

// 在庫-1購入処理
app.post('/purchase/:id', (req, res) => {
  const id = req.params.id;
  db.run(
    'UPDATE vender_menu SET stock = stock - 1 WHERE id = ? AND stock > 0',
    [id],
    err => {
      if (err) return res.send('購入エラー');
      res.redirect('/menu');
    }
  );
});

// ✅ API: menu1.html 用（サンプルデータのみ）
app.get('/api/menu1', (req, res) => {
  db.all('SELECT id, stock FROM vender_menu', (err, stockRows) => {
    if (err) return res.status(500).json({ error: 'DBエラー(menu.db)' });

    menu1db.all('SELECT id, name FROM vender_menu WHERE is_sample = 1', (err2, infoRows) => {
      if (err2) return res.status(500).json({ error: 'DBエラー(menu1.db)' });

      const merged = infoRows.map(info => {
        const stockEntry = stockRows.find(s => s.id === info.id) || { stock: 0 };
        return { ...info, stock: stockEntry.stock };
      });

      res.json(merged);
    });
  });
});

// ✅ API: menu.html 用（登録データのみ）
app.get('/api/menu', (req, res) => {
  menu1db.all(
    'SELECT name, type, day, kcal, protein, fat, salt FROM vender_menu WHERE is_sample = 0',
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DBエラー(menu1.db)' });
      res.json(rows);
    }
  );
});

// サーバ起動
app.listen(port, () =>
  console.log(`Server is running on http://localhost:${port}`)
);
