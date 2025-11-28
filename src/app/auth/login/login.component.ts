import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CommonService } from '../../shared/services/common.service';
import { ApiService } from '../../shared/services/api.service';
import { StorageService } from '../../shared/services/storage.service';
import { SocketService } from '../../shared/services/socket.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private commonService: CommonService,
    private apiService: ApiService,
    private storageService: StorageService,
    private socketService: SocketService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false],
    });
  }

  get email() { return this.loginForm.get('email')!; }
  get password() { return this.loginForm.get('password')!; }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { email, password } = this.loginForm.value;

      this.apiService.login(email, password).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Store tokens and user data
            this.storageService.setAccessToken(response.data.accessToken);
            this.storageService.setRefreshToken(response.data.refreshToken);
            this.storageService.setUser(response.data.user);

            // Initialize socket connection after successful login
            this.socketService.initializeSocket();

            // Navigate to dashboard
            this.commonService.navigateToPage('/dashboard', true);
          } else {
            this.errorMessage = response.message || 'Login failed';
            this.isLoading = false;
          }
        },
        error: (error) => {
          this.errorMessage = error.message || 'An error occurred during login';
          this.isLoading = false;
          console.error('Login error:', error);
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  redirectToSignUp() {
    this.commonService.navigateToPage('/auth/signup', true);
  }
}
