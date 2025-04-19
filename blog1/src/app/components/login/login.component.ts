//src\app\components\login\login.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    NavbarComponent
  ],
  template: `
    <div class="page-wrapper">
      <app-navbar></app-navbar>
      
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <h1>Welcome Back</h1>
        </div>
      </section>

      <!-- Login Form -->
      <div class="form-container" [class.shake]="isShaking">
        <!-- Error Alert -->
        <div class="alert" 
             [class.alert-danger]="loginError && !isUsernameError"
             [class.alert-warning]="isUsernameError"
             *ngIf="loginError">
          <i class="fas" 
             [class.fa-exclamation-circle]="!isUsernameError"
             [class.fa-user-times]="isUsernameError"></i>
          {{ loginError }}
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="username">Username</label>
            <input 
              type="text" 
              id="username" 
              formControlName="username"
              class="form-control"
              [class.is-invalid]="(username?.invalid && username?.touched) || isUsernameError"
              (input)="clearError()"
            >
            <div class="invalid-feedback" *ngIf="username?.invalid && username?.touched">
              Username is required
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password"
              class="form-control"
              [class.is-invalid]="password?.invalid && password?.touched"
            >
            <div class="invalid-feedback" *ngIf="password?.invalid && password?.touched">
              Password is required
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="loginForm.invalid || isLoading">
              {{ isLoading ? 'Signing in...' : 'Sign In' }}
            </button>
          </div>

          <div class="form-footer">
            <p>Don't have an account? <a routerLink="/register">Register</a></p>
          </div>
        </form>
      </div>

      <!-- Footer -->
      <footer class="footer">
        <div class="footer-content">
          <div class="footer-section">
            <h3>DevBlog</h3>
            <p>Share your knowledge and experiences with our growing community.</p>
          </div>
          <div class="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a routerLink="/">Home</a></li>
              <li><a routerLink="/about">About</a></li>
            </ul>
          </div>
          <div class="footer-section">
            <h4>Connect</h4>
            <div class="social-links">
              <a href="#" target="_blank"><i class="fab fa-github"></i></a>
              <a href="#" target="_blank"><i class="fab fa-linkedin"></i></a>
              <a href="#" target="_blank"><i class="fab fa-twitter"></i></a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; {{currentYear}} DevBlog. All rights reserved.</p>
        </div>
      </footer>
    </div>
  `,
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ],
  styles: [`
    .page-wrapper {
      min-height: 100vh;
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f5f5f5;
    }

    .hero {
      background: linear-gradient(135deg, #1a237e 0%, #0d47a1 100%);
      height: 15vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: white;
      position: relative;
    }

    .hero::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle, transparent 20%, #000 150%);
      opacity: 0.3;
    }

    .hero-content {
      position: relative;
      z-index: 1;
      padding: 0 1rem;
    }

    .hero-content h1 {
      font-size: 1.6rem;
      font-weight: 700;
      margin-bottom: 0.2rem;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }

    .hero-content p {
      font-size: 0.85rem;
    }

    .form-container {
      max-width: 450px;
      width: 85%;
      margin: -1.5rem auto 0;
      padding: 1rem 2rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
      position: relative;
      z-index: 2;
    }

    .form-group {
      margin-bottom: 0.7rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.3rem;
      font-weight: 500;
      color: #1a237e;
      font-size: 0.9rem;
    }

    .form-control {
      width: 90%;
      height: 2.5rem;
      padding: 0.4rem 1rem;
      font-size: 0.9rem;
      margin: 0.3rem auto 0;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      display: block;
      transition: all 0.3s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #1a237e;
      box-shadow: 0 0 0 2px rgba(26, 35, 126, 0.1);
    }

    .form-control.is-invalid {
      border-color: #dc3545;
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%23dc3545' viewBox='0 0 12 12'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 1rem center;
      background-size: 1.5rem;
    }

    .invalid-feedback {
      width: 90%;
      margin: 0.25rem auto 0;
      color: #dc3545;
      font-size: 0.875rem;
    }

    .form-actions {
      width: 90%;
      margin: 1.5rem auto 0;
    }

    .btn {
      width: 100%;
      height: 2.5rem;
      padding: 0 1rem;
      font-size: 0.9rem;
      border-radius: 8px;
      display: block;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-primary {
      background: #1a237e;
      color: white;
      border: none;
      font-weight: 500;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0d47a1;
      transform: translateY(-1px);
    }

    .btn-primary:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .form-footer {
      text-align: center;
      margin-top: 0.8rem;
      color: #666;
      font-size: 0.9rem;
    }

    .form-footer a {
      color: #1a237e;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .form-footer a:hover {
      color: #0d47a1;
      text-decoration: underline;
    }

    .footer {
      background: linear-gradient(135deg, #1a237e 0%, #0d47a1 100%);
      color: white;
      padding: 0.8rem 0 0;
      margin-top: auto;
    }

    .footer-content {
      max-width: 1400px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 1rem;
      padding: 0 2rem 0.3rem;
    }

    .footer-section h3 {
      font-size: 1.1rem;
      margin-bottom: 0.3rem;
      font-weight: 600;
    }

    .footer-section h4 {
      font-size: 0.9rem;
      margin-bottom: 0.3rem;
      font-weight: 500;
    }

    .footer-section p {
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.3;
      margin-bottom: 0.3rem;
    }

    .footer-section ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .footer-section ul li {
      margin-bottom: 0.3rem;
      font-size: 0.8rem;
    }

    .footer-section ul li a {
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      transition: color 0.3s ease;
    }

    .footer-section ul li a:hover {
      color: white;
    }

    .social-links {
      display: flex;
      gap: 0.8rem;
    }

    .social-links a {
      color: white;
      font-size: 1.2rem;
      transition: transform 0.3s ease;
    }

    .social-links a:hover {
      transform: translateY(-3px);
    }

    .footer-bottom {
      margin-top: 0.8rem;
      padding: 0.5rem;
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .footer-bottom p {
      margin: 0;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.8rem;
    }

    /* Desktop and Tablet */
    @media (min-width: 769px) {
      .page-wrapper {
        overflow: hidden;
      }
      
      .hero {
        min-height: auto;
      }
      
      .form-container {
        flex-shrink: 0;
      }
      
      .footer {
        flex-shrink: 0;
      }
    }

    /* Mobile Only */
    @media (max-width: 768px) {
      .page-wrapper {
        height: auto;
        overflow-y: auto;
      }
      
      .hero {
        min-height: 100px;
      }
      
      .form-container {
        margin: -1.5rem auto 1rem;
      }
    }

    .alert {
      width: 90%;
      margin: 0 auto 1rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .alert-danger {
      background-color: #fff5f5;
      color: #dc3545;
      border: 1px solid #ffcdd2;
    }

    .alert-warning {
      background-color: #fff3cd;
      color: #856404;
      border: 1px solid #ffeeba;
    }

    .is-invalid {
      border-color: #dc3545;
      padding-right: calc(1.5em + 0.75rem);
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right calc(0.375em + 0.1875rem) center;
      background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  loginError: string | null = null;
  isShaking = false;
  attemptCount = 0;
  readonly MAX_ATTEMPTS = 3;
  currentYear = new Date().getFullYear();
  isUsernameError = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  get username() { 
    return this.loginForm.get('username'); 
  }

  get password() { 
    return this.loginForm.get('password'); 
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.loginError = null;
      this.isUsernameError = false;

      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.router.navigate(['/']);
          }
        },
        error: (error) => {
          if (error.type === 'USERNAME_NOT_FOUND') {
            this.isUsernameError = true;
            this.loginError = `Username "${this.loginForm.value.username}" not found. Please check your username.`;
            // Clear both fields for username error
            this.loginForm.patchValue({
              username: '',
              password: ''
            });
          } else if (error.type === 'INVALID_PASSWORD') {
            this.isUsernameError = false;
            this.attemptCount++;
            
            if (this.attemptCount >= this.MAX_ATTEMPTS) {
              this.loginError = `Too many failed attempts. Please try again later. (${this.MAX_ATTEMPTS} attempts limit)`;
            } else {
              this.loginError = `Wrong password. Please try again. (${this.MAX_ATTEMPTS - this.attemptCount} attempts remaining)`;
            }
            // Only clear password for password error
            this.loginForm.patchValue({ password: '' });
          } else {
            this.loginError = error.message;
          }
          
          this.handleLoginError();
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }

  clearError() {
    this.loginError = null;
    this.isUsernameError = false;
  }

  private handleLoginError(): void {
    this.isShaking = true;
    setTimeout(() => {
      this.isShaking = false;
    }, 820);
    
    if (this.attemptCount >= this.MAX_ATTEMPTS) {
      this.loginForm.disable();
      setTimeout(() => {
        this.loginForm.enable();
        this.attemptCount = 0;
        this.loginError = null;
        this.isUsernameError = false;
      }, 30000); // 30 seconds timeout
    }
  }
}
