// src\app\components\user-home\user-home.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../navbar/navbar.component';


@Component({
  selector: 'app-user-home',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  template: `
    <div class="page-wrapper">
      <app-navbar></app-navbar>

      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <h1>Welcome, {{ getUsername() }}!</h1>
          <p>Manage your blog posts and share your stories with the world</p>
          <a routerLink="/create-blog" class="create-blog-btn">
            <i class="fas fa-plus-circle"></i> Create New Blog
          </a>
        </div>
      </section>

      <div class="container">
        <!-- Success/Error Messages -->
        <div *ngIf="successMessage" class="alert alert-success alert-dismissible fade show" role="alert">
          {{ successMessage }}
          <button type="button" class="btn-close" (click)="successMessage = ''"></button>
        </div>

        <div *ngIf="errorMessage" class="alert alert-danger alert-dismissible fade show" role="alert">
          {{ errorMessage }}
          <button type="button" class="btn-close" (click)="errorMessage = ''"></button>
        </div>

        <!-- Blog Posts Grid -->
        <div class="blog-grid" *ngIf="blogs && blogs.length > 0; else noBlogs">
          <div class="blog-card" *ngFor="let blog of blogs">
            <div class="blog-image">
              <img [src]="blog.image_url" [alt]="blog.title">
              <div class="blog-date">
                {{ blog.created_at | date:'mediumDate' }}
              </div>
            </div>
            <div class="blog-content">
              <h2 class="blog-title">{{ blog.title }}</h2>
              <p class="blog-summary">{{ blog.summary }}</p>
              <div class="blog-actions">
                <a [routerLink]="['/blog', blog.id]" class="btn btn-view">
                  <i class="fas fa-eye"></i> View
                </a>
                <a [routerLink]="['/edit-blog', blog.id]" class="btn btn-edit">
                  <i class="fas fa-edit"></i> Edit
                </a>
                <button class="btn btn-delete" 
                        (click)="confirmDelete(blog.id)"
                        [disabled]="deletingBlogId === blog.id">
                  <span *ngIf="deletingBlogId === blog.id" 
                        class="spinner-border spinner-border-sm me-1">
                  </span>
                  <i *ngIf="deletingBlogId !== blog.id" class="fas fa-trash-alt"></i>
                  {{ deletingBlogId === blog.id ? 'Deleting...' : 'Delete' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- No Blogs Template -->
        <ng-template #noBlogs>
          <div class="no-blogs">
            <i class="fas fa-pen-fancy no-blogs-icon"></i>
            <h2>No Blog Posts Yet</h2>
            <p>Start sharing your thoughts with the world!</p>
            <a routerLink="/create-blog" class="btn btn-primary create-first-blog">
              <i class="fas fa-plus-circle"></i> Create Your First Blog
            </a>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .page-wrapper {
      min-height: 100vh;
      background-color: #f8f9fa;
    }

    .hero {
      background: linear-gradient(135deg, #1a237e 0%, #0d47a1 100%);
      color: white;
      padding: 4rem 0;
      text-align: center;
      margin-bottom: 3rem;
    }

    .hero-content {
      max-width: 800px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .hero h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      font-weight: 600;
    }

    .hero p {
      font-size: 1.2rem;
      opacity: 0.9;
      margin-bottom: 2rem;
    }

    .create-blog-btn {
      display: inline-block;
      padding: 1rem 2rem;
      background: white;
      color: #1a237e;
      border-radius: 50px;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .create-blog-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .blog-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 2rem;
      padding: 1rem 0;
    }

    .blog-card {
      background: white;
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease;
    }

    .blog-card:hover {
      transform: translateY(-5px);
    }

    .blog-image {
      position: relative;
      height: 200px;
      overflow: hidden;
    }

    .blog-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .blog-card:hover .blog-image img {
      transform: scale(1.05);
    }

    .blog-date {
      position: absolute;
      bottom: 1rem;
      right: 1rem;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.9rem;
    }

    .blog-content {
      padding: 1.5rem;
    }

    .blog-title {
      font-size: 1.4rem;
      margin-bottom: 1rem;
      color: #2d3748;
      font-weight: 600;
    }

    .blog-summary {
      color: #718096;
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }

    .blog-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-start;
    }

    .btn {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 500;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
      border: none;
      cursor: pointer;
    }

    .btn-view {
      background: #e2e8f0;
      color: #2d3748;
    }

    .btn-edit {
      background: #1a237e;
      color: white;
    }

    .btn-delete {
      background: #dc3545;
      color: white;
    }

    .btn:hover {
      transform: translateY(-2px);
    }

    .btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }

    .no-blogs {
      text-align: center;
      padding: 4rem 0;
    }

    .no-blogs-icon {
      font-size: 4rem;
      color: #1a237e;
      margin-bottom: 1rem;
    }

    .no-blogs h2 {
      font-size: 2rem;
      color: #2d3748;
      margin-bottom: 1rem;
    }

    .no-blogs p {
      color: #718096;
      margin-bottom: 2rem;
    }

    .create-first-blog {
      padding: 1rem 2rem;
      font-size: 1.1rem;
    }

    .alert {
      margin-bottom: 2rem;
      border-radius: 10px;
      padding: 1rem;
    }

    .alert-success {
      background-color: #d4edda;
      border-color: #c3e6cb;
      color: #155724;
    }

    .alert-danger {
      background-color: #f8d7da;
      border-color: #f5c6cb;
      color: #721c24;
    }

    @media (max-width: 768px) {
      .hero {
        padding: 3rem 0;
      }

      .hero h1 {
        font-size: 2rem;
      }

      .blog-grid {
        grid-template-columns: 1fr;
      }

      .blog-actions {
        flex-wrap: wrap;
      }

      .btn {
        flex: 1;
        text-align: center;
        justify-content: center;
      }
    }
  `]
})
export class UserHomeComponent implements OnInit {
  blogs: any[] = [];
  deletingBlogId: number | null = null;
  successMessage: string = '';
  errorMessage: string = '';
  apiUrl = 'http://localhost/php-blog1-api';

  constructor(
    private blogService: BlogService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadUserBlogs();
  }

  getUsername(): string {
    const userStr = localStorage.getItem('user');
    if (!userStr) return 'Guest';
    try {
      const user = JSON.parse(userStr);
      return user.username;
    } catch (error) {
      return 'Guest';
    }
  }

  loadUserBlogs() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    const user = JSON.parse(userStr);
    this.blogService.getUserBlogs(user.id).subscribe({
      next: (blogs) => {
        if (Array.isArray(blogs)) {
          this.blogs = blogs;
          this.errorMessage = '';
        } else {
          this.errorMessage = 'Invalid blog data received';
          this.blogs = [];
        }
      },
      error: (error) => {
        console.error('Error loading blogs:', error);
        this.errorMessage = error.message || 'Failed to load your blogs. Please try again.';
        this.blogs = [];
      }
    });
  }

  confirmDelete(blogId: number) {
    if (confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      this.deleteBlog(blogId);
    }
  }

  deleteBlog(blogId: number) {
    this.deletingBlogId = blogId;
    this.errorMessage = '';
    this.successMessage = '';

    this.blogService.deleteBlog(blogId).subscribe({
      next: () => {
        this.blogs = this.blogs.filter(blog => blog.id !== blogId);
        this.successMessage = 'Blog post deleted successfully!';
        this.deletingBlogId = null;
      },
      error: (error) => {
        console.error('Error deleting blog:', error);
        this.errorMessage = error.message || 'Failed to delete blog post. Please try again.';
        this.deletingBlogId = null;
      }
    });
  }
}