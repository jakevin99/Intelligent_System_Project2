# PHP Blog API with AI Summaries

A RESTful API for a blog application with AI-powered post summarization functionality.

## Features

- **User Authentication**: Register, login, and JWT-based authentication
- **Blog Management**: Create, read, update, and delete blog posts
- **Image Uploads**: Support for blog post images
- **AI Summaries**: Automatic blog post summarization using Ollama AI
- **Frontend Integration**: Compatible with the Angular frontend

## AI Feature

The API includes an AI-powered feature that automatically generates summaries for blog posts using Ollama's open-source LLM models. 

- Uses deepseek-r1:1.5b as the primary model with automatic fallbacks
- Multiple connection options for resilience
- Graceful degradation if the AI service is unavailable

## Technologies

- PHP 7.4+
- MySQL
- Angular (for the frontend)
- Ollama API (for AI summaries)

## Setup

1. Clone the repository
2. Set up a web server (Apache/Nginx) with PHP support
3. Create a MySQL database
4. Configure the database connection in `/backend/config/database.php`
5. Install Ollama locally (optional, for AI features)
6. Run the Angular frontend with `npm run dev`

## API Endpoints

- **Authentication**: `/api/v1/auth/login`, `/api/v1/users` (register)
- **Blogs**: `/api/v1/blogs`
- **AI Summaries**: `/api/v1/blogs/{id}/summary`

## License

MIT 