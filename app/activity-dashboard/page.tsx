"use client"
import React, { useState, useEffect } from 'react';
// Using native date formatting instead of date-fns
import { Activity, Shield, User, Mail, Clock, MapPin, Smartphone, Filter, ChevronDown, AlertTriangle } from 'lucide-react';

interface ActivityLog {
  id: string;
  action: string;
  category: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  metadata: any;
  success: boolean;
  createdAt: string;
}

interface ActivitySummary {
  category: string;
  action: string;
  success: boolean;
  count: number;
}

const ActivityDashboard = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [summary, setSummary] = useState<ActivitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    category: '',
    action: '',
    success: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchActivityLogs();
    fetchActivitySummary();
  }, [currentPage, filters]);

  const fetchActivityLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await fetch(`/api/user/activity-logs?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivitySummary = async () => {
    try {
      const response = await fetch('/api/user/activity-summary?days=30');
      const data = await response.json();
      
      if (response.ok) {
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching activity summary:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'auth': return <Shield className="h-4 w-4" />;
      case 'profile': return <User className="h-4 w-4" />;
      case 'verification': return <Mail className="h-4 w-4" />;
      case 'security': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string, success: boolean) => {
    if (!success) return 'text-red-700 bg-red-100';
    
    switch (action) {
      case 'login':
      case 'google_login':
        return 'text-green-700 bg-green-100';
      case 'signup':
      case 'google_signup':
        return 'text-blue-700 bg-blue-100';
      case 'logout':
        return 'text-gray-700 bg-gray-100';
      case 'password_reset_request':
      case 'password_reset_complete':
        return 'text-orange-700 bg-orange-100';
      case 'email_verification':
        return 'text-purple-700 bg-purple-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const formatUserAgent = (userAgent: string) => {
    if (!userAgent || userAgent === 'unknown') return 'Unknown device';
    
    // Simple parsing - you could use a library like ua-parser-js for better parsing
    if (userAgent.includes('Mobile')) return 'Mobile device';
    if (userAgent.includes('Chrome')) return 'Chrome browser';
    if (userAgent.includes('Firefox')) return 'Firefox browser';
    if (userAgent.includes('Safari')) return 'Safari browser';
    return 'Desktop browser';
  };

  const resetFilters = () => {
    setFilters({
      category: '',
      action: '',
      success: '',
      startDate: '',
      endDate: ''
    });
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
            <p className="text-gray-700 font-medium">Monitor your account activity and security events</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors shadow-sm font-medium text-gray-900"
          >
            <Filter className="h-4 w-4" />
            Filters
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['auth', 'security', 'profile', 'verification'].map(category => {
            const categoryData = summary.filter(s => s.category === category);
            const total = categoryData.reduce((sum, item) => sum + item.count, 0);
            const successful = categoryData.filter(s => s.success).reduce((sum, item) => sum + item.count, 0);
            
            return (
              <div key={category} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <div className="text-blue-700">
                      {getCategoryIcon(category)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 capitalize">{category}</p>
                    <p className="text-2xl font-bold text-gray-900">{total}</p>
                    <p className="text-xs font-medium text-green-700">{successful} successful</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                <option value="auth">Authentication</option>
                <option value="security">Security</option>
                <option value="profile">Profile</option>
                <option value="verification">Verification</option>
              </select>

              <select
                value={filters.success}
                onChange={(e) => setFilters(prev => ({ ...prev, success: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Results</option>
                <option value="true">Successful</option>
                <option value="false">Failed</option>
              </select>

              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Start Date"
              />

              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="End Date"
              />

              <button
                onClick={resetFilters}
                className="px-4 py-2 text-gray-900 font-medium hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white shadow-sm"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Activity Logs */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-700 font-medium">Loading activity logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="font-medium">No activity logs found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${getActionColor(log.action, log.success)}`}>
                      {getCategoryIcon(log.category)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action, log.success)}`}>
                          {log.action.replace('_', ' ')}
                        </span>
                        {!log.success && (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            Failed
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-900 font-medium mb-2">{log.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 font-medium">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(log.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        
                        {log.ipAddress && log.ipAddress !== 'unknown' && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {log.ipAddress}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Smartphone className="h-3 w-3" />
                          {formatUserAgent(log.userAgent)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-700 font-medium">
                Page {currentPage} of {totalPages}
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 bg-white transition-colors"
                >
                  Previous
                </button>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 bg-white transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityDashboard;