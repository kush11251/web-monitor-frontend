import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { inject } from '@vercel/analytics';

import { environment } from '../environments/environment';
import { StorageService } from './shared/services/storage.service';
import { SocketService } from './shared/services/socket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  title = 'web-monitor-frontend';

  constructor(
    private storageService: StorageService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    console.log("Environment Name: ", environment.production ? 'Production' : 'Development');

    inject();

    // Initialize socket if user is already authenticated
    if (this.storageService.isAuthenticated()) {
      this.socketService.initializeSocket();
    }
  }
}
