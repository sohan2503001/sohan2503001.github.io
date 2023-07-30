const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/content', express.static(path.join(__dirname, 'content')));

// Serve the index.html file from the root directory
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the post.html file from the root directory
app.get('/post/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'post.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
