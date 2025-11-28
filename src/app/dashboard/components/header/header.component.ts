import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../shared/services/api.service';
import { StorageService } from '../../../shared/services/storage.service';
import { SocketService } from '../../../shared/services/socket.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  serImage = '/assets/images/pic_1.png';
  isMobileMenuOpen = false;
  isDesktopMenuOpen = false;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private storageService: StorageService,
    private socketService: SocketService
  ) {}

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  toggleDesktopMenu(): void {
    this.isDesktopMenuOpen = !this.isDesktopMenuOpen;
  }

  closeMenus(): void {
    this.isMobileMenuOpen = false;
    this.isDesktopMenuOpen = false;
  }

  navigateTo(route: string): void {
    this.router.navigate([`/dashboard/${route}`]);
    this.closeMenus(); // Close menu after navigation
  }

  logout(): void {
    this.apiService.logout().subscribe({
      next: () => {
        // Disconnect socket
        this.socketService.disconnect();
        // Clear storage
        this.storageService.clearAll();
        // Navigate to login
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Even if API call fails, clear local data and redirect
        this.socketService.disconnect();
        this.storageService.clearAll();
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
