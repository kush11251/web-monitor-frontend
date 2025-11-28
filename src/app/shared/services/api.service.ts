import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.storageService.getAccessToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    return throwError(() => new Error(errorMessage));
  }

  // Auth endpoints
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/login`, { email, password })
      .pipe(catchError(this.handleError));
  }

  signup(email: string, password: string, name?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/signup`, { email, password, name })
      .pipe(catchError(this.handleError));
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/logout`, {}, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/change-password`, 
      { currentPassword, newPassword }, 
      { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  refreshToken(): Observable<any> {
    const refreshToken = this.storageService.getRefreshToken();
    // Don't send access token in header for refresh token endpoint
    return this.http.post(`${this.apiUrl}/api/auth/refresh-token`, 
      { refreshToken }, 
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) })
      .pipe(catchError(this.handleError));
  }

  // Monitor endpoints
  addWebsiteMonitor(monitorData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/monitor/add/website`, monitorData, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  addApiMonitor(monitorData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/monitor/add/api`, monitorData, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  deleteMonitor(monitorId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/monitor/delete/${monitorId}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateMonitor(monitorId: string, monitorData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/monitor/update/${monitorId}`, monitorData, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateMonitorStatus(monitorId: string, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/api/monitor/status/${monitorId}`, { status }, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  getMonitorStats(monitorId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/monitor/stats/${monitorId}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  getAllAnalytics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/monitor/analytics/all`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }
}
