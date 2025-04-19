//src\app\components\create-blog\create-blog.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BlogService } from '../../services/blog.service';
import { NavbarComponent } from '../navbar/navbar.component';

interface BlogForm {
  title: string;
  summary: string;
  content: string;
}

@Component({
  selector: 'app-create-blog',
  standalone: true,
  imports: [FormsModule, CommonModule, NavbarComponent],
  template: `
    <div class="page-wrapper">
      <app-navbar></app-navbar>
      
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <h1>Create New Blog Post</h1>
          <p>Share your thoughts and ideas with the world</p>
        </div>
      </section>

      <div class="container mt-4">
        <div class="row">
          <div class="col-md-8 mx-auto">
            <!-- Alerts -->
            <div *ngIf="successMessage" class="alert alert-success alert-dismissible fade show" role="alert">
              {{ successMessage }}
              <button type="button" class="btn-close" (click)="successMessage = null"></button>
            </div>

            <div *ngIf="imageError" class="alert alert-danger alert-dismissible fade show" role="alert">
              {{ imageError }}
              <button type="button" class="btn-close" (click)="imageError = null"></button>
            </div>

            <div class="blog-form-card">
              <form #blogForm="ngForm" (ngSubmit)="onSubmit(blogForm)" class="blog-form">
                <!-- Title Input -->
                <div class="form-group mb-4">
                  <div class="input-label">
                    <i class="fas fa-heading"></i>
                    <label for="title">Title</label>
                  </div>
                  <input 
                    type="text" 
                    id="title" 
                    name="title" 
                    [(ngModel)]="blog.title" 
                    required 
                    class="form-control custom-input"
                    placeholder="Enter an engaging title for your blog post"
                  >
                </div>

                <!-- Summary Input -->
                <div class="form-group mb-4">
                  <div class="input-label">
                    <i class="fas fa-align-left"></i>
                    <label for="summary">Summary</label>
                  </div>
                  <textarea 
                    id="summary" 
                    name="summary" 
                    [(ngModel)]="blog.summary" 
                    required 
                    class="form-control custom-textarea"
                    rows="3"
                    placeholder="Write a compelling summary that captures your readers' attention"
                  ></textarea>
                </div>

                <!-- Content Input -->
                <div class="form-group mb-4">
                  <div class="input-label">
                    <i class="fas fa-pen-fancy"></i>
                    <label for="content">Content</label>
                  </div>
                  <textarea 
                    id="content" 
                    name="content" 
                    [(ngModel)]="blog.content" 
                    required 
                    class="form-control custom-textarea content-area"
                    rows="8"
                    placeholder="Share your story, insights, or knowledge here..."
                  ></textarea>
                </div>

                <!-- Image Upload -->
                <div class="form-group mb-4">
                  <div class="input-label">
                    <i class="fas fa-image"></i>
                    <label for="image">Featured Image</label>
                  </div>
                  <div class="image-upload-container" 
                       [class.has-image]="previewUrl"
                       (dragover)="$event.preventDefault()"
                       (drop)="handleDrop($event)">
                    <div class="upload-content" *ngIf="!previewUrl">
                      <i class="fas fa-cloud-upload-alt upload-icon"></i>
                      <p class="upload-text">Drag and drop your image here or</p>
                      <label for="image" class="upload-button">Choose File</label>
                      <input 
                        type="file" 
                        id="image" 
                        (change)="onFileSelected($event)"
                        accept="image/*"
                        required
                        class="file-input"
                      >
                      <p class="upload-info">Supported formats: JPEG, PNG, GIF (Max: 5MB)</p>
                    </div>
                    
                    <!-- Image Preview -->
                    <div *ngIf="previewUrl" class="image-preview">
                      <img [src]="previewUrl" class="preview-image" alt="Preview">
                      <button type="button" class="remove-image" (click)="removeImage()">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Submit Button -->
                <div class="form-actions">
                  <button 
                    type="submit" 
                    class="btn btn-primary submit-btn"
                    [disabled]="blogForm.invalid || loading || !selectedFile"
                  >
                    <i class="fas fa-paper-plane me-2"></i>
                    <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                    {{loading ? 'Publishing...' : 'Publish Blog Post'}}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
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
      padding: 3rem 0;
      margin-bottom: -2rem;
      text-align: center;
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
    }

    .blog-form-card {
      background: white;
      border-radius: 15px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      padding: 2.5rem;
      margin-bottom: 2rem;
    }

    .form-group {
      margin-bottom: 2rem;
    }

    .input-label {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
      padding-left: 0.5rem;
    }

    .input-label i {
      font-size: 1.2rem;
      margin-right: 0.75rem;
      color: #007bff;
    }

    .input-label label {
      font-weight: 600;
      font-size: 1.2rem;
      color: #2d3748;
      margin: 0;
    }

    .custom-input, .custom-textarea {
      width: 100%;
      padding: 1.2rem;
      font-size: 1.1rem;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      background-color: #fff;
      transition: all 0.3s ease;
      color: #2d3748;
      font-family: 'Inter', sans-serif;
    }

    .custom-input {
      height: 3.5rem;
      line-height: 1.5;
    }

    .custom-textarea {
      resize: vertical;
      min-height: 120px;
      line-height: 1.6;
    }

    .custom-input:focus, .custom-textarea:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.1);
      transform: translateY(-1px);
    }

    .custom-input::placeholder, .custom-textarea::placeholder {
      color: #a0aec0;
      font-size: 1rem;
    }

    .content-area {
      min-height: 300px;
      line-height: 1.8;
      padding: 1.5rem;
      background-color: #fff;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      font-size: 1.1rem;
    }

    .content-area:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.1);
    }

    .custom-input, .custom-textarea {
      transform-origin: top left;
      animation: fadeInUp 0.3s ease-out;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .submit-btn {
      background: linear-gradient(135deg, #1a237e 0%, #0d47a1 100%);
      color: white;
      padding: 1.2rem 2rem;
      border: none;
      border-radius: 12px;
      font-size: 1.2rem;
      font-weight: 600;
      width: 100%;
      transition: all 0.3s ease;
      margin-top: 1rem;
    }

    .submit-btn:not(:disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
    }

    .submit-btn:disabled {
      background: linear-gradient(135deg, #ccc, #999);
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .blog-form-card {
        padding: 1.5rem;
      }

      .custom-input, .custom-textarea {
        font-size: 1rem;
        padding: 1rem;
      }

      .input-label label {
        font-size: 1.1rem;
      }

      .submit-btn {
        padding: 1rem;
        font-size: 1.1rem;
      }
    }

    .form-group:focus-within .input-label {
      color: #007bff;
      transform: translateY(-2px);
      transition: all 0.3s ease;
    }

    .form-group:focus-within .input-label i {
      transform: scale(1.1);
      transition: all 0.3s ease;
    }

    .form-group.has-error .custom-input,
    .form-group.has-error .custom-textarea {
      border-color: #dc3545;
      box-shadow: 0 0 0 4px rgba(220, 53, 69, 0.1);
    }

    .form-group.is-valid .custom-input,
    .form-group.is-valid .custom-textarea {
      border-color: #28a745;
      box-shadow: 0 0 0 4px rgba(40, 167, 69, 0.1);
    }

    .image-upload-container {
      border: 2px dashed #007bff;
      padding: 2rem;
      border-radius: 10px;
      background: #f8fafc;
      text-align: center;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .image-upload-container:hover {
      border-color: #0056b3;
      background: #f1f5f9;
    }

    .upload-icon {
      font-size: 3rem;
      color: #007bff;
      margin-bottom: 1rem;
    }

    .upload-text {
      font-size: 1.1rem;
      color: #64748b;
      margin-bottom: 1rem;
    }

    .upload-button {
      display: inline-block;
      padding: 0.5rem 1.5rem;
      background: #007bff;
      color: white;
      border-radius: 25px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .upload-button:hover {
      background: #0056b3;
      transform: translateY(-1px);
    }

    .upload-info {
      font-size: 0.9rem;
      color: #94a3b8;
      margin-top: 1rem;
    }

    .file-input {
      display: none;
    }

    .image-preview {
      position: relative;
      margin-top: 1rem;
    }

    .preview-image {
      max-width: 100%;
      max-height: 400px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .remove-image {
      position: absolute;
      top: -10px;
      right: -10px;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .remove-image:hover {
      background: #c82333;
      transform: scale(1.1);
    }
  `]
})
export class CreateBlogComponent {
  blog: BlogForm = {
    title: '',
    summary: '',
    content: ''
  };
  
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  loading = false;
  imageError: string | null = null;
  successMessage: string | null = null;

  constructor(
    private blogService: BlogService,
    private router: Router
  ) {}

  private createPreviewUrl(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewUrl = e.target.result;
    };
    reader.onerror = () => {
      this.imageError = 'Error creating image preview';
      this.previewUrl = null;
    };
    reader.readAsDataURL(file);
  }

  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    const file = element.files?.[0];
    
    if (file) {
      this.handleFile(file);
    }
  }

  handleDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        this.handleFile(file);
      }
    }
  }

  removeImage() {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  private handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      this.imageError = 'File size must be less than 5MB';
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      this.imageError = 'Only image files are allowed';
      return;
    }

    this.selectedFile = file;
    this.createPreviewUrl(file);
  }

  onSubmit(form: NgForm): void {
    if (form.invalid || !this.selectedFile) return;

    const userString = localStorage.getItem('user');
    if (!userString) {
      this.router.navigate(['/login']);
      return;
    }

    const user = JSON.parse(userString);
    const formData = new FormData();
    formData.append('title', this.blog.title);
    formData.append('summary', this.blog.summary);
    formData.append('content', this.blog.content);
    formData.append('image', this.selectedFile);
    formData.append('author_id', user.id.toString());

    this.loading = true;
    this.imageError = null;
    this.successMessage = null;

    this.blogService.createBlog(formData).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = 'Blog created successfully!';
        setTimeout(() => {
          this.router.navigate(['/user-home']);
        }, 1000);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error creating blog:', error);
        if (error.status === 413) {
          this.imageError = 'File size too large';
        } else {
          this.imageError = error.error?.message || 'Failed to create blog. Please try again.';
        }
      }
    });
  }
}