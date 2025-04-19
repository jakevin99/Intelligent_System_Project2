import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Blog } from '../../services/blog.service';
import { AISummaryService } from '../../services/ai-summary.service';

@Component({
  selector: 'app-ai-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ai-summary-container">
      <h2 class="summary-title">AI-Generated Summary</h2>
      
      <div *ngIf="loading" class="summary-loading">
        <div class="spinner"></div>
        <p>{{ loadingMessage }}</p>
      </div>
      
      <div *ngIf="error && !summary" class="summary-error">
        <p><strong>Error:</strong> {{ error }}</p>
        <button *ngIf="canRetry" (click)="retryGeneration()" class="retry-btn">Retry</button>
      </div>
      
      <div *ngIf="!loading && summary" class="summary-content">
        <p>{{ summary }}</p>
        <div class="ai-badge">
          <span>{{ modelBadge }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ai-summary-container {
      background-color: #f8f9fa;
      border-radius: 12px;
      padding: 1.5rem;
      margin: 1.5rem 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      border-left: 4px solid #1a237e;
    }

    .summary-title {
      color: #1a237e;
      font-size: 1.5rem;
      margin-bottom: 1rem;
      font-weight: 600;
      display: flex;
      align-items: center;
    }

    .summary-content {
      font-size: 1.1rem;
      line-height: 1.6;
      color: #37474f;
    }

    .summary-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(26, 35, 126, 0.2);
      border-radius: 50%;
      border-top-color: #1a237e;
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .summary-error {
      color: #d32f2f;
      padding: 0.5rem;
      border-radius: 4px;
      background-color: rgba(211, 47, 47, 0.1);
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .retry-btn {
      margin-top: 0.5rem;
      border: none;
      border-radius: 4px;
      padding: 0.4rem 0.8rem;
      font-size: 0.9rem;
      cursor: pointer;
      transition: background-color 0.2s;
      margin-right: 0.5rem;
      background-color: #d32f2f;
      color: white;
    }

    .retry-btn:hover {
      background-color: #b71c1c;
    }

    .ai-badge {
      margin-top: 1rem;
      display: flex;
      justify-content: flex-end;
    }

    .ai-badge span {
      background-color: #e3f2fd;
      color: #1565c0;
      padding: 0.3rem 0.8rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
    }
  `]
})
export class AISummaryComponent implements OnInit {
  @Input() blog: Blog | null = null;
  
  summary: string | null = null;
  loading = false;
  error: string | null = null;
  canRetry = false;
  loadingMessage = 'Generating summary with DeepSeek-R1:1.5B...';
  modelBadge = 'Powered by DeepSeek-R1:1.5B';

  constructor(private aiSummaryService: AISummaryService) {}

  ngOnInit(): void {
    this.generateSummary();
  }

  generateSummary(): void {
    if (!this.blog) {
      this.error = 'No blog content available to summarize';
      return;
    }

    this.loading = true;
    this.error = null;
    this.summary = null;
    this.loadingMessage = 'Connecting to AI service...';

    this.aiSummaryService.summarizeBlog(this.blog).subscribe({
      next: (response) => {
        this.loading = false;
        
        // Handle the response from the backend API
        if (response && response.message && response.message.content) {
          this.summary = response.message.content;
          this.updateModelBadge(response);
        } else {
          // Try to parse the response differently if the format is different
          this.extractSummaryFromResponse(response);
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = this.getReadableErrorMessage(err);
        this.canRetry = true;
        console.error('AI Summary error:', err);
      }
    });
  }

  private extractSummaryFromResponse(response: any): void {
    if (!response) {
      this.error = 'Failed to get AI summary response';
      this.canRetry = true;
      return;
    }
    
    // Try different response format patterns
    if (response.message && typeof response.message === 'string') {
      this.summary = response.message;
    } else if (response.content && typeof response.content === 'string') {
      this.summary = response.content;
    } else if (response.response && typeof response.response === 'string') {
      this.summary = response.response;
    } else if (Array.isArray(response) && response.length > 0) {
      // If it's an array, try to find the response in the array
      const messageObj = response.find((item: any) => 
        item.content || item.message || item.text || item.response
      );
      
      if (messageObj) {
        this.summary = messageObj.content || messageObj.message || 
                      messageObj.text || messageObj.response;
      } else {
        this.error = 'Failed to parse AI summary response';
        this.canRetry = true;
      }
    } else {
      // Try to extract from nested structure
      try {
        const responseStr = JSON.stringify(response);
        const contentMatch = responseStr.match(/"content"\s*:\s*"([^"]+)"/);
        if (contentMatch && contentMatch[1]) {
          this.summary = contentMatch[1];
        } else {
          this.error = 'Failed to parse AI summary response';
          this.canRetry = true;
          console.error('Unexpected response format:', response);
        }
      } catch (e) {
        this.error = 'Failed to parse AI summary response';
        this.canRetry = true;
        console.error('Error parsing response:', e);
      }
    }
  }

  private updateModelBadge(response: any): void {
    // Try to extract model name from response
    try {
      if (response.model) {
        this.modelBadge = `Powered by ${response.model}`;
      } else if (typeof response === 'object' && response !== null) {
        const responseStr = JSON.stringify(response);
        const modelMatch = responseStr.match(/"model"\s*:\s*"([^"]+)"/);
        if (modelMatch && modelMatch[1]) {
          this.modelBadge = `Powered by ${modelMatch[1]}`;
        }
      }
    } catch (e) {
      // If we can't determine the model, leave the default
      console.log('Could not determine model from response');
    }
  }

  private getReadableErrorMessage(error: any): string {
    // Get a user-friendly error message
    if (error.status === 0) {
      return 'Cannot connect to the AI service. The service may be down or unreachable.';
    } else if (error.status === 404) {
      return 'AI service endpoint not found. Please check your API configuration.';
    } else if (error.status === 500) {
      return 'AI service encountered an internal error. Please try again later.';
    } else if (error.message) {
      return error.message;
    } else {
      return 'Failed to generate AI summary. Please try again later.';
    }
  }

  retryGeneration(): void {
    // Reset state and try again
    this.generateSummary();
  }
} 