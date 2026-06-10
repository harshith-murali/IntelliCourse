import mongoose from "mongoose";

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5000; // 5 seconds

class DatabaseConnection {
  constructor() {
    this.retryCount = 0;
    this.isConnected = false;
    this.isConnecting = false;

    // Configure mongoose settings
    mongoose.set("strictQuery", true);

    // Handle connection events
    mongoose.connection.on("connected", () => {
      console.log("✅ MongoDB connected successfully");
      this.isConnected = true;
      this.isConnecting = false;
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
      this.isConnected = false;
      this.isConnecting = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB disconnected");
      this.isConnected = false;
    });

    // Handle application termination
    process.on("SIGINT", this.handleAppTermination.bind(this));
    process.on("SIGTERM", this.handleAppTermination.bind(this));
  }

  async connect() {
    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      if (!process.env.MONGO_URI) {
        throw new Error("MongoDB URI is not defined in environment variables");
      }

      const connectionOptions = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      if (process.env.NODE_ENV === "development") {
        mongoose.set("debug", true);
      }

      await mongoose.connect(process.env.MONGO_URI, connectionOptions);
      this.retryCount = 0; // Reset retry count on successful connection
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error.message);
      this.isConnecting = false;
      await this.handleConnectionError();
    }
  }

  async handleConnectionError() {
    if (this.retryCount < MAX_RETRIES) {
      this.retryCount++;
      console.log(
        `Retrying connection... Attempt ${this.retryCount} of ${MAX_RETRIES}`,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
      return this.connect();
    } else if (process.env.MONGO_URI !== "mongodb://127.0.0.1:27017/lms") {
      // Try local fallback database
      console.warn("⚠️ Could not connect to Atlas. Falling back to local MongoDB...");
      process.env.MONGO_URI = "mongodb://127.0.0.1:27017/lms";
      this.retryCount = 0;
      return this.connect();
    } else {
      console.error(
        `❌ Database offline: Failed to connect to MongoDB after attempts. Proceeding in offline mock mode...`
      );
      // Do NOT exit process, let express server run so developer can debug or view UI.
    }
  }

  async handleDisconnection() {
    if (!this.isConnected && !this.isConnecting) {
      console.log("Attempting to reconnect to MongoDB...");
      this.connect();
    }
  }

  async handleAppTermination() {
    try {
      await mongoose.connection.close();
      console.log("MongoDB connection closed through app termination");
      process.exit(0);
    } catch (err) {
      console.error("Error during database disconnection:", err);
      process.exit(1);
    }
  }

  // Get the current connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };
  }
}

// Create a singleton instance
const dbConnection = new DatabaseConnection();

// Export the connect function and the instance
export default dbConnection.connect.bind(dbConnection);
export const getDBStatus = dbConnection.getConnectionStatus.bind(dbConnection);
