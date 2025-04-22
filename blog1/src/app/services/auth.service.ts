//src\app\services\auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Buffer } from 'buffer';

interface AuthResponse {
  status: string;
  message: string;
  data?: {
    token: string;
    user: {
      id: number;
      username: string;
    }
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = 'http://localhost/php-blog1-api/api/v1';

  constructor(private http: HttpClient) {}

  // Add decryptResponse method
  private decryptResponse(encrypted: string, salt: string): any {
    const decoded = atob(encrypted);
    const data = decoded.slice(0, -salt.length);
    return JSON.parse(data);
  }

  // Generate random salt
  private generateSalt(length: number = 16): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let salt = '';
    for (let i = 0; i < length; i++) {
      salt += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return salt;
  }

  // Enhanced encryption with salt
  private encryptData(data: string): { encrypted: string, salt: string } {
    const salt = this.generateSalt();
    const saltedData = data + salt;
    return {
      encrypted: Buffer.from(saltedData).toString('base64'),
      salt: salt
    };
  }

  register(data: { username: string; password: string }): Observable<any> {
    const encryptedUsername = this.encryptData(data.username);
    const encryptedPassword = this.encryptData(data.password);

    const encryptedData = {
      username: encryptedUsername.encrypted,
      usernameSalt: encryptedUsername.salt,
      password: encryptedPassword.encrypted,
      passwordSalt: encryptedPassword.salt
    };

    return this.http.post<any>(`${this.baseUrl}/users`, encryptedData)
      .pipe(
        map(response => {
          if (response.status === 'success') {
            return response;
          }
          throw new Error(response.message || 'Registration failed');
        }),
        catchError(error => throwError(() => ({
          status: error.status,
          message: error.error?.message || 'Registration failed'
        })))
      );
  }

  login(credentials: { username: string; password: string }): Observable<AuthResponse> {
    // Encrypt credentials before sending
    const encryptedUsername = this.encryptData(credentials.username);
    const encryptedPassword = this.encryptData(credentials.password);

    const encryptedData = {
      username: encryptedUsername.encrypted,
      usernameSalt: encryptedUsername.salt,
      password: encryptedPassword.encrypted,
      passwordSalt: encryptedPassword.salt
    };

    return this.http.post<any>(`${this.baseUrl}/auth/login`, encryptedData)
        .pipe(
            map(response => {
                if (response.status === 'success' && response.data) {
                    // Decrypt the response data
                    const decryptedData = this.decryptResponse(
                        response.data.encrypted,
                        response.data.salt
                    );

                    // Store the decrypted token and user data
                    localStorage.setItem('token', decryptedData.token);
                    localStorage.setItem('user', JSON.stringify({
                        id: decryptedData.user.id,
                        username: decryptedData.user.username
                    }));

                    return {
                        status: response.status,
                        message: 'Login successful',
                        data: {
                            token: decryptedData.token,
                            user: decryptedData.user
                        }
                    };
                }
                throw new Error('Login failed');
            }),
            catchError(error => {
                console.error('Login error:', error);
                return throwError(() => ({
                    status: error.status || 500,
                    message: error.error?.message || 'Login failed. Please try again.',
                    type: error.error?.type || 'LOGIN_ERROR'
                }));
            })
        );
  }

  private handleError(error: HttpErrorResponse) {
    console.log('Full API Error:', error);
    console.log('Error Status:', error.status);
    console.log('Error Body:', error.error);

    let errorResponse = {
      status: error.status,
      type: '',
      message: ''
    };

    if (error.status === 401) {
      // Check if username exists in the request body
      const requestBody = JSON.parse(error.error.requestBody || '{}');
      const username = requestBody.username;

      // Check if the error is related to username
      if (error.error && error.error.message && 
          error.error.message.toLowerCase().includes('user not found')) {
        errorResponse.type = 'USERNAME_NOT_FOUND';
        errorResponse.message = `Username "${username}" not found. Please try again!`;
      } else {
        errorResponse.type = 'INVALID_PASSWORD';
        errorResponse.message = 'Wrong password. Please try again!';
      }
    } else {
      errorResponse.type = 'UNKNOWN_ERROR';
      errorResponse.message = 'An error occurred. Please try again';
    }

    console.log('Processed Error Response:', errorResponse);
    return throwError(() => errorResponse);
  }
} 