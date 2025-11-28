import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';

export interface MonitorUpdate {
  timestamp: Date;
  monitor: {
    uuid: string;
    name: string;
    url: string;
    lastPing: {
      statusCode: number;
      timeTaken: number;
      timestamp: Date;
      error?: string;
    };
    currentStatusCode: number;
    lastTimeTaken: number;
    averageResponseTime: number;
    uptimePercent: number;
    lastError?: string;
  };
}

export interface AnalyticsUpdate {
  timestamp: Date;
  data: {
    userId: string;
    totalMonitors: number;
    activeMonitors: number;
    pausedMonitors: number;
    averageUptime: number;
    averageResponseTime: number;
    monitors: any[];
  };
}

export interface MonitorStatusChange {
  timestamp: Date;
  monitorId: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private socketUrl = environment.socketUrl;
  private isConnected = false;

  // Subjects for emitting events
  private monitorUpdateSubject = new Subject<MonitorUpdate>();
  private analyticsUpdateSubject = new Subject<AnalyticsUpdate>();
  private monitorStatusSubject = new Subject<MonitorStatusChange>();

  // Observables
  public monitorUpdate$ = this.monitorUpdateSubject.asObservable();
  public analyticsUpdate$ = this.analyticsUpdateSubject.asObservable();
  public monitorStatus$ = this.monitorStatusSubject.asObservable();

  constructor(private storageService: StorageService) { }

  /**
   * Initialize socket connection with JWT token
   */
  initializeSocket(): void {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    const token = this.storageService.getAccessToken();
    if (!token) {
      console.error('No access token found. Cannot initialize socket.');
      return;
    }

    console.log('Initializing socket connection...');

    this.socket = io(this.socketUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.setupEventListeners();
  }

  /**
   * Setup socket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Connection error:', error.message);
      this.isConnected = false;
    });

    // Listen for monitor updates
    this.socket.on('monitor:update', (data: MonitorUpdate) => {
      console.log('📊 Monitor update received:', data);
      this.monitorUpdateSubject.next(data);
    });

    // Listen for analytics updates
    this.socket.on('analytics:update', (data: AnalyticsUpdate) => {
      console.log('📈 Analytics update received:', data);
      this.analyticsUpdateSubject.next(data);
    });

    // Listen for status changes
    this.socket.on('monitor:status', (data: MonitorStatusChange) => {
      console.log('🔄 Status change received:', data);
      this.monitorStatusSubject.next(data);
    });
  }

  /**
   * Request analytics from server
   */
  requestAnalytics(): void {
    if (this.socket?.connected) {
      this.socket.emit('request:analytics');
    }
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('Socket disconnected');
    }
  }

  /**
   * Check if socket is connected
   */
  getConnectionStatus(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Get socket instance (for advanced usage)
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

