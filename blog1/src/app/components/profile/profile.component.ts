//src\app\components\profile\profile.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  template: `
    <div class="profile-container">
      <h1>Welcome, {{ getUsername() }}!</h1>
      <button (click)="logout()">Logout</button>
    </div>
  `,
  styles: [/* Your styles here */]
})
export class ProfileComponent {
  constructor(private router: Router) {}

  // Get the logged-in user's username from localStorage
  getUsername(): string {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.username || '';
  }

  // Log out the user
  logout(): void {
    localStorage.removeItem('user'); // Clear the user data
    this.router.navigate(['/login']); // Redirect to login page
  }
}