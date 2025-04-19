<?php
//C:\xampp\htdocs\php-blog1-api\backend\models\User.php

require_once __DIR__ . '/../config/database.php';
class User {
    private $conn;
    private $table = 'users';
    private $jwt_secret = 'your_secure_secret_key'; // Move this to a secure config file in production

    // User Properties
    public $id;
    public $username;
    public $password; // Added for potential updates
    // email and created_at are fetched but not typically set directly on the object for updates/deletes

    public function __construct($db) {
        $this->conn = $db;
    }

    public function authenticate($username, $password) {
        try {
            $query = "SELECT id, username, password 
                      FROM " . $this->table . " 
                      WHERE username = :username";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':username', $username);
            $stmt->execute();

            if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                if (password_verify($password, $row['password'])) {
                    unset($row['password']);
                    
                    // Generate JWT token
                    $issued_at = time();
                    $expiration = $issued_at + (60 * 60); // Token expires in 1 hour
                    
                    $payload = array(
                        "iat" => $issued_at,
                        "exp" => $expiration,
                        "user" => array(
                            "id" => $row['id'],
                            "username" => $row['username']
                        )
                    );
                    
                    $jwt = $this->generateJWT($payload);
                    
                    return [
                        'status' => 'success',
                        'data' => [
                            'token' => $jwt,
                            'user' => $row
                        ]
                    ];
                }
            }

            throw new Exception('Invalid username or password', 401);
        } catch (PDOException $e) {
            error_log("Database error: " . $e->getMessage());
            throw new Exception('Authentication failed', 500);
        }
    }

    private function generateJWT($payload) {
        // Create token header
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        
        // Encode Header
        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        
        // Encode Payload
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));
        
        // Create Signature
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->jwt_secret, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public function verifyJWT($jwt) {
        $tokenParts = explode('.', $jwt);
        if (count($tokenParts) != 3) {
            return false;
        }
        
        $header = base64_decode($tokenParts[0]);
        $payload = base64_decode($tokenParts[1]);
        $signatureProvided = $tokenParts[2];
        
        // Check expiration
        $payloadObj = json_decode($payload);
        if ($payloadObj->exp < time()) {
            return false;
        }
        
        // Verify signature
        $base64UrlHeader = $tokenParts[0];
        $base64UrlPayload = $tokenParts[1];
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->jwt_secret, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return ($base64UrlSignature === $signatureProvided);
    }

    public function register($username, $password) {
        try {
            // Check if username already exists
            $query = "SELECT id FROM " . $this->table . " WHERE username = :username";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':username', $username);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                return [
                    'status' => 'error',
                    'message' => 'Username already exists'
                ];
            }

            // Hash password
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

            // Create query
            $query = "INSERT INTO " . $this->table . " (username, password) VALUES (:username, :password)";
            $stmt = $this->conn->prepare($query);

            // Bind values
            $stmt->bindParam(':username', $username);
            $stmt->bindParam(':password', $hashedPassword);

            if ($stmt->execute()) {
                $id = $this->conn->lastInsertId();
                
                // Prepare user data for response
                $userData = [
                    'id' => $id,
                    'username' => $username
                ];

                return [
                    'status' => 'success',
                    'message' => 'Registration successful',
                    'data' => $userData
                ];
            }

            return [
                'status' => 'error',
                'message' => 'Registration failed'
            ];

        } catch (PDOException $e) {
            error_log("Database error: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Registration failed'
            ];
        }
    }

    public function getById($id) {
        // Create query
        $query = "SELECT id, username, email, created_at 
                FROM " . $this->table . " 
                WHERE id = :id";

        // Prepare statement
        $stmt = $this->conn->prepare($query);

        // Bind ID
        $stmt->bindParam(':id', $id);

        // Execute query
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            throw new Exception('User not found', 404);
        }

        return $row;
    }

    public function getAll() {
        // Create query
        $query = "SELECT id, username, email, created_at 
                FROM " . $this->table . " 
                ORDER BY created_at DESC";

        // Prepare statement
        $stmt = $this->conn->prepare($query);

        // Execute query
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Update user
    public function update() {
        // Build query based on which properties are set
        $fields = [];
        if (!empty($this->username)) {
            $fields[] = 'username = :username';
        }
        if (!empty($this->password)) {
            $fields[] = 'password = :password';
        }

        if (empty($fields)) {
            // Nothing to update
            return false;
        }

        $query = 'UPDATE ' . $this->table . '
                  SET ' . implode(', ', $fields) . '
                  WHERE id = :id';

        $stmt = $this->conn->prepare($query);

        // Clean data & Bind parameters
        $this->id = htmlspecialchars(strip_tags($this->id));
        $stmt->bindParam(':id', $this->id);

        if (!empty($this->username)) {
            $this->username = htmlspecialchars(strip_tags($this->username));
            $stmt->bindParam(':username', $this->username);
        }
        
        if (!empty($this->password)) {
            // Hash password before saving
            $hashedPassword = password_hash($this->password, PASSWORD_DEFAULT);
            $stmt->bindParam(':password', $hashedPassword);
        }

        if($stmt->execute()) {
            // Check if any row was actually updated
            if($stmt->rowCount() > 0) {
                return true;
            } else {
                // User ID might not exist, or data was the same
                return false; 
            }
        }

        // Print error if something went wrong
        printf("Error: %s.\n", $stmt->error);
        return false;
    }

    // Delete User
    public function delete() {
        $query = 'DELETE FROM ' . $this->table . ' WHERE id = :id';

        $stmt = $this->conn->prepare($query);

        // Clean data
        $this->id = htmlspecialchars(strip_tags($this->id));

        // Bind data
        $stmt->bindParam(':id', $this->id);

        if($stmt->execute()) {
            // Check if any row was actually deleted
             if($stmt->rowCount() > 0) {
                return true;
            } else {
                // User ID might not exist
                return false; 
            }
        }

        // Print error if something went wrong
        printf("Error: %s.\n", $stmt->error);
        return false;
    }

    // Add encryption method
    private function encryptResponse($data) {
        $salt = bin2hex(random_bytes(16));
        $saltedData = json_encode($data) . $salt;
        return [
            'encrypted' => base64_encode($saltedData),
            'salt' => $salt
        ];
    }

    // Add decryption method
    private function decryptData($encrypted, $salt) {
        $decoded = base64_decode($encrypted);
        return substr($decoded, 0, -strlen($salt));
    }

    public function login($username, $password) {
        try {
            // Prepare query
            $query = "SELECT id, username, password FROM " . $this->table . " WHERE username = :username";
            $stmt = $this->conn->prepare($query);
            
            // Clean data
            $username = htmlspecialchars(strip_tags($username));
            
            // Bind data
            $stmt->bindParam(':username', $username);
            
            // Execute query
            $stmt->execute();
            
            if($stmt->rowCount() > 0) {
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if(password_verify($password, $row['password'])) {
                    // Prepare response data
                    $responseData = [
                        'token' => bin2hex(random_bytes(32)),
                        'user' => [
                            'id' => $row['id'],
                            'username' => $row['username']
                        ]
                    ];
                    
                    // Encrypt the response
                    $encryptedResponse = $this->encryptResponse($responseData);
                    
                    return [
                        'status' => 'success',
                        'message' => 'Login successful',
                        'data' => $encryptedResponse
                    ];
                }
                
                throw new Exception('Invalid password', 401);
            }
            
            throw new Exception('User not found', 401);
        } catch(Exception $e) {
            throw $e;
        }
    }

    public function create($userData) {
        try {
            // Check if username already exists
            $query = "SELECT id FROM " . $this->table . " WHERE username = :username";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':username', $userData->username);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                throw new Exception('Username already exists', 400);
            }

            // Hash password
            $hashedPassword = password_hash($userData->password, PASSWORD_DEFAULT);

            // Create query
            $query = "INSERT INTO " . $this->table . " (username, password) VALUES (:username, :password)";
            $stmt = $this->conn->prepare($query);

            // Bind values
            $stmt->bindParam(':username', $userData->username);
            $stmt->bindParam(':password', $hashedPassword);

            if ($stmt->execute()) {
                $id = $this->conn->lastInsertId();
                
                // Prepare user data for response
                $userData = [
                    'id' => $id,
                    'username' => $userData->username
                ];

                return [
                    'status' => 'success',
                    'message' => 'Registration successful',
                    'data' => $userData
                ];
            }

            throw new Exception('Registration failed', 500);

        } catch (PDOException $e) {
            error_log("Database error: " . $e->getMessage());
            throw new Exception('Registration failed: ' . $e->getMessage(), 500);
        }
    }
}

