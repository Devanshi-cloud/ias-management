require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();

// CORS configuration
const allowedOrigins = [
    "http://localhost:3000", // Next.js dev
    "http://127.0.0.1:3000",
    "http://localhost:5173", // Vite dev (if used)
    "https://ias-management-a6k0.onrender.com", // Render backend (this service)
    "https://ias-management-1.onrender.com", // legacy/alt Render URL
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow non-browser requests (no origin) and whitelisted origins
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    // Leave allowedHeaders undefined so the cors package reflects requested headers
    credentials: true,
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Handle preflight for all routes with the same options (important for Render)
app.options(/.*/, cors(corsOptions));

app.use(express.json());

// Connect to Database
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reports", reportRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));