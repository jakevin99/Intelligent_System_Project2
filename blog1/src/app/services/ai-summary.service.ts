import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Blog } from './blog.service';

export interface AISummaryResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AISummaryService {
  private apiUrl = 'http://localhost/php-blog1-api';
  
  // Use the same Ollama URL that works in the chatbot
  private ollamaUrl = 'http://localhost:11434';
  private modelName = 'deepseek-r1:1.5b';

  constructor(private http: HttpClient) {}

  summarizeBlog(blog: Blog): Observable<any> {
    // Skip the backend API and go directly to Ollama like in your chatbot
    console.log('Connecting directly to Ollama API...');
    return this.summarizeWithOllama(blog);
  }

  // Direct method for using Ollama API
  private summarizeWithOllama(blog: Blog): Observable<any> {
    console.log(`Using model: ${this.modelName} at ${this.ollamaUrl}`);

    const prompt = `
      Write a direct summary of this blog post in 2-3 concise sentences.
      DO NOT use any tags, markers, or labels like <think> or "Thinking:".
      DO NOT include explanations of your process.
      DO NOT structure your response with sections.
      Just provide a clean, direct summary of the blog post.
      
      Title: ${blog.title}
      
      Content: ${blog.content}
    `;

    const payload = {
      model: this.modelName,
      messages: [
        {
          role: "system",
          content: "You are a professional blog summarizer that provides DIRECT, CONCISE summaries with NO meta-commentary, NO tags (like <think>), NO sections, and NO explanations of your process. Just give the summary itself."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      // Add stream: false to prevent streaming response which causes JSON parsing issues
      stream: false
    };

    // Add headers to ensure proper content type and response type
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    // Use the chat endpoint with responseType: 'text' to avoid parsing errors
    return this.http.post(`${this.ollamaUrl}/api/chat`, payload, {
      headers: headers,
      responseType: 'text'
    }).pipe(
      map(response => {
        // Parse the text response manually
        try {
          // Clean the response - sometimes Ollama returns multiple JSON objects
          const cleanedResponse = this.cleanJsonResponse(response);
          const parsedResponse = JSON.parse(cleanedResponse);
          
          // Clean the summary by removing thinking/reasoning sections
          if (parsedResponse.message && parsedResponse.message.content) {
            parsedResponse.message.content = this.cleanSummaryContent(parsedResponse.message.content);
          }
          
          return parsedResponse;
        } catch (e) {
          console.error('Error parsing response:', e);
          console.log('Raw response:', response);
          
          // Try to extract content from malformed JSON
          const content = this.extractContentFromMalformedJson(response);
          if (content) {
            return { message: { content: this.cleanSummaryContent(content) } };
          }
          
          return { message: { content: "Error parsing AI response" } };
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error calling Ollama API:', error);
        return throwError(() => ({
          success: false,
          message: error.message || 'Failed to generate AI summary'
        }));
      })
    );
  }
  
  // Clean JSON response by taking only the first valid JSON object
  private cleanJsonResponse(response: string): string {
    try {
      // If it's already valid JSON, return it
      JSON.parse(response);
      return response;
    } catch (e) {
      // Try to extract the first valid JSON object
      console.log('Cleaning malformed JSON response');
      
      // Look for complete JSON objects terminated by newlines (common in streaming responses)
      const jsonObjects = response.split('\n').filter(line => line.trim().length > 0);
      if (jsonObjects.length > 0) {
        return jsonObjects[0]; // Take the first complete JSON object
      }
      
      return response; // Return original if we can't clean it
    }
  }
  
  // Extract content from malformed JSON using regex
  private extractContentFromMalformedJson(response: string): string | null {
    try {
      // Look for content field patterns
      const contentMatch = /"content"\s*:\s*"([^"]+)"/g;
      let allContent = '';
      let match;
      
      while ((match = contentMatch.exec(response)) !== null) {
        if (match[1]) {
          allContent += match[1] + ' ';
        }
      }
      
      if (allContent.trim().length > 0) {
        return allContent.trim();
      }
      
      return null;
    } catch (e) {
      console.error('Error extracting content:', e);
      return null;
    }
  }
  
  // Clean summary content by removing any thinking/reasoning sections
  private cleanSummaryContent(content: string): string {
    if (!content) return '';
    
    // Remove XML-style <think> tags and everything inside them
    let cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
    
    // Remove shorter versions without closing tags
    cleaned = cleaned.replace(/<think>.*$/gim, '');
    
    // Remove any remaining standalone tags
    cleaned = cleaned.replace(/<\/?think>/gi, '');
    
    // Also remove traditional thinking sections
    cleaned = cleaned.replace(/(\n|\s)*(thinking|reasoning)(\s*:|\s*process\s*:).*?(\n\s*\n|\n\s*[a-z0-9])/is, '$4');
    cleaned = cleaned.replace(/^(\s*)(answer|summary)(\s*:|\s*)/i, '');
    
    // Remove numbered sections 
    cleaned = cleaned.replace(/^\s*\d+\.\s*(thinking|reasoning)(\s*:|\s*process\s*:).*?(\n\s*\n|\n\s*\d+\.\s*)/is, '$3');
    cleaned = cleaned.replace(/^\s*\d+\.\s*(answer|summary)(\s*:|\s*)/i, '');
    
    // If after cleaning, the content starts with dashes or similar formatting, remove those too
    cleaned = cleaned.replace(/^[-–—>*\s]+/, '');
    
    return cleaned.trim();
  }
} 