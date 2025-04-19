// src\app\components\home\home.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BlogService, Blog } from '../../services/blog.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { AISummaryComponent } from '../ai-summary/ai-summary.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, AISummaryComponent],
  template: `
    <div class="page-wrapper">
      <app-navbar></app-navbar>
      
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <h1>Welcome to DevBlog</h1>
          <p>Discover stories, thinking, and expertise from writers on any topic.</p>
        </div>
      </section>

      <!-- AI Summary Section -->
      <div *ngIf="!loading && !error && blogs.length > 0" class="ai-featured-summary">
        <div class="container">
          <div class="featured-blog-wrapper">
            <div class="featured-blog-content">
              <div class="featured-blog-header">
                <h2>Featured Post</h2>
                <span class="featured-badge">Today's Pick</span>
              </div>
              <h3 class="featured-blog-title">{{ latestBlog?.title }}</h3>
              <p class="featured-blog-author">By {{ latestBlog?.author }} · {{ latestBlog?.created_at | date:'medium' }}</p>
              
              <!-- AI Summary Component -->
              <app-ai-summary [blog]="latestBlog"></app-ai-summary>
              
              <a [routerLink]="['/blog', latestBlog?.id]" class="read-more-btn">Read Full Article</a>
            </div>
            <div class="featured-blog-image" *ngIf="latestBlog?.image_url">
              <img [src]="latestBlog?.image_url" [alt]="latestBlog?.title">
            </div>
          </div>
        </div>
      </div>

      <!-- Blog Posts Grid -->
      <div *ngIf="!loading && !error && blogs.length > 0" class="blog-container">
        <div class="blog-grid">
          <div *ngFor="let blog of blogs" class="blog-card" [routerLink]="['/blog', blog.id]">
            <div class="blog-image-wrapper">
              <img [src]="blog.image_url" class="blog-image" [alt]="blog.title">
              <div class="blog-overlay"></div>
            </div>
            <div class="blog-content">
              <h5 class="blog-title">{{blog.title}}</h5>
              <p class="blog-summary">{{blog.summary}}</p>
              <div class="blog-meta">
                <div class="author-info">
                  <span class="author-label">Author</span>
                  <span class="author-name">{{blog.author}}</span>
                </div>
                <span class="date">{{blog.created_at | date:'MMM d'}}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- States -->
      <div *ngIf="loading" class="text-center my-3">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div *ngIf="error" class="alert alert-danger m-2">
        {{ error }}
      </div>

      <div *ngIf="!loading && !error && blogs.length === 0" class="alert alert-info m-2">
        No blog posts available at the moment.
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
              <li><a routerLink="/create-blog">Create Blog</a></li>
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
  styles: [`
    :host {
      display: block;
      height: 100vh;
      overflow-y: auto;
    }

    .hero {
      background: linear-gradient(135deg, #1a237e 0%, #0d47a1 100%);
      height: 25vh;
      min-height: 200px;
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
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }

    /* AI Featured Summary Section */
    .ai-featured-summary {
      margin-top: -2rem;
      position: relative;
      z-index: 2;
      padding: 0 1rem;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .featured-blog-wrapper {
      background: white;
      border-radius: 12px;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
      padding: 2rem;
      margin-bottom: 2rem;
      display: flex;
      flex-direction: row;
      gap: 2.5rem;
    }

    .featured-blog-content {
      flex: 2;
    }

    .featured-blog-image {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      overflow: hidden;
    }

    .featured-blog-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 8px;
    }

    .featured-blog-header {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
    }

    .featured-blog-header h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a237e;
      margin: 0;
    }

    .featured-badge {
      margin-left: 1rem;
      background-color: #e8eaf6;
      color: #3949ab;
      padding: 0.3rem 0.8rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .featured-blog-title {
      font-size: 2rem;
      line-height: 1.3;
      color: #212121;
      margin-bottom: 0.75rem;
    }

    .featured-blog-author {
      color: #757575;
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
    }

    .read-more-btn {
      display: inline-block;
      background-color: #1a237e;
      color: white;
      padding: 0.8rem 1.5rem;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 1rem;
      transition: all 0.2s ease;
    }

    .read-more-btn:hover {
      background-color: #0d47a1;
      transform: translateY(-2px);
    }

    /* Responsive design for featured blog */
    @media (max-width: 768px) {
      .featured-blog-wrapper {
        flex-direction: column;
      }
      
      .featured-blog-image {
        height: 250px;
        order: -1;
      }
    }

    .blog-container {
      flex: 1;
      padding: 1rem;
      position: relative;
      z-index: 2;
      margin-bottom: 2rem; /* Space for footer */
    }

    .blog-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .blog-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      height: 400px; /* Fixed height */
    }

    .blog-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .blog-image-wrapper {
      position: relative;
      height: 200px;
      overflow: hidden;
    }

    .blog-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }

    .blog-card:hover .blog-image {
      transform: scale(1.1);
    }

    .blog-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 100%);
    }

    .blog-content {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      flex: 1;
      background: white;
    }

    .blog-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a237e;
      margin-bottom: 1rem;
      line-height: 1.4;
    }

    .blog-summary {
      font-size: 0.95rem;
      color: #546e7a;
      line-height: 1.6;
      flex: 1;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }

    .blog-meta {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .author-info {
      display: flex;
      flex-direction: column;
    }

    .author-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: #9e9e9e;
      letter-spacing: 0.5px;
    }

    .author-name {
      font-size: 0.95rem;
      color: #1a237e;
      font-weight: 500;
    }

    .date {
      font-size: 0.85rem;
      color: #9e9e9e;
      font-weight: 500;
    }

    .footer {
      background-color: #1a237e;
      color: white;
      padding: 2rem 1rem;
    }

    .footer-content {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      max-width: 1400px;
      margin: 0 auto;
      gap: 2rem;
    }

    .footer-section {
      flex: 1;
      min-width: 250px;
    }

    .footer-section h3 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }

    .footer-section h4 {
      font-size: 1.2rem;
      margin-bottom: 1rem;
    }

    .footer-section p {
      color: #bdc5d5;
      line-height: 1.6;
    }

    .footer-section ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .footer-section ul li {
      margin-bottom: 0.5rem;
    }

    .footer-section ul li a {
      color: #bdc5d5;
      text-decoration: none;
      transition: color 0.2s;
    }

    .footer-section ul li a:hover {
      color: white;
    }

    .social-links {
      display: flex;
      gap: 1rem;
    }

    .social-links a {
      color: white;
      background-color: rgba(255, 255, 255, 0.1);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
    }

    .social-links a:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }

    .footer-bottom {
      margin-top: 2rem;
      text-align: center;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      max-width: 1400px;
      margin-left: auto;
      margin-right: auto;
    }

    .footer-bottom p {
      margin: 0;
      color: #bdc5d5;
      font-size: 0.9rem;
    }
  `]
})
export class HomeComponent implements OnInit {
  blogs: Blog[] = [];
  latestBlog: Blog | null = null;
  loading = false;
  error = '';
  currentYear = new Date().getFullYear();

  constructor(private blogService: BlogService) {}

  ngOnInit(): void {
    this.loadBlogs();
  }

  loadBlogs(): void {
    this.loading = true;
    this.error = '';
    
    this.blogService.getBlogs().subscribe({
      next: (blogs) => {
        this.blogs = blogs;
        
        if (blogs.length > 0) {
          // Sort blogs by date (newest first) and get the latest one
          this.blogs.sort((a, b) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
          this.latestBlog = this.blogs[0];
        }
        
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load blog posts. Please try again later.';
        this.loading = false;
      }
    });
  }
}
