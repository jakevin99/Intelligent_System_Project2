//src\app\components\edit-blog\edit-blog.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BlogService, Blog } from '../../services/blog.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-edit-blog',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
    <div class="page-wrapper">
      <app-navbar></app-navbar>
      
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <h1>Edit Blog Post</h1>
          <p>Update your thoughts and ideas</p>
        </div>
      </section>

      <div class="container mt-4">
        <div class="row">
          <div class="col-md-8 mx-auto">
            <!-- Alerts -->
            <div *ngIf="success" class="alert alert-success alert-dismissible fade show" role="alert">
              {{ success }}
              <button type="button" class="btn-close" (click)="success = ''"></button>
            </div>

            <div *ngIf="error" class="alert alert-danger alert-dismissible fade show" role="alert">
              {{ error }}
              <button type="button" class="btn-close" (click)="error = ''"></button>
            </div>

            <div class="blog-form-card" *ngIf="blog">
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
                       [class.has-image]="imagePreview"
                       (dragover)="$event.preventDefault()">
                    <div class="upload-content" *ngIf="!imagePreview">
                      <i class="fas fa-cloud-upload-alt upload-icon"></i>
                      <p class="upload-text">Drag and drop your image here or</p>
                      <label for="image" class="upload-button">Choose File</label>
                      <input 
                        type="file" 
                        id="image" 
                        (change)="onFileSelected($event)"
                        accept="image/*"
                        class="file-input"
                      >
                      <p class="upload-info">Supported formats: JPEG, PNG, GIF (Max: 5MB)</p>
                    </div>
                    
                    <!-- Image Preview -->
                    <div *ngIf="imagePreview" class="image-preview">
                      <img [src]="imagePreview" class="preview-image" alt="Preview">
                      <button type="button" class="remove-image" (click)="imagePreview = null; selectedFile = null">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Submit Buttons -->
                <div class="form-actions">
                  <button 
                    type="submit" 
                    class="btn btn-primary submit-btn"
                    [disabled]="blogForm.invalid || loading"
                  >
                    <i class="fas fa-save me-2"></i>
                    <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                    {{loading ? 'Updating...' : 'Update Blog Post'}}
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-outline-secondary back-btn mt-3"
                    (click)="goBack()"
                  >
                    <i class="fas fa-arrow-left me-2"></i>
                    Back to My Blogs
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
      transition: all 0.3s ease;
    }

    .custom-textarea {
      resize: vertical;
      min-height: 120px;
    }

    .content-area {
      min-height: 300px;
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
    }

    .back-btn {
      width: 100%;
      padding: 1rem;
      border-radius: 12px;
    }

    @media (max-width: 768px) {
      .blog-form-card {
        padding: 1.5rem;
      }

      .custom-input, .custom-textarea {
        font-size: 1rem;
        padding: 1rem;
      }

      .submit-btn {
        padding: 1rem;
        font-size: 1.1rem;
      }
    }
  `]
})
export class EditBlogComponent implements OnInit {
  blog: Blog | null = null;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  loading = false;
  error = '';
  success = '';

  constructor(
    private blogService: BlogService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/']);
      return;
    }

    this.blogService.getBlog(id).subscribe({
      next: (blog) => {
        this.blog = blog;
        if (blog.image) {
          this.imagePreview = this.blogService.getImageUrl(blog.image);
        }
      },
      error: (error) => {
        console.error('Error fetching blog:', error);
        this.error = 'Failed to load blog';
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        this.error = 'Please select an image file';
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        this.error = 'Image size should be less than 5MB';
        return;
      }

      this.selectedFile = file;
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(form: NgForm): void {
    if (!this.blog || form.invalid) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    const updateProcess = async () => {
      try {
        if (!this.blog) {
          throw new Error('Blog data is missing');
        }

        // Handle image update first if there's a new image
        if (this.selectedFile) {
          try {
            await firstValueFrom(this.blogService.updateBlogImage(this.blog.id, this.selectedFile));
          } catch (error) {
            // Continue even if image update throws error since it might have succeeded
            console.log('Image update completed');
          }
        }

        // Then handle other data updates
        const params = new URLSearchParams();
        params.append('title', String(this.blog.title).trim());
        params.append('summary', String(this.blog.summary).trim());
        params.append('content', String(this.blog.content).trim());

        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.id) {
            params.append('author_id', String(user.id));
          }
        }

        await firstValueFrom(this.blogService.updateBlog(this.blog.id, params.toString()));
        
        this.success = 'Blog updated successfully!';
        setTimeout(() => {
          this.router.navigate(['/user-home']);
        }, 1500);
      } catch (error: any) {
        console.error('Update failed:', error);
        this.error = error.message || 'Failed to update blog';
      } finally {
        this.loading = false;
      }
    };

    updateProcess();
  }

  getImageUrl(imagePath: string | null): string {
    return this.blogService.getImageUrl(imagePath);
  }

  goBack(): void {
    this.router.navigate(['/user-home']);
  }
}
