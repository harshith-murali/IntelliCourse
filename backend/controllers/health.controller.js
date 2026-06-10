import { getDBStatus } from '../database/db.js';

export const checkHealth = async (req, res) => {
    const dbStatus = getDBStatus();
    
    res.status(200).json({
        status: "success",
        message: "Server is healthy",
        timestamp: new Date(),
        uptime: process.uptime(),
        database: {
            connected: dbStatus.isConnected,
            state: getReadyStateText(dbStatus.readyState)
        }
    });
};

function getReadyStateText(state) {
    switch (state) {
        case 0: return "disconnected";
        case 1: return "connected";
        case 2: return "connecting";
        case 3: return "disconnecting";
        default: return "unknown";
    }
}
