import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../shared/services/api.service';
import { StorageService } from '../../../shared/services/storage.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  changePasswordForm: FormGroup;
  isSubmitting = false;
  submitError = '';
  submitSuccess = '';
  user: any = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private storageService: StorageService
  ) {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    this.user = this.storageService.getUser();
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  get currentPassword() {
    return this.changePasswordForm.get('currentPassword')!;
  }

  get newPassword() {
    return this.changePasswordForm.get('newPassword')!;
  }

  get confirmPassword() {
    return this.changePasswordForm.get('confirmPassword')!;
  }

  onSubmitChangePassword(): void {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';
    this.submitSuccess = '';

    const { currentPassword, newPassword } = this.changePasswordForm.value;

    this.apiService.changePassword(currentPassword, newPassword).subscribe({
      next: (response) => {
        if (response.success) {
          this.submitSuccess = 'Password changed successfully!';
          this.changePasswordForm.reset();
          // Clear error after 3 seconds
          setTimeout(() => {
            this.submitSuccess = '';
          }, 3000);
        } else {
          this.submitError = response.message || 'Failed to change password';
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        this.submitError = error.message || 'An error occurred while changing password';
        this.isSubmitting = false;
        console.error('Change password error:', error);
      }
    });
  }
}
