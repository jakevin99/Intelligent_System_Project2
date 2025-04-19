//src\app\components\blog-detail\blog-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BlogService, Blog } from '../../services/blog.service';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  template: `
    <div class="page-wrapper">
      <app-navbar></app-navbar>
      
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <h1>Blog Details</h1>
          <p>Explore the full story</p>
        </div>
      </section>

      <!-- Loading State -->
      <div *ngIf="loading" class="text-center my-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="alert alert-danger m-3">
        {{ error }}
      </div>

      <!-- Blog Content -->
      <div *ngIf="blog && !loading && !error" class="container my-5">
        <article class="blog-post">
          <!-- Blog Header -->
          <header class="blog-header mb-4">
            <h1 class="blog-title">{{ blog.title }}</h1>
            <div class="blog-meta">
              <div class="author-info">
                <i class="fas fa-user-circle"></i>
                <span class="author-label">Written by</span>
                <span class="author-name">{{ blog.author }}</span>
              </div>
              <div class="date-info">
                <i class="fas fa-calendar-alt"></i>
                <span>Published on {{ blog.created_at | date:'mediumDate' }}</span>
              </div>
            </div>
          </header>

          <!-- Blog Image -->
          <div class="blog-image-wrapper mb-4">
            <img [src]="getImageUrl(blog.image)" [alt]="blog.title" class="blog-image">
          </div>

          <!-- Blog Content -->
          <div class="blog-content">
            <div class="summary">
              <h5>Summary</h5>
              <p class="lead">{{ blog.summary }}</p>
            </div>
            <div class="content" [innerHTML]="blog.content"></div>
          </div>
        </article>
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
      padding: 4rem 2rem;
      text-align: center;
      margin-bottom: 2rem;
    }

    .hero-content h1 {
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 1rem;
    }

    .hero-content p {
      font-size: 1.2rem;
      opacity: 0.9;
    }

    .blog-post {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .blog-header {
      text-align: center;
      border-bottom: 2px solid #eee;
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
    }

    .blog-title {
      font-size: 2.5rem;
      font-weight: bold;
      color: #333;
      margin-bottom: 1.5rem;
    }

    .blog-meta {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      color: #666;
      font-size: 1.1rem;
    }

    .author-info, .date-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .author-label {
      color: #666;
      margin-right: 0.25rem;
    }

    .author-name {
      color: #0d47a1;
      font-weight: 600;
    }

    .blog-meta i {
      color: #0d47a1;
      font-size: 1.2rem;
    }

    .blog-image-wrapper {
      width: 100%;
      margin: 2rem auto;
      text-align: center;
    }

    .blog-image {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease;
    }

    .blog-image:hover {
      transform: scale(1.01);
      cursor: pointer;
    }

    .blog-content {
      font-size: 1.1rem;
      line-height: 1.8;
      color: #444;
      max-width: 900px;
      margin: 0 auto;
    }

    .summary {
      background-color: #f8f9fa;
      padding: 1.5rem;
      border-radius: 8px;
      margin: 2rem 0;
      border-left: 4px solid #0d47a1;
    }

    .summary h5 {
      color: #0d47a1;
      margin-bottom: 1rem;
      font-size: 1.2rem;
    }

    .lead {
      font-size: 1.25rem;
      font-weight: 300;
      color: #555;
      margin-bottom: 0;
    }

    .content {
      padding: 1rem 0;
    }

    @media (max-width: 768px) {
      .hero {
        padding: 3rem 1rem;
      }

      .blog-title {
        font-size: 2rem;
      }

      .blog-post {
        padding: 1.5rem;
      }

      .blog-meta {
        font-size: 1rem;
      }

      .blog-content {
        font-size: 1rem;
      }
    }
  `]
})
export class BlogDetailComponent implements OnInit {
  blog: Blog | null = null;
  loading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadBlog(params['id']);
      }
    });
  }

  loadBlog(id: number): void {
    this.loading = true;
    this.error = '';

    this.blogService.getBlog(id).subscribe({
      next: (blog) => {
        this.blog = blog;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading blog:', error);
        this.error = 'Failed to load blog post. Please try again later.';
        this.loading = false;
      }
    });
  }

  getImageUrl(imagePath: string | null): string {
    if (!imagePath) return 'assets/default-blog-image.jpg';
    return `http://localhost/php-blog1-api/backend/uploads/${imagePath}`;// this is the path where image is stored 
  }
}
