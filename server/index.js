// Import the Express framework to create the web server
import express from "express";
// Import the CORS middleware to allow cross-origin requests from the frontend
import cors from "cors";

// Initialize the Express application
const app = express();
// Define the port number where the backend server will listen for requests
const port = 3001;

// Define CORS settings to securely connect the "Two Servers" (Frontend and Backend)
const corsOptions = {
  // Explicitly allow requests ONLY from the Vite frontend address (Security measure)
  origin: 'http://localhost:5173', 
  // Crucial requirement: Allow the browser to send and receive Session Cookies for authentication (Passport.js)
  credentials: true, 
};

// Apply the CORS configuration as a global middleware to intercept and approve incoming requests
app.use(cors(corsOptions));

// Apply a built-in middleware to automatically parse incoming request bodies that are formatted as JSON
app.use(express.json());

// Create a simple GET endpoint to verify that the frontend can successfully talk to this backend
app.get('/api/test', (req, res) => {
  // Send a JSON response back to the client to confirm the connection
  res.json({ message: 'Server is successfully connected to the client!' });
});

// Start the server and make it actively listen for incoming connections on the specified port
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});