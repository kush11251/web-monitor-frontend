import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../shared/services/api.service';
import { SocketService, MonitorUpdate } from '../../../shared/services/socket.service';
import { Subscription } from 'rxjs';

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

@Component({
  selector: 'app-website-monitoring',
  templateUrl: './website-monitoring.component.html',
  styleUrl: './website-monitoring.component.css'
})
export class WebsiteMonitoringComponent implements OnInit, OnDestroy {
  analyticsData: AnalyticsData | null = null;
  isLoading = true;
  errorMessage = '';

  showPopup = false;
  monitorForm: FormGroup;
  isSubmitting = false;
  submitError = '';

  // Subscriptions
  private monitorUpdateSub?: Subscription;
  private analyticsUpdateSub?: Subscription;

  constructor(
    private apiService: ApiService,
    private socketService: SocketService,
    private fb: FormBuilder
  ) {
    this.monitorForm = this.fb.group({
      name: ['', [Validators.required]],
      url: ['', [Validators.required]],
      type: ['website', [Validators.required]],
      refreshTime: [60, [Validators.required, Validators.min(5)]],
      occurances: [0, [Validators.required, Validators.min(0)]],
      parallelLimit: [1, [Validators.required, Validators.min(1)]],
      // API specific fields
      apiType: ['GET'],
      headers: ['{}'],
      requestBody: ['{}']
    });

    // Watch type changes to show/hide API fields
    this.monitorForm.get('type')?.valueChanges.subscribe(type => {
      if (type === 'api') {
        this.monitorForm.get('apiType')?.setValidators([Validators.required]);
        this.monitorForm.get('headers')?.setValidators([Validators.required]);
        this.monitorForm.get('requestBody')?.setValidators([Validators.required]);
      } else {
        this.monitorForm.get('apiType')?.clearValidators();
        this.monitorForm.get('headers')?.clearValidators();
        this.monitorForm.get('requestBody')?.clearValidators();
      }
      this.monitorForm.get('apiType')?.updateValueAndValidity();
      this.monitorForm.get('headers')?.updateValueAndValidity();
      this.monitorForm.get('requestBody')?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.loadAnalytics();
    this.setupSocketListeners();
  }

  ngOnDestroy(): void {
    if (this.monitorUpdateSub) {
      this.monitorUpdateSub.unsubscribe();
    }
    if (this.analyticsUpdateSub) {
      this.analyticsUpdateSub.unsubscribe();
    }
  }

  /**
   * Load analytics data from API
   */
  loadAnalytics(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.getAllAnalytics().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.analyticsData = response.data;
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
   * Setup socket listeners for real-time updates
   */
  setupSocketListeners(): void {
    if (!this.socketService.getConnectionStatus()) {
      this.socketService.initializeSocket();
    }

    this.monitorUpdateSub = this.socketService.monitorUpdate$.subscribe((update: MonitorUpdate) => {
      this.handleMonitorUpdate(update);
    });

    this.analyticsUpdateSub = this.socketService.analyticsUpdate$.subscribe((update) => {
      if (update.data) {
        this.analyticsData = update.data;
      }
    });
  }

  /**
   * Handle real-time monitor update
   */
  handleMonitorUpdate(update: MonitorUpdate): void {
    if (!this.analyticsData) return;

    const monitor = this.analyticsData.monitors.find(m => m.uuid === update.monitor.uuid);
    if (monitor) {
      monitor.currentStatusCode = update.monitor.currentStatusCode;
      monitor.lastTimeTaken = update.monitor.lastTimeTaken;
      monitor.averageResponseTime = update.monitor.averageResponseTime;
      monitor.uptimePercent = update.monitor.uptimePercent;
      monitor.lastError = update.monitor.lastError;
      monitor.lastCheckedAt = new Date(update.monitor.lastPing.timestamp);
    }
  }

  /**
   * Get computed cards data from analytics
   */
  get cards() {
    if (!this.analyticsData) return [];

    return [
      {
        icon: 'fa-solid fa-server',
        iconColor: 'text-blue-400',
        value: this.analyticsData.totalMonitors.toString(),
        label: 'Total Monitors',
        change: `+${this.analyticsData.activeMonitors} Active`,
        changeColor: 'text-green-400'
      },
      {
        icon: 'fa-solid fa-chart-line',
        iconColor: 'text-purple-400',
        value: `${this.analyticsData.averageUptime}%`,
        label: 'Avg Uptime',
        change: `${this.analyticsData.averageUptime}%`,
        changeColor: this.analyticsData.averageUptime >= 99 ? 'text-green-400' : 'text-yellow-400'
      },
      {
        icon: 'fa-solid fa-stopwatch',
        iconColor: 'text-pink-400',
        value: `${this.analyticsData.averageResponseTime}ms`,
        label: 'Avg Response',
        change: `${this.analyticsData.averageResponseTime}ms`,
        changeColor: 'text-blue-400'
      },
      {
        icon: 'fa-solid fa-triangle-exclamation',
        iconColor: 'text-yellow-400',
        value: this.analyticsData.pausedMonitors.toString(),
        label: 'Paused',
        change: `${this.analyticsData.pausedMonitors} Paused`,
        changeColor: 'text-yellow-400'
      }
    ];
  }

  /**
   * Get card widgets from monitors
   */
  get cardWidgets() {
    if (!this.analyticsData) return [];

    return this.analyticsData.monitors.map(monitor => ({
      nameTag: monitor.name,
      nameSubTag: monitor.url,
      responseTime: monitor.lastTimeTaken || 0,
      uptime: parseFloat(monitor.uptimePercent.toString()),
      status: monitor.status === 'active' ? 'Online' : 'Offline',
      uuid: monitor.uuid
    }));
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

  addNewWidget() {
    this.openPopup();
  }

  openPopup() {
    this.showPopup = true;
    this.submitError = '';
    // Reset form
    this.monitorForm.reset({
      name: '',
      url: '',
      type: 'website',
      refreshTime: 60,
      occurances: 0,
      parallelLimit: 1,
      apiType: 'GET',
      headers: '{}',
      requestBody: '{}'
    });
  }

  closePopup() {
    this.showPopup = false;
    this.submitError = '';
    this.monitorForm.reset({
      name: '',
      url: '',
      type: 'website',
      refreshTime: 60,
      occurances: 0,
      parallelLimit: 1,
      apiType: 'GET',
      headers: '{}',
      requestBody: '{}'
    });
  }

  get isApiType(): boolean {
    return this.monitorForm.get('type')?.value === 'api';
  }

  submitForm() {
    if (this.monitorForm.invalid) {
      this.monitorForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';

    const formValue = this.monitorForm.value;

    // Validate URL
    let url = formValue.url.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    // Parse JSON fields
    let headers = {};
    let requestBody = {};

    if (this.isApiType) {
      try {
        headers = JSON.parse(formValue.headers || '{}');
      } catch (e) {
        this.submitError = 'Invalid JSON in Headers field';
        this.isSubmitting = false;
        return;
      }

      try {
        requestBody = JSON.parse(formValue.requestBody || '{}');
      } catch (e) {
        this.submitError = 'Invalid JSON in Request Body field';
        this.isSubmitting = false;
        return;
      }
    }

    const monitorData: any = {
      name: formValue.name,
      url: url,
      refreshTime: formValue.refreshTime || 60,
      occurances: formValue.occurances || 0,
      parallelLimit: formValue.parallelLimit || 1
    };

    if (this.isApiType) {
      monitorData.apiType = formValue.apiType || 'GET';
      monitorData.headers = headers;
      monitorData.requestBody = requestBody;

      this.apiService.addApiMonitor(monitorData).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadAnalytics();
            this.closePopup();
          } else {
            this.submitError = response.message || 'Failed to add monitor';
          }
          this.isSubmitting = false;
        },
        error: (error) => {
          this.submitError = error.message || 'An error occurred while adding monitor';
          this.isSubmitting = false;
          console.error('Add monitor error:', error);
        }
      });
    } else {
      this.apiService.addWebsiteMonitor(monitorData).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadAnalytics();
            this.closePopup();
          } else {
            this.submitError = response.message || 'Failed to add monitor';
          }
          this.isSubmitting = false;
        },
        error: (error) => {
          this.submitError = error.message || 'An error occurred while adding monitor';
          this.isSubmitting = false;
          console.error('Add monitor error:', error);
        }
      });
    }
  }
}
