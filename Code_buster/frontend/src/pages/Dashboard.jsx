import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Frown,
  Meh,
  Smile,
  ThumbsUp,
  Activity,
  PieChart,
  BarChart
} from 'lucide-react';
import { complaintService, handleApiError } from '../services/api';
import '../styles/leaflet.css';


// StatsBox component
const StatsBox = ({ icon, title, value, description, className = '' }) => (
  <div className={`bg-gray-800 rounded-lg shadow p-4 border-l-4 ${className}`}>
    <div className="flex items-center space-x-3">
      <div className="p-2 rounded-full bg-gray-700">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
    {description && <p className="mt-2 text-xs text-gray-400">{description}</p>}
  </div>
);

// ComplaintCard component
const ComplaintCard = ({ complaint }) => {
  // Format the date
  const formattedDate = new Date(complaint.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Status colors
  const statusColors = {
    pending: 'bg-yellow-900 text-yellow-200',
    in_progress: 'bg-blue-900 text-blue-200',
    resolved: 'bg-green-900 text-green-200',
    rejected: 'bg-red-900 text-red-200'
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-white">{complaint.title}</h3>
            <div className="mt-1 flex items-center">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[complaint.status] || 'bg-gray-700 text-gray-300'}`}>
                {complaint.status.replace('_', ' ')}
              </span>
              {complaint.priority && (
                <span className="ml-2 px-2 py-1 text-xs font-medium bg-gray-700 text-gray-300 rounded-full">
                  {complaint.priority} priority
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="mt-2 text-sm text-gray-400 line-clamp-2">
          {complaint.description}
        </p>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>{formattedDate}</span>
          <span className="truncate max-w-[150px]">{complaint.location}</span>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const location = useLocation();
  
  // State for complaints and UI
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Visualization state
  const [showVisualization, setShowVisualization] = useState(false);
  const [visualizationData, setVisualizationData] = useState(null);
  const [visualizationLoading, setVisualizationLoading] = useState(false);
  
  // Heatmap state
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapLoading, setHeatmapLoading] = useState(false);

  // Fetch complaints from API and fall back to localStorage if needed
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      console.log('Fetching complaints...');
      
      // First, always check localStorage for the most recent data
      const localComplaints = JSON.parse(localStorage.getItem('complaints') || '[]');
      console.log('Local complaints found:', localComplaints.length);
      
      // Try to fetch from API to get additional complaints
      try {
        const data = await complaintService.getComplaints();
        console.log('Complaints data received from API:', data);
        
        if (data && Array.isArray(data) && data.length > 0) {
          // Merge API data with local data, avoiding duplicates
          const mergedComplaints = [...localComplaints];
          data.forEach(apiComplaint => {
            if (!mergedComplaints.find(local => local.id === apiComplaint.id)) {
              mergedComplaints.push(apiComplaint);
            }
          });
          
          // Sort by date (most recent first)
          mergedComplaints.sort((a, b) => new Date(b.date) - new Date(a.date));
          
          console.log('Using merged complaints:', mergedComplaints);
          setComplaints(mergedComplaints);
          setError('');
        } else {
          // API returned empty, use only local data
          console.log('API returned empty, using local complaints only');
          setComplaints(localComplaints);
          if (localComplaints.length > 0) {
            setError('');
          } else {
            setError('No complaints found. Submit a new complaint to get started!');
          }
        }
      } catch (apiError) {
        console.log('API failed, using local complaints:', apiError);
        // API failed, use local data
        setComplaints(localComplaints);
        if (localComplaints.length > 0) {
          setError('Using locally saved complaints. Some features may be limited.');
        } else {
          setError('No complaints found. Submit a new complaint to get started!');
        }
      }
    } catch (err) {
      console.error('Error loading complaints:', err);
      const errorMessage = err.message || 'Failed to load complaints';
      setError(errorMessage);
      
      // Final fallback to localStorage
      const localComplaints = JSON.parse(localStorage.getItem('complaints') || '[]');
      setComplaints(localComplaints);
    } finally {
      setLoading(false);
    }
  };

  // Load complaints on component mount and when refreshTrigger changes
  useEffect(() => {
    console.log('Fetching complaints...');
    fetchComplaints();
  }, [refreshTrigger]);

  // Check for success message from navigation state
  useEffect(() => {
    console.log('Checking location state:', location.state);
    if (location.state?.showSuccess) {
      console.log('New complaint submitted, refreshing data...');
      setShowSuccess(true);
      setMessage(location.state.message || 'Complaint submitted successfully!');
      
      // Force multiple refreshes to ensure data is loaded
      setTimeout(() => {
        console.log('Triggering first data refresh...');
        setRefreshTrigger(prev => prev + 1);
      }, 100);
      
      setTimeout(() => {
        console.log('Triggering second data refresh...');
        setRefreshTrigger(prev => prev + 1);
      }, 500);
      
      // Clear the success message after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
        setMessage('');
        // Clear the location state to prevent re-triggering
        window.history.replaceState({}, document.title);
      }, 5000);
      return () => clearTimeout(timer);
    }
    
    // Check for heatmap request
    if (location.state?.showHeatmap) {
      console.log('Heatmap requested from home page');
      setShowHeatmap(true);
      setMessage(location.state.message || 'Heatmap view activated');
      
      // Clear the message after 3 seconds
      const timer = setTimeout(() => {
        setMessage('');
        window.history.replaceState({}, document.title);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  // Calculate summary from actual complaints
  const summary = {
    totalComplaints: complaints.length,
    pendingComplaints: complaints.filter(c => c.status === 'pending').length,
    inProgressComplaints: complaints.filter(c => c.status === 'in_progress').length,
    resolvedComplaints: complaints.filter(c => c.status === 'resolved').length,
    rejectedComplaints: complaints.filter(c => c.status === 'rejected').length,
    statusDistribution: {
      pending: complaints.filter(c => c.status === 'pending').length,
      in_progress: complaints.filter(c => c.status === 'in_progress').length,
      resolved: complaints.filter(c => c.status === 'resolved').length,
      rejected: complaints.filter(c => c.status === 'rejected').length
    }
  };

  // Get recent complaints (sorted by date, most recent first)
  const recentComplaints = [...complaints]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  // Categories and statuses
  const categories = ['all', 'road', 'water', 'electricity', 'garbage', 'safety', 'health'];
  const statuses = ['all', 'pending', 'in_progress', 'resolved', 'rejected'];

  // Filter complaints
  const filteredComplaints = complaints.filter(complaint =>
    (selectedCategory === 'all' || complaint.category === selectedCategory) &&
    (selectedStatus === 'all' || complaint.status === selectedStatus)
  );

  // Handle refresh
  const handleRefresh = () => {
    console.log('Manual refresh triggered');
    setRefreshTrigger(prev => prev + 1);
  };

  // Debug function to check localStorage
  const handleDebugLocalStorage = () => {
    const localComplaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    console.log('Debug - LocalStorage complaints:', localComplaints);
    console.log('Debug - Number of complaints:', localComplaints.length);
    alert(`Found ${localComplaints.length} complaints in localStorage. Check console for details.`);
  };

  // Generate AI-powered visualization with emotions
  const handleGetVisualization = async () => {
    setVisualizationLoading(true);
    setShowVisualization(false);
    
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if there are any complaints
      if (complaints.length === 0) {
        // Show visualization for no data
        const noDataAnalysis = {
          summary: {
            total: 0,
            pending: 0,
            inProgress: 0,
            resolved: 0,
            rejected: 0,
            pendingPercentage: 0,
            inProgressPercentage: 0,
            resolvedPercentage: 0,
            rejectedPercentage: 0
          },
          emotion: {
            overallEmotion: 'neutral',
            emoji: '📋',
            color: 'text-gray-400',
            sentiment: 'No Data Available',
            recommendation: 'Submit some complaints to see AI-powered insights and visualizations!'
          },
          insights: [
            {
              type: 'info',
              emoji: 'ℹ️',
              message: 'No complaints found in the system'
            },
            {
              type: 'info',
              emoji: '➕',
              message: 'Click "Get Started" to submit your first complaint'
            }
          ],
          trend: {
            direction: 'no-data',
            emoji: '📊',
            color: 'text-gray-400',
            message: 'No trend data available yet'
          },
          generatedAt: new Date().toLocaleString()
        };
        
        setVisualizationData(noDataAnalysis);
        setShowVisualization(true);
      } else {
        // Analyze complaint data and generate insights
        const analysis = analyzeComplaintData();
        setVisualizationData(analysis);
        setShowVisualization(true);
      }
    } catch (error) {
      console.error('Error generating visualization:', error);
      setError('Failed to generate visualization. Please try again.');
    } finally {
      setVisualizationLoading(false);
    }
  };

  // AI-powered data analysis
  const analyzeComplaintData = () => {
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const inProgress = complaints.filter(c => c.status === 'in_progress').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const rejected = complaints.filter(c => c.status === 'rejected').length;
    
    // Calculate percentages
    const pendingPercentage = total > 0 ? (pending / total * 100).toFixed(1) : 0;
    const inProgressPercentage = total > 0 ? (inProgress / total * 100).toFixed(1) : 0;
    const resolvedPercentage = total > 0 ? (resolved / total * 100).toFixed(1) : 0;
    const rejectedPercentage = total > 0 ? (rejected / total * 100).toFixed(1) : 0;
    
    // Determine overall emotion based on data
    let overallEmotion = 'neutral';
    let emotionEmoji = '😐';
    let emotionColor = 'text-gray-400';
    let sentiment = 'Balanced';
    let recommendation = '';
    
    if (resolvedPercentage >= 60) {
      overallEmotion = 'positive';
      emotionEmoji = '😊';
      emotionColor = 'text-green-400';
      sentiment = 'Excellent Performance';
      recommendation = 'Great job! Keep up the excellent work in resolving complaints efficiently.';
    } else if (resolvedPercentage >= 40) {
      overallEmotion = 'slightly-positive';
      emotionEmoji = '🙂';
      emotionColor = 'text-blue-400';
      sentiment = 'Good Progress';
      recommendation = 'Good progress! Focus on reducing pending complaints for better performance.';
    } else if (pendingPercentage >= 50) {
      overallEmotion = 'negative';
      emotionEmoji = '😟';
      emotionColor = 'text-red-400';
      sentiment = 'Needs Attention';
      recommendation = 'High number of pending complaints! Immediate action needed to improve response times.';
    } else if (inProgressPercentage >= 40) {
      overallEmotion = 'concerned';
      emotionEmoji = '😰';
      emotionColor = 'text-yellow-400';
      sentiment = 'Work in Progress';
      recommendation = 'Many complaints are in progress. Ensure timely completion to maintain citizen satisfaction.';
    } else {
      overallEmotion = 'neutral';
      emotionEmoji = '😐';
      emotionColor = 'text-gray-400';
      sentiment = 'Stable';
      recommendation = 'Complaint management is stable. Look for opportunities to improve efficiency.';
    }
    
    // Generate insights
    const insights = [];
    
    if (pending > 0) {
      insights.push({
        type: 'warning',
        emoji: '⚠️',
        message: `${pending} complaints pending (${pendingPercentage}%) require immediate attention`
      });
    }
    
    if (resolved > 0) {
      insights.push({
        type: 'success',
        emoji: '✅',
        message: `${resolved} complaints successfully resolved (${resolvedPercentage}%)`
      });
    }
    
    if (inProgress > 0) {
      insights.push({
        type: 'info',
        emoji: '🔄',
        message: `${inProgress} complaints currently being processed (${inProgressPercentage}%)`
      });
    }
    
    if (rejected > 0) {
      insights.push({
        type: 'error',
        emoji: '❌',
        message: `${rejected} complaints were rejected (${rejectedPercentage}%)`
      });
    }
    
    // Generate trends
    const trend = generateTrendAnalysis();
    
    return {
      summary: {
        total,
        pending,
        inProgress,
        resolved,
        rejected,
        pendingPercentage,
        inProgressPercentage,
        resolvedPercentage,
        rejectedPercentage
      },
      emotion: {
        overallEmotion,
        emoji: emotionEmoji,
        color: emotionColor,
        sentiment,
        recommendation
      },
      insights,
      trend,
      generatedAt: new Date().toLocaleString()
    };
  };

  // Generate trend analysis
  const generateTrendAnalysis = () => {
    // Simple trend simulation based on current data
    const resolvedRate = complaints.length > 0 ? 
      (complaints.filter(c => c.status === 'resolved').length / complaints.length) * 100 : 0;
    
    let trend = 'stable';
    let trendEmoji = '➡️';
    let trendColor = 'text-gray-400';
    let trendMessage = '';
    
    if (resolvedRate >= 70) {
      trend = 'improving';
      trendEmoji = '📈';
      trendColor = 'text-green-400';
      trendMessage = 'Excellent upward trend in complaint resolution!';
    } else if (resolvedRate >= 50) {
      trend = 'positive';
      trendEmoji = '📊';
      trendColor = 'text-blue-400';
      trendMessage = 'Positive trend in handling complaints.';
    } else if (resolvedRate < 30) {
      trend = 'declining';
      trendEmoji = '📉';
      trendColor = 'text-red-400';
      trendMessage = 'Declining trend - immediate improvement needed!';
    } else {
      trend = 'stable';
      trendEmoji = '➡️';
      trendColor = 'text-gray-400';
      trendMessage = 'Stable performance with room for improvement.';
    }
    
    return {
      direction: trend,
      emoji: trendEmoji,
      color: trendColor,
      message: trendMessage
    };
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6">
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-600 text-white px-4 py-2 rounded shadow">
            Dashboard refreshed successfully!
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <div className="flex gap-2">
            <button
              onClick={handleGetVisualization}
              disabled={visualizationLoading}
              className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold shadow-lg"
            >
              {visualizationLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <TrendingUp size={20} />
                  <span>Get Visualization</span>
                </>
              )}
            </button>
            <button
              onClick={() => window.open('/heatmap.html', '_blank')}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-colors font-semibold shadow-lg"
            >
              <Activity size={20} />
              <span>View Heatmap</span>
            </button>
            <button
              onClick={handleDebugLocalStorage}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
            >
              Debug LocalStorage
            </button>
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <RefreshCw size={18} />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && message && (
          <div className="mb-6 p-4 bg-green-900 border border-green-700 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <span className="text-green-200">{message}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-200">{error}</span>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsBox
            icon={<BarChart3 className="h-5 w-5 text-blue-400" />}
            title="Total Complaints"
            value={summary.totalComplaints}
          />
          <StatsBox
            icon={<AlertCircle className="h-5 w-5 text-yellow-400" />}
            title="Pending"
            value={summary.pendingComplaints}
            className="border-yellow-400"
          />
          <StatsBox
            icon={<Clock className="h-5 w-5 text-blue-400" />}
            title="In Progress"
            value={summary.inProgressComplaints}
            className="border-blue-400"
          />
          <StatsBox
            icon={<CheckCircle className="h-5 w-5 text-green-400" />}
            title="Resolved"
            value={summary.resolvedComplaints}
            className="border-green-400"
          />
        </div>



        {/* Recent Complaints */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Complaints</h3>
            <div className="flex space-x-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-sm border border-gray-600 bg-gray-800 text-white rounded px-2 py-1"
              >
                <option value="all">All Categories</option>
                {categories.filter(c => c !== 'all').map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-sm border border-gray-600 bg-gray-800 text-white rounded px-2 py-1"
              >
                <option value="all">All Statuses</option>
                {statuses.filter(s => s !== 'all').map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {recentComplaints
              .filter(complaint =>
                (selectedCategory === 'all' || complaint.category === selectedCategory) &&
                (selectedStatus === 'all' || complaint.status === selectedStatus)
              )
              .map(complaint => (
                <ComplaintCard
                  key={complaint.id}
                  complaint={complaint}
                />
              ))}
          </div>
        </div>
      </div>

      {/* Heatmap Section */}
      {showHeatmap && (
        <div className="max-w-7xl mx-auto mt-8">
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="text-orange-400" />
                Complaint Heatmap
              </h2>
              <button
                onClick={() => setShowHeatmap(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            {complaints.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No complaints to display on heatmap</p>
                <p className="text-gray-500 text-sm mt-2">Submit some complaints to see location data</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Heatmap Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <div className="text-2xl font-bold text-orange-400">{complaints.length}</div>
                    <p className="text-gray-300 text-sm">Total Locations</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <div className="text-2xl font-bold text-red-400">
                      {complaints.filter(c => c.status === 'pending').length}
                    </div>
                    <p className="text-gray-300 text-sm">Hotspots (Pending)</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <div className="text-2xl font-bold text-green-400">
                      {complaints.filter(c => c.status === 'resolved').length}
                    </div>
                    <p className="text-gray-300 text-sm">Resolved Areas</p>
                  </div>
                </div>

                {/* Simulated Heatmap */}
                <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Location Intensity Map</h3>
                  <div className="grid grid-cols-8 gap-1">
                    {Array.from({ length: 64 }, (_, i) => {
                      const intensity = Math.random();
                      let bgColor = 'bg-gray-800';
                      if (intensity > 0.8) bgColor = 'bg-red-600';
                      else if (intensity > 0.6) bgColor = 'bg-orange-600';
                      else if (intensity > 0.4) bgColor = 'bg-yellow-600';
                      else if (intensity > 0.2) bgColor = 'bg-green-600';
                      
                      return (
                        <div
                          key={i}
                          className={`${bgColor} h-8 rounded opacity-80 hover:opacity-100 transition-opacity`}
                          title={`Intensity: ${(intensity * 100).toFixed(0)}%`}
                        ></div>
                      );
                    })}
                  </div>
                  
                  {/* Legend */}
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-800 rounded"></div>
                      <span className="text-gray-400 text-xs">Low</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-600 rounded"></div>
                      <span className="text-gray-400 text-xs">Medium</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-600 rounded"></div>
                      <span className="text-gray-400 text-xs">High</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-600 rounded"></div>
                      <span className="text-gray-400 text-xs">Very High</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-600 rounded"></div>
                      <span className="text-gray-400 text-xs">Critical</span>
                    </div>
                  </div>
                </div>

                {/* Location List */}
                <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Complaint Locations</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {complaints.map((complaint, index) => (
                      <div key={complaint.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-orange-400" />
                          <div>
                            <p className="text-white text-sm">{complaint.location || 'Unknown Location'}</p>
                            <p className="text-gray-400 text-xs">{complaint.title}</p>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          complaint.status === 'resolved' ? 'bg-green-900/50 text-green-400' :
                          complaint.status === 'in_progress' ? 'bg-blue-900/50 text-blue-400' :
                          complaint.status === 'rejected' ? 'bg-red-900/50 text-red-400' :
                          'bg-yellow-900/50 text-yellow-400'
                        }`}>
                          {complaint.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Visualization Section */}
      {showVisualization && visualizationData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Activity className="text-purple-400" />
                  AI-Powered Data Visualization
                </h2>
                <button
                  onClick={() => setShowVisualization(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Overall Emotion & Sentiment */}
              <div className="bg-gray-900/50 rounded-xl p-6 mb-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Overall Sentiment</h3>
                    <p className={`text-2xl font-bold ${visualizationData.emotion.color} flex items-center gap-2`}>
                      <span className="text-4xl">{visualizationData.emotion.emoji}</span>
                      {visualizationData.emotion.sentiment}
                    </p>
                    <p className="text-gray-300 mt-2">{visualizationData.emotion.recommendation}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-6xl mb-2">{visualizationData.emotion.emoji}</div>
                    <p className="text-gray-400 text-sm">AI Analysis</p>
                  </div>
                </div>
              </div>

              {/* Trend Analysis */}
              <div className="bg-gray-900/50 rounded-xl p-6 mb-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="text-blue-400" />
                  Trend Analysis
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{visualizationData.trend.emoji}</span>
                  <div>
                    <p className={`text-xl font-semibold ${visualizationData.trend.color}`}>
                      {visualizationData.trend.direction.charAt(0).toUpperCase() + visualizationData.trend.direction.slice(1)}
                    </p>
                    <p className="text-gray-300">{visualizationData.trend.message}</p>
                  </div>
                </div>
              </div>

              {/* Data Summary */}
              <div className="bg-gray-900/50 rounded-xl p-6 mb-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <PieChart className="text-green-400" />
                  Data Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{visualizationData.summary.total}</div>
                    <p className="text-gray-400 text-sm">Total</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{visualizationData.summary.pending}</div>
                    <p className="text-gray-400 text-sm">Pending</p>
                    <p className="text-gray-500 text-xs">{visualizationData.summary.pendingPercentage}%</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{visualizationData.summary.inProgress}</div>
                    <p className="text-gray-400 text-sm">In Progress</p>
                    <p className="text-gray-500 text-xs">{visualizationData.summary.inProgressPercentage}%</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{visualizationData.summary.resolved}</div>
                    <p className="text-gray-400 text-sm">Resolved</p>
                    <p className="text-gray-500 text-xs">{visualizationData.summary.resolvedPercentage}%</p>
                  </div>
                </div>
              </div>

              {/* AI Insights */}
              <div className="bg-gray-900/50 rounded-xl p-6 mb-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart className="text-purple-400" />
                  AI Insights
                </h3>
                <div className="space-y-3">
                  {visualizationData.insights.map((insight, index) => (
                    <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${
                      insight.type === 'success' ? 'bg-green-900/30 border border-green-700/50' :
                      insight.type === 'warning' ? 'bg-yellow-900/30 border border-yellow-700/50' :
                      insight.type === 'error' ? 'bg-red-900/30 border border-red-700/50' :
                      'bg-blue-900/30 border border-blue-700/50'
                    }`}>
                      <span className="text-xl">{insight.emoji}</span>
                      <p className="text-gray-200">{insight.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual Progress Bars */}
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Visual Progress</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-green-400">Resolved ✅</span>
                      <span className="text-gray-400">{visualizationData.summary.resolvedPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${visualizationData.summary.resolvedPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-blue-400">In Progress 🔄</span>
                      <span className="text-gray-400">{visualizationData.summary.inProgressPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-blue-500 h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${visualizationData.summary.inProgressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-yellow-400">Pending ⚠️</span>
                      <span className="text-gray-400">{visualizationData.summary.pendingPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-yellow-500 h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${visualizationData.summary.pendingPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-700">
                <p className="text-gray-400 text-sm text-center">
                  Generated at {visualizationData.generatedAt} • AI-powered analysis
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
