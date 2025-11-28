import { Component, OnDestroy, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ApiService } from '../../../shared/services/api.service';
import { SocketService, MonitorUpdate, AnalyticsUpdate } from '../../../shared/services/socket.service';
import { StorageService } from '../../../shared/services/storage.service';
import { Router } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';

Chart.register(...registerables);

interface Monitor {
  uuid: string;
  name: string;
  url: string;
  type: string;
  status: string;
  refreshTime: number;
  lastCheckedAt: Date;
  currentStatusCode: number;
  averageResponseTime: number;
  lastTimeTaken: number;
  lastError?: string;
  totalPings: number;
  successPings: number;
  failurePings: number;
  uptimePercent: number;
}

interface AnalyticsData {
  userId: string;
  totalMonitors: number;
  activeMonitors: number;
  pausedMonitors: number;
  averageUptime: number;
  averageResponseTime: number;
  monitors: Monitor[];
}

interface ResponseLog {
  pingTime: Date;
  pingStatusCode: number;
  pingTimeTaken: number;
  pingResponse?: any;
  pingError?: string;
}

@Component({
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.css'
})
export class DashboardHomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('responseTimeChart', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('monitorChart', { static: false }) monitorChartCanvas!: ElementRef<HTMLCanvasElement>;
  
  analyticsData: AnalyticsData | null = null;
  isLoading = true;
  errorMessage = '';

  // Chart instances
  private responseTimeChart: Chart | null = null;
  private monitorChart: Chart | null = null;
  private chartData: { time: string; responseTime: number; monitorName: string; timestamp: number }[] = [];
  private monitorChartData: { time: string; responseTime: number; statusCode: number }[] = [];
  private maxDataPoints = 100; // Increased to show more historical data
  private maxMonitorDataPoints = 100;

  // Flags to track initialization state
  private isChartInitialized = false;
  private isHistoricalDataLoaded = false;
  private pendingSocketUpdates: MonitorUpdate[] = [];

  // Monitor popup
  selectedMonitor: Monitor | null = null;
  showMonitorPopup = false;
  isLoadingMonitorData = false;

  // Subscriptions
  private monitorUpdateSub?: Subscription;
  private analyticsUpdateSub?: Subscription;
  private monitorStatusSub?: Subscription;

  constructor(
    private apiService: ApiService,
    private socketService: SocketService,
    private storageService: StorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check for refresh token and refresh access token if needed
    this.checkAndRefreshToken().then(() => {
      this.loadAnalytics();
    });
  }

  /**
   * Check for refresh token and refresh access token if needed
   */
  private async checkAndRefreshToken(): Promise<void> {
    const refreshToken = this.storageService.getRefreshToken();
    const accessToken = this.storageService.getAccessToken();

    // If no refresh token, redirect to login
    if (!refreshToken) {
      this.router.navigate(['/auth/login']);
      return;
    }

    // If access token exists, try to use it (it might be expired, but let API handle that)
    // If no access token or we want to refresh anyway, get new tokens
    if (!accessToken) {
      try {
        const response = await firstValueFrom(this.apiService.refreshToken());
        if (response?.success && response.data) {
          this.storageService.setAccessToken(response.data.accessToken);
          this.storageService.setRefreshToken(response.data.refreshToken);
          console.log('Tokens refreshed successfully');
        } else {
          // Refresh token invalid, redirect to login
          this.storageService.clearAll();
          this.router.navigate(['/auth/login']);
        }
      } catch (error) {
        console.error('Error refreshing token:', error);
        // Refresh token invalid, redirect to login
        this.storageService.clearAll();
        this.router.navigate(['/auth/login']);
      }
    }
  }

  ngAfterViewInit(): void {
    // Initialize chart first, then load historical data
    this.initializeChart().then(() => {
      this.isChartInitialized = true;
      // If analytics data is already loaded, load historical data
      if (this.analyticsData) {
        this.loadHistoricalDataForMainChart();
      }
      // Process any pending socket updates
      this.processPendingSocketUpdates();
      // Setup socket listeners after chart is ready
      this.setupSocketListeners();
    });
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    if (this.monitorUpdateSub) {
      this.monitorUpdateSub.unsubscribe();
    }
    if (this.analyticsUpdateSub) {
      this.analyticsUpdateSub.unsubscribe();
    }
    if (this.monitorStatusSub) {
      this.monitorStatusSub.unsubscribe();
    }

    // Destroy charts
    if (this.responseTimeChart) {
      this.responseTimeChart.destroy();
    }
    if (this.monitorChart) {
      this.monitorChart.destroy();
    }
  }

  /**
   * Load initial analytics data from API
   */
  loadAnalytics(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.getAllAnalytics().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.analyticsData = response.data;
          // If chart is already initialized, load historical data
          if (this.isChartInitialized) {
            this.loadHistoricalDataForMainChart();
          }
        } else {
          this.errorMessage = response.message || 'Failed to load analytics';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'An error occurred while loading analytics';
        this.isLoading = false;
        console.error('Analytics load error:', error);
      }
    });
  }

  /**
   * Load historical data for main chart from all monitors
   */
  loadHistoricalDataForMainChart(): void {
    if (!this.analyticsData || !this.analyticsData.monitors.length || !this.isChartInitialized) {
      return;
    }

    // Load stats for ALL monitors to get their response logs
    const monitorPromises = this.analyticsData.monitors.map(monitor => 
      firstValueFrom(this.apiService.getMonitorStats(monitor.uuid))
    );

    Promise.all(monitorPromises).then(results => {
      const allLogs: { time: Date; responseTime: number; monitorName: string; timestamp: number }[] = [];

      results.forEach((result: any, index: number) => {
        if (result?.success && result.data?.responseLogs) {
          const monitor = this.analyticsData!.monitors[index];
          if (monitor && result.data.responseLogs) {
            result.data.responseLogs.forEach((log: ResponseLog) => {
              const logTime = new Date(log.pingTime);
              allLogs.push({
                time: logTime,
                responseTime: log.pingTimeTaken,
                monitorName: monitor.name,
                timestamp: logTime.getTime()
              });
            });
          }
        }
      });

      // Sort by timestamp (oldest first)
      allLogs.sort((a, b) => a.timestamp - b.timestamp);
      
      // Take last N points to show recent history
      const recentLogs = allLogs.slice(-this.maxDataPoints);

      // Populate chart with historical data (always replace on refresh)
      if (recentLogs.length > 0) {
        // Map logs to chart data format
        this.chartData = recentLogs.map(log => ({
          time: log.time.toLocaleTimeString(),
          responseTime: log.responseTime,
          monitorName: log.monitorName,
          timestamp: log.timestamp
        }));

        // Update chart
        if (this.responseTimeChart) {
          this.responseTimeChart.data.labels = this.chartData.map(d => d.time);
          this.responseTimeChart.data.datasets[0].data = this.chartData.map(d => d.responseTime);
          this.responseTimeChart.update();
          this.isHistoricalDataLoaded = true;
          
          console.log(`Loaded ${this.chartData.length} historical data points`);
        }
      } else {
        // No historical data available
        if (this.responseTimeChart) {
          this.chartData = [];
          this.responseTimeChart.data.labels = [];
          this.responseTimeChart.data.datasets[0].data = [];
          this.responseTimeChart.update();
          this.isHistoricalDataLoaded = true;
          console.log('No historical data available');
        }
      }

      // Process any pending socket updates that came in while loading
      this.processPendingSocketUpdates();
    }).catch(error => {
      console.error('Error loading historical data:', error);
      this.isHistoricalDataLoaded = true; // Mark as loaded even on error to allow socket updates
      this.processPendingSocketUpdates();
    });
  }

  /**
   * Process pending socket updates that arrived before historical data was loaded
   */
  private processPendingSocketUpdates(): void {
    if (this.pendingSocketUpdates.length > 0 && this.isHistoricalDataLoaded && this.isChartInitialized) {
      console.log(`Processing ${this.pendingSocketUpdates.length} pending socket updates`);
      this.pendingSocketUpdates.forEach(update => {
        this.handleMonitorUpdate(update);
      });
      this.pendingSocketUpdates = [];
    }
  }

  /**
   * Setup socket listeners for real-time updates
   */
  setupSocketListeners(): void {
    // Ensure socket is initialized
    if (!this.socketService.getConnectionStatus()) {
      this.socketService.initializeSocket();
    }

    // Listen for monitor updates
    this.monitorUpdateSub = this.socketService.monitorUpdate$.subscribe((update: MonitorUpdate) => {
      // If historical data hasn't loaded yet, queue the update
      if (!this.isHistoricalDataLoaded || !this.isChartInitialized) {
        this.pendingSocketUpdates.push(update);
        return;
      }
      this.handleMonitorUpdate(update);
    });

    // Listen for analytics updates
    this.analyticsUpdateSub = this.socketService.analyticsUpdate$.subscribe((update: AnalyticsUpdate) => {
      this.handleAnalyticsUpdate(update);
    });

    // Listen for status changes
    this.monitorStatusSub = this.socketService.monitorStatus$.subscribe((statusChange) => {
      this.handleStatusChange(statusChange);
    });

    // Request initial analytics via socket
    setTimeout(() => {
      this.socketService.requestAnalytics();
    }, 1000);
  }

  /**
   * Handle real-time monitor update
   */
  handleMonitorUpdate(update: MonitorUpdate): void {
    if (!this.analyticsData || !this.isChartInitialized || !this.isHistoricalDataLoaded) {
      return;
    }

    const monitor = this.analyticsData.monitors.find(m => m.uuid === update.monitor.uuid);
    if (monitor) {
      // Update monitor data
      monitor.currentStatusCode = update.monitor.currentStatusCode;
      monitor.lastTimeTaken = update.monitor.lastTimeTaken;
      monitor.averageResponseTime = update.monitor.averageResponseTime;
      monitor.uptimePercent = update.monitor.uptimePercent;
      monitor.lastError = update.monitor.lastError;
      monitor.lastCheckedAt = new Date(update.monitor.lastPing.timestamp);

      // Update main chart with new data point (only if it's newer than the last point)
      const updateTimestamp = new Date(update.monitor.lastPing.timestamp).getTime();
      const lastTimestamp = this.chartData.length > 0 
        ? this.chartData[this.chartData.length - 1].timestamp 
        : 0;

      // Only add if this is a new update (not a duplicate)
      if (updateTimestamp > lastTimestamp) {
        this.addChartDataPoint(
          update.monitor.name,
          update.monitor.lastPing.timeTaken,
          new Date(update.monitor.lastPing.timestamp)
        );
      }

      // Update monitor popup chart if this is the selected monitor
      if (this.selectedMonitor && this.selectedMonitor.uuid === update.monitor.uuid) {
        this.addMonitorChartDataPoint(
          update.monitor.lastPing.timeTaken,
          update.monitor.lastPing.statusCode,
          new Date(update.monitor.lastPing.timestamp)
        );
      }

      // Recalculate averages
      this.recalculateAverages();
    }
  }

  /**
   * Handle analytics update
   */
  handleAnalyticsUpdate(update: AnalyticsUpdate): void {
    if (update.data) {
      // Update analytics data but don't reload historical data
      // to avoid resetting the chart
      this.analyticsData = update.data;
    }
  }

  /**
   * Handle status change
   */
  handleStatusChange(statusChange: any): void {
    if (!this.analyticsData) return;

    const monitor = this.analyticsData.monitors.find(m => m.uuid === statusChange.monitorId);
    if (monitor) {
      monitor.status = statusChange.status;
      
      // Update counts
      if (statusChange.status === 'active') {
        this.analyticsData.activeMonitors++;
        this.analyticsData.pausedMonitors--;
      } else {
        this.analyticsData.activeMonitors--;
        this.analyticsData.pausedMonitors++;
      }
    }
  }

  /**
   * Initialize main Chart.js chart
   */
  private async initializeChart(): Promise<void> {
    return new Promise((resolve) => {
      // Wait for canvas to be available
      const checkCanvas = () => {
        if (!this.chartCanvas) {
          setTimeout(checkCanvas, 50);
          return;
        }

        const ctx = this.chartCanvas.nativeElement.getContext('2d');
        if (!ctx) {
          setTimeout(checkCanvas, 50);
          return;
        }

        const config: ChartConfiguration = {
          type: 'line',
          data: {
            labels: [],
            datasets: [
              {
                label: 'Response Time (ms)',
                data: [],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 3,
                pointHoverRadius: 5
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: {
                  color: '#e5e7eb'
                }
              },
              tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                  title: (items) => {
                    const index = items[0].dataIndex;
                    return this.chartData[index]?.monitorName || '';
                  }
                }
              }
            },
            scales: {
              x: {
                ticks: {
                  color: '#9ca3af',
                  maxRotation: 45,
                  minRotation: 45
                },
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)'
                }
              },
              y: {
                beginAtZero: true,
                ticks: {
                  color: '#9ca3af'
                },
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)'
                },
                title: {
                  display: true,
                  text: 'Response Time (ms)',
                  color: '#e5e7eb'
                }
              }
            },
            interaction: {
              mode: 'nearest',
              axis: 'x',
              intersect: false
            }
          }
        };

        this.responseTimeChart = new Chart(ctx, config);
        resolve();
      };

      checkCanvas();
    });
  }

  /**
   * Initialize monitor popup chart
   */
  initializeMonitorChart(): void {
    if (!this.monitorChartCanvas) return;

    const ctx = this.monitorChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Response Time (ms)',
            data: [],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 2,
            pointHoverRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#e5e7eb'
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#9ca3af',
              maxRotation: 45,
              minRotation: 45
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#9ca3af'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            title: {
              display: true,
              text: 'Response Time (ms)',
              color: '#e5e7eb'
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    };

    this.monitorChart = new Chart(ctx, config);
  }

  /**
   * Add data point to main chart
   */
  addChartDataPoint(monitorName: string, responseTime: number, timestamp: Date): void {
    if (!this.responseTimeChart) return;

    const timeLabel = timestamp.toLocaleTimeString();
    const timestampValue = timestamp.getTime();
    
    // Check if this point already exists (avoid duplicates)
    const exists = this.chartData.some(d => d.timestamp === timestampValue);
    if (exists) {
      return;
    }

    // Add new data point
    this.chartData.push({
      time: timeLabel,
      responseTime,
      monitorName,
      timestamp: timestampValue
    });

    // Keep only last N data points
    if (this.chartData.length > this.maxDataPoints) {
      this.chartData.shift();
    }

    // Sort by timestamp to maintain chronological order
    this.chartData.sort((a, b) => a.timestamp - b.timestamp);

    // Update chart
    this.responseTimeChart.data.labels = this.chartData.map(d => d.time);
    this.responseTimeChart.data.datasets[0].data = this.chartData.map(d => d.responseTime);
    this.responseTimeChart.update('none');
  }

  /**
   * Add data point to monitor chart
   */
  addMonitorChartDataPoint(responseTime: number, statusCode: number, timestamp: Date): void {
    if (!this.monitorChart) return;

    const timeLabel = timestamp.toLocaleTimeString();
    
    // Add new data point
    this.monitorChartData.push({
      time: timeLabel,
      responseTime,
      statusCode
    });

    // Keep only last N data points
    if (this.monitorChartData.length > this.maxMonitorDataPoints) {
      this.monitorChartData.shift();
    }

    // Update chart
    this.monitorChart.data.labels = this.monitorChartData.map(d => d.time);
    this.monitorChart.data.datasets[0].data = this.monitorChartData.map(d => d.responseTime);
    this.monitorChart.update('none');
  }

  /**
   * Open monitor popup and load its data
   */
  openMonitorPopup(monitor: Monitor): void {
    this.selectedMonitor = monitor;
    this.showMonitorPopup = true;
    this.isLoadingMonitorData = true;
    this.monitorChartData = [];

    // Wait for view to update, then initialize chart and load data
    setTimeout(() => {
      // Initialize chart first
      if (!this.monitorChart) {
        this.initializeMonitorChart();
      }

      // Wait a bit more to ensure chart is ready
      setTimeout(() => {
        // Load historical data for this monitor FIRST
        this.apiService.getMonitorStats(monitor.uuid).subscribe({
          next: (response) => {
            if (response.success && response.data?.responseLogs) {
              const logs = response.data.responseLogs as ResponseLog[];
              
              if (logs && logs.length > 0) {
                // Sort logs by time (oldest first)
                const sortedLogs = [...logs].sort((a, b) => 
                  new Date(a.pingTime).getTime() - new Date(b.pingTime).getTime()
                );
                
                // Populate chart with historical data first
                this.monitorChartData = sortedLogs.map(log => ({
                  time: new Date(log.pingTime).toLocaleTimeString(),
                  responseTime: log.pingTimeTaken,
                  statusCode: log.pingStatusCode
                }));

                if (this.monitorChart) {
                  this.monitorChart.data.labels = this.monitorChartData.map(d => d.time);
                  this.monitorChart.data.datasets[0].data = this.monitorChartData.map(d => d.responseTime);
                  this.monitorChart.update();
                  console.log(`Loaded ${this.monitorChartData.length} historical data points for monitor ${monitor.name}`);
                }
              } else {
                // No historical data, initialize with empty chart
                if (this.monitorChart) {
                  this.monitorChart.data.labels = [];
                  this.monitorChart.data.datasets[0].data = [];
                  this.monitorChart.update();
                }
              }
            }
            this.isLoadingMonitorData = false;
            
            // After historical data is loaded, socket updates will continue to add new points
            // via handleMonitorUpdate -> addMonitorChartDataPoint
          },
          error: (error) => {
            console.error('Error loading monitor data:', error);
            this.isLoadingMonitorData = false;
            // Initialize empty chart on error
            if (this.monitorChart) {
              this.monitorChart.data.labels = [];
              this.monitorChart.data.datasets[0].data = [];
              this.monitorChart.update();
            }
          }
        });
      }, 150);
    }, 100);
  }

  /**
   * Close monitor popup
   */
  closeMonitorPopup(): void {
    this.showMonitorPopup = false;
    this.selectedMonitor = null;
    this.monitorChartData = [];
  }

  /**
   * Recalculate average uptime and response time
   */
  recalculateAverages(): void {
    if (!this.analyticsData) return;

    const monitors = this.analyticsData.monitors;
    if (monitors.length === 0) return;

    let totalUptime = 0;
    let totalResponseTime = 0;

    monitors.forEach(monitor => {
      totalUptime += parseFloat(monitor.uptimePercent.toString());
      totalResponseTime += monitor.averageResponseTime || 0;
    });

    this.analyticsData.averageUptime = parseFloat((totalUptime / monitors.length).toFixed(2));
    this.analyticsData.averageResponseTime = parseFloat((totalResponseTime / monitors.length).toFixed(2));
  }

  /**
   * Get status badge color
   */
  getStatusBadgeColor(status: string): string {
    return status === 'active' ? 'bg-green-500' : 'bg-gray-500';
  }

  /**
   * Get status code color
   */
  getStatusCodeColor(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return 'text-green-400';
    if (statusCode >= 300 && statusCode < 400) return 'text-yellow-400';
    if (statusCode >= 400) return 'text-red-400';
    return 'text-gray-400';
  }

  /**
   * Refresh analytics manually
   */
  refreshAnalytics(): void {
    // Reload analytics and historical data
    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.getAllAnalytics().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.analyticsData = response.data;
          // Always reload historical data on refresh to get latest data from API
          if (this.isChartInitialized) {
            // Clear existing chart data and reload fresh from API
            this.chartData = [];
            this.loadHistoricalDataForMainChart();
          } else {
            // If chart not initialized yet, wait for it
            setTimeout(() => {
              if (this.isChartInitialized) {
                this.chartData = [];
                this.loadHistoricalDataForMainChart();
              }
            }, 200);
          }
        } else {
          this.errorMessage = response.message || 'Failed to load analytics';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'An error occurred while loading analytics';
        this.isLoading = false;
        console.error('Analytics load error:', error);
      }
    });
  }
}
