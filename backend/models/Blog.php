<?php
// C:\xampp\htdocs\php-blog1-api\backend\models\Blog.php


require_once __DIR__ . '/../config/database.php';

class Blog {
    private $conn;
    private $table = 'blogs';

    public $id;
    public $title;
    public $summary;
    public $content;
    public $image;
    public $author_id;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        try {
            $this->conn->beginTransaction();

            // Handle image upload first
            if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                $uploadDir = __DIR__ . '/../uploads/';
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0755, true);
                }
                
                $fileName = uniqid() . '_' . basename($_FILES['image']['name']);
                $targetPath = $uploadDir . $fileName;
                
                if (move_uploaded_file($_FILES['image']['tmp_name'], $targetPath)) {
                    $this->image = $fileName;
                } else {
                    throw new Exception("Failed to upload image");
                }
            }

            // Validate required fields
            if (empty($this->title) || empty($this->content)) {
                throw new Exception("Title and content are required");
            }

            // Validate content length
            if (mb_strlen($this->content) > 16777215) {
                throw new Exception("Content exceeds maximum length");
            }

            $query = "INSERT INTO " . $this->table . "
                    (title, summary, content, image, author_id)
                    VALUES
                    (:title, :summary, :content, :image, :author_id)";

            $stmt = $this->conn->prepare($query);

            // Sanitize and bind data
            $this->title = htmlspecialchars(strip_tags($this->title));
            $this->summary = htmlspecialchars(strip_tags($this->summary));
            $this->content = htmlspecialchars(strip_tags($this->content));
            
            $stmt->bindParam(':title', $this->title);
            $stmt->bindParam(':summary', $this->summary);
            $stmt->bindParam(':content', $this->content);
            $stmt->bindParam(':image', $this->image);
            $stmt->bindParam(':author_id', $this->author_id);

            if ($stmt->execute()) {
                $this->id = $this->conn->lastInsertId();
                $this->conn->commit();

                // Fetch the created blog with author information
                $query = "SELECT b.*, u.username as author 
                         FROM " . $this->table . " b
                         LEFT JOIN users u ON b.author_id = u.id
                         WHERE b.id = :id";
                
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':id', $this->id);
                $stmt->execute();
                
                $blog = $stmt->fetch(PDO::FETCH_ASSOC);
                
                // Decode HTML entities for response
                $blog['title'] = html_entity_decode($blog['title'], ENT_QUOTES | ENT_HTML5, 'UTF-8');
                $blog['summary'] = html_entity_decode($blog['summary'], ENT_QUOTES | ENT_HTML5, 'UTF-8');
                $blog['content'] = html_entity_decode($blog['content'], ENT_QUOTES | ENT_HTML5, 'UTF-8');

                // Add full image URL to the newly created blog data
                if (!empty($blog['image'])) {
                    $blog['image_url'] = $this->_buildImageUrl($blog['image']);
                }

                // Return encrypted response
                return [
                    'status' => 'success',
                    'data' => $this->encryptResponse($blog)
                ];
            }

            throw new Exception("Failed to create blog post");
        } catch (Exception $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            throw $e;
        }
    }

    public function read($author_id = null) {
        try {
            $query = "SELECT b.*, u.username as author 
                    FROM " . $this->table . " b
                    LEFT JOIN users u ON b.author_id = u.id
                    ORDER BY b.created_at DESC";
            
            $stmt = $this->conn->prepare($query);
            
            if (!$stmt->execute()) {
                return [];
            }
            
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

            // Add full image URL
            foreach ($results as &$blog) {
                if (!empty($blog['image'])) {
                    $blog['image_url'] = $this->_buildImageUrl($blog['image']);
                }
            }

            return $this->encryptResponse($results);
        } catch(PDOException $e) {
            return $this->encryptResponse([]);
        }
    }

    public function handleImageUpload($file) {
        try {
            if (!isset($file['tmp_name']) || !is_file($file['tmp_name'])) {
                throw new Exception("Invalid file upload");
            }

            $uploadDir = __DIR__ . '/../uploads/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            // Validate file type
            $mimeType = mime_content_type($file['tmp_name']);
            $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
            
            if (!in_array($mimeType, $allowedTypes)) {
                throw new Exception("Invalid file type");
            }

            // Generate filename
            $extension = match($mimeType) {
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/gif' => 'gif',
                default => 'jpg'
            };
            
            $newFilename = uniqid() . '.' . $extension;
            $targetPath = $uploadDir . $newFilename;

            if (!copy($file['tmp_name'], $targetPath)) {
                throw new Exception("Failed to save file");
            }

            return $newFilename;
        } catch (Exception $e) {
            error_log("Error in handleImageUpload: " . $e->getMessage());
            return false;
        }
    }

    public function readOne($id) {
        try {
            // Modified query to include author username
            $query = "SELECT b.*, u.username as author 
                     FROM " . $this->table . " b
                     LEFT JOIN users u ON b.author_id = u.id
                     WHERE b.id = :id";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id", $id);
            $stmt->execute();

            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$row) {
                throw new Exception("Blog not found", 404);
            }

            // Add full image URL
            if (!empty($row['image'])) {
                $row['image_url'] = $this->_buildImageUrl($row['image']);
            }

            // Ensure we're returning the author information
            return $this->encryptResponse($row);
        } catch (PDOException $e) {
            throw new Exception("Failed to fetch blog details", 500);
        }
    }

    public function getUserBlogs($userId) {
        $query = "SELECT b.*, u.username as author 
                 FROM " . $this->table . " b
                 LEFT JOIN users u ON b.author_id = u.id
                 WHERE b.author_id = :author_id
                 ORDER BY b.created_at DESC";
        
        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":author_id", $userId, PDO::PARAM_INT);
            $stmt->execute();
            
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
            
            // HTML decode the content for each blog
            foreach ($results as &$blog) {
                if (isset($blog['title'])) {
                    $blog['title'] = html_entity_decode($blog['title'], ENT_QUOTES | ENT_HTML5, 'UTF-8');
                }
                if (isset($blog['summary'])) {
                    $blog['summary'] = html_entity_decode($blog['summary'], ENT_QUOTES | ENT_HTML5, 'UTF-8');
                }
                if (isset($blog['content'])) {
                    $blog['content'] = html_entity_decode($blog['content'], ENT_QUOTES | ENT_HTML5, 'UTF-8');
                }
                // Add full image URL
                if (!empty($blog['image'])) {
                    $blog['image_url'] = $this->_buildImageUrl($blog['image']);
                }
            }

            // Return encrypted response
            return [
                'status' => 'success',
                'data' => $this->encryptResponse($results)
            ];
            
        } catch (PDOException $e) {
            error_log("Error in getUserBlogs: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to fetch user blogs'
            ];
        }
    }

    public function update() {
        try {
            $this->conn->beginTransaction();

            $query = "UPDATE " . $this->table . " SET ";
            $updateFields = [];
            $params = [];

            if ($this->title !== null) {
                $updateFields[] = "title = :title";
                $params[':title'] = strip_tags($this->title);
            }
            if ($this->summary !== null) {
                $updateFields[] = "summary = :summary";
                $params[':summary'] = strip_tags($this->summary);
            }
            if ($this->content !== null) {
                $updateFields[] = "content = :content";
                // Decode any existing entities before saving
                $decodedContent = html_entity_decode($this->content, ENT_QUOTES | ENT_HTML5, 'UTF-8');
                // Strip tags if needed but preserve line breaks
                $params[':content'] = strip_tags($decodedContent, '<br><p>');
            }

            if (empty($updateFields)) {
                throw new Exception("No fields to update");
            }

            $query .= implode(", ", $updateFields);
            $query .= " WHERE id = :id";
            $params[':id'] = $this->id;

            $stmt = $this->conn->prepare($query);

            if ($stmt->execute($params)) {
                $this->conn->commit();
                return $this->getBlogById($this->id);
            }

            throw new Exception("Failed to update blog");
        } catch (Exception $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            throw $e;
        }
    }

    public function delete() {
        $query = "DELETE FROM " . $this->table . " WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);

            // Bind parameter
            $stmt->bindParam(':id', $this->id);

            if ($stmt->execute()) {
                return [
                    'status' => 'success',
                    'message' => 'Blog deleted successfully'
                ];
            }
            throw new Exception("Failed to delete blog", 400);
        } catch (PDOException $e) {
            throw new Exception("Database error occurred", 500);
        }
    }

    public function getByUserId($userId) {
        // Prepare query using author_id instead of user_id
        $query = "SELECT b.*, u.username as author 
                FROM " . $this->table . " b
                LEFT JOIN users u ON b.author_id = u.id
                WHERE b.author_id = :author_id
                ORDER BY b.created_at DESC";
        
        try {
            // Prepare and execute
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":author_id", $userId, PDO::PARAM_INT);
            
            $stmt->execute();
            
            // Get the results
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return $results;
            
        } catch (PDOException $e) {
            throw new Exception("Failed to fetch user blogs", 500);
        }
    }

    private function getBlogById($id) {
        $query = "SELECT b.*, u.username as author 
                 FROM " . $this->table . " b
                 LEFT JOIN users u ON b.author_id = u.id
                 WHERE b.id = :id";
        
        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            
            if (!$stmt->execute()) {
                throw new Exception("Failed to fetch blog");
            }
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$result) {
                throw new Exception("Blog not found");
            }
            
            // Decode HTML entities for all text fields
            $result['title'] = html_entity_decode($result['title'], ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $result['summary'] = html_entity_decode($result['summary'], ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $result['content'] = html_entity_decode($result['content'], ENT_QUOTES | ENT_HTML5, 'UTF-8');
            
            // Add full image URL
            if (!empty($result['image'])) {
                $result['image_url'] = $this->_buildImageUrl($result['image']);
            }
            
            return $result;
        } catch (Exception $e) {
            error_log("Error fetching blog: " . $e->getMessage());
            throw new Exception("Failed to fetch blog details");
        }
    }

    public function updateImage() {
        try {
            $query = "UPDATE " . $this->table . " 
                     SET image = :image
                     WHERE id = :id";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':image', $this->image, PDO::PARAM_STR);
            $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);

            if ($stmt->execute()) {
                return $this->getBlogById($this->id);
            }
            return false;
        } catch (Exception $e) {
            error_log("Database error: " . $e->getMessage());
            return false;
        }
    }

    private function _buildImageUrl($filename) {
        if (empty($filename)) {
            return null;
        }
        // Construct the base URL dynamically
        $scheme = $_SERVER['REQUEST_SCHEME'] ?? 'http';
        $host = $_SERVER['HTTP_HOST'];
        // Get the base path, assuming the script is run from within the API directory structure
        $basePath = rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'])), '/'); // Go up two levels from /backend/index.php potentially

        // If basePath is empty (e.g., root install), handle appropriately
        if ($basePath == '/' || $basePath == '\\') {
             $basePath = '';
        }

        return $scheme . '://' . $host . $basePath . '/backend/uploads/' . $filename;
    }

    private function encryptResponse($data) {
        $salt = bin2hex(random_bytes(16));
        $saltedData = json_encode($data) . $salt;
        return [
            'encrypted' => base64_encode($saltedData),
            'salt' => $salt
        ];
    }

    public function decryptResponse($encrypted, $salt) {
        $decoded = base64_decode($encrypted);
        if ($decoded === false) {
            throw new Exception("Failed to decode base64 data");
        }
        
        $data = substr($decoded, 0, -strlen($salt));
        
        $jsonData = json_decode($data, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Failed to decode JSON data: " . json_last_error_msg());
        }
        
        return $jsonData;
    }

    /**
     * Generate or update AI summary for a blog post
     * 
     * @param int $id Blog ID
     * @param string|null $customPrompt Optional custom prompt for the AI
     * @return array Response with the AI-generated summary
     * @throws Exception if blog not found or API error
     */
    public function generateAiSummary($id, $customPrompt = null) {
        try {
            // Get the blog data first
            $blog = $this->getBlogById($id);
            
            if (!$blog) {
                throw new Exception("Blog not found", 404);
            }

            // Create the prompt for the AI
            $prompt = $customPrompt ?? "
                Please summarize the following blog post in a concise way.
                
                Title: {$blog['title']}
                
                Content: {$blog['content']}
                
                Please provide a 2-3 sentence summary that captures the key points.
            ";
            
            // Call the Ollama API (function defined in index.php)
            $aiResponse = callOllamaAPI($prompt);
            
            if (!$aiResponse || !isset($aiResponse['message']['content'])) {
                throw new Exception("Failed to generate AI summary", 500);
            }
            
            // Extract the summary text
            $summaryText = $aiResponse['message']['content'];
            
            // Update the blog with the new AI-generated summary
            $query = "UPDATE " . $this->table . " 
                     SET summary = :summary
                     WHERE id = :id";
                     
            $stmt = $this->conn->prepare($query);
            
            // Sanitize the summary
            $sanitizedSummary = htmlspecialchars(strip_tags(trim($summaryText)));
            
            $stmt->bindParam(':summary', $sanitizedSummary);
            $stmt->bindParam(':id', $id);
            
            $stmt->execute();
            
            // Return the AI response along with the updated blog data
            return [
                'status' => 'success',
                'data' => [
                    'summary' => $summaryText,
                    'blog_id' => $id,
                    'blog' => $this->encryptResponse($blog)
                ]
            ];
            
        } catch (Exception $e) {
            throw $e;
        }
    }
}