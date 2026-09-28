// Imports the Express app from app.js.
// app.js contains all middleware, routes, and Express configuration.
// This separation keeps the server startup logic clean.
const app = require('./app');

// Imports configuration (port, MongoDB URI, JWT secret, etc.) from config/index.js.
// config/index.js reads from .env file and exports all settings.
const config = require('./config');

// Imports the database connection function from config/db.js.
// connectDB() establishes the connection to MongoDB using Mongoose.
const connectDB = require('./config/db');

// Defines an async function to start the server.
// Using async/await allows us to wait for database connection before starting.
const startServer = async () => {
  try {
    // Connects to MongoDB database.
    // This MUST succeed before the server starts accepting requests.
    // If MongoDB is not running, the server will exit with an error.
    await connectDB();

    // Starts the Express server listening on the configured port.
    // config.port comes from .env (default 5000).
    // The callback runs once the server is successfully listening.
    const server = app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });

    // Graceful shutdown handler function.
    // When the process receives SIGINT (Ctrl+C) or SIGTERM (docker stop, etc.),
    // this function closes the server properly before exiting.
    const shutdown = (signal) => {
      console.log(`${signal} received, shutting down gracefully...`);
      
      // server.close() stops accepting new connections
      // and waits for existing requests to finish.
      // Then it calls process.exit(0) for clean exit.
      server.close(() => process.exit(0));
      
      // Force exit after 10 seconds if graceful shutdown takes too long.
      // .unref() prevents this timeout from keeping the process alive.
      setTimeout(() => process.exit(1), 10000).unref();
    };

    // Listens for SIGINT signal (Ctrl+C in terminal).
    // When user presses Ctrl+C, shutdown('SIGINT') is called.
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Listens for SIGTERM signal (sent by process managers like PM2, Docker, Kubernetes).
    // When the system wants to stop the container/process, shutdown('SIGTERM') is called.
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    // If database connection fails, log the error and exit with code 1 (failure).
    console.error(`Server start error: ${error.message}`);
    process.exit(1);
  }
};

// Calls the startServer function to begin the application.
// This is the actual entry point - nothing runs until this is called.
startServer();
