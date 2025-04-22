<?php

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Move these headers to the very top of the file, before any output
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: http://localhost:4200');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/models/User.php';
require_once __DIR__ . '/models/Blog.php';

// Add this at the top of your request handling
ob_start();

function sendJsonResponse($status, $message = '', $data = null, $code = 200) {
    $response = [
        'status' => $status,
        'message' => $message,
        'data' => $data
    ];
    
    http_response_code($code);
    echo json_encode($response);
    exit;
}

function handleImageUpload($file) {
    $target_dir = __DIR__ . "/uploads/";
    $file_extension = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));
    $new_filename = uniqid() . '.' . $file_extension;
    $target_file = $target_dir . $new_filename;

    // Check file size (5MB limit)
    if ($file["size"] > 5000000) {
        throw new Exception("Sorry, your file is too large. Maximum size is 5MB.");
    }

    // Allow certain file formats
    $allowed_types = ["jpg", "jpeg", "png", "gif"];
    if (!in_array($file_extension, $allowed_types)) {
        throw new Exception("Sorry, only JPG, JPEG, PNG & GIF files are allowed.");
    }

    // Try to upload file
    if (move_uploaded_file($file["tmp_name"], $target_file)) {
        return $new_filename;
    } else {
        throw new Exception("Sorry, there was an error uploading your file.");
    }
}

function getAuthorizationHeader() {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER["Authorization"]);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(
            array_map('ucwords', array_keys($requestHeaders)),
            array_values($requestHeaders)
        );
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    return $headers;
}

function verifyToken() {
    $auth = getAuthorizationHeader();
    if (!$auth || !preg_match('/Bearer\s(\S+)/', $auth, $matches)) {
        throw new Exception('No token provided', 401);
    }
    
    $jwt = $matches[1];
    $user = new User($GLOBALS['db']);
    if (!$user->verifyJWT($jwt)) {
        throw new Exception('Invalid token', 401);
    }
}

/**
 * Call Ollama API for AI summarization
 * 
 * This function is used by the RESTful API endpoints for:
 * - POST /api/v1/blogs/{id}/summary - Generate new summary
 * - PUT /api/v1/blogs/{id}/summary - Update with custom prompt
 *
 * @param string $prompt The prompt to send to the Ollama API
 * @param string $model The model to use (defaults to deepseek-r1:1.5b)
 * @return array Response from the Ollama API with 'message' containing the generated content
 * 
 * ---------------------------------------------------------------
 * AI FEATURE DOCUMENTATION
 * ---------------------------------------------------------------
 * 
 * The AI feature in this blog application provides automated blog post summarization
 * using the Ollama API with open-source LLM models.
 * 
 * ARCHITECTURE:
 * - Backend (PHP): Provides RESTful API endpoints to generate, retrieve and update
 *   AI-generated summaries for blog posts. The summary is stored with each blog post.
 * - Frontend (Angular): Uses the AISummaryService and AISummaryComponent to display 
 *   the AI-generated summary on the blog detail page.
 * 
 * IMPLEMENTATION DETAILS:
 * 1. Model Selection: Uses deepseek-r1:1.5b as the primary model with fallback options.
 * 2. Redundancy: Tries multiple Ollama URLs (localhost, 127.0.0.1, 0.0.0.0) for resilience.
 * 3. Graceful Degradation: Falls back to simpler models if the primary model fails.
 * 4. Fallback Response: Provides a placeholder summary if all models/connections fail.
 * 5. Format Adaptation: Supports both modern chat API and legacy generate API formats.
 * 
 * API ENDPOINTS:
 * - GET /api/v1/blogs/{id}/summary - Retrieve existing AI summary for a blog post
 * - POST /api/v1/blogs/{id}/summary - Generate a new AI summary (optional custom prompt)
 * - PUT /api/v1/blogs/{id}/summary - Update with a custom prompt (required)
 * 
 * FRONTEND INTEGRATION:
 * - AISummaryService: Angular service that communicates with backend API
 * - AISummaryComponent: Displays the AI summary with loading states and error handling
 * 
 * SECURITY & PERFORMANCE:
 * - Increased timeout settings for potentially slow LLM responses
 * - Error handling and fallback mechanisms to ensure user experience
 * - Response cleaning to handle malformed responses from the AI service
 */
function callOllamaAPI($prompt, $model = 'deepseek-r1:1.5b') {
    // Try multiple URLs for Ollama
    $ollamaUrls = [
        'http://localhost:11434',
        'http://127.0.0.1:11434',
        'http://0.0.0.0:11434'
    ];
    
    // Available models to try in order if primary model fails
    $fallbackModels = ['deepseek-r1:1.5b', 'deepseek-r1:7b'];
    
    // If the requested model is not in our fallback list, add it as the first to try
    if (!in_array($model, $fallbackModels)) {
        array_unshift($fallbackModels, $model);
    }
    
    $lastError = null;
    
    // Try each URL
    foreach ($ollamaUrls as $baseUrl) {
        error_log("Trying Ollama at: $baseUrl");
        
        // Try each model until one succeeds
        foreach ($fallbackModels as $currentModel) {
            try {
                error_log("Trying model: $currentModel at $baseUrl");
                
                $url = "$baseUrl/api/chat";
                
                $payload = [
                    'model' => $currentModel,
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You are an AI assistant that summarizes blog posts concisely while capturing the main points.'
                        ],
                        [
                            'role' => 'user',
                            'content' => $prompt
                        ]
                    ]
                ];
                
                // Increase timeout and modify settings for Windows
                $options = [
                    'http' => [
                        'header' => "Content-type: application/json\r\n",
                        'method' => 'POST',
                        'content' => json_encode($payload),
                        'timeout' => 60, // Longer timeout
                        'ignore_errors' => true
                    ]
                ];
                
                $context = stream_context_create($options);
                $result = @file_get_contents($url, false, $context);
                
                // Check if request was successful
                if ($result === FALSE) {
                    $error = error_get_last();
                    throw new Exception("Failed to connect to Ollama API at $baseUrl with model $currentModel: " . ($error['message'] ?? 'Unknown error'));
                }
                
                // Check HTTP response code from headers
                foreach ($http_response_header as $header) {
                    if (strpos($header, 'HTTP/') === 0) {
                        $parts = explode(' ', $header);
                        $statusCode = intval($parts[1]);
                        if ($statusCode >= 400) {
                            throw new Exception("Ollama API returned error code: $statusCode");
                        }
                    }
                }
                
                $response = json_decode($result, true);
                
                // If the response is valid, return it
                if (isset($response) && !empty($response)) {
                    error_log("Successfully generated summary with model: $currentModel at $baseUrl");
                    return $response;
                }
                
                throw new Exception("Invalid response from Ollama API");
                
            } catch (Exception $e) {
                $lastError = $e;
                error_log("Error with model $currentModel at $baseUrl: " . $e->getMessage());
                
                // Try legacy API format if appropriate
                try {
                    error_log("Trying legacy API at $baseUrl");
                    // Try the legacy /api/generate endpoint
                    $legacyUrl = "$baseUrl/api/generate";
                    
                    $legacyPayload = [
                        'model' => $currentModel,
                        'prompt' => $prompt
                    ];
                    
                    $legacyOptions = [
                        'http' => [
                            'header' => "Content-type: application/json\r\n",
                            'method' => 'POST',
                            'content' => json_encode($legacyPayload),
                            'timeout' => 60, // Longer timeout
                            'ignore_errors' => true
                        ]
                    ];
                    
                    $legacyContext = stream_context_create($legacyOptions);
                    $legacyResult = @file_get_contents($legacyUrl, false, $legacyContext);
                    
                    if ($legacyResult !== FALSE) {
                        $legacyResponse = json_decode($legacyResult, true);
                        
                        if (!empty($legacyResponse) && isset($legacyResponse['response'])) {
                            error_log("Successfully generated summary with legacy API and model: $currentModel at $baseUrl");
                            
                            // Convert to chat API format
                            return [
                                'message' => [
                                    'content' => $legacyResponse['response']
                                ]
                            ];
                        }
                    }
                } catch (Exception $legacyError) {
                    error_log("Legacy API also failed at $baseUrl: " . $legacyError->getMessage());
                    // Continue to next model
                }
            }
        }
    }
    
    // If all models fail, return a fallback response
    if ($lastError) {
        error_log("All Ollama URLs and models failed. Last error: " . $lastError->getMessage());
    }
    
    // Return a mock summary as fallback
    return [
        'message' => [
            'content' => 'This is an AI-generated summary placeholder. The actual Ollama API service is currently unavailable. The blog post discusses the key topics and provides insights that would be valuable to readers interested in this subject matter.'
        ]
    ];
}

try {
    $database = new Database();
    $db = $database->connect();
    
    $request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $path = trim(str_replace('/php-blog1-api', '', $request_uri), '/');
    $path_parts = explode('/', $path);
    
    if ($path_parts[0] === 'api' && $path_parts[1] === 'v1') {
        // RESTful AI Summary endpoint
        if ($path_parts[2] === 'blogs' && isset($path_parts[3]) && isset($path_parts[4]) && $path_parts[4] === 'summary') {
            $blogId = intval($path_parts[3]);
            
            switch ($_SERVER['REQUEST_METHOD']) {
                case 'GET':
                    // GET /api/v1/blogs/{id}/summary - Get the existing AI summary
                    try {
                        $blog = new Blog($db);
                        $blogData = $blog->readOne($blogId);
                        
                        if (!$blogData) {
                            throw new Exception("Blog not found", 404);
                        }
                        
                        // Decrypt blog data from readOne method
                        $decryptedData = $blog->decryptResponse($blogData['encrypted'], $blogData['salt']);
                        
                        // Return just the summary
                        header('Content-Type: application/json');
                        http_response_code(200);
                        echo json_encode([
                            'status' => 'success',
                            'data' => [
                                'blog_id' => $blogId,
                                'summary' => $decryptedData['summary'] ?? 'No summary available'
                            ]
                        ]);
                    } catch (Exception $e) {
                        header('Content-Type: application/json');
                        http_response_code($e->getCode() ?: 500);
                        echo json_encode([
                            'status' => 'error',
                            'message' => $e->getMessage()
                        ]);
                    }
                    exit;
                    
                case 'POST':
                    // POST /api/v1/blogs/{id}/summary - Generate a new AI summary
                    try {
                        // Increase the execution time limit for the AI summary generation
                        set_time_limit(120); // 2 minutes should be enough
                        
                        // Get optional custom prompt from request body
                        $data = json_decode(file_get_contents("php://input"), true);
                        $customPrompt = $data['prompt'] ?? null;
                        
                        $blog = new Blog($db);
                        $result = $blog->generateAiSummary($blogId, $customPrompt);
                        
                        header('Content-Type: application/json');
                        http_response_code(201); // Created
                        echo json_encode($result);
                    } catch (Exception $e) {
                        header('Content-Type: application/json');
                        http_response_code($e->getCode() ?: 500);
                        echo json_encode([
                            'status' => 'error',
                            'message' => $e->getMessage()
                        ]);
                    }
                    exit;
                    
                case 'PUT':
                    // PUT /api/v1/blogs/{id}/summary - Update the AI summary with a custom prompt
                    try {
                        // Increase the execution time limit for the AI summary generation
                        set_time_limit(120); // 2 minutes should be enough
                        
                        // Get custom prompt from request body (required for PUT)
                        $data = json_decode(file_get_contents("php://input"), true);
                        
                        if (!isset($data['prompt']) || empty($data['prompt'])) {
                            throw new Exception("Custom prompt is required for updating a summary", 400);
                        }
                        
                        $blog = new Blog($db);
                        $result = $blog->generateAiSummary($blogId, $data['prompt']);
                        
                        header('Content-Type: application/json');
                        http_response_code(200); // OK
                        echo json_encode($result);
                    } catch (Exception $e) {
                        header('Content-Type: application/json');
                        http_response_code($e->getCode() ?: 500);
                        echo json_encode([
                            'status' => 'error',
                            'message' => $e->getMessage()
                        ]);
                    }
                    exit;
                    
                default:
                    header('Content-Type: application/json');
                    http_response_code(405); // Method Not Allowed
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Method not allowed'
                    ]);
                    exit;
            }
        }
        
        // Specific handler for /api/v1/users/{id}/blogs
        if ($path_parts[2] === 'users' && isset($path_parts[3]) && $path_parts[4] === 'blogs') {
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $userId = intval($path_parts[3]);
                
                $blog = new Blog($db);
                
                try {
                    $results = $blog->getUserBlogs($userId);
                    
                    header('Content-Type: application/json');
                    http_response_code(200);
                    echo json_encode([
                        'status' => 'success',
                        'data' => $results
                    ]);
                    
                } catch (Exception $e) {
                    header('Content-Type: application/json');
                    http_response_code(500);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Failed to fetch user blogs'
                    ]);
                }
                exit;
            }
        }
        
        // User resource endpoints
        if ($path_parts[2] === 'users') {
            $user = new User($db);
            
            switch ($_SERVER['REQUEST_METHOD']) {
                case 'POST':   // Create user (register)
                    header('Content-Type: application/json');
                    
                    try {
                        $data = json_decode(file_get_contents("php://input"));
                        
                        if (!isset($data->username) || !isset($data->password) || 
                            !isset($data->usernameSalt) || !isset($data->passwordSalt)) {
                            throw new Exception('Invalid registration data', 400);
                        }

                        // Remove salt and decrypt
                        $encryptedUsername = $data->username;
                        $encryptedPassword = $data->password;
                        $usernameSalt = $data->usernameSalt;
                        $passwordSalt = $data->passwordSalt;

                        // Decrypt and remove salt
                        $decodedUsername = base64_decode($encryptedUsername);
                        $decodedPassword = base64_decode($encryptedPassword);

                        if ($decodedUsername === false || $decodedPassword === false) {
                            throw new Exception('Invalid data format', 400);
                        }

                        // Remove salt from decoded values
                        $username = substr($decodedUsername, 0, -strlen($usernameSalt));
                        $password = substr($decodedPassword, 0, -strlen($passwordSalt));

                        if (!$username || !$password) {
                            throw new Exception('Invalid registration data', 400);
                        }

                        $user = new User($db);
                        $registrationData = new stdClass();
                        $registrationData->username = $username;
                        $registrationData->password = $password;
                        
                        $result = $user->create($registrationData);
                        
                        http_response_code(201);
                        echo json_encode($result);
                        
                    } catch (Exception $e) {
                        http_response_code($e->getCode() ?: 500);
                        echo json_encode([
                            'status' => 'error',
                            'message' => $e->getMessage()
                        ]);
                    }
                    exit;
                    
                case 'GET':    // Get user(s)
                    if (isset($path_parts[3])) {
                        // GET /users/{id}
                        $result = $user->getById($path_parts[3]);
                    } else {
                        // GET /users
                        $result = $user->getAll();
                    }
                    echo json_encode([
                        'status' => 'success',
                        'data' => $result
                    ]);
                    break;
                    
                case 'PUT':    // Update user
                    if (isset($path_parts[3])) {
                        // PUT /users/{id}
                        $user->id = $path_parts[3];
                        
                        $data = json_decode(file_get_contents("php://input"));
                        
                        if (isset($data->username)) {
                            $user->username = $data->username;
                        }
                        
                        if (isset($data->password)) {
                            $user->password = $data->password;
                        }
                        
                        if ($user->update()) {
                            echo json_encode([
                                'status' => 'success',
                                'message' => 'User updated'
                            ]);
                        } else {
                            http_response_code(500);
                            echo json_encode([
                                'status' => 'error',
                                'message' => 'User not updated'
                            ]);
                        }
                    } else {
                        http_response_code(400);
                        echo json_encode([
                            'status' => 'error',
                            'message' => 'User ID is required'
                        ]);
                    }
                    break;
                    
                case 'DELETE': // Delete user
                    if (isset($path_parts[3])) {
                        // DELETE /users/{id}
                        $user->id = $path_parts[3];
                        
                        if ($user->delete()) {
                            echo json_encode([
                                'status' => 'success',
                                'message' => 'User deleted'
                            ]);
                        } else {
                            http_response_code(500);
                            echo json_encode([
                                'status' => 'error',
                                'message' => 'User not deleted'
                            ]);
                        }
                    } else {
                        http_response_code(400);
                        echo json_encode([
                            'status' => 'error',
                            'message' => 'User ID is required'
                        ]);
                    }
                    break;
                    
                default:
                    http_response_code(405);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Method not allowed'
                    ]);
                    break;
            }
            exit;
        }
        
        // Auth endpoints
        if ($path_parts[2] === 'auth') {
            header('Content-Type: application/json');
            
            switch ($_SERVER['REQUEST_METHOD']) {
                case 'POST':
                    if ($path_parts[3] === 'login') {
                        try {
                            // Get posted data
                            $data = json_decode(file_get_contents("php://input"));
                            
                            if(!isset($data->username) || !isset($data->password) || 
                               !isset($data->usernameSalt) || !isset($data->passwordSalt)) {
                                throw new Exception('Missing required fields', 400);
                            }

                            // Remove salt and decrypt
                            $encryptedUsername = $data->username;
                            $encryptedPassword = $data->password;
                            $usernameSalt = $data->usernameSalt;
                            $passwordSalt = $data->passwordSalt;

                            // Decrypt and remove salt
                            $decodedUsername = base64_decode($encryptedUsername);
                            $decodedPassword = base64_decode($encryptedPassword);

                            if ($decodedUsername === false || $decodedPassword === false) {
                                throw new Exception('Invalid data format', 400);
                            }

                            // Remove salt from decoded values
                            $username = substr($decodedUsername, 0, -strlen($usernameSalt));
                            $password = substr($decodedPassword, 0, -strlen($passwordSalt));

                            if (!$username || !$password) {
                                throw new Exception('Invalid login data', 400);
                            }

                            $user = new User($db);
                            $result = $user->login($username, $password);
                            
                            // Send response
                            echo json_encode($result);
                            exit;
                            
                        } catch(Exception $e) {
                            http_response_code($e->getCode() ?: 500);
                            echo json_encode([
                                'status' => 'error',
                                'message' => $e->getMessage(),
                                'type' => $e->getCode() === 401 ? 'INVALID_CREDENTIALS' : 'LOGIN_ERROR'
                            ]);
                            exit;
                        }
                    }
                    break;
                    
                default:
                    http_response_code(405);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Method not allowed'
                    ]);
            }
            exit;
        }
        
        // Blog resource endpoints
        if ($path_parts[2] === 'blogs') {
            $blog = new Blog($db);
            
            switch ($_SERVER['REQUEST_METHOD']) {
                case 'GET':
                    if (isset($path_parts[3])) {
                        // GET single blog
                        $result = $blog->readOne($path_parts[3]);
                    } else {
                        // GET all blogs
                        $result = $blog->read();
                    }
                    echo json_encode([
                        'status' => 'success',
                        'data' => $result
                    ]);
                    break;
                
                case 'POST':
                    if (!isset($path_parts[3])) {
                        try {
                            // Set blog properties from POST data
                            $blog->title = $_POST['title'] ?? null;
                            $blog->summary = $_POST['summary'] ?? null;
                            $blog->content = $_POST['content'] ?? null;
                            $blog->author_id = $_POST['author_id'] ?? null;

                            // Handle image if present
                            if (isset($_FILES['image'])) {
                                $blog->image = $_FILES['image']['name'];
                            }

                            $result = $blog->create();
                            
                            if ($result) {
                                echo json_encode([
                                    'status' => 'success',
                                    'data' => $result
                                ]);
                            } else {
                                throw new Exception("Failed to create blog", 500);
                            }
                        } catch (Exception $e) {
                            http_response_code($e->getCode() ?: 500);
                            echo json_encode([
                                'status' => 'error',
                                'message' => $e->getMessage()
                            ]);
                        }
                    } else if (isset($path_parts[3]) && isset($path_parts[4]) && $path_parts[4] === 'update') {
                        try {
                            $blog->id = $path_parts[3];
                            
                            // Set blog properties from POST data
                            $blog->title = $_POST['title'] ?? null;
                            $blog->summary = $_POST['summary'] ?? null;
                            $blog->content = $_POST['content'] ?? null;

                            // Handle image if present
                            if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                                $blog->image = $_FILES['image']['name'];
                            }

                            $result = $blog->update();
                            
                            if ($result) {
                                echo json_encode([
                                    'status' => 'success',
                                    'data' => $result
                                ]);
                            } else {
                                throw new Exception("Failed to update blog", 500);
                            }
                        } catch (Exception $e) {
                            http_response_code($e->getCode() ?: 500);
                            echo json_encode([
                                'status' => 'error',
                                'message' => $e->getMessage()
                            ]);
                        }
                    }
                    break;
                    
                case 'DELETE':
                    try {
                        if (!isset($path_parts[3])) {
                            throw new Exception('Blog ID is required');
                        }
                        
                        $blog = new Blog($db);
                        $blog->id = $path_parts[3];
                        
                        // Verify blog ownership (optional but recommended)
                        $currentBlog = $blog->readOne($blog->id);
                        if (!$currentBlog) {
                            throw new Exception('Blog not found', 404);
                        }
                        
                        if ($blog->delete()) {
                            echo json_encode([
                                'status' => 'success',
                                'message' => 'Blog deleted successfully'
                            ]);
                        } else {
                            throw new Exception('Failed to delete blog');
                        }
                    } catch (Exception $e) {
                        http_response_code($e->getCode() ?: 500);
                        echo json_encode([
                            'status' => 'error',
                            'message' => $e->getMessage()
                        ]);
                    }
                    break;
                    
                case 'PUT':
                    if (isset($path_parts[3])) {  // blogs/{id}
                        try {
                            $blog->id = $path_parts[3];
                            
                            // Get PUT data
                            $putData = file_get_contents("php://input");
                            $formData = [];
                            parse_str($putData, $formData);
                            
                            // Handle multipart form data
                            if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                                $blog->image = handleImageUpload($_FILES['image']);
                            }
                            
                            // Set blog properties from PUT data
                            if (isset($formData['title'])) {
                                $blog->title = $formData['title'];
                            }
                            if (isset($formData['summary'])) {
                                $blog->summary = $formData['summary'];
                            }
                            if (isset($formData['content'])) {
                                $blog->content = $formData['content'];
                            }
                            
                            $result = $blog->update();
                            
                            if ($result) {
                                echo json_encode([
                                    'status' => 'success',
                                    'data' => $result
                                ]);
                            } else {
                                throw new Exception("Failed to update blog", 400);
                            }
                        } catch (Exception $e) {
                            http_response_code($e->getCode() ?: 500);
                            echo json_encode([
                                'status' => 'error',
                                'message' => $e->getMessage()
                            ]);
                        }
                    }
                    break;
                    
                default:
                    http_response_code(405); // Method Not Allowed
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Method not allowed'
                    ]);
                    break;
            }

            // Handle image update endpoint
            if ($_SERVER['REQUEST_METHOD'] === 'PUT' && isset($path_parts[3]) && isset($path_parts[4]) && $path_parts[4] === 'image') {
                try {
                    $blogId = $path_parts[3];
                    
                    // Get PUT data
                    $putdata = file_get_contents("php://input");
                    
                    // Find the start of file content
                    $start = strpos($putdata, "\r\n\r\n") + 4;
                    $end = strrpos($putdata, "\r\n--");
                    if ($start === false || $end === false) {
                        throw new Exception("Invalid file format");
                    }
                    
                    // Extract file content
                    $content = substr($putdata, $start, $end - $start);
                    
                    // Create temporary file
                    $tmpFile = tempnam(sys_get_temp_dir(), 'img');
                    file_put_contents($tmpFile, $content);
                    
                    $fileInfo = [
                        'tmp_name' => $tmpFile,
                        'name' => 'upload.jpg',
                        'type' => mime_content_type($tmpFile),
                        'size' => strlen($content),
                        'error' => 0
                    ];
                    
                    $blog = new Blog($db);
                    $blog->id = $blogId;
                    
                    // Process the image
                    $newImageName = $blog->handleImageUpload($fileInfo);
                    
                    // Clean up
                    @unlink($tmpFile);
                    
                    if (!$newImageName) {
                        throw new Exception("Failed to process image");
                    }
                    
                    $blog->image = $newImageName;
                    $result = $blog->updateImage();
                    
                    if ($result) {
                        http_response_code(200);
                        echo json_encode([
                            'status' => 'success',
                            'data' => $result
                        ]);
                    } else {
                        throw new Exception("Failed to update blog image");
                    }
                    
                } catch (Exception $e) {
                    error_log("Image update error: " . $e->getMessage());
                    http_response_code(500);
                    echo json_encode([
                        'status' => 'error',
                        'message' => $e->getMessage()
                    ]);
                }
                exit;
            }
        }
    } else {
        throw new Exception('Invalid endpoint', 404);
    }
} catch (Exception $e) {
    error_log("Fatal error: " . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'An unexpected error occurred',
        'debug' => $e->getMessage() // Remove in production
    ]);
}

// At the top of your file, update CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Inside the image upload handler
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($path_parts[3]) && isset($path_parts[4]) && $path_parts[4] === 'image') {
    header('Content-Type: application/json');
    
    try {
        // Enable error reporting
        error_reporting(E_ALL);
        ini_set('display_errors', 1);
        
        // Debug logs
        error_log("Request Method: " . $_SERVER['REQUEST_METHOD']);
        error_log("Content Type: " . $_SERVER['CONTENT_TYPE']);
        error_log("Raw POST data: " . file_get_contents('php://input'));
        error_log("FILES array: " . print_r($_FILES, true));
        error_log("POST array: " . print_r($_POST, true));
        
        if (!isset($path_parts[3])) {
            throw new Exception('Blog ID is required', 400);
        }

        if (!isset($_FILES['image'])) {
            throw new Exception('No image file received in $_FILES[\'image\']', 400);
        }

        if ($_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            throw new Exception('File upload error code: ' . $_FILES['image']['error'], 400);
        }

        $blog = new Blog($db);
        $blog->id = $path_parts[3];

        // Verify upload directory exists and is writable
        $uploadDir = __DIR__ . '/uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        
        if (!is_writable($uploadDir)) {
            throw new Exception('Upload directory is not writable', 500);
        }

        // Handle image upload
        $newImageName = $blog->handleImageUpload($_FILES['image']);
        if (!$newImageName) {
            throw new Exception('Failed to process uploaded image', 500);
        }

        $blog->image = $newImageName;
        $result = $blog->updateImage();
        
        if ($result) {
            $response = [
                'status' => 'success',
                'data' => $result
            ];
            error_log("Success response: " . json_encode($response));
            echo json_encode($response);
        } else {
            throw new Exception('Failed to update blog image in database', 500);
        }
    } catch (Exception $e) {
        error_log("Image upload error: " . $e->getMessage());
        $errorResponse = [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
        http_response_code($e->getCode() ?: 500);
        echo json_encode($errorResponse);
        error_log("Error response: " . json_encode($errorResponse));
    }
    exit;
}

// Inside the if ($path_parts[2] === 'blogs') block
if ($_SERVER['REQUEST_METHOD'] === 'PUT' && isset($path_parts[3]) && isset($path_parts[4]) && $path_parts[4] === 'image') {
    header('Content-Type: application/json');
    
    try {
        // Get the raw PUT data
        $putData = file_get_contents('php://input');
        
        // Find the boundary
        $contentType = $_SERVER['CONTENT_TYPE'];
        preg_match('/boundary=(.*)$/', $contentType, $matches);
        $boundary = $matches[1];
        
        // Split content by boundary
        $parts = array_slice(explode('--' . $boundary, $putData), 1, -1);
        
        if (empty($parts)) {
            throw new Exception('No file data received', 400);
        }
        
        // Process the first part (should be our image)
        $part = $parts[0];
        
        // Extract the binary data
        $part = ltrim($part, "\r\n");
        list($headers, $body) = explode("\r\n\r\n", $part, 2);
        
        // Create temporary file
        $tmpfname = tempnam(sys_get_temp_dir(), 'PUT');
        file_put_contents($tmpfname, $body);
        
        $fileInfo = [
            'tmp_name' => $tmpfname,
            'name' => 'upload.jpg', // Will be renamed by handleImageUpload
            'type' => mime_content_type($tmpfname),
            'size' => filesize($tmpfname),
            'error' => 0
        ];

        $blog = new Blog($db);
        $blog->id = $path_parts[3];
        
        $newImageName = $blog->handleImageUpload($fileInfo);
        if (!$newImageName) {
            throw new Exception('Failed to process uploaded image', 500);
        }

        $blog->image = $newImageName;
        $result = $blog->updateImage();
        
        // Clean up
        @unlink($tmpfname);
        
        if ($result) {
            echo json_encode([
                'status' => 'success',
                'data' => $result
            ]);
        } else {
            throw new Exception('Failed to update blog image in database', 500);
        }
    } catch (Exception $e) {
        error_log("Image update error: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        error_log("Raw input: " . $putData);
        error_log("Content Type: " . $_SERVER['CONTENT_TYPE']);
        http_response_code($e->getCode() ?: 500);
        echo json_encode([
            'status' => 'error',
            'message' => $e->getMessage()
        ]);
    }
    exit;
}