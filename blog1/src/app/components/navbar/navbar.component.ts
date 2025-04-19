// src/app/components/navbar/navbar.component.ts
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar">
      <div class="container">
        <a routerLink="/" class="logo">DevBlog</a>
        <ul class="nav-links">
          <li><a routerLink="/">Home</a></li>
          <li *ngIf="!isLoggedIn()"><a routerLink="/login">Login</a></li>
          <li *ngIf="!isLoggedIn()"><a routerLink="/register">Register</a></li>
          <li *ngIf="isLoggedIn()"><a routerLink="/create-blog">Create Blog</a></li>
          <li *ngIf="isLoggedIn()" class="dropdown">
            <a>{{ getUsername() }} <i class="fa fa-caret-down"></i></a>
            <ul class="dropdown-menu">
              <li><a routerLink="/user-home">My Blogs</a></li>
              <li><a (click)="logout()">Logout</a></li>
            </ul>
          </li>
        </ul>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: linear-gradient(135deg, #1a237e 0%, #0d47a1 100%);
      padding: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .nav-links {
      list-style-type: none;
      display: flex;
      gap: 25px;
      margin: 0;
      padding: 0;
      align-items: center;
    }

    .nav-links li {
      position: relative;
    }

    .nav-links li a {
      color: rgba(255, 255, 255, 0.9);
      text-decoration: none;
      cursor: pointer;
      font-weight: 500;
      padding: 0.5rem 0;
      transition: color 0.3s ease;
      position: relative;
    }

    .nav-links li a:hover {
      color: white;
      text-decoration: none;
    }

    .nav-links li a::after {
      content: '';
      position: absolute;
      width: 0;
      height: 2px;
      bottom: 0;
      left: 0;
      background-color: white;
      transition: width 0.3s ease;
    }

    .nav-links li a:hover::after {
      width: 100%;
    }

    .logo {
      font-size: 1.5rem;
      color: white;
      text-decoration: none;
      font-weight: 700;
      letter-spacing: 0.5px;
      transition: transform 0.3s ease;
    }

    .logo:hover {
      transform: translateY(-1px);
    }

    .dropdown-menu {
      display: none;
      position: absolute;
      right: 0;
      background: linear-gradient(135deg, #1a237e 0%, #0d47a1 100%);
      min-width: 180px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      padding: 0.5rem 0;
      list-style: none;
      border-radius: 8px;
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.3s ease;
    }

    .dropdown:hover .dropdown-menu {
      display: block;
      opacity: 1;
      transform: translateY(0);
    }

    .dropdown-menu li {
      padding: 0.5rem 1rem;
      transition: background-color 0.3s ease;
    }

    .dropdown-menu li:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .dropdown-menu a {
      color: white;
      text-decoration: none;
      display: block;
      font-size: 0.95rem;
    }

    .dropdown-menu a:hover::after {
      width: 0;
    }

    @media (max-width: 768px) {
      .container {
        padding: 0 1rem;
      }

      .nav-links {
        gap: 15px;
      }

      .nav-links li a {
        font-size: 0.95rem;
      }

      .dropdown-menu {
        position: absolute;
        min-width: 160px;
      }
    }
  `]
})
export class NavbarComponent {
  constructor(private router: Router) {}

  isLoggedIn(): boolean {
    const userStr = localStorage.getItem('user');
    return userStr !== null && userStr !== undefined;
  }

  getUsername(): string {
    const userStr = localStorage.getItem('user');
    if (!userStr) return 'Guest';
  
    try {
      const user = JSON.parse(userStr);
      return user.username || 'Guest';
    } catch (error) {
      return 'Guest';
    }
  }

  logout(): void {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}