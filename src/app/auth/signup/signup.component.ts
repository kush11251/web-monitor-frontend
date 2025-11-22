import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CommonService } from '../../shared/services/common.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  signupForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private commonService: CommonService,
  ) {
    this.signupForm = this.fb.group(
      {
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: this.checkPasswords }
    );
  }

  get firstName() { return this.signupForm.get('firstName')!; }
  get lastName() { return this.signupForm.get('lastName')!; }
  get email() { return this.signupForm.get('email')!; }
  get password() { return this.signupForm.get('password')!; }
  get confirmPassword() { return this.signupForm.get('confirmPassword')!; }

  checkPasswords(form: FormGroup) {
    const pass = form.get('password')?.value;
    const confirmPass = form.get('confirmPassword')?.value;
    return pass === confirmPass ? null : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.signupForm.valid) {
      console.log("Signup form:", this.signupForm.value);
    }
  }

  redirectToSignIn() {
    this.commonService.navigateToPage('/auth/login', true);
  }
}
