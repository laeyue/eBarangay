import express from 'express';
import User from '../models/User';
import Incident from '../models/Incident';
import DocumentRequest from '../models/DocumentRequest';

const router = express.Router();

// Stats endpoints documentation
router.get('/', (req, res) => {
  res.json({
    message: 'BarangayConnect Hub - Statistics API',
    endpoints: {
      public: 'GET /api/stats/public - Get public statistics (active users, barangays, satisfaction rate)',
      admin: 'GET /api/admin/stats - Get detailed admin statistics (requires auth, admin)',
      incidents: 'GET /api/stats/incidents - Incident statistics',
      documents: 'GET /api/stats/documents - Document request statistics',
      users: 'GET /api/stats/users - User statistics',
      health: 'GET /api/health - Server health check'
    }
  });
});

/**
 * @route   GET /api/stats/public
 * @desc    Get public statistics for homepage
 * @access  Public
 */
router.get('/public', async (req, res) => {
  try {
    // Count active residents (registered users)
    const activeResidents = await User.countDocuments({ 
      role: 'user',
      isActive: true 
    });
    
    // For connected barangays, we'll use a mock value since there's no barangay collection
    // In production, this would query a Barangays collection
    const connectedBarangays = 50;
    
    // Calculate satisfaction rate based on resolved incidents and completed documents
    const totalIncidents = await Incident.countDocuments();
    const resolvedIncidents = await Incident.countDocuments({ status: 'resolved' });
    
    const totalDocuments = await DocumentRequest.countDocuments();
    const completedDocuments = await DocumentRequest.countDocuments({ 
      status: { $in: ['ready', 'claimed'] }
    });
    
    // Calculate satisfaction rate (percentage of resolved/completed items)
    const totalItems = totalIncidents + totalDocuments;
    const completedItems = resolvedIncidents + completedDocuments;
    const satisfactionRate = totalItems > 0 
      ? Math.round((completedItems / totalItems) * 100) 
      : 99; // Default to 99% if no data
    
    res.json({
      success: true,
      data: {
        activeResidents: activeResidents || 10500, // Default value if no users yet
        connectedBarangays,
        satisfactionRate: Math.min(satisfactionRate, 99) // Cap at 99%
      }
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message,
      // Return default values on error
      data: {
        activeResidents: 10500,
        connectedBarangays: 50,
        satisfactionRate: 99
      }
    });
  }
});

export default router;
