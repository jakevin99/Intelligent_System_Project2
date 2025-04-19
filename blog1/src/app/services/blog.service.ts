//src\app\services\blog.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';


export interface Blog {
  id: number;
  title: string;
  summary: string;
  content: string;
  image: string | null;
  image_url?: string | null;
  author: string;
  created_at: string;
}

export interface ApiResponse<T> {
  status: string;
  message?: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private apiUrl = 'http://localhost/php-blog1-api';

  constructor(private http: HttpClient) {}

  private decryptResponse(encrypted: string, salt: string): any {
    const decoded = atob(encrypted);
    const data = decoded.slice(0, -salt.length);
    return JSON.parse(data);
  }

  // Get all blogs
  getBlogs(): Observable<Blog[]> {
    return this.http.get<any>(`${this.apiUrl}/api/v1/blogs`).pipe(
      map(response => {
        if (response.status === 'success') {
          return this.decryptResponse(
            response.data.encrypted,
            response.data.salt
          );
        }
        throw new Error(response.message || 'Invalid blog data format');
      }),
      catchError(error => {
        console.error('Error fetching blogs:', error);
        return throwError(() => ({
          status: error.status || 500,
          message: error.error?.message || 'Failed to fetch blogs',
          error: error
        }));
      })
    );
  }

  // Get single blog
  getBlog(id: number): Observable<Blog> {
    return this.http.get<any>(`${this.apiUrl}/api/v1/blogs/${id}`).pipe(
      map(response => {
        if (response.status === 'success') {
          return this.decryptResponse(
            response.data.encrypted,
            response.data.salt
          );
        }
        throw new Error(response.message || 'Failed to fetch blog');
      }),
      catchError(error => {
        console.error('Error fetching blog:', error);
        return throwError(() => ({
          status: error.status,
          message: error.error?.message || 'Failed to fetch blog'
        }));
      })
    );
  }

  // Create blog
  createBlog(formData: FormData): Observable<Blog> {
    return this.http.post<ApiResponse<Blog>>(`${this.apiUrl}/api/v1/blogs`, formData)
      .pipe(
        map(response => {
          if (response.status === 'success' && response.data) {
            const blog = response.data;
            if (blog.image) {
              blog.image = blog.image;
            }
            return blog;
          }
          throw new Error(response.message || 'Failed to create blog');
        }),
        catchError(error => {
          console.error('Error creating blog:', error);
          return throwError(() => ({
            status: error.status || 500,
            message: error.error?.message || 'Failed to create blog',
            error: error
          }));
        })
      );
  }

  // Update blog
  updateBlog(id: number, data: string): Observable<Blog> {
    return this.http.put<ApiResponse<Blog>>(
      `${this.apiUrl}/api/v1/blogs/${id}`,
      data,
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        })
      }
    ).pipe(
      map(response => {
        if (response.status === 'success' && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to update blog');
      }),
      catchError(error => {
        console.error('Error updating blog:', error);
        return throwError(() => ({
          status: error.status || 500,
          message: error.error?.message || 'Failed to update blog',
          error: error
        }));
      })
    );
  }

  // Delete blog
  deleteBlog(id: number): Observable<any> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/api/v1/blogs/${id}`)
      .pipe(
        map(response => {
          if (response.status === 'success') {
            return response;
          } else {
            throw new Error(response.message || 'Failed to delete blog');
          }
        }),
        catchError(error => {
          console.error('Error deleting blog:', error);
          return throwError(() => ({
            status: error.status,
            message: error.error?.message || 'Failed to delete blog',
            error: error
          }));
        })
      );
  }

  // Get image URL
  getImageUrl(imagePath: string | null): string {
    if (!imagePath) {
      return 'assets/default-blog-image.jpg';
    }
    return `${this.apiUrl}/uploads/${imagePath}`;
  }

  // Get blogs by user ID following RESTful conventions
  getUserBlogs(userId: number): Observable<Blog[]> {
    return this.http.get<any>(`${this.apiUrl}/api/v1/users/${userId}/blogs`)
        .pipe(
            map(response => {
                if (response.status === 'success' && response.data?.data) {
                    const decryptedData = this.decryptResponse(
                        response.data.data.encrypted,
                        response.data.data.salt
                    );
                    if (!Array.isArray(decryptedData)) {
                        throw new Error('Invalid blog data format');
                    }
                    return decryptedData;
                }
                throw new Error('Failed to fetch user blogs');
            }),
            catchError(error => {
                console.error('Error fetching user blogs:', error);
                return throwError(() => ({
                    status: error.status || 500,
                    message: error.error?.message || 'Failed to fetch user blogs'
                }));
            })
        );
  }

  // Update blog image
  updateBlogImage(id: number, imageFile: File): Observable<Blog> {
    const formData = new FormData();
    formData.append('image', imageFile);

    return this.http.put<ApiResponse<Blog>>(
      `${this.apiUrl}/api/v1/blogs/${id}/image`,
      formData,
      {
        headers: new HttpHeaders({
          'Accept': 'application/json'
        })
      }
    ).pipe(
      map(response => {
        if (response.status === 'success' && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to update image');
      }),
      catchError(error => {
        console.error('Error updating blog image:', error);
        return throwError(() => error);
      })
    );
  }
}