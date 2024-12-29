import app from "./app.js";
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`);
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

