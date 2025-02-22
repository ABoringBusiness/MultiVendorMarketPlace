import { config } from "dotenv";
config(); // Load environment variables first

import app from "./app.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Root route for "/"
app.get('/', (req, res) => {
  res.send('Welcome to the Backend Server!');
});

app.get('/health', (req, res) => {
  res.status(200).json({
      status: 'OK',
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
  });
});

