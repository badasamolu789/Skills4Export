{
    "openapi": "3.0.3",
    "info": {
        "title": "SkillForExport API",
        "version": "0.1.0",
        "description": "API documentation for SkillForExport backend"
    },
    "components": {
        "schemas": {}
    },
    "paths": {
        "/api/": {
            "get": {
                "operationId": "getRoot",
                "description": "API root endpoint",
                "responses": {
                    "200": {
                        "description": "Default Response"
                    }
                }
            }
        },
        "/api/health": {
            "get": {
                "operationId": "getHealth",
                "tags": [
                    "Health"
                ],
                "description": "Check API health status",
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "status": {
                                            "type": "string"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/auth/google": {
            "get": {
                "operationId": "googleRedirect",
                "tags": [
                    "Auth"
                ],
                "description": "Redirect to Google OAuth consent screen",
                "responses": {
                    "200": {
                        "description": "Default Response"
                    }
                }
            }
        },
        "/api/auth/google/callback": {
            "get": {
                "operationId": "googleCallback",
                "tags": [
                    "Auth"
                ],
                "description": "Google OAuth callback handler",
                "responses": {
                    "200": {
                        "description": "Default Response"
                    }
                }
            }
        },
        "/api/auth/google/token": {
            "post": {
                "operationId": "googleTokenSignIn",
                "tags": [
                    "Auth"
                ],
                "description": "Exchange a Google ID token for an application auth token.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "id_token"
                                ],
                                "description": "Google ID token obtained from the client after a successful Google sign-in flow.",
                                "properties": {
                                    "id_token": {
                                        "type": "string"
                                    }
                                },
                                "example": {
                                    "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij..."
                                }
                            }
                        }
                    },
                    "description": "Google ID token obtained from the client after a successful Google sign-in flow."
                },
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "token": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "email": {
                                                    "type": "string"
                                                },
                                                "username": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "api_token": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                }
                                            },
                                            "example": {
                                                "id": "user-uuid",
                                                "email": "user@example.com",
                                                "username": "janedoe",
                                                "api_token": "eyJhbGciOiJI..."
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "token": "eyJhbGciOiJI...",
                                        "data": {
                                            "id": "user-uuid",
                                            "email": "user@example.com",
                                            "username": "janedoe",
                                            "api_token": "eyJhbGciOiJI..."
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": [
                                                "null",
                                                "object"
                                            ]
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "message": "Token invalid or expired",
                                        "data": null
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/register/send-otp": {
            "post": {
                "operationId": "sendRegistrationOtp",
                "tags": [
                    "Auth"
                ],
                "description": "Start registration by sending an OTP to the supplied email address.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "email"
                                ],
                                "properties": {
                                    "email": {
                                        "type": "string"
                                    }
                                },
                                "example": {
                                    "email": "user@example.com"
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "data": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "message": "OTP sent to your email",
                                        "data": "user@example.com"
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "errors": {
                                                    "type": "object",
                                                    "additionalProperties": {
                                                        "type": "array",
                                                        "items": {
                                                            "type": "string"
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "message": "email is required",
                                        "data": {
                                            "errors": {
                                                "email": [
                                                    "email is required"
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/register/verify-otp": {
            "post": {
                "operationId": "verifyRegistrationOtp",
                "tags": [
                    "Auth"
                ],
                "description": "Verify the OTP code sent during registration before completing account creation.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "email",
                                    "otp"
                                ],
                                "properties": {
                                    "email": {
                                        "type": "string"
                                    },
                                    "otp": {
                                        "type": "string"
                                    }
                                },
                                "example": {
                                    "email": "user@example.com",
                                    "otp": "123456"
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "data": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "message": "OTP sent to your email",
                                        "data": "user@example.com"
                                    }
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": [
                                                "null",
                                                "object"
                                            ]
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "message": "Token invalid or expired",
                                        "data": null
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "errors": {
                                                    "type": "object",
                                                    "additionalProperties": {
                                                        "type": "array",
                                                        "items": {
                                                            "type": "string"
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "message": "email is required",
                                        "data": {
                                            "errors": {
                                                "email": [
                                                    "email is required"
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/register/resend-otp": {
            "post": {
                "operationId": "resendRegistrationOtp",
                "tags": [
                    "Auth"
                ],
                "description": "Resend the registration OTP to the provided email address.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "email"
                                ],
                                "properties": {
                                    "email": {
                                        "type": "string"
                                    }
                                },
                                "example": {
                                    "email": "user@example.com"
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "data": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "message": "OTP sent to your email",
                                        "data": "user@example.com"
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "errors": {
                                                    "type": "object",
                                                    "additionalProperties": {
                                                        "type": "array",
                                                        "items": {
                                                            "type": "string"
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "message": "email is required",
                                        "data": {
                                            "errors": {
                                                "email": [
                                                    "email is required"
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/register/set-password": {
            "post": {
                "operationId": "setRegistrationPassword",
                "tags": [
                    "Auth"
                ],
                "description": "Set the password during the registration flow after email ownership has been verified.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "email",
                                    "password"
                                ],
                                "properties": {
                                    "email": {
                                        "type": "string"
                                    },
                                    "password": {
                                        "type": "string"
                                    }
                                },
                                "example": {
                                    "email": "user@example.com",
                                    "password": "P@ssw0rd123"
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": "object",
                                            "additionalProperties": true
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "message": "Password set successfully",
                                        "data": {}
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "errors": {
                                                    "type": "object",
                                                    "additionalProperties": {
                                                        "type": "array",
                                                        "items": {
                                                            "type": "string"
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "message": "email is required",
                                        "data": {
                                            "errors": {
                                                "email": [
                                                    "email is required"
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/register/complete": {
            "post": {
                "operationId": "completeRegistration",
                "tags": [
                    "Auth"
                ],
                "description": "Complete the registration flow and return the created user with an API token.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "email",
                                    "name"
                                ],
                                "description": "Complete registration after OTP verification.",
                                "properties": {
                                    "email": {
                                        "type": "string",
                                        "example": "user@example.com"
                                    },
                                    "name": {
                                        "type": "string",
                                        "example": "Jane Doe"
                                    },
                                    "ref_code": {
                                        "type": "string",
                                        "example": "ABC123"
                                    }
                                },
                                "example": {
                                    "email": "user@example.com",
                                    "name": "Jane Doe",
                                    "ref_code": "ABC123"
                                }
                            }
                        }
                    },
                    "description": "Complete registration after OTP verification."
                },
                "responses": {
                    "201": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "token": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "email": {
                                                    "type": "string"
                                                },
                                                "username": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "api_token": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                }
                                            },
                                            "example": {
                                                "id": "user-uuid",
                                                "email": "user@example.com",
                                                "username": "janedoe",
                                                "api_token": "eyJhbGciOiJI..."
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "token": "eyJhbGciOiJI...",
                                        "data": {
                                            "id": "user-uuid",
                                            "email": "user@example.com",
                                            "username": "janedoe",
                                            "api_token": "eyJhbGciOiJI..."
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": [
                                                "null",
                                                "object"
                                            ]
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "message": "Token invalid or expired",
                                        "data": null
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "errors": {
                                                    "type": "object",
                                                    "additionalProperties": {
                                                        "type": "array",
                                                        "items": {
                                                            "type": "string"
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "message": "email is required",
                                        "data": {
                                            "errors": {
                                                "email": [
                                                    "email is required"
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/login": {
            "post": {
                "operationId": "loginWithEmailPassword",
                "tags": [
                    "Auth"
                ],
                "description": "Authenticate with email and password and return the authenticated user plus API token.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "email",
                                    "password"
                                ],
                                "description": "Standard email/password login request. This endpoint does not require an OTP for normal authentication flows.",
                                "properties": {
                                    "email": {
                                        "type": "string"
                                    },
                                    "password": {
                                        "type": "string"
                                    }
                                },
                                "example": {
                                    "email": "user@example.com",
                                    "password": "P@ssw0rd"
                                }
                            }
                        }
                    },
                    "description": "Standard email/password login request. This endpoint does not require an OTP for normal authentication flows."
                },
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "token": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "email": {
                                                    "type": "string"
                                                },
                                                "username": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "api_token": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                }
                                            },
                                            "example": {
                                                "id": "user-uuid",
                                                "email": "user@example.com",
                                                "username": "janedoe",
                                                "api_token": "eyJhbGciOiJI..."
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "token": "eyJhbGciOiJI...",
                                        "data": {
                                            "id": "user-uuid",
                                            "email": "user@example.com",
                                            "username": "janedoe",
                                            "api_token": "eyJhbGciOiJI..."
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "message": {
                                            "type": "string"
                                        }
                                    },
                                    "example": {
                                        "message": "Invalid credentials"
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "errors": {
                                                    "type": "object",
                                                    "additionalProperties": {
                                                        "type": "array",
                                                        "items": {
                                                            "type": "string"
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "message": "email is required",
                                        "data": {
                                            "errors": {
                                                "email": [
                                                    "email is required"
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/forgot-password": {
            "post": {
                "operationId": "requestPasswordReset",
                "tags": [
                    "Auth"
                ],
                "description": "Request a password reset token or OTP for the supplied email address.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "email"
                                ],
                                "properties": {
                                    "email": {
                                        "type": "string"
                                    }
                                },
                                "example": {
                                    "email": "user@example.com"
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "data": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "message": "OTP sent to your email",
                                        "data": "user@example.com"
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "errors": {
                                                    "type": "object",
                                                    "additionalProperties": {
                                                        "type": "array",
                                                        "items": {
                                                            "type": "string"
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "message": "email is required",
                                        "data": {
                                            "errors": {
                                                "email": [
                                                    "email is required"
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/reset-password": {
            "post": {
                "operationId": "resetPassword",
                "tags": [
                    "Auth"
                ],
                "description": "Reset a user password with a reset token or OTP previously issued by the platform.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "email",
                                    "password",
                                    "password_confirmation"
                                ],
                                "anyOf": [
                                    {
                                        "required": [
                                            "otp"
                                        ]
                                    },
                                    {
                                        "required": [
                                            "token"
                                        ]
                                    }
                                ],
                                "properties": {
                                    "otp": {
                                        "type": "string",
                                        "example": "123456"
                                    },
                                    "token": {
                                        "type": "string",
                                        "example": "f3a8...token"
                                    },
                                    "email": {
                                        "type": "string",
                                        "example": "user@example.com"
                                    },
                                    "password": {
                                        "type": "string",
                                        "example": "NewP@ssw0rd123"
                                    },
                                    "password_confirmation": {
                                        "type": "string",
                                        "example": "NewP@ssw0rd123"
                                    }
                                },
                                "example": {
                                    "token": "f3a8...token",
                                    "email": "user@example.com",
                                    "password": "NewP@ssw0rd123",
                                    "password_confirmation": "NewP@ssw0rd123"
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "message": "Operation completed successfully"
                                    }
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": [
                                                "null",
                                                "object"
                                            ]
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "message": "Token invalid or expired",
                                        "data": null
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "errors": {
                                                    "type": "object",
                                                    "additionalProperties": {
                                                        "type": "array",
                                                        "items": {
                                                            "type": "string"
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "message": "email is required",
                                        "data": {
                                            "errors": {
                                                "email": [
                                                    "email is required"
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/logout": {
            "post": {
                "operationId": "logoutUser",
                "tags": [
                    "Auth"
                ],
                "description": "Invalidate the current authenticated session or token.",
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "message": "Operation completed successfully"
                                    }
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": [
                                                "null",
                                                "object"
                                            ]
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "message": "Token invalid or expired",
                                        "data": null
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/refresh-token": {
            "post": {
                "operationId": "refreshAuthToken",
                "tags": [
                    "Auth"
                ],
                "description": "Refresh the current authentication token and return a new token payload.",
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "token": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "email": {
                                                    "type": "string"
                                                },
                                                "username": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "api_token": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                }
                                            },
                                            "example": {
                                                "id": "user-uuid",
                                                "email": "user@example.com",
                                                "username": "janedoe",
                                                "api_token": "eyJhbGciOiJI..."
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "token": "eyJhbGciOiJI...",
                                        "data": {
                                            "id": "user-uuid",
                                            "email": "user@example.com",
                                            "username": "janedoe",
                                            "api_token": "eyJhbGciOiJI..."
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": [
                                                "null",
                                                "object"
                                            ]
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "message": "Token invalid or expired",
                                        "data": null
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/user/change-password": {
            "put": {
                "operationId": "changeUserPassword",
                "tags": [
                    "Auth"
                ],
                "description": "Change the password for the currently authenticated user.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "current_password",
                                    "password",
                                    "password_confirmation"
                                ],
                                "description": "Change the password for the authenticated user.",
                                "properties": {
                                    "current_password": {
                                        "type": "string",
                                        "example": "OldP@ssw0rd"
                                    },
                                    "password": {
                                        "type": "string",
                                        "example": "NewP@ssw0rd123"
                                    },
                                    "password_confirmation": {
                                        "type": "string",
                                        "example": "NewP@ssw0rd123"
                                    }
                                },
                                "example": {
                                    "current_password": "OldP@ssw0rd",
                                    "password": "NewP@ssw0rd123",
                                    "password_confirmation": "NewP@ssw0rd123"
                                }
                            }
                        }
                    },
                    "description": "Change the password for the authenticated user."
                },
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": "array",
                                            "items": {}
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "message": "Deleted success",
                                        "data": []
                                    }
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": [
                                                "null",
                                                "object"
                                            ]
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "message": "Token invalid or expired",
                                        "data": null
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "errors": {
                                                    "type": "object",
                                                    "additionalProperties": {
                                                        "type": "array",
                                                        "items": {
                                                            "type": "string"
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "message": "email is required",
                                        "data": {
                                            "errors": {
                                                "email": [
                                                    "email is required"
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/user/change-email": {
            "put": {
                "operationId": "changeUserEmail",
                "tags": [
                    "Auth"
                ],
                "description": "Change the email address for the currently authenticated user.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "new_email"
                                ],
                                "description": "Change the email address for the authenticated user.",
                                "properties": {
                                    "new_email": {
                                        "type": "string",
                                        "example": "new-email@example.com"
                                    }
                                },
                                "example": {
                                    "new_email": "new-email@example.com"
                                }
                            }
                        }
                    },
                    "description": "Change the email address for the authenticated user."
                },
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "email": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "message": "Email change requested. Please verify.",
                                        "data": {
                                            "email": "new-email@example.com"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": [
                                                "null",
                                                "object"
                                            ]
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "message": "Token invalid or expired",
                                        "data": null
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "errors": {
                                                    "type": "object",
                                                    "additionalProperties": {
                                                        "type": "array",
                                                        "items": {
                                                            "type": "string"
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "message": "email is required",
                                        "data": {
                                            "errors": {
                                                "email": [
                                                    "email is required"
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/users/{id}": {
            "get": {
                "operationId": "getUser",
                "tags": [
                    "Users"
                ],
                "description": "Get a user record by id.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "email": {
                                                    "type": "string"
                                                },
                                                "username": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "role": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "user-uuid",
                                            "email": "user@example.com",
                                            "username": "janedoe",
                                            "role": "user"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "404": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/users": {
            "post": {
                "operationId": "createUser",
                "tags": [
                    "Users"
                ],
                "description": "Create a user",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "email",
                                    "password"
                                ],
                                "properties": {
                                    "email": {
                                        "type": "string"
                                    },
                                    "password": {
                                        "type": "string"
                                    },
                                    "role": {
                                        "type": "string",
                                        "enum": [
                                            "user",
                                            "admin"
                                        ]
                                    }
                                },
                                "example": {
                                    "email": "user@example.com",
                                    "password": "P@ssw0rd",
                                    "role": "user"
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "email": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "409": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "errors": {
                                                    "type": "object",
                                                    "additionalProperties": {
                                                        "type": "array",
                                                        "items": {
                                                            "type": "string"
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "message": "email is required",
                                        "data": {
                                            "errors": {
                                                "email": [
                                                    "email is required"
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/users/{id}/profile": {
            "get": {
                "operationId": "getUserProfile",
                "tags": [
                    "Users"
                ],
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "user": {
                                                    "type": "object",
                                                    "properties": {
                                                        "id": {
                                                            "type": "string"
                                                        },
                                                        "email": {
                                                            "type": "string"
                                                        },
                                                        "role": {
                                                            "type": "string"
                                                        },
                                                        "created_at": {
                                                            "type": "string"
                                                        }
                                                    }
                                                },
                                                "profile": {
                                                    "type": "object",
                                                    "properties": {
                                                        "id": {
                                                            "type": "string",
                                                            "description": "Profile record id (server-generated)",
                                                            "readOnly": true
                                                        },
                                                        "userId": {
                                                            "type": "string",
                                                            "description": "User id (derived from authenticated token)",
                                                            "readOnly": true
                                                        },
                                                        "username": {
                                                            "type": "string"
                                                        },
                                                        "bio": {
                                                            "type": "string"
                                                        },
                                                        "location": {
                                                            "type": "string"
                                                        },
                                                        "avatar": {
                                                            "type": [
                                                                "null",
                                                                "string"
                                                            ]
                                                        },
                                                        "banner": {
                                                            "type": [
                                                                "null",
                                                                "string"
                                                            ]
                                                        },
                                                        "website": {
                                                            "type": "string"
                                                        },
                                                        "linkedin": {
                                                            "type": "string"
                                                        },
                                                        "github": {
                                                            "type": "string"
                                                        },
                                                        "createdAt": {
                                                            "type": "string",
                                                            "format": "date-time"
                                                        }
                                                    },
                                                    "example": {
                                                        "id": "profile-uuid",
                                                        "userId": "user-uuid",
                                                        "username": "tech",
                                                        "bio": "Developer",
                                                        "location": "Remote",
                                                        "avatar": null,
                                                        "banner": null,
                                                        "website": "https://example.com",
                                                        "linkedin": "https://linkedin.com/in/tech",
                                                        "github": "https://github.com/tech",
                                                        "createdAt": "2026-04-13T00:00:00Z"
                                                    }
                                                },
                                                "skills": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "object",
                                                        "properties": {
                                                            "id": {
                                                                "type": "string"
                                                            },
                                                            "name": {
                                                                "type": "string"
                                                            },
                                                            "level": {
                                                                "type": "string",
                                                                "enum": [
                                                                    "beginner",
                                                                    "intermediate",
                                                                    "expert"
                                                                ]
                                                            }
                                                        },
                                                        "example": {
                                                            "id": "skill-uuid",
                                                            "name": "JavaScript",
                                                            "level": "expert"
                                                        }
                                                    }
                                                },
                                                "portfolios": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "object",
                                                        "properties": {
                                                            "id": {
                                                                "type": "string"
                                                            },
                                                            "userId": {
                                                                "type": "string"
                                                            },
                                                            "title": {
                                                                "type": "string"
                                                            },
                                                            "description": {
                                                                "type": "string"
                                                            },
                                                            "link": {
                                                                "type": "string"
                                                            }
                                                        },
                                                        "example": {
                                                            "id": "portfolio-uuid",
                                                            "userId": "user-uuid",
                                                            "title": "Personal Website",
                                                            "description": "Portfolio site",
                                                            "link": "https://janedoe.dev"
                                                        }
                                                    }
                                                },
                                                "certifications": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "object",
                                                        "properties": {
                                                            "id": {
                                                                "type": "string"
                                                            },
                                                            "userId": {
                                                                "type": "string"
                                                            },
                                                            "name": {
                                                                "type": "string"
                                                            },
                                                            "issuer": {
                                                                "type": "string"
                                                            },
                                                            "issueDate": {
                                                                "type": "string"
                                                            }
                                                        },
                                                        "example": {
                                                            "id": "cert-uuid",
                                                            "userId": "user-uuid",
                                                            "name": "Certified Kubernetes Administrator",
                                                            "issuer": "CNCF",
                                                            "issueDate": "2021-08-01"
                                                        }
                                                    }
                                                },
                                                "education": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "object",
                                                        "properties": {
                                                            "id": {
                                                                "type": "string"
                                                            },
                                                            "userId": {
                                                                "type": "string"
                                                            },
                                                            "school": {
                                                                "type": "string"
                                                            },
                                                            "degree": {
                                                                "type": "string"
                                                            },
                                                            "field": {
                                                                "type": "string"
                                                            },
                                                            "startDate": {
                                                                "type": "string"
                                                            },
                                                            "endDate": {
                                                                "type": [
                                                                    "null",
                                                                    "string"
                                                                ]
                                                            }
                                                        },
                                                        "example": {
                                                            "id": "education-uuid",
                                                            "userId": "user-uuid",
                                                            "school": "University of Lagos",
                                                            "degree": "BSc Computer Science",
                                                            "field": "Computer Science",
                                                            "startDate": "2015-09-01",
                                                            "endDate": "2019-06-01"
                                                        }
                                                    }
                                                },
                                                "experiences": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "object",
                                                        "properties": {
                                                            "id": {
                                                                "type": "string"
                                                            },
                                                            "userId": {
                                                                "type": "string"
                                                            },
                                                            "company": {
                                                                "type": "string"
                                                            },
                                                            "title": {
                                                                "type": "string"
                                                            },
                                                            "employmentType": {
                                                                "type": "string"
                                                            },
                                                            "startDate": {
                                                                "type": "string"
                                                            },
                                                            "endDate": {
                                                                "type": [
                                                                    "null",
                                                                    "string"
                                                                ]
                                                            },
                                                            "isCurrent": {
                                                                "type": "number"
                                                            },
                                                            "description": {
                                                                "type": "string"
                                                            }
                                                        },
                                                        "example": {
                                                            "id": "experience-uuid",
                                                            "userId": "user-uuid",
                                                            "company": "Acme Corp",
                                                            "title": "Senior Engineer",
                                                            "employmentType": "full-time",
                                                            "startDate": "2020-01-01",
                                                            "endDate": "2022-12-31",
                                                            "isCurrent": 0,
                                                            "description": "Worked on backend services and APIs."
                                                        }
                                                    }
                                                },
                                                "followers": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "object",
                                                        "properties": {
                                                            "id": {
                                                                "type": "string"
                                                            },
                                                            "followerId": {
                                                                "type": "string"
                                                            },
                                                            "followingId": {
                                                                "type": "string"
                                                            },
                                                            "createdAt": {
                                                                "type": "string"
                                                            }
                                                        },
                                                        "example": {
                                                            "id": "follow-uuid",
                                                            "followerId": "user-uuid-2",
                                                            "followingId": "user-uuid",
                                                            "createdAt": "2026-04-20T09:00:00Z"
                                                        }
                                                    }
                                                },
                                                "oauthAccounts": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "object",
                                                        "properties": {
                                                            "id": {
                                                                "type": "string"
                                                            },
                                                            "userId": {
                                                                "type": "string"
                                                            },
                                                            "provider": {
                                                                "type": "string"
                                                            },
                                                            "providerId": {
                                                                "type": "string"
                                                            },
                                                            "providerEmail": {
                                                                "type": [
                                                                    "null",
                                                                    "string"
                                                                ]
                                                            },
                                                            "avatarUrl": {
                                                                "type": [
                                                                    "null",
                                                                    "string"
                                                                ]
                                                            }
                                                        },
                                                        "example": {
                                                            "id": "oauth-uuid",
                                                            "userId": "user-uuid",
                                                            "provider": "google",
                                                            "providerId": "google-12345",
                                                            "providerEmail": "user@example.com",
                                                            "avatarUrl": "https://example.com/avatar.jpg"
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "404": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "post": {
                "operationId": "createUserProfile",
                "tags": [
                    "Users"
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "description": "Profile fields to create or update. Do NOT provide `id` or `userId` — those are generated/derived by the server.",
                                "properties": {
                                    "username": {
                                        "type": "string"
                                    },
                                    "bio": {
                                        "type": "string"
                                    },
                                    "location": {
                                        "type": "string"
                                    },
                                    "avatar": {
                                        "type": [
                                            "string",
                                            "null"
                                        ]
                                    },
                                    "banner": {
                                        "type": [
                                            "string",
                                            "null"
                                        ]
                                    },
                                    "website": {
                                        "type": "string"
                                    },
                                    "linkedin": {
                                        "type": "string"
                                    },
                                    "github": {
                                        "type": "string"
                                    }
                                },
                                "example": {
                                    "username": "codemonk",
                                    "bio": "Developer,engineer",
                                    "location": "Remote",
                                    "website": "https://example.com",
                                    "linkedin": "https://linkedin.com/in/tech",
                                    "github": "https://github.com/tech"
                                }
                            }
                        }
                    },
                    "description": "Profile fields to create or update. Do NOT provide `id` or `userId` — those are generated/derived by the server."
                },
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "201": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string",
                                                    "description": "Profile record id (server-generated)",
                                                    "readOnly": true
                                                },
                                                "userId": {
                                                    "type": "string",
                                                    "description": "User id (derived from authenticated token)",
                                                    "readOnly": true
                                                },
                                                "username": {
                                                    "type": "string"
                                                },
                                                "bio": {
                                                    "type": "string"
                                                },
                                                "location": {
                                                    "type": "string"
                                                },
                                                "avatar": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "banner": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "website": {
                                                    "type": "string"
                                                },
                                                "linkedin": {
                                                    "type": "string"
                                                },
                                                "github": {
                                                    "type": "string"
                                                },
                                                "createdAt": {
                                                    "type": "string",
                                                    "format": "date-time"
                                                }
                                            },
                                            "example": {
                                                "id": "profile-uuid",
                                                "userId": "user-uuid",
                                                "username": "tech",
                                                "bio": "Developer",
                                                "location": "Remote",
                                                "avatar": null,
                                                "banner": null,
                                                "website": "https://example.com",
                                                "linkedin": "https://linkedin.com/in/tech",
                                                "github": "https://github.com/tech",
                                                "createdAt": "2026-04-13T00:00:00Z"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "409": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/user/profile/me": {
            "get": {
                "operationId": "getMyProfile",
                "tags": [
                    "Users"
                ],
                "description": "Get complete profile for the authenticated user (profile, skills, portfolios, certs, education, experiences, followers, oauth accounts)",
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "user": {
                                                    "type": "object",
                                                    "properties": {
                                                        "id": {
                                                            "type": "string"
                                                        },
                                                        "email": {
                                                            "type": "string"
                                                        },
                                                        "role": {
                                                            "type": "string"
                                                        },
                                                        "created_at": {
                                                            "type": "string"
                                                        }
                                                    }
                                                },
                                                "profile": {
                                                    "type": "object",
                                                    "properties": {
                                                        "id": {
                                                            "type": "string",
                                                            "description": "Profile record id (server-generated)",
                                                            "readOnly": true
                                                        },
                                                        "userId": {
                                                            "type": "string",
                                                            "description": "User id (derived from authenticated token)",
                                                            "readOnly": true
                                                        },
                                                        "username": {
                                                            "type": "string"
                                                        },
                                                        "bio": {
                                                            "type": "string"
                                                        },
                                                        "location": {
                                                            "type": "string"
                                                        },
                                                        "avatar": {
                                                            "type": [
                                                                "null",
                                                                "string"
                                                            ]
                                                        },
                                                        "banner": {
                                                            "type": [
                                                                "null",
                                                                "string"
                                                            ]
                                                        },
                                                        "website": {
                                                            "type": "string"
                                                        },
                                                        "linkedin": {
                                                            "type": "string"
                                                        },
                                                        "github": {
                                                            "type": "string"
                                                        },
                                                        "createdAt": {
                                                            "type": "string",
                                                            "format": "date-time"
                                                        }
                                                    },
                                                    "example": {
                                                        "id": "profile-uuid",
                                                        "userId": "user-uuid",
                                                        "username": "tech",
                                                        "bio": "Developer",
                                                        "location": "Remote",
                                                        "avatar": null,
                                                        "banner": null,
                                                        "website": "https://example.com",
                                                        "linkedin": "https://linkedin.com/in/tech",
                                                        "github": "https://github.com/tech",
                                                        "createdAt": "2026-04-13T00:00:00Z"
                                                    }
                                                },
                                                "skills": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "object",
                                                        "properties": {
                                                            "id": {
                                                                "type": "string"
                                                            },
                                                            "name": {
                                                                "type": "string"
                                                            },
                                                            "level": {
                                                                "type": "string",
                                                                "enum": [
                                                                    "beginner",
                                                                    "intermediate",
                                                                    "expert"
                                                                ]
                                                            }
                                                        },
                                                        "example": {
                                                            "id": "skill-uuid",
                                                            "name": "JavaScript",
                                                            "level": "expert"
                                                        }
                                                    }
                                                },
                                                "portfolios": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "object",
                                                        "properties": {
                                                            "id": {
                                                                "type": "string"
                                                            },
                                                            "userId": {
                                                                "type": "string"
                                                            },
                                                            "title": {
                                                                "type": "string"
                                                            },
                                                            "description": {
                                                                "type": "string"
                                                            },
                                                            "link": {
                                                                "type": "string"
                                                            }
                                                        },
                                                        "example": {
                                                            "id": "portfolio-uuid",
                                                            "userId": "user-uuid",
                                                            "title": "Personal Website",
                                                            "description": "Portfolio site",
                                                            "link": "https://janedoe.dev"
                                                        }
                                                    }
                                                },
                                                "certifications": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "object",
                                                        "properties": {
                                                            "id": {
                                                                "type": "string"
                                                            },
                                                            "userId": {
                                                                "type": "string"
                                                            },
                                                            "name": {
                                                                "type": "string"
                                                            },
                                                            "issuer": {
                                                                "type": "string"
                                                            },
                                                            "issueDate": {
                                                                "type": "string"
                                                            }
                                                        },
                                                        "example": {
                                                            "id": "cert-uuid",
                                                            "userId": "user-uuid",
                                                            "name": "Certified Kubernetes Administrator",
                                                            "issuer": "CNCF",
                                                            "issueDate": "2021-08-01"
                                                        }
                                                    }
                                                },
                                                "education": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "object",
                                                        "properties": {
                                                            "id": {
                                                                "type": "string"
                                                            },
                                                            "userId": {
                                                                "type": "string"
                                                            },
                                                            "school": {
                                                                "type": "string"
                                                            },
                                                            "degree": {
                                                                "type": "string"
                                                            },
                                                            "field": {
                                                                "type": "string"
                                                            },
                                                            "startDate": {
                                                                "type": "string"
                                                            },
                                                            "endDate": {
                                                                "type": [
                                                                    "null",
                                                                    "string"
                                                                ]
                                                            }
                                                        },
                                                        "example": {
                                                            "id": "education-uuid",
                                                            "userId": "user-uuid",
                                                            "school": "University of Lagos",
                                                            "degree": "BSc Computer Science",
                                                            "field": "Computer Science",
                                                            "startDate": "2015-09-01",
                                                            "endDate": "2019-06-01"
                                                        }
                                                    }
                                                },
                                                "experiences": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "object",
                                                        "properties": {
                                                            "id": {
                                                                "type": "string"
                                                            },
                                                            "userId": {
                                                                "type": "string"
                                                            },
                                                            "company": {
                                                                "type": "string"
                                                            },
                                                            "title": {
                                                                "type": "string"
                                                            },
                                                            "employmentType": {
                                                                "type": "string"
                                                            },
                                                            "startDate": {
                                                                "type": "string"
                                                            },
                                                            "endDate": {
                                                                "type": [
                                                                    "null",
                                                                    "string"
                                                                ]
                                                            },
                                                            "isCurrent": {
                                                                "type": "number"
                                                            },
                                                            "description": {
                                                                "type": "string"
                                                            }
                                                        },
                                                        "example": {
                                                            "id": "experience-uuid",
                                                            "userId": "user-uuid",
                                                            "company": "Acme Corp",
                                                            "title": "Senior Engineer",
                                                            "employmentType": "full-time",
                                                            "startDate": "2020-01-01",
                                                            "endDate": "2022-12-31",
                                                            "isCurrent": 0,
                                                            "description": "Worked on backend services and APIs."
                                                        }
                                                    }
                                                },
                                                "followers": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "object",
                                                        "properties": {
                                                            "id": {
                                                                "type": "string"
                                                            },
                                                            "followerId": {
                                                                "type": "string"
                                                            },
                                                            "followingId": {
                                                                "type": "string"
                                                            },
                                                            "createdAt": {
                                                                "type": "string"
                                                            }
                                                        },
                                                        "example": {
                                                            "id": "follow-uuid",
                                                            "followerId": "user-uuid-2",
                                                            "followingId": "user-uuid",
                                                            "createdAt": "2026-04-20T09:00:00Z"
                                                        }
                                                    }
                                                },
                                                "oauthAccounts": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "object",
                                                        "properties": {
                                                            "id": {
                                                                "type": "string"
                                                            },
                                                            "userId": {
                                                                "type": "string"
                                                            },
                                                            "provider": {
                                                                "type": "string"
                                                            },
                                                            "providerId": {
                                                                "type": "string"
                                                            },
                                                            "providerEmail": {
                                                                "type": [
                                                                    "null",
                                                                    "string"
                                                                ]
                                                            },
                                                            "avatarUrl": {
                                                                "type": [
                                                                    "null",
                                                                    "string"
                                                                ]
                                                            }
                                                        },
                                                        "example": {
                                                            "id": "oauth-uuid",
                                                            "userId": "user-uuid",
                                                            "provider": "google",
                                                            "providerId": "google-12345",
                                                            "providerEmail": "user@example.com",
                                                            "avatarUrl": "https://example.com/avatar.jpg"
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": [
                                                "null",
                                                "object"
                                            ]
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "message": "Token invalid or expired",
                                        "data": null
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/user/stats/me": {
            "get": {
                "operationId": "getMyStats",
                "tags": [
                    "Users"
                ],
                "description": "Get simple counts for the authenticated user: pages, communities, posts, comments",
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "pages": {
                                                    "type": "number"
                                                },
                                                "communities": {
                                                    "type": "number"
                                                },
                                                "posts": {
                                                    "type": "number"
                                                },
                                                "comments": {
                                                    "type": "number"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/users/{id}/profile/avatar": {
            "post": {
                "operationId": "uploadUserAvatar",
                "tags": [
                    "Users"
                ],
                "description": "Upload a profile avatar by URL; validation and Cloudinary upload happen in background. If avatar already exists, pass ?replace=true or clear it first using PUT /users/:id/profile with { avatar: null }.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "202": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "jobId": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "409": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "503": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/users/{id}/profile/banner": {
            "post": {
                "operationId": "uploadUserBanner",
                "tags": [
                    "Users"
                ],
                "description": "Upload a profile banner by URL or multipart file; validation and Cloudinary upload happen in background. If banner already exists, pass ?replace=true or clear it first using PUT /users/:id/profile with { banner: null }.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "202": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "jobId": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "409": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "503": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/media/signature": {
            "get": {
                "operationId": "getCloudinarySignature",
                "tags": [
                    "Media"
                ],
                "description": "Get Cloudinary upload signature and credentials for direct client upload",
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "cloudName": {
                                                    "type": "string"
                                                },
                                                "apiKey": {
                                                    "type": "string"
                                                },
                                                "timestamp": {
                                                    "type": "number"
                                                },
                                                "signature": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/media/register": {
            "post": {
                "operationId": "registerMedia",
                "tags": [
                    "Media"
                ],
                "description": "Register a direct client upload (Cloudinary public id) so the server can validate, create an asset record and enqueue processing. Recommended flow: upload media first (or perform direct client upload), then call this endpoint with the provider public id. Server-side validation performed: allowed MIME types (image/jpeg,image/png,image/webp), max file size (enforced by the media worker, see MAX_POST_IMAGE_BYTES env), and optional checks per `kind` (e.g., avatar/banner uniqueness). The endpoint returns a job id — poll `GET /media/jobs/:id` for processing status and detailed per-asset errors (e.g., file_too_large, unsupported_media_type). If you intend to attach media to a post, wait until job status is `completed` and asset record has a `url` before creating the post.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "publicId"
                                ],
                                "properties": {
                                    "publicId": {
                                        "type": "string"
                                    },
                                    "kind": {
                                        "type": "string"
                                    },
                                    "replace": {
                                        "type": "boolean"
                                    },
                                    "pageId": {
                                        "type": [
                                            "string",
                                            "null"
                                        ]
                                    }
                                },
                                "example": {
                                    "publicId": "banners/abcd1234",
                                    "kind": "banner",
                                    "pageId": null
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "202": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "jobId": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "409": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                },
                                                "details": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "object",
                                                        "properties": {
                                                            "assetId": {
                                                                "type": "string"
                                                            },
                                                            "code": {
                                                                "type": "string"
                                                            },
                                                            "message": {
                                                                "type": "string"
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/media/jobs/{id}": {
            "get": {
                "operationId": "getMediaJobStatus",
                "tags": [
                    "Media"
                ],
                "description": "Get status for a media processing job",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "name": {
                                                    "type": "string"
                                                },
                                                "state": {
                                                    "type": "string"
                                                },
                                                "attemptsMade": {
                                                    "type": "number"
                                                },
                                                "failedReason": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "friendlyMessage": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "returnvalue": {
                                                    "type": [
                                                        "null",
                                                        "object"
                                                    ]
                                                },
                                                "data": {
                                                    "type": [
                                                        "null",
                                                        "object"
                                                    ]
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "404": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "503": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/users/{id}/profile/avatar-file": {
            "post": {
                "operationId": "uploadUserAvatarFile",
                "tags": [
                    "Media",
                    "Users"
                ],
                "description": "Upload avatar file (multipart) - server accepts file and enqueues background validation and Cloudinary upload. Use kind=banner to upload a banner. If image already exists, pass ?replace=true or clear it first using PUT /users/:id/profile with { avatar: null } or { banner: null }.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "202": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "jobId": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "409": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "503": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/users/{id}/skills": {
            "get": {
                "operationId": "listUserSkills",
                "tags": [
                    "Users"
                ],
                "description": "List the skills attached to a user profile.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "id": {
                                                        "type": "string"
                                                    },
                                                    "name": {
                                                        "type": "string"
                                                    },
                                                    "level": {
                                                        "type": "string",
                                                        "enum": [
                                                            "beginner",
                                                            "intermediate",
                                                            "expert"
                                                        ]
                                                    }
                                                },
                                                "example": {
                                                    "id": "skill-uuid",
                                                    "name": "JavaScript",
                                                    "level": "expert"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": [
                                            {
                                                "id": "skill-uuid",
                                                "name": "JavaScript",
                                                "level": "expert"
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "post": {
                "operationId": "addUserSkill",
                "tags": [
                    "Users"
                ],
                "description": "Add a skill entry to the user profile.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "skill"
                                ],
                                "properties": {
                                    "skill": {
                                        "type": "string"
                                    },
                                    "level": {
                                        "type": "string"
                                    }
                                },
                                "example": {
                                    "skill": "JavaScript",
                                    "level": "advanced"
                                }
                            }
                        }
                    }
                },
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "201": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "name": {
                                                    "type": "string"
                                                },
                                                "level": {
                                                    "type": "string",
                                                    "enum": [
                                                        "beginner",
                                                        "intermediate",
                                                        "expert"
                                                    ]
                                                }
                                            },
                                            "example": {
                                                "id": "skill-uuid",
                                                "name": "JavaScript",
                                                "level": "expert"
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "skill-uuid",
                                            "name": "JavaScript",
                                            "level": "expert"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/users/{id}/skills/{skillId}": {
            "delete": {
                "operationId": "deleteUserSkill",
                "tags": [
                    "Users"
                ],
                "description": "Delete a specific skill from the user profile.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    },
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "skillId",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "user-uuid"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/users/{id}/portfolios": {
            "get": {
                "operationId": "listUserPortfolios",
                "tags": [
                    "Users"
                ],
                "description": "List portfolio links or projects attached to a user profile.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "id": {
                                                        "type": "string"
                                                    },
                                                    "userId": {
                                                        "type": "string"
                                                    },
                                                    "title": {
                                                        "type": "string"
                                                    },
                                                    "description": {
                                                        "type": "string"
                                                    },
                                                    "link": {
                                                        "type": "string"
                                                    }
                                                },
                                                "example": {
                                                    "id": "portfolio-uuid",
                                                    "userId": "user-uuid",
                                                    "title": "Personal Website",
                                                    "description": "Portfolio site",
                                                    "link": "https://janedoe.dev"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": [
                                            {
                                                "id": "portfolio-uuid",
                                                "userId": "user-uuid",
                                                "title": "Personal Website",
                                                "description": "Portfolio site",
                                                "link": "https://janedoe.dev"
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "post": {
                "operationId": "addUserPortfolio",
                "tags": [
                    "Users"
                ],
                "description": "Create a portfolio entry for the user profile.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "title"
                                ],
                                "properties": {
                                    "title": {
                                        "type": "string"
                                    },
                                    "description": {
                                        "type": "string"
                                    },
                                    "link": {
                                        "type": "string"
                                    }
                                },
                                "example": {
                                    "title": "Personal Website",
                                    "description": "Portfolio site",
                                    "link": "https://janedoe.dev"
                                }
                            }
                        }
                    }
                },
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "201": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "userId": {
                                                    "type": "string"
                                                },
                                                "title": {
                                                    "type": "string"
                                                },
                                                "description": {
                                                    "type": "string"
                                                },
                                                "link": {
                                                    "type": "string"
                                                }
                                            },
                                            "example": {
                                                "id": "portfolio-uuid",
                                                "userId": "user-uuid",
                                                "title": "Personal Website",
                                                "description": "Portfolio site",
                                                "link": "https://janedoe.dev"
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "portfolio-uuid",
                                            "userId": "user-uuid",
                                            "title": "Personal Website",
                                            "description": "Portfolio site",
                                            "link": "https://janedoe.dev"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/users/{id}/portfolios/{portfolioId}": {
            "delete": {
                "operationId": "deleteUserPortfolio",
                "tags": [
                    "Users"
                ],
                "description": "Delete a portfolio entry from the user profile.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    },
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "portfolioId",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "user-uuid"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/users/{id}/follow": {
            "post": {
                "operationId": "followUser",
                "tags": [
                    "Users"
                ],
                "description": "Follow another user. The authenticated user becomes the follower.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "followerId": {
                                        "type": "string"
                                    }
                                },
                                "example": {
                                    "followerId": "uuid-or-id"
                                }
                            }
                        }
                    }
                },
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "201": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "followerId": {
                                                    "type": "string"
                                                },
                                                "followingId": {
                                                    "type": "string"
                                                },
                                                "createdAt": {
                                                    "type": "string"
                                                }
                                            },
                                            "example": {
                                                "id": "follow-uuid",
                                                "followerId": "user-uuid-2",
                                                "followingId": "user-uuid",
                                                "createdAt": "2026-04-20T09:00:00Z"
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "follow-uuid",
                                            "followerId": "user-uuid-2",
                                            "followingId": "user-uuid",
                                            "createdAt": "2026-04-20T09:00:00Z"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "delete": {
                "operationId": "unfollowUser",
                "tags": [
                    "Users"
                ],
                "description": "Unfollow a user. The response may indicate when the user was not being followed.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "followerId": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "followingId": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "createdAt": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "message": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "follow-uuid",
                                            "followerId": "user-uuid-2",
                                            "followingId": "user-uuid",
                                            "createdAt": "2026-04-20T09:00:00Z",
                                            "message": "unfollowed"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/users/{id}/followers": {
            "get": {
                "operationId": "listFollowers",
                "tags": [
                    "Users"
                ],
                "description": "List followers for a user.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "id": {
                                                        "type": "string"
                                                    },
                                                    "followerId": {
                                                        "type": "string"
                                                    },
                                                    "followingId": {
                                                        "type": "string"
                                                    },
                                                    "createdAt": {
                                                        "type": "string"
                                                    }
                                                },
                                                "example": {
                                                    "id": "follow-uuid",
                                                    "followerId": "user-uuid-2",
                                                    "followingId": "user-uuid",
                                                    "createdAt": "2026-04-20T09:00:00Z"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": [
                                            {
                                                "id": "follow-uuid",
                                                "followerId": "user-uuid-2",
                                                "followingId": "user-uuid",
                                                "createdAt": "2026-04-20T09:00:00Z"
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/users/{id}/login-history": {
            "get": {
                "operationId": "listLoginHistory",
                "tags": [
                    "Users"
                ],
                "description": "List recent login history entries for a user.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "id": {
                                                        "type": "string"
                                                    },
                                                    "userId": {
                                                        "type": "string"
                                                    },
                                                    "loginMethod": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "ipAddress": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "loginAt": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ],
                                                        "format": "date-time"
                                                    }
                                                },
                                                "example": {
                                                    "id": "login-uuid",
                                                    "userId": "user-uuid",
                                                    "loginMethod": "email_password",
                                                    "ipAddress": "127.0.0.1",
                                                    "loginAt": "2026-04-23T08:15:00Z"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": [
                                            {
                                                "id": "login-uuid",
                                                "userId": "user-uuid",
                                                "loginMethod": "email_password",
                                                "ipAddress": "127.0.0.1",
                                                "loginAt": "2026-04-23T08:15:00Z"
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/community-categories": {
            "post": {
                "operationId": "createCommunityCategory",
                "tags": [
                    "Communities"
                ],
                "description": "Create a community category used to organize communities.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "name"
                                ],
                                "properties": {
                                    "name": {
                                        "type": "string"
                                    },
                                    "description": {
                                        "type": "string"
                                    }
                                },
                                "example": {
                                    "name": "Sports",
                                    "description": "Groups for sports fans"
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "name": {
                                                    "type": "string"
                                                },
                                                "description": {
                                                    "type": "string"
                                                }
                                            },
                                            "example": {
                                                "id": "community-category-uuid",
                                                "name": "Sports",
                                                "description": "Groups for sports fans"
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "community-category-uuid",
                                            "name": "Sports",
                                            "description": "Groups for sports fans"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "409": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "get": {
                "operationId": "listCommunityCategories",
                "tags": [
                    "Communities"
                ],
                "description": "List all community categories",
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "id": {
                                                        "type": "string"
                                                    },
                                                    "name": {
                                                        "type": "string"
                                                    },
                                                    "description": {
                                                        "type": "string"
                                                    }
                                                },
                                                "example": {
                                                    "id": "community-category-uuid",
                                                    "name": "Sports",
                                                    "description": "Groups for sports fans"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/community-categories/{id}": {
            "put": {
                "operationId": "updateCommunityCategory",
                "tags": [
                    "Communities"
                ],
                "description": "Update a community category by id.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "name": {
                                        "type": "string"
                                    },
                                    "description": {
                                        "type": "string"
                                    }
                                },
                                "example": {
                                    "name": "Sports",
                                    "description": "Groups for sports fans"
                                }
                            }
                        }
                    }
                },
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "name": {
                                                    "type": "string"
                                                },
                                                "description": {
                                                    "type": "string"
                                                }
                                            },
                                            "example": {
                                                "id": "community-category-uuid",
                                                "name": "Sports",
                                                "description": "Groups for sports fans"
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "community-category-uuid",
                                            "name": "Sports",
                                            "description": "Groups for sports fans"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "404": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "409": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "delete": {
                "operationId": "deleteCommunityCategory",
                "tags": [
                    "Communities"
                ],
                "description": "Delete a community category.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "user-uuid"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "404": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/communities": {
            "post": {
                "operationId": "createCommunity",
                "tags": [
                    "Communities"
                ],
                "description": "Create a community. The authenticated user becomes the owner.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "name"
                                ],
                                "properties": {
                                    "name": {
                                        "type": "string"
                                    },
                                    "description": {
                                        "type": "string"
                                    },
                                    "categoryId": {
                                        "type": "string"
                                    },
                                    "defaultPostVisibility": {
                                        "type": "string",
                                        "enum": [
                                            "public",
                                            "connections",
                                            "community"
                                        ]
                                    }
                                },
                                "example": {
                                    "name": "Local Chess Club",
                                    "description": "We meet weekly to play chess",
                                    "categoryId": null,
                                    "defaultPostVisibility": "public"
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "categoryId": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "name": {
                                                    "type": "string"
                                                },
                                                "description": {
                                                    "type": "string"
                                                },
                                                "is_active": {
                                                    "type": "number"
                                                },
                                                "default_post_visibility": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ],
                                                    "description": "Default visibility for new posts in this community"
                                                },
                                                "created_at": {
                                                    "type": "string"
                                                }
                                            },
                                            "example": {
                                                "id": "community-uuid",
                                                "categoryId": "community-category-uuid",
                                                "name": "Local Chess Club",
                                                "description": "We meet weekly to play chess",
                                                "is_active": 1,
                                                "default_post_visibility": "community",
                                                "created_at": "2026-04-12T10:00:00Z"
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "community-uuid",
                                            "categoryId": "community-category-uuid",
                                            "name": "Local Chess Club",
                                            "description": "We meet weekly to play chess",
                                            "is_active": 1,
                                            "default_post_visibility": "community",
                                            "created_at": "2026-04-12T10:00:00Z"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": [
                                                "null",
                                                "object"
                                            ]
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "message": "Token invalid or expired",
                                        "data": null
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "get": {
                "operationId": "listCommunities",
                "tags": [
                    "Communities"
                ],
                "description": "List communities. Supports query params: page, per_page, q (search), categoryId, limit, offset.",
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "current_page": {
                                            "type": "number"
                                        },
                                        "data": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "id": {
                                                        "type": "string"
                                                    },
                                                    "categoryId": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "name": {
                                                        "type": "string"
                                                    },
                                                    "description": {
                                                        "type": "string"
                                                    },
                                                    "is_active": {
                                                        "type": "number"
                                                    },
                                                    "default_post_visibility": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ],
                                                        "description": "Default visibility for new posts in this community"
                                                    },
                                                    "created_at": {
                                                        "type": "string"
                                                    }
                                                },
                                                "example": {
                                                    "id": "community-uuid",
                                                    "categoryId": "community-category-uuid",
                                                    "name": "Local Chess Club",
                                                    "description": "We meet weekly to play chess",
                                                    "is_active": 1,
                                                    "default_post_visibility": "community",
                                                    "created_at": "2026-04-12T10:00:00Z"
                                                }
                                            }
                                        },
                                        "first_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "from": {
                                            "type": [
                                                "null",
                                                "number"
                                            ]
                                        },
                                        "last_page": {
                                            "type": "number"
                                        },
                                        "last_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "links": {
                                            "type": "array",
                                            "items": {
                                                "type": "object"
                                            }
                                        },
                                        "next_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "path": {
                                            "type": "string"
                                        },
                                        "per_page": {
                                            "type": "number"
                                        },
                                        "prev_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "to": {
                                            "type": [
                                                "null",
                                                "number"
                                            ]
                                        },
                                        "total": {
                                            "type": "number"
                                        }
                                    },
                                    "example": {
                                        "current_page": 1,
                                        "data": [
                                            {
                                                "id": "community-uuid",
                                                "categoryId": "community-category-uuid",
                                                "name": "Local Chess Club",
                                                "description": "We meet weekly to play chess",
                                                "is_active": 1,
                                                "default_post_visibility": "community",
                                                "created_at": "2026-04-12T10:00:00Z"
                                            }
                                        ],
                                        "first_page_url": "http://localhost:3000/resource?page=1&per_page=20",
                                        "from": 1,
                                        "last_page": 1,
                                        "last_page_url": "http://localhost:3000/resource?page=1&per_page=20",
                                        "links": [],
                                        "next_page_url": null,
                                        "path": "http://localhost:3000/resource",
                                        "per_page": 20,
                                        "prev_page_url": null,
                                        "to": 1,
                                        "total": 1
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/communities/{id}": {
            "get": {
                "operationId": "getCommunity",
                "tags": [
                    "Communities"
                ],
                "description": "Get a community by id.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "categoryId": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "name": {
                                                    "type": "string"
                                                },
                                                "description": {
                                                    "type": "string"
                                                },
                                                "is_active": {
                                                    "type": "number"
                                                },
                                                "default_post_visibility": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ],
                                                    "description": "Default visibility for new posts in this community"
                                                },
                                                "created_at": {
                                                    "type": "string"
                                                }
                                            },
                                            "example": {
                                                "id": "community-uuid",
                                                "categoryId": "community-category-uuid",
                                                "name": "Local Chess Club",
                                                "description": "We meet weekly to play chess",
                                                "is_active": 1,
                                                "default_post_visibility": "community",
                                                "created_at": "2026-04-12T10:00:00Z"
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "community-uuid",
                                            "categoryId": "community-category-uuid",
                                            "name": "Local Chess Club",
                                            "description": "We meet weekly to play chess",
                                            "is_active": 1,
                                            "default_post_visibility": "community",
                                            "created_at": "2026-04-12T10:00:00Z"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "404": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "put": {
                "operationId": "updateCommunity",
                "tags": [
                    "Communities"
                ],
                "description": "Update community settings. Only the owner or an admin may perform this action.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "name": {
                                        "type": "string"
                                    },
                                    "description": {
                                        "type": "string"
                                    },
                                    "defaultPostVisibility": {
                                        "type": "string",
                                        "enum": [
                                            "public",
                                            "connections",
                                            "community"
                                        ]
                                    },
                                    "is_active": {
                                        "type": "number"
                                    }
                                },
                                "example": {
                                    "name": "Chess Club",
                                    "description": "Updated desc",
                                    "defaultPostVisibility": "community",
                                    "is_active": 1
                                }
                            }
                        }
                    }
                },
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "categoryId": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "name": {
                                                    "type": "string"
                                                },
                                                "description": {
                                                    "type": "string"
                                                },
                                                "is_active": {
                                                    "type": "number"
                                                },
                                                "default_post_visibility": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ],
                                                    "description": "Default visibility for new posts in this community"
                                                },
                                                "created_at": {
                                                    "type": "string"
                                                }
                                            },
                                            "example": {
                                                "id": "community-uuid",
                                                "categoryId": "community-category-uuid",
                                                "name": "Local Chess Club",
                                                "description": "We meet weekly to play chess",
                                                "is_active": 1,
                                                "default_post_visibility": "community",
                                                "created_at": "2026-04-12T10:00:00Z"
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "community-uuid",
                                            "categoryId": "community-category-uuid",
                                            "name": "Local Chess Club",
                                            "description": "We meet weekly to play chess",
                                            "is_active": 1,
                                            "default_post_visibility": "community",
                                            "created_at": "2026-04-12T10:00:00Z"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": [
                                                "null",
                                                "object"
                                            ]
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "message": "Token invalid or expired",
                                        "data": null
                                    }
                                }
                            }
                        }
                    },
                    "403": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "404": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "delete": {
                "operationId": "deleteCommunity",
                "tags": [
                    "Communities"
                ],
                "description": "Delete a community. Only the owner or an admin may perform this action.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "user-uuid"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": [
                                                "null",
                                                "object"
                                            ]
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "message": "Token invalid or expired",
                                        "data": null
                                    }
                                }
                            }
                        }
                    },
                    "403": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "404": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/communities/{id}/join": {
            "post": {
                "operationId": "joinCommunity",
                "tags": [
                    "Communities"
                ],
                "description": "Join a community as the authenticated user.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "userId": {
                                                    "type": "string"
                                                },
                                                "communityId": {
                                                    "type": "string"
                                                },
                                                "role": {
                                                    "type": "string"
                                                }
                                            },
                                            "example": {
                                                "id": "membership-uuid",
                                                "userId": "user-uuid",
                                                "communityId": "community-uuid",
                                                "role": "member"
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "membership-uuid",
                                            "userId": "user-uuid",
                                            "communityId": "community-uuid",
                                            "role": "member"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": [
                                                "null",
                                                "object"
                                            ]
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "message": "Token invalid or expired",
                                        "data": null
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "delete": {
                "operationId": "leaveCommunity",
                "tags": [
                    "Communities"
                ],
                "description": "Leave a community as the authenticated user.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "removed": {
                                                    "type": "boolean"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "removed": true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": [
                                                "null",
                                                "object"
                                            ]
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "message": "Token invalid or expired",
                                        "data": null
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/communities/{id}/members": {
            "get": {
                "operationId": "listCommunityMembers",
                "tags": [
                    "Communities"
                ],
                "description": "List members in a community.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "id": {
                                                        "type": "string"
                                                    },
                                                    "userId": {
                                                        "type": "string"
                                                    },
                                                    "communityId": {
                                                        "type": "string"
                                                    },
                                                    "role": {
                                                        "type": "string"
                                                    }
                                                },
                                                "example": {
                                                    "id": "membership-uuid",
                                                    "userId": "user-uuid",
                                                    "communityId": "community-uuid",
                                                    "role": "member"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": [
                                            {
                                                "id": "membership-uuid",
                                                "userId": "user-uuid",
                                                "communityId": "community-uuid",
                                                "role": "member"
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/users/{id}/oauth-accounts": {
            "post": {
                "operationId": "createOauthAccount",
                "tags": [
                    "Users"
                ],
                "description": "Link an OAuth account to a user.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "provider",
                                    "providerId"
                                ],
                                "properties": {
                                    "provider": {
                                        "type": "string"
                                    },
                                    "providerId": {
                                        "type": "string"
                                    },
                                    "accessToken": {
                                        "type": "string"
                                    }
                                },
                                "example": {
                                    "provider": "google",
                                    "providerId": "google-12345",
                                    "accessToken": "ya29.a0Af..."
                                }
                            }
                        }
                    }
                },
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "201": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "userId": {
                                                    "type": "string"
                                                },
                                                "provider": {
                                                    "type": "string"
                                                },
                                                "providerId": {
                                                    "type": "string"
                                                },
                                                "providerEmail": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "avatarUrl": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                }
                                            },
                                            "example": {
                                                "id": "oauth-uuid",
                                                "userId": "user-uuid",
                                                "provider": "google",
                                                "providerId": "google-12345",
                                                "providerEmail": "user@example.com",
                                                "avatarUrl": "https://example.com/avatar.jpg"
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "oauth-uuid",
                                            "userId": "user-uuid",
                                            "provider": "google",
                                            "providerId": "google-12345",
                                            "providerEmail": "user@example.com",
                                            "avatarUrl": "https://example.com/avatar.jpg"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/users/{id}/certifications": {
            "get": {
                "operationId": "listCertifications",
                "tags": [
                    "Users"
                ],
                "description": "List certification entries for a user profile.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "id": {
                                                        "type": "string"
                                                    },
                                                    "userId": {
                                                        "type": "string"
                                                    },
                                                    "name": {
                                                        "type": "string"
                                                    },
                                                    "issuer": {
                                                        "type": "string"
                                                    },
                                                    "issueDate": {
                                                        "type": "string"
                                                    }
                                                },
                                                "example": {
                                                    "id": "cert-uuid",
                                                    "userId": "user-uuid",
                                                    "name": "Certified Kubernetes Administrator",
                                                    "issuer": "CNCF",
                                                    "issueDate": "2021-08-01"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": [
                                            {
                                                "id": "cert-uuid",
                                                "userId": "user-uuid",
                                                "name": "Certified Kubernetes Administrator",
                                                "issuer": "CNCF",
                                                "issueDate": "2021-08-01"
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "post": {
                "operationId": "addCertification",
                "tags": [
                    "Users"
                ],
                "description": "Add a certification to a user profile.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "name"
                                ],
                                "properties": {
                                    "name": {
                                        "type": "string"
                                    },
                                    "issuer": {
                                        "type": "string"
                                    },
                                    "issueDate": {
                                        "type": "string"
                                    }
                                },
                                "example": {
                                    "name": "Certified Kubernetes Administrator",
                                    "issuer": "CNCF",
                                    "issueDate": "2021-08-01"
                                }
                            }
                        }
                    }
                },
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "201": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "userId": {
                                                    "type": "string"
                                                },
                                                "name": {
                                                    "type": "string"
                                                },
                                                "issuer": {
                                                    "type": "string"
                                                },
                                                "issueDate": {
                                                    "type": "string"
                                                }
                                            },
                                            "example": {
                                                "id": "cert-uuid",
                                                "userId": "user-uuid",
                                                "name": "Certified Kubernetes Administrator",
                                                "issuer": "CNCF",
                                                "issueDate": "2021-08-01"
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "cert-uuid",
                                            "userId": "user-uuid",
                                            "name": "Certified Kubernetes Administrator",
                                            "issuer": "CNCF",
                                            "issueDate": "2021-08-01"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/users/{id}/certifications/{certId}": {
            "delete": {
                "operationId": "deleteCertification",
                "tags": [
                    "Users"
                ],
                "description": "Delete a certification from a user profile.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    },
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "certId",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "user-uuid"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/users/{id}/education": {
            "get": {
                "operationId": "listEducation",
                "tags": [
                    "Users"
                ],
                "description": "List education entries for a user profile.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "id": {
                                                        "type": "string"
                                                    },
                                                    "userId": {
                                                        "type": "string"
                                                    },
                                                    "school": {
                                                        "type": "string"
                                                    },
                                                    "degree": {
                                                        "type": "string"
                                                    },
                                                    "field": {
                                                        "type": "string"
                                                    },
                                                    "startDate": {
                                                        "type": "string"
                                                    },
                                                    "endDate": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    }
                                                },
                                                "example": {
                                                    "id": "education-uuid",
                                                    "userId": "user-uuid",
                                                    "school": "University of Lagos",
                                                    "degree": "BSc Computer Science",
                                                    "field": "Computer Science",
                                                    "startDate": "2015-09-01",
                                                    "endDate": "2019-06-01"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": [
                                            {
                                                "id": "education-uuid",
                                                "userId": "user-uuid",
                                                "school": "University of Lagos",
                                                "degree": "BSc Computer Science",
                                                "field": "Computer Science",
                                                "startDate": "2015-09-01",
                                                "endDate": "2019-06-01"
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "post": {
                "operationId": "addEducation",
                "tags": [
                    "Users"
                ],
                "description": "Add an education entry to a user profile.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "school"
                                ],
                                "properties": {
                                    "school": {
                                        "type": "string"
                                    },
                                    "degree": {
                                        "type": "string"
                                    },
                                    "field": {
                                        "type": "string"
                                    },
                                    "startDate": {
                                        "type": "string"
                                    },
                                    "endDate": {
                                        "type": "string"
                                    }
                                },
                                "example": {
                                    "school": "University",
                                    "degree": "BSc Computer Science",
                                    "field": "Computer Science",
                                    "startDate": "2015-09-01",
                                    "endDate": "2019-06-01"
                                }
                            }
                        }
                    }
                },
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "201": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "userId": {
                                                    "type": "string"
                                                },
                                                "school": {
                                                    "type": "string"
                                                },
                                                "degree": {
                                                    "type": "string"
                                                },
                                                "field": {
                                                    "type": "string"
                                                },
                                                "startDate": {
                                                    "type": "string"
                                                },
                                                "endDate": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                }
                                            },
                                            "example": {
                                                "id": "education-uuid",
                                                "userId": "user-uuid",
                                                "school": "University of Lagos",
                                                "degree": "BSc Computer Science",
                                                "field": "Computer Science",
                                                "startDate": "2015-09-01",
                                                "endDate": "2019-06-01"
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "education-uuid",
                                            "userId": "user-uuid",
                                            "school": "University of Lagos",
                                            "degree": "BSc Computer Science",
                                            "field": "Computer Science",
                                            "startDate": "2015-09-01",
                                            "endDate": "2019-06-01"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/users/{id}/education/{eduId}": {
            "delete": {
                "operationId": "deleteEducation",
                "tags": [
                    "Users"
                ],
                "description": "Delete an education entry from a user profile.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    },
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "eduId",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "user-uuid"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/users/{id}/experiences": {
            "get": {
                "operationId": "listExperiences",
                "tags": [
                    "Users"
                ],
                "description": "List work experience entries for a user profile.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "id": {
                                                        "type": "string"
                                                    },
                                                    "userId": {
                                                        "type": "string"
                                                    },
                                                    "company": {
                                                        "type": "string"
                                                    },
                                                    "title": {
                                                        "type": "string"
                                                    },
                                                    "employmentType": {
                                                        "type": "string"
                                                    },
                                                    "startDate": {
                                                        "type": "string"
                                                    },
                                                    "endDate": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "isCurrent": {
                                                        "type": "number"
                                                    },
                                                    "description": {
                                                        "type": "string"
                                                    }
                                                },
                                                "example": {
                                                    "id": "experience-uuid",
                                                    "userId": "user-uuid",
                                                    "company": "Acme Corp",
                                                    "title": "Senior Engineer",
                                                    "employmentType": "full-time",
                                                    "startDate": "2020-01-01",
                                                    "endDate": "2022-12-31",
                                                    "isCurrent": 0,
                                                    "description": "Worked on backend services and APIs."
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": [
                                            {
                                                "id": "experience-uuid",
                                                "userId": "user-uuid",
                                                "company": "Acme Corp",
                                                "title": "Senior Engineer",
                                                "employmentType": "full-time",
                                                "startDate": "2020-01-01",
                                                "endDate": "2022-12-31",
                                                "isCurrent": 0,
                                                "description": "Worked on backend services and APIs."
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "post": {
                "operationId": "addExperience",
                "tags": [
                    "Users"
                ],
                "description": "Add a work experience entry to a user profile.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "company",
                                    "title"
                                ],
                                "properties": {
                                    "company": {
                                        "type": "string"
                                    },
                                    "title": {
                                        "type": "string"
                                    },
                                    "employmentType": {
                                        "type": "string"
                                    },
                                    "startDate": {
                                        "type": "string"
                                    },
                                    "endDate": {
                                        "type": "string"
                                    },
                                    "isCurrent": {
                                        "type": "boolean"
                                    },
                                    "description": {
                                        "type": "string"
                                    }
                                },
                                "example": {
                                    "company": "Acme Corp",
                                    "title": "Senior Engineer",
                                    "employmentType": "full-time",
                                    "startDate": "2020-01-01",
                                    "endDate": "2022-12-31",
                                    "isCurrent": false,
                                    "description": "Worked on X"
                                }
                            }
                        }
                    }
                },
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "201": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "userId": {
                                                    "type": "string"
                                                },
                                                "company": {
                                                    "type": "string"
                                                },
                                                "title": {
                                                    "type": "string"
                                                },
                                                "employmentType": {
                                                    "type": "string"
                                                },
                                                "startDate": {
                                                    "type": "string"
                                                },
                                                "endDate": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "isCurrent": {
                                                    "type": "number"
                                                },
                                                "description": {
                                                    "type": "string"
                                                }
                                            },
                                            "example": {
                                                "id": "experience-uuid",
                                                "userId": "user-uuid",
                                                "company": "Acme Corp",
                                                "title": "Senior Engineer",
                                                "employmentType": "full-time",
                                                "startDate": "2020-01-01",
                                                "endDate": "2022-12-31",
                                                "isCurrent": 0,
                                                "description": "Worked on backend services and APIs."
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "experience-uuid",
                                            "userId": "user-uuid",
                                            "company": "Acme Corp",
                                            "title": "Senior Engineer",
                                            "employmentType": "full-time",
                                            "startDate": "2020-01-01",
                                            "endDate": "2022-12-31",
                                            "isCurrent": 0,
                                            "description": "Worked on backend services and APIs."
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/users/{id}/experiences/{expId}": {
            "delete": {
                "operationId": "deleteExperience",
                "tags": [
                    "Users"
                ],
                "description": "Delete a work experience entry from a user profile.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    },
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "expId",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "user-uuid"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/posts": {
            "post": {
                "operationId": "createPost",
                "tags": [
                    "Posts"
                ],
                "description": "Create a new post. Provide `title` and `content` in body. Optional `communityId`. Upload media first (use /media/register or media endpoints), wait until media job(s) are processed, then include their `mediaAssetIds` here — the server will validate that each asset is processed and has a URL before creating the post.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "title",
                                    "content"
                                ],
                                "properties": {
                                    "userId": {
                                        "type": "string"
                                    },
                                    "communityId": {
                                        "type": "string"
                                    },
                                    "pageId": {
                                        "type": "string"
                                    },
                                    "title": {
                                        "type": "string"
                                    },
                                    "content": {
                                        "type": "string"
                                    },
                                    "mediaAssetIds": {
                                        "type": "array",
                                        "items": {
                                            "type": "string"
                                        },
                                        "description": "Optional list of media asset ids (uploaded via /media/register or asset endpoints). All assets must be processed and have a URL before creating a post."
                                    }
                                },
                                "example": {
                                    "communityId": null,
                                    "title": "Hello world",
                                    "content": "Hello world — this is a test post.",
                                    "mediaAssetIds": [
                                        "asset-uuid-123"
                                    ]
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "user_id": {
                                                    "type": "string"
                                                },
                                                "community_id": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "page_id": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "title": {
                                                    "type": "string"
                                                },
                                                "content": {
                                                    "type": "string"
                                                },
                                                "created_at": {
                                                    "type": "string"
                                                },
                                                "updated_at": {
                                                    "type": "string"
                                                }
                                            },
                                            "example": {
                                                "id": "post-uuid",
                                                "user_id": "user-uuid",
                                                "community_id": null,
                                                "title": "Hello world",
                                                "content": "Hello world — this is a test post.",
                                                "created_at": "2026-04-09T12:00:00Z",
                                                "updated_at": "2026-04-09T12:00:00Z"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                },
                                                "details": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "object",
                                                        "properties": {
                                                            "assetId": {
                                                                "type": "string"
                                                            },
                                                            "code": {
                                                                "type": "string"
                                                            },
                                                            "message": {
                                                                "type": "string"
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "get": {
                "operationId": "listPosts",
                "tags": [
                    "Posts"
                ],
                "description": "List posts (feed). Returns a paginator payload at the root.",
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "current_page": {
                                            "type": "number"
                                        },
                                        "data": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "id": {
                                                        "type": "string"
                                                    },
                                                    "user_id": {
                                                        "type": "string"
                                                    },
                                                    "community_id": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "page_id": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "title": {
                                                        "type": "string"
                                                    },
                                                    "content": {
                                                        "type": "string"
                                                    },
                                                    "created_at": {
                                                        "type": "string"
                                                    },
                                                    "updated_at": {
                                                        "type": "string"
                                                    }
                                                },
                                                "example": {
                                                    "id": "post-uuid",
                                                    "user_id": "user-uuid",
                                                    "community_id": null,
                                                    "title": "Hello world",
                                                    "content": "Hello world — this is a test post.",
                                                    "created_at": "2026-04-09T12:00:00Z",
                                                    "updated_at": "2026-04-09T12:00:00Z"
                                                }
                                            }
                                        },
                                        "first_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "from": {
                                            "type": [
                                                "null",
                                                "number"
                                            ]
                                        },
                                        "last_page": {
                                            "type": "number"
                                        },
                                        "last_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "links": {
                                            "type": "array",
                                            "items": {
                                                "type": "object"
                                            }
                                        },
                                        "next_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "path": {
                                            "type": "string"
                                        },
                                        "per_page": {
                                            "type": "number"
                                        },
                                        "prev_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "to": {
                                            "type": [
                                                "null",
                                                "number"
                                            ]
                                        },
                                        "total": {
                                            "type": "number"
                                        }
                                    },
                                    "example": {
                                        "current_page": 1,
                                        "data": [
                                            {
                                                "id": "post-uuid",
                                                "user_id": "user-uuid",
                                                "community_id": null,
                                                "title": "Hello world",
                                                "content": "Hello world — this is a test post.",
                                                "created_at": "2026-04-09T12:00:00Z",
                                                "updated_at": "2026-04-09T12:00:00Z"
                                            }
                                        ],
                                        "first_page_url": "http://localhost:3000/resource?page=1&per_page=20",
                                        "from": 1,
                                        "last_page": 1,
                                        "last_page_url": "http://localhost:3000/resource?page=1&per_page=20",
                                        "links": [],
                                        "next_page_url": null,
                                        "path": "http://localhost:3000/resource",
                                        "per_page": 20,
                                        "prev_page_url": null,
                                        "to": 1,
                                        "total": 1
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/posts/{id}": {
            "get": {
                "operationId": "getPost",
                "tags": [
                    "Posts"
                ],
                "description": "Get a single post by id",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "user_id": {
                                                    "type": "string"
                                                },
                                                "community_id": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "page_id": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "title": {
                                                    "type": "string"
                                                },
                                                "content": {
                                                    "type": "string"
                                                },
                                                "created_at": {
                                                    "type": "string"
                                                },
                                                "updated_at": {
                                                    "type": "string"
                                                }
                                            },
                                            "example": {
                                                "id": "post-uuid",
                                                "user_id": "user-uuid",
                                                "community_id": null,
                                                "title": "Hello world",
                                                "content": "Hello world — this is a test post.",
                                                "created_at": "2026-04-09T12:00:00Z",
                                                "updated_at": "2026-04-09T12:00:00Z"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "404": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            },
            "put": {
                "operationId": "updatePost",
                "tags": [
                    "Posts"
                ],
                "description": "Update a post. Provide `userId` and `content` in body.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "userId": {
                                        "type": "string"
                                    },
                                    "content": {
                                        "type": "string"
                                    }
                                },
                                "example": {
                                    "userId": "user-uuid",
                                    "content": "Updated post content"
                                }
                            }
                        }
                    }
                },
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "user_id": {
                                                    "type": "string"
                                                },
                                                "community_id": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "page_id": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "title": {
                                                    "type": "string"
                                                },
                                                "content": {
                                                    "type": "string"
                                                },
                                                "created_at": {
                                                    "type": "string"
                                                },
                                                "updated_at": {
                                                    "type": "string"
                                                }
                                            },
                                            "example": {
                                                "id": "post-uuid",
                                                "user_id": "user-uuid",
                                                "community_id": null,
                                                "title": "Hello world",
                                                "content": "Hello world — this is a test post.",
                                                "created_at": "2026-04-09T12:00:00Z",
                                                "updated_at": "2026-04-09T12:00:00Z"
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "post-uuid",
                                            "user_id": "user-uuid",
                                            "community_id": null,
                                            "title": "Hello world",
                                            "content": "Hello world — this is a test post.",
                                            "created_at": "2026-04-09T12:00:00Z",
                                            "updated_at": "2026-04-09T12:00:00Z"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "403": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "404": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "delete": {
                "operationId": "deletePost",
                "tags": [
                    "Posts"
                ],
                "description": "Delete a post. Provide `userId` in body to verify ownership.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "userId": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    }
                },
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": "array",
                                            "items": {}
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "message": "Deleted success",
                                        "data": []
                                    }
                                }
                            }
                        }
                    },
                    "403": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "404": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/posts/{id}/media": {
            "post": {
                "operationId": "attachPostMedia",
                "tags": [
                    "Posts",
                    "Media"
                ],
                "description": "Attach media to a post by URL (server enqueues background validation/upload).",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "url"
                                ],
                                "properties": {
                                    "url": {
                                        "type": "string"
                                    },
                                    "mediaType": {
                                        "type": "string"
                                    },
                                    "displayOrder": {
                                        "type": "number"
                                    }
                                },
                                "example": {
                                    "url": "https://example.com/image.jpg",
                                    "mediaType": "image",
                                    "displayOrder": 0
                                }
                            }
                        }
                    }
                },
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "202": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "jobId": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "503": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            },
            "get": {
                "operationId": "listPostMedia",
                "tags": [
                    "Posts",
                    "Media"
                ],
                "description": "List media attached to a post",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "id": {
                                                        "type": "string"
                                                    },
                                                    "post_id": {
                                                        "type": "string"
                                                    },
                                                    "media_type": {
                                                        "type": "string"
                                                    },
                                                    "url": {
                                                        "type": "string"
                                                    },
                                                    "thumbnail_url": {
                                                        "type": "string"
                                                    },
                                                    "display_order": {
                                                        "type": "number"
                                                    }
                                                },
                                                "example": {
                                                    "id": "media-uuid",
                                                    "post_id": "post-uuid",
                                                    "media_type": "image",
                                                    "url": "https://res.cloudinary.com/demo/image/upload/v12345/example.jpg",
                                                    "thumbnail_url": "https://res.cloudinary.com/demo/image/upload/v12345/example_thumb.jpg",
                                                    "display_order": 0
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/posts/{id}/comments": {
            "post": {
                "operationId": "createComment",
                "tags": [
                    "Posts",
                    "Comments"
                ],
                "description": "Create a comment on a post",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "content"
                                ],
                                "properties": {
                                    "userId": {
                                        "type": "string"
                                    },
                                    "content": {
                                        "type": "string"
                                    },
                                    "parentCommentId": {
                                        "type": [
                                            "string",
                                            "null"
                                        ]
                                    }
                                }
                            }
                        }
                    }
                },
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "201": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "post_id": {
                                                    "type": "string"
                                                },
                                                "user_id": {
                                                    "type": "string"
                                                },
                                                "parent_comment_id": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "content": {
                                                    "type": "string"
                                                },
                                                "created_at": {
                                                    "type": "string"
                                                }
                                            },
                                            "example": {
                                                "id": "comment-uuid",
                                                "post_id": "post-uuid",
                                                "user_id": "user-uuid",
                                                "parent_comment_id": null,
                                                "content": "This is really helpful.",
                                                "created_at": "2026-04-10T12:30:00Z"
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "comment-uuid",
                                            "post_id": "post-uuid",
                                            "user_id": "user-uuid",
                                            "parent_comment_id": null,
                                            "content": "This is really helpful.",
                                            "created_at": "2026-04-10T12:30:00Z"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "get": {
                "operationId": "listComments",
                "tags": [
                    "Posts",
                    "Comments"
                ],
                "description": "List comments for a post. Returns a paginator payload at the root.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "current_page": {
                                            "type": "number"
                                        },
                                        "data": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "id": {
                                                        "type": "string"
                                                    },
                                                    "post_id": {
                                                        "type": "string"
                                                    },
                                                    "user_id": {
                                                        "type": "string"
                                                    },
                                                    "parent_comment_id": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "content": {
                                                        "type": "string"
                                                    },
                                                    "created_at": {
                                                        "type": "string"
                                                    }
                                                },
                                                "example": {
                                                    "id": "comment-uuid",
                                                    "post_id": "post-uuid",
                                                    "user_id": "user-uuid",
                                                    "parent_comment_id": null,
                                                    "content": "This is really helpful.",
                                                    "created_at": "2026-04-10T12:30:00Z"
                                                }
                                            }
                                        },
                                        "first_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "from": {
                                            "type": [
                                                "null",
                                                "number"
                                            ]
                                        },
                                        "last_page": {
                                            "type": "number"
                                        },
                                        "last_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "links": {
                                            "type": "array",
                                            "items": {
                                                "type": "object"
                                            }
                                        },
                                        "next_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "path": {
                                            "type": "string"
                                        },
                                        "per_page": {
                                            "type": "number"
                                        },
                                        "prev_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "to": {
                                            "type": [
                                                "null",
                                                "number"
                                            ]
                                        },
                                        "total": {
                                            "type": "number"
                                        }
                                    },
                                    "example": {
                                        "current_page": 1,
                                        "data": [
                                            {
                                                "id": "comment-uuid",
                                                "post_id": "post-uuid",
                                                "user_id": "user-uuid",
                                                "parent_comment_id": null,
                                                "content": "This is really helpful.",
                                                "created_at": "2026-04-10T12:30:00Z"
                                            }
                                        ],
                                        "first_page_url": "http://localhost:3000/resource?page=1&per_page=20",
                                        "from": 1,
                                        "last_page": 1,
                                        "last_page_url": "http://localhost:3000/resource?page=1&per_page=20",
                                        "links": [],
                                        "next_page_url": null,
                                        "path": "http://localhost:3000/resource",
                                        "per_page": 20,
                                        "prev_page_url": null,
                                        "to": 1,
                                        "total": 1
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/posts/{id}/reactions": {
            "post": {
                "operationId": "togglePostReaction",
                "tags": [
                    "Posts",
                    "Reactions"
                ],
                "description": "Toggle reaction on a post (one reaction per user). Omitting `type` defaults to `like`.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "userId": {
                                        "type": "string"
                                    },
                                    "type": {
                                        "type": "string",
                                        "enum": [
                                            "like",
                                            "love",
                                            "clap",
                                            "dislike"
                                        ],
                                        "example": "like"
                                    }
                                }
                            }
                        }
                    }
                },
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "result": {
                                                    "type": "object"
                                                },
                                                "count": {
                                                    "type": "number"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/posts/{id}/save": {
            "post": {
                "operationId": "toggleSave",
                "tags": [
                    "Posts",
                    "Interactions"
                ],
                "description": "Toggle save for a post (save/unsave).",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "userId": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    }
                },
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "postId": {
                                                    "type": "string"
                                                },
                                                "userId": {
                                                    "type": "string"
                                                },
                                                "saved": {
                                                    "type": "boolean"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "postId": "post-uuid",
                                            "userId": "user-uuid",
                                            "saved": true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/posts/{id}/report": {
            "post": {
                "operationId": "reportPost",
                "tags": [
                    "Posts",
                    "Moderation"
                ],
                "description": "Report a post for moderation.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "userId": {
                                        "type": "string"
                                    },
                                    "reason": {
                                        "type": "string"
                                    },
                                    "details": {
                                        "type": "string"
                                    }
                                },
                                "example": {
                                    "reason": "spam",
                                    "details": "This post contains unsolicited ads"
                                }
                            }
                        }
                    }
                },
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "201": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "post_id": {
                                                    "type": "string"
                                                },
                                                "user_id": {
                                                    "type": "string"
                                                },
                                                "reason": {
                                                    "type": "string"
                                                },
                                                "details": {
                                                    "type": "string"
                                                },
                                                "created_at": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/comments/{id}/reactions": {
            "post": {
                "operationId": "toggleCommentReaction",
                "tags": [
                    "Comments",
                    "Reactions"
                ],
                "description": "Toggle reaction on a comment (one reaction per user). Omitting `type` defaults to `like`.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "userId": {
                                        "type": "string"
                                    },
                                    "type": {
                                        "type": "string",
                                        "enum": [
                                            "like",
                                            "love",
                                            "clap",
                                            "dislike"
                                        ],
                                        "example": "like"
                                    }
                                }
                            }
                        }
                    }
                },
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "result": {
                                                    "type": "object"
                                                },
                                                "count": {
                                                    "type": "number"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/posts/media/{id}": {
            "delete": {
                "operationId": "deletePostMedia",
                "tags": [
                    "Posts",
                    "Media"
                ],
                "description": "Delete a post media item by id",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/questions": {
            "post": {
                "operationId": "createQuestion",
                "tags": [
                    "Questions"
                ],
                "description": "Create a new question. Authenticated user becomes the author. Optionally attach the question to a community. Returns the created question.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "title",
                                    "body"
                                ],
                                "properties": {
                                    "communityId": {
                                        "type": "string"
                                    },
                                    "title": {
                                        "type": "string"
                                    },
                                    "body": {
                                        "type": "string"
                                    },
                                    "visibility": {
                                        "type": "string",
                                        "enum": [
                                            "public",
                                            "community_only",
                                            "community_public"
                                        ]
                                    }
                                },
                                "example": {
                                    "communityId": null,
                                    "title": "How do I configure X?",
                                    "body": "I tried Y but get error Z"
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "userId": {
                                                    "type": "string"
                                                },
                                                "communityId": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "title": {
                                                    "type": "string"
                                                },
                                                "body": {
                                                    "type": "string"
                                                },
                                                "visibility": {
                                                    "type": "string"
                                                },
                                                "isClosed": {
                                                    "type": "boolean"
                                                },
                                                "acceptedAnswerId": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "createdAt": {
                                                    "type": "string"
                                                },
                                                "updatedAt": {
                                                    "type": "string"
                                                },
                                                "answers": {
                                                    "type": [
                                                        "null",
                                                        "array"
                                                    ],
                                                    "items": {
                                                        "type": "object"
                                                    }
                                                }
                                            },
                                            "example": {
                                                "id": "q-uuid",
                                                "userId": "user-uuid",
                                                "communityId": null,
                                                "title": "How to...",
                                                "body": "Details...",
                                                "visibility": "public",
                                                "isClosed": false,
                                                "acceptedAnswerId": null,
                                                "createdAt": "2026-04-01T12:00:00Z",
                                                "updatedAt": "2026-04-01T12:00:00Z",
                                                "answers": [
                                                    {
                                                        "id": "a-uuid",
                                                        "questionId": "q-uuid",
                                                        "userId": "user-uuid",
                                                        "parentAnswerId": null,
                                                        "content": "This is how...",
                                                        "createdAt": "2026-04-01T13:00:00Z",
                                                        "updatedAt": "2026-04-01T13:00:00Z"
                                                    }
                                                ]
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "q-uuid",
                                            "userId": "user-uuid",
                                            "communityId": null,
                                            "title": "How to...",
                                            "body": "Details...",
                                            "visibility": "public",
                                            "isClosed": false,
                                            "acceptedAnswerId": null,
                                            "createdAt": "2026-04-01T12:00:00Z",
                                            "updatedAt": "2026-04-01T12:00:00Z",
                                            "answers": [
                                                {
                                                    "id": "a-uuid",
                                                    "questionId": "q-uuid",
                                                    "userId": "user-uuid",
                                                    "parentAnswerId": null,
                                                    "content": "This is how...",
                                                    "createdAt": "2026-04-01T13:00:00Z",
                                                    "updatedAt": "2026-04-01T13:00:00Z"
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            },
            "get": {
                "operationId": "listQuestions",
                "tags": [
                    "Questions"
                ],
                "description": "List questions. Returns a paginator payload at the root.",
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "current_page": {
                                            "type": "number"
                                        },
                                        "data": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "id": {
                                                        "type": "string"
                                                    },
                                                    "userId": {
                                                        "type": "string"
                                                    },
                                                    "communityId": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "title": {
                                                        "type": "string"
                                                    },
                                                    "body": {
                                                        "type": "string"
                                                    },
                                                    "visibility": {
                                                        "type": "string"
                                                    },
                                                    "isClosed": {
                                                        "type": "boolean"
                                                    },
                                                    "acceptedAnswerId": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "createdAt": {
                                                        "type": "string"
                                                    },
                                                    "updatedAt": {
                                                        "type": "string"
                                                    },
                                                    "answers": {
                                                        "type": [
                                                            "null",
                                                            "array"
                                                        ],
                                                        "items": {
                                                            "type": "object"
                                                        }
                                                    }
                                                },
                                                "example": {
                                                    "id": "q-uuid",
                                                    "userId": "user-uuid",
                                                    "communityId": null,
                                                    "title": "How to...",
                                                    "body": "Details...",
                                                    "visibility": "public",
                                                    "isClosed": false,
                                                    "acceptedAnswerId": null,
                                                    "createdAt": "2026-04-01T12:00:00Z",
                                                    "updatedAt": "2026-04-01T12:00:00Z",
                                                    "answers": [
                                                        {
                                                            "id": "a-uuid",
                                                            "questionId": "q-uuid",
                                                            "userId": "user-uuid",
                                                            "parentAnswerId": null,
                                                            "content": "This is how...",
                                                            "createdAt": "2026-04-01T13:00:00Z",
                                                            "updatedAt": "2026-04-01T13:00:00Z"
                                                        }
                                                    ]
                                                }
                                            }
                                        },
                                        "first_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "from": {
                                            "type": [
                                                "null",
                                                "number"
                                            ]
                                        },
                                        "last_page": {
                                            "type": "number"
                                        },
                                        "last_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "links": {
                                            "type": "array",
                                            "items": {
                                                "type": "object"
                                            }
                                        },
                                        "next_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "path": {
                                            "type": "string"
                                        },
                                        "per_page": {
                                            "type": "number"
                                        },
                                        "prev_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "to": {
                                            "type": [
                                                "null",
                                                "number"
                                            ]
                                        },
                                        "total": {
                                            "type": "number"
                                        }
                                    },
                                    "example": {
                                        "current_page": 1,
                                        "data": [
                                            {
                                                "id": "q-uuid",
                                                "userId": "user-uuid",
                                                "communityId": null,
                                                "title": "How to...",
                                                "body": "Details...",
                                                "visibility": "public",
                                                "isClosed": false,
                                                "acceptedAnswerId": null,
                                                "createdAt": "2026-04-01T12:00:00Z",
                                                "updatedAt": "2026-04-01T12:00:00Z",
                                                "answers": [
                                                    {
                                                        "id": "a-uuid",
                                                        "questionId": "q-uuid",
                                                        "userId": "user-uuid",
                                                        "parentAnswerId": null,
                                                        "content": "This is how...",
                                                        "createdAt": "2026-04-01T13:00:00Z",
                                                        "updatedAt": "2026-04-01T13:00:00Z"
                                                    }
                                                ]
                                            }
                                        ],
                                        "first_page_url": "http://localhost:3000/resource?page=1&per_page=20",
                                        "from": 1,
                                        "last_page": 1,
                                        "last_page_url": "http://localhost:3000/resource?page=1&per_page=20",
                                        "links": [],
                                        "next_page_url": null,
                                        "path": "http://localhost:3000/resource",
                                        "per_page": 20,
                                        "prev_page_url": null,
                                        "to": 1,
                                        "total": 1
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/questions/{id}": {
            "get": {
                "operationId": "getQuestion",
                "tags": [
                    "Questions"
                ],
                "description": "Get a single question by id. Set `includeAnswers=true` to include answers in the response.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "userId": {
                                                    "type": "string"
                                                },
                                                "communityId": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "title": {
                                                    "type": "string"
                                                },
                                                "body": {
                                                    "type": "string"
                                                },
                                                "visibility": {
                                                    "type": "string"
                                                },
                                                "isClosed": {
                                                    "type": "boolean"
                                                },
                                                "acceptedAnswerId": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "createdAt": {
                                                    "type": "string"
                                                },
                                                "updatedAt": {
                                                    "type": "string"
                                                },
                                                "answers": {
                                                    "type": [
                                                        "null",
                                                        "array"
                                                    ],
                                                    "items": {
                                                        "type": "object"
                                                    }
                                                }
                                            },
                                            "example": {
                                                "id": "q-uuid",
                                                "userId": "user-uuid",
                                                "communityId": null,
                                                "title": "How to...",
                                                "body": "Details...",
                                                "visibility": "public",
                                                "isClosed": false,
                                                "acceptedAnswerId": null,
                                                "createdAt": "2026-04-01T12:00:00Z",
                                                "updatedAt": "2026-04-01T12:00:00Z",
                                                "answers": [
                                                    {
                                                        "id": "a-uuid",
                                                        "questionId": "q-uuid",
                                                        "userId": "user-uuid",
                                                        "parentAnswerId": null,
                                                        "content": "This is how...",
                                                        "createdAt": "2026-04-01T13:00:00Z",
                                                        "updatedAt": "2026-04-01T13:00:00Z"
                                                    }
                                                ]
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "q-uuid",
                                            "userId": "user-uuid",
                                            "communityId": null,
                                            "title": "How to...",
                                            "body": "Details...",
                                            "visibility": "public",
                                            "isClosed": false,
                                            "acceptedAnswerId": null,
                                            "createdAt": "2026-04-01T12:00:00Z",
                                            "updatedAt": "2026-04-01T12:00:00Z",
                                            "answers": [
                                                {
                                                    "id": "a-uuid",
                                                    "questionId": "q-uuid",
                                                    "userId": "user-uuid",
                                                    "parentAnswerId": null,
                                                    "content": "This is how...",
                                                    "createdAt": "2026-04-01T13:00:00Z",
                                                    "updatedAt": "2026-04-01T13:00:00Z"
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "404": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/questions/{questionId}/answers": {
            "post": {
                "operationId": "createAnswer",
                "tags": [
                    "Questions",
                    "Answers"
                ],
                "description": "Create an answer for a question. Authenticated user becomes the author.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "content"
                                ],
                                "properties": {
                                    "content": {
                                        "type": "string"
                                    },
                                    "parentAnswerId": {
                                        "type": [
                                            "string",
                                            "null"
                                        ]
                                    }
                                },
                                "example": {
                                    "content": "You can fix it by..."
                                }
                            }
                        }
                    }
                },
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "questionId",
                        "required": true
                    }
                ],
                "responses": {
                    "201": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "questionId": {
                                                    "type": "string"
                                                },
                                                "userId": {
                                                    "type": "string"
                                                },
                                                "parentAnswerId": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "content": {
                                                    "type": "string"
                                                },
                                                "createdAt": {
                                                    "type": "string"
                                                },
                                                "updatedAt": {
                                                    "type": "string"
                                                }
                                            },
                                            "example": {
                                                "id": "a-uuid",
                                                "questionId": "q-uuid",
                                                "userId": "user-uuid",
                                                "parentAnswerId": null,
                                                "content": "This is how...",
                                                "createdAt": "2026-04-01T13:00:00Z",
                                                "updatedAt": "2026-04-01T13:00:00Z"
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "a-uuid",
                                            "questionId": "q-uuid",
                                            "userId": "user-uuid",
                                            "parentAnswerId": null,
                                            "content": "This is how...",
                                            "createdAt": "2026-04-01T13:00:00Z",
                                            "updatedAt": "2026-04-01T13:00:00Z"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            },
            "get": {
                "operationId": "listAnswers",
                "tags": [
                    "Questions",
                    "Answers"
                ],
                "description": "List answers for a question. Returns a paginator payload at the root.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "questionId",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "current_page": {
                                            "type": "number"
                                        },
                                        "data": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "id": {
                                                        "type": "string"
                                                    },
                                                    "questionId": {
                                                        "type": "string"
                                                    },
                                                    "userId": {
                                                        "type": "string"
                                                    },
                                                    "parentAnswerId": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "content": {
                                                        "type": "string"
                                                    },
                                                    "createdAt": {
                                                        "type": "string"
                                                    },
                                                    "updatedAt": {
                                                        "type": "string"
                                                    }
                                                },
                                                "example": {
                                                    "id": "a-uuid",
                                                    "questionId": "q-uuid",
                                                    "userId": "user-uuid",
                                                    "parentAnswerId": null,
                                                    "content": "This is how...",
                                                    "createdAt": "2026-04-01T13:00:00Z",
                                                    "updatedAt": "2026-04-01T13:00:00Z"
                                                }
                                            }
                                        },
                                        "first_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "from": {
                                            "type": [
                                                "null",
                                                "number"
                                            ]
                                        },
                                        "last_page": {
                                            "type": "number"
                                        },
                                        "last_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "links": {
                                            "type": "array",
                                            "items": {
                                                "type": "object"
                                            }
                                        },
                                        "next_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "path": {
                                            "type": "string"
                                        },
                                        "per_page": {
                                            "type": "number"
                                        },
                                        "prev_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "to": {
                                            "type": [
                                                "null",
                                                "number"
                                            ]
                                        },
                                        "total": {
                                            "type": "number"
                                        }
                                    },
                                    "example": {
                                        "current_page": 1,
                                        "data": [
                                            {
                                                "id": "a-uuid",
                                                "questionId": "q-uuid",
                                                "userId": "user-uuid",
                                                "parentAnswerId": null,
                                                "content": "This is how...",
                                                "createdAt": "2026-04-01T13:00:00Z",
                                                "updatedAt": "2026-04-01T13:00:00Z"
                                            }
                                        ],
                                        "first_page_url": "http://localhost:3000/resource?page=1&per_page=20",
                                        "from": 1,
                                        "last_page": 1,
                                        "last_page_url": "http://localhost:3000/resource?page=1&per_page=20",
                                        "links": [],
                                        "next_page_url": null,
                                        "path": "http://localhost:3000/resource",
                                        "per_page": 20,
                                        "prev_page_url": null,
                                        "to": 1,
                                        "total": 1
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/pages": {
            "post": {
                "operationId": "createPage",
                "tags": [
                    "Pages"
                ],
                "description": "Create a new page. Authenticated user becomes the owner.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "name",
                                    "slug"
                                ],
                                "properties": {
                                    "categoryId": {
                                        "type": "string"
                                    },
                                    "name": {
                                        "type": "string"
                                    },
                                    "slug": {
                                        "type": "string"
                                    },
                                    "description": {
                                        "type": "string"
                                    },
                                    "metadata": {
                                        "type": [
                                            "object",
                                            "null"
                                        ]
                                    }
                                },
                                "example": {
                                    "name": "My Page",
                                    "slug": "my-page",
                                    "description": "A public page"
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "ownerId": {
                                                    "type": "string"
                                                },
                                                "categoryId": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "name": {
                                                    "type": "string"
                                                },
                                                "slug": {
                                                    "type": "string"
                                                },
                                                "description": {
                                                    "type": "string"
                                                },
                                                "avatar": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "coverImage": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "isVerified": {
                                                    "type": "number"
                                                },
                                                "isActive": {
                                                    "type": "number"
                                                },
                                                "isApproved": {
                                                    "type": "number"
                                                },
                                                "approvalNotes": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "approvedAt": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "approvedBy": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "metadata": {
                                                    "type": [
                                                        "null",
                                                        "object"
                                                    ]
                                                },
                                                "followers_count": {
                                                    "type": [
                                                        "null",
                                                        "number"
                                                    ],
                                                    "description": "Number of followers for the page (optional; present if calculated/denormalized)"
                                                },
                                                "posts_count": {
                                                    "type": [
                                                        "null",
                                                        "number"
                                                    ],
                                                    "description": "Denormalized post count for the page (optional; present when the pages table maintains a post_count column)"
                                                },
                                                "category_pages_count": {
                                                    "type": [
                                                        "null",
                                                        "number"
                                                    ],
                                                    "description": "Total pages in the page category (optional; present if counted)"
                                                },
                                                "createdAt": {
                                                    "type": "string"
                                                },
                                                "updatedAt": {
                                                    "type": "string"
                                                }
                                            },
                                            "example": {
                                                "id": "page-uuid",
                                                "ownerId": "user-uuid",
                                                "categoryId": "page-category-uuid",
                                                "name": "My Page",
                                                "slug": "my-page",
                                                "description": "A public page",
                                                "avatar": null,
                                                "coverImage": null,
                                                "isVerified": 0,
                                                "isActive": 1,
                                                "isApproved": 1,
                                                "approvalNotes": null,
                                                "approvedAt": "2026-04-20T10:00:00Z",
                                                "approvedBy": "admin-uuid",
                                                "metadata": {
                                                    "theme": "business"
                                                },
                                                "followers_count": 12,
                                                "posts_count": 3,
                                                "category_pages_count": 25,
                                                "createdAt": "2026-04-10T09:00:00Z",
                                                "updatedAt": "2026-04-20T10:00:00Z"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            },
            "get": {
                "operationId": "listPages",
                "tags": [
                    "Pages"
                ],
                "description": "List pages. Returns a paginator payload at the root.",
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "current_page": {
                                            "type": "number"
                                        },
                                        "data": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "id": {
                                                        "type": "string"
                                                    },
                                                    "ownerId": {
                                                        "type": "string"
                                                    },
                                                    "categoryId": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "name": {
                                                        "type": "string"
                                                    },
                                                    "slug": {
                                                        "type": "string"
                                                    },
                                                    "description": {
                                                        "type": "string"
                                                    },
                                                    "avatar": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "coverImage": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "isVerified": {
                                                        "type": "number"
                                                    },
                                                    "isActive": {
                                                        "type": "number"
                                                    },
                                                    "isApproved": {
                                                        "type": "number"
                                                    },
                                                    "approvalNotes": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "approvedAt": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "approvedBy": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "metadata": {
                                                        "type": [
                                                            "null",
                                                            "object"
                                                        ]
                                                    },
                                                    "followers_count": {
                                                        "type": [
                                                            "null",
                                                            "number"
                                                        ],
                                                        "description": "Number of followers for the page (optional; present if calculated/denormalized)"
                                                    },
                                                    "posts_count": {
                                                        "type": [
                                                            "null",
                                                            "number"
                                                        ],
                                                        "description": "Denormalized post count for the page (optional; present when the pages table maintains a post_count column)"
                                                    },
                                                    "category_pages_count": {
                                                        "type": [
                                                            "null",
                                                            "number"
                                                        ],
                                                        "description": "Total pages in the page category (optional; present if counted)"
                                                    },
                                                    "createdAt": {
                                                        "type": "string"
                                                    },
                                                    "updatedAt": {
                                                        "type": "string"
                                                    }
                                                },
                                                "example": {
                                                    "id": "page-uuid",
                                                    "ownerId": "user-uuid",
                                                    "categoryId": "page-category-uuid",
                                                    "name": "My Page",
                                                    "slug": "my-page",
                                                    "description": "A public page",
                                                    "avatar": null,
                                                    "coverImage": null,
                                                    "isVerified": 0,
                                                    "isActive": 1,
                                                    "isApproved": 1,
                                                    "approvalNotes": null,
                                                    "approvedAt": "2026-04-20T10:00:00Z",
                                                    "approvedBy": "admin-uuid",
                                                    "metadata": {
                                                        "theme": "business"
                                                    },
                                                    "followers_count": 12,
                                                    "posts_count": 3,
                                                    "category_pages_count": 25,
                                                    "createdAt": "2026-04-10T09:00:00Z",
                                                    "updatedAt": "2026-04-20T10:00:00Z"
                                                }
                                            }
                                        },
                                        "first_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "from": {
                                            "type": [
                                                "null",
                                                "number"
                                            ]
                                        },
                                        "last_page": {
                                            "type": "number"
                                        },
                                        "last_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "links": {
                                            "type": "array",
                                            "items": {
                                                "type": "object"
                                            }
                                        },
                                        "next_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "path": {
                                            "type": "string"
                                        },
                                        "per_page": {
                                            "type": "number"
                                        },
                                        "prev_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "to": {
                                            "type": [
                                                "null",
                                                "number"
                                            ]
                                        },
                                        "total": {
                                            "type": "number"
                                        }
                                    },
                                    "example": {
                                        "current_page": 1,
                                        "data": [
                                            {
                                                "id": "page-uuid",
                                                "ownerId": "user-uuid",
                                                "categoryId": "page-category-uuid",
                                                "name": "My Page",
                                                "slug": "my-page",
                                                "description": "A public page",
                                                "avatar": null,
                                                "coverImage": null,
                                                "isVerified": 0,
                                                "isActive": 1,
                                                "isApproved": 1,
                                                "approvalNotes": null,
                                                "approvedAt": "2026-04-20T10:00:00Z",
                                                "approvedBy": "admin-uuid",
                                                "metadata": {
                                                    "theme": "business"
                                                },
                                                "followers_count": 12,
                                                "posts_count": 3,
                                                "category_pages_count": 25,
                                                "createdAt": "2026-04-10T09:00:00Z",
                                                "updatedAt": "2026-04-20T10:00:00Z"
                                            }
                                        ],
                                        "first_page_url": "http://localhost:3000/resource?page=1&per_page=20",
                                        "from": 1,
                                        "last_page": 1,
                                        "last_page_url": "http://localhost:3000/resource?page=1&per_page=20",
                                        "links": [],
                                        "next_page_url": null,
                                        "path": "http://localhost:3000/resource",
                                        "per_page": 20,
                                        "prev_page_url": null,
                                        "to": 1,
                                        "total": 1
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/pages/{id}": {
            "get": {
                "operationId": "getPage",
                "tags": [
                    "Pages"
                ],
                "description": "Get a page by id",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "ownerId": {
                                                    "type": "string"
                                                },
                                                "categoryId": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "name": {
                                                    "type": "string"
                                                },
                                                "slug": {
                                                    "type": "string"
                                                },
                                                "description": {
                                                    "type": "string"
                                                },
                                                "avatar": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "coverImage": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "isVerified": {
                                                    "type": "number"
                                                },
                                                "isActive": {
                                                    "type": "number"
                                                },
                                                "isApproved": {
                                                    "type": "number"
                                                },
                                                "approvalNotes": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "approvedAt": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "approvedBy": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "metadata": {
                                                    "type": [
                                                        "null",
                                                        "object"
                                                    ]
                                                },
                                                "followers_count": {
                                                    "type": [
                                                        "null",
                                                        "number"
                                                    ],
                                                    "description": "Number of followers for the page (optional; present if calculated/denormalized)"
                                                },
                                                "posts_count": {
                                                    "type": [
                                                        "null",
                                                        "number"
                                                    ],
                                                    "description": "Denormalized post count for the page (optional; present when the pages table maintains a post_count column)"
                                                },
                                                "category_pages_count": {
                                                    "type": [
                                                        "null",
                                                        "number"
                                                    ],
                                                    "description": "Total pages in the page category (optional; present if counted)"
                                                },
                                                "createdAt": {
                                                    "type": "string"
                                                },
                                                "updatedAt": {
                                                    "type": "string"
                                                }
                                            },
                                            "example": {
                                                "id": "page-uuid",
                                                "ownerId": "user-uuid",
                                                "categoryId": "page-category-uuid",
                                                "name": "My Page",
                                                "slug": "my-page",
                                                "description": "A public page",
                                                "avatar": null,
                                                "coverImage": null,
                                                "isVerified": 0,
                                                "isActive": 1,
                                                "isApproved": 1,
                                                "approvalNotes": null,
                                                "approvedAt": "2026-04-20T10:00:00Z",
                                                "approvedBy": "admin-uuid",
                                                "metadata": {
                                                    "theme": "business"
                                                },
                                                "followers_count": 12,
                                                "posts_count": 3,
                                                "category_pages_count": 25,
                                                "createdAt": "2026-04-10T09:00:00Z",
                                                "updatedAt": "2026-04-20T10:00:00Z"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "404": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            },
            "put": {
                "operationId": "updatePage",
                "tags": [
                    "Pages"
                ],
                "description": "Update a page. Only the page owner may update.",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "name": {
                                        "type": "string"
                                    },
                                    "slug": {
                                        "type": "string"
                                    },
                                    "description": {
                                        "type": "string"
                                    },
                                    "metadata": {
                                        "type": "object"
                                    }
                                },
                                "example": {
                                    "name": "My Updated Page",
                                    "slug": "my-updated-page",
                                    "description": "Updated page description",
                                    "metadata": {
                                        "theme": "business"
                                    }
                                }
                            }
                        }
                    }
                },
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "ownerId": {
                                                    "type": "string"
                                                },
                                                "categoryId": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "name": {
                                                    "type": "string"
                                                },
                                                "slug": {
                                                    "type": "string"
                                                },
                                                "description": {
                                                    "type": "string"
                                                },
                                                "avatar": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "coverImage": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "isVerified": {
                                                    "type": "number"
                                                },
                                                "isActive": {
                                                    "type": "number"
                                                },
                                                "isApproved": {
                                                    "type": "number"
                                                },
                                                "approvalNotes": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "approvedAt": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "approvedBy": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "metadata": {
                                                    "type": [
                                                        "null",
                                                        "object"
                                                    ]
                                                },
                                                "followers_count": {
                                                    "type": [
                                                        "null",
                                                        "number"
                                                    ],
                                                    "description": "Number of followers for the page (optional; present if calculated/denormalized)"
                                                },
                                                "posts_count": {
                                                    "type": [
                                                        "null",
                                                        "number"
                                                    ],
                                                    "description": "Denormalized post count for the page (optional; present when the pages table maintains a post_count column)"
                                                },
                                                "category_pages_count": {
                                                    "type": [
                                                        "null",
                                                        "number"
                                                    ],
                                                    "description": "Total pages in the page category (optional; present if counted)"
                                                },
                                                "createdAt": {
                                                    "type": "string"
                                                },
                                                "updatedAt": {
                                                    "type": "string"
                                                }
                                            },
                                            "example": {
                                                "id": "page-uuid",
                                                "ownerId": "user-uuid",
                                                "categoryId": "page-category-uuid",
                                                "name": "My Page",
                                                "slug": "my-page",
                                                "description": "A public page",
                                                "avatar": null,
                                                "coverImage": null,
                                                "isVerified": 0,
                                                "isActive": 1,
                                                "isApproved": 1,
                                                "approvalNotes": null,
                                                "approvedAt": "2026-04-20T10:00:00Z",
                                                "approvedBy": "admin-uuid",
                                                "metadata": {
                                                    "theme": "business"
                                                },
                                                "followers_count": 12,
                                                "posts_count": 3,
                                                "category_pages_count": 25,
                                                "createdAt": "2026-04-10T09:00:00Z",
                                                "updatedAt": "2026-04-20T10:00:00Z"
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "page-uuid",
                                            "ownerId": "user-uuid",
                                            "categoryId": "page-category-uuid",
                                            "name": "My Page",
                                            "slug": "my-page",
                                            "description": "A public page",
                                            "avatar": null,
                                            "coverImage": null,
                                            "isVerified": 0,
                                            "isActive": 1,
                                            "isApproved": 1,
                                            "approvalNotes": null,
                                            "approvedAt": "2026-04-20T10:00:00Z",
                                            "approvedBy": "admin-uuid",
                                            "metadata": {
                                                "theme": "business"
                                            },
                                            "followers_count": 12,
                                            "posts_count": 3,
                                            "category_pages_count": 25,
                                            "createdAt": "2026-04-10T09:00:00Z",
                                            "updatedAt": "2026-04-20T10:00:00Z"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "403": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "404": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "delete": {
                "operationId": "deletePage",
                "tags": [
                    "Pages"
                ],
                "description": "Delete a page. Only the page owner may delete.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "user-uuid"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "403": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "404": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/page-categories/{id}/pages": {
            "get": {
                "operationId": "listPagesByCategoryId",
                "tags": [
                    "Pages",
                    "Categories"
                ],
                "description": "List pages under a category id. Returns a paginator payload at the root.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "current_page": {
                                            "type": "number"
                                        },
                                        "data": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "id": {
                                                        "type": "string"
                                                    },
                                                    "ownerId": {
                                                        "type": "string"
                                                    },
                                                    "categoryId": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "name": {
                                                        "type": "string"
                                                    },
                                                    "slug": {
                                                        "type": "string"
                                                    },
                                                    "description": {
                                                        "type": "string"
                                                    },
                                                    "avatar": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "coverImage": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "isVerified": {
                                                        "type": "number"
                                                    },
                                                    "isActive": {
                                                        "type": "number"
                                                    },
                                                    "isApproved": {
                                                        "type": "number"
                                                    },
                                                    "approvalNotes": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "approvedAt": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "approvedBy": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "metadata": {
                                                        "type": [
                                                            "null",
                                                            "object"
                                                        ]
                                                    },
                                                    "followers_count": {
                                                        "type": [
                                                            "null",
                                                            "number"
                                                        ],
                                                        "description": "Number of followers for the page (optional; present if calculated/denormalized)"
                                                    },
                                                    "posts_count": {
                                                        "type": [
                                                            "null",
                                                            "number"
                                                        ],
                                                        "description": "Denormalized post count for the page (optional; present when the pages table maintains a post_count column)"
                                                    },
                                                    "category_pages_count": {
                                                        "type": [
                                                            "null",
                                                            "number"
                                                        ],
                                                        "description": "Total pages in the page category (optional; present if counted)"
                                                    },
                                                    "createdAt": {
                                                        "type": "string"
                                                    },
                                                    "updatedAt": {
                                                        "type": "string"
                                                    }
                                                },
                                                "example": {
                                                    "id": "page-uuid",
                                                    "ownerId": "user-uuid",
                                                    "categoryId": "page-category-uuid",
                                                    "name": "My Page",
                                                    "slug": "my-page",
                                                    "description": "A public page",
                                                    "avatar": null,
                                                    "coverImage": null,
                                                    "isVerified": 0,
                                                    "isActive": 1,
                                                    "isApproved": 1,
                                                    "approvalNotes": null,
                                                    "approvedAt": "2026-04-20T10:00:00Z",
                                                    "approvedBy": "admin-uuid",
                                                    "metadata": {
                                                        "theme": "business"
                                                    },
                                                    "followers_count": 12,
                                                    "posts_count": 3,
                                                    "category_pages_count": 25,
                                                    "createdAt": "2026-04-10T09:00:00Z",
                                                    "updatedAt": "2026-04-20T10:00:00Z"
                                                }
                                            }
                                        },
                                        "first_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "from": {
                                            "type": [
                                                "null",
                                                "number"
                                            ]
                                        },
                                        "last_page": {
                                            "type": "number"
                                        },
                                        "last_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "links": {
                                            "type": "array",
                                            "items": {
                                                "type": "object"
                                            }
                                        },
                                        "next_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "path": {
                                            "type": "string"
                                        },
                                        "per_page": {
                                            "type": "number"
                                        },
                                        "prev_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "to": {
                                            "type": [
                                                "null",
                                                "number"
                                            ]
                                        },
                                        "total": {
                                            "type": "number"
                                        }
                                    },
                                    "example": {
                                        "current_page": 1,
                                        "data": [
                                            {
                                                "id": "page-uuid",
                                                "ownerId": "user-uuid",
                                                "categoryId": "page-category-uuid",
                                                "name": "My Page",
                                                "slug": "my-page",
                                                "description": "A public page",
                                                "avatar": null,
                                                "coverImage": null,
                                                "isVerified": 0,
                                                "isActive": 1,
                                                "isApproved": 1,
                                                "approvalNotes": null,
                                                "approvedAt": "2026-04-20T10:00:00Z",
                                                "approvedBy": "admin-uuid",
                                                "metadata": {
                                                    "theme": "business"
                                                },
                                                "followers_count": 12,
                                                "posts_count": 3,
                                                "category_pages_count": 25,
                                                "createdAt": "2026-04-10T09:00:00Z",
                                                "updatedAt": "2026-04-20T10:00:00Z"
                                            }
                                        ],
                                        "first_page_url": "http://localhost:3000/resource?page=1&per_page=20",
                                        "from": 1,
                                        "last_page": 1,
                                        "last_page_url": "http://localhost:3000/resource?page=1&per_page=20",
                                        "links": [],
                                        "next_page_url": null,
                                        "path": "http://localhost:3000/resource",
                                        "per_page": 20,
                                        "prev_page_url": null,
                                        "to": 1,
                                        "total": 1
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/page-categories/name/{name}/pages": {
            "get": {
                "operationId": "listPagesByCategoryName",
                "tags": [
                    "Pages",
                    "Categories"
                ],
                "description": "List pages under a category name. Returns a paginator payload at the root.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "name",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "current_page": {
                                            "type": "number"
                                        },
                                        "data": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "id": {
                                                        "type": "string"
                                                    },
                                                    "ownerId": {
                                                        "type": "string"
                                                    },
                                                    "categoryId": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "name": {
                                                        "type": "string"
                                                    },
                                                    "slug": {
                                                        "type": "string"
                                                    },
                                                    "description": {
                                                        "type": "string"
                                                    },
                                                    "avatar": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "coverImage": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "isVerified": {
                                                        "type": "number"
                                                    },
                                                    "isActive": {
                                                        "type": "number"
                                                    },
                                                    "isApproved": {
                                                        "type": "number"
                                                    },
                                                    "approvalNotes": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "approvedAt": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "approvedBy": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    },
                                                    "metadata": {
                                                        "type": [
                                                            "null",
                                                            "object"
                                                        ]
                                                    },
                                                    "followers_count": {
                                                        "type": [
                                                            "null",
                                                            "number"
                                                        ],
                                                        "description": "Number of followers for the page (optional; present if calculated/denormalized)"
                                                    },
                                                    "posts_count": {
                                                        "type": [
                                                            "null",
                                                            "number"
                                                        ],
                                                        "description": "Denormalized post count for the page (optional; present when the pages table maintains a post_count column)"
                                                    },
                                                    "category_pages_count": {
                                                        "type": [
                                                            "null",
                                                            "number"
                                                        ],
                                                        "description": "Total pages in the page category (optional; present if counted)"
                                                    },
                                                    "createdAt": {
                                                        "type": "string"
                                                    },
                                                    "updatedAt": {
                                                        "type": "string"
                                                    }
                                                },
                                                "example": {
                                                    "id": "page-uuid",
                                                    "ownerId": "user-uuid",
                                                    "categoryId": "page-category-uuid",
                                                    "name": "My Page",
                                                    "slug": "my-page",
                                                    "description": "A public page",
                                                    "avatar": null,
                                                    "coverImage": null,
                                                    "isVerified": 0,
                                                    "isActive": 1,
                                                    "isApproved": 1,
                                                    "approvalNotes": null,
                                                    "approvedAt": "2026-04-20T10:00:00Z",
                                                    "approvedBy": "admin-uuid",
                                                    "metadata": {
                                                        "theme": "business"
                                                    },
                                                    "followers_count": 12,
                                                    "posts_count": 3,
                                                    "category_pages_count": 25,
                                                    "createdAt": "2026-04-10T09:00:00Z",
                                                    "updatedAt": "2026-04-20T10:00:00Z"
                                                }
                                            }
                                        },
                                        "first_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "from": {
                                            "type": [
                                                "null",
                                                "number"
                                            ]
                                        },
                                        "last_page": {
                                            "type": "number"
                                        },
                                        "last_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "links": {
                                            "type": "array",
                                            "items": {
                                                "type": "object"
                                            }
                                        },
                                        "next_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "path": {
                                            "type": "string"
                                        },
                                        "per_page": {
                                            "type": "number"
                                        },
                                        "prev_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "to": {
                                            "type": [
                                                "null",
                                                "number"
                                            ]
                                        },
                                        "total": {
                                            "type": "number"
                                        }
                                    },
                                    "example": {
                                        "current_page": 1,
                                        "data": [
                                            {
                                                "id": "page-uuid",
                                                "ownerId": "user-uuid",
                                                "categoryId": "page-category-uuid",
                                                "name": "My Page",
                                                "slug": "my-page",
                                                "description": "A public page",
                                                "avatar": null,
                                                "coverImage": null,
                                                "isVerified": 0,
                                                "isActive": 1,
                                                "isApproved": 1,
                                                "approvalNotes": null,
                                                "approvedAt": "2026-04-20T10:00:00Z",
                                                "approvedBy": "admin-uuid",
                                                "metadata": {
                                                    "theme": "business"
                                                },
                                                "followers_count": 12,
                                                "posts_count": 3,
                                                "category_pages_count": 25,
                                                "createdAt": "2026-04-10T09:00:00Z",
                                                "updatedAt": "2026-04-20T10:00:00Z"
                                            }
                                        ],
                                        "first_page_url": "http://localhost:3000/resource?page=1&per_page=20",
                                        "from": 1,
                                        "last_page": 1,
                                        "last_page_url": "http://localhost:3000/resource?page=1&per_page=20",
                                        "links": [],
                                        "next_page_url": null,
                                        "path": "http://localhost:3000/resource",
                                        "per_page": 20,
                                        "prev_page_url": null,
                                        "to": 1,
                                        "total": 1
                                    }
                                }
                            }
                        }
                    },
                    "404": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/page-categories/{id}": {
            "get": {
                "operationId": "getPageCategory",
                "tags": [
                    "Pages",
                    "Categories"
                ],
                "description": "Get page category details (includes total pages count)",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "name": {
                                                    "type": "string"
                                                },
                                                "slug": {
                                                    "type": "string"
                                                },
                                                "description": {
                                                    "type": "string"
                                                },
                                                "icon": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "is_active": {
                                                    "type": "number"
                                                },
                                                "rules": {
                                                    "type": [
                                                        "null",
                                                        "object"
                                                    ]
                                                },
                                                "max_pages_per_user": {
                                                    "type": [
                                                        "null",
                                                        "number"
                                                    ]
                                                },
                                                "requires_approval": {
                                                    "type": [
                                                        "null",
                                                        "number"
                                                    ]
                                                },
                                                "validation_rules": {
                                                    "type": [
                                                        "null",
                                                        "object"
                                                    ]
                                                },
                                                "created_at": {
                                                    "type": "string"
                                                },
                                                "updated_at": {
                                                    "type": "string"
                                                },
                                                "total_pages": {
                                                    "type": [
                                                        "null",
                                                        "number"
                                                    ],
                                                    "description": "Total pages in this category (provided by GET /page-categories/:id)"
                                                }
                                            },
                                            "example": {
                                                "id": "page-category-uuid",
                                                "name": "Community",
                                                "slug": "community",
                                                "description": "Community pages",
                                                "icon": "users",
                                                "is_active": 1,
                                                "rules": {
                                                    "allowPosting": true
                                                },
                                                "max_pages_per_user": 5,
                                                "requires_approval": 1,
                                                "validation_rules": {
                                                    "slugPattern": "^[a-z0-9-]+$"
                                                },
                                                "created_at": "2026-04-01T12:00:00Z",
                                                "updated_at": "2026-04-10T12:00:00Z",
                                                "total_pages": 12
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "data": {
                                            "id": "page-category-uuid",
                                            "name": "Community",
                                            "slug": "community",
                                            "description": "Community pages",
                                            "icon": "users",
                                            "is_active": 1,
                                            "rules": {
                                                "allowPosting": true
                                            },
                                            "max_pages_per_user": 5,
                                            "requires_approval": 1,
                                            "validation_rules": {
                                                "slugPattern": "^[a-z0-9-]+$"
                                            },
                                            "created_at": "2026-04-01T12:00:00Z",
                                            "updated_at": "2026-04-10T12:00:00Z",
                                            "total_pages": 12
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "404": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "put": {
                "operationId": "updatePageCategory",
                "tags": [
                    "Categories"
                ],
                "description": "Update an existing page category (admin only).",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "name",
                                    "slug"
                                ],
                                "properties": {
                                    "name": {
                                        "type": "string"
                                    },
                                    "slug": {
                                        "type": "string"
                                    },
                                    "description": {
                                        "type": "string"
                                    },
                                    "icon": {
                                        "type": "string"
                                    },
                                    "is_active": {
                                        "type": "number"
                                    },
                                    "rules": {
                                        "type": [
                                            "object",
                                            "null"
                                        ]
                                    },
                                    "max_pages_per_user": {
                                        "type": [
                                            "number",
                                            "null"
                                        ]
                                    },
                                    "requires_approval": {
                                        "type": [
                                            "number",
                                            "null"
                                        ]
                                    },
                                    "validation_rules": {
                                        "type": [
                                            "object",
                                            "null"
                                        ]
                                    }
                                },
                                "example": {
                                    "name": "Community",
                                    "slug": "community",
                                    "description": "Community pages for user groups, discussions and events.",
                                    "icon": "users",
                                    "is_active": 1,
                                    "rules": {
                                        "allowPosting": true,
                                        "allowMedia": true,
                                        "requireMembership": false,
                                        "profanityFilter": true
                                    },
                                    "max_pages_per_user": 5,
                                    "requires_approval": 1,
                                    "validation_rules": {
                                        "slugPattern": "^[a-z0-9-]+$",
                                        "minNameLength": 3,
                                        "maxNameLength": 60
                                    }
                                }
                            }
                        }
                    }
                },
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "name": {
                                                    "type": "string"
                                                },
                                                "slug": {
                                                    "type": "string"
                                                },
                                                "description": {
                                                    "type": "string"
                                                },
                                                "icon": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "is_active": {
                                                    "type": "number"
                                                },
                                                "rules": {
                                                    "type": [
                                                        "null",
                                                        "object"
                                                    ]
                                                },
                                                "max_pages_per_user": {
                                                    "type": [
                                                        "null",
                                                        "number"
                                                    ]
                                                },
                                                "requires_approval": {
                                                    "type": [
                                                        "null",
                                                        "number"
                                                    ]
                                                },
                                                "validation_rules": {
                                                    "type": [
                                                        "null",
                                                        "object"
                                                    ]
                                                },
                                                "created_at": {
                                                    "type": "string"
                                                },
                                                "updated_at": {
                                                    "type": "string"
                                                },
                                                "total_pages": {
                                                    "type": [
                                                        "null",
                                                        "number"
                                                    ],
                                                    "description": "Total pages in this category (provided by GET /page-categories/:id)"
                                                }
                                            },
                                            "example": {
                                                "id": "page-category-uuid",
                                                "name": "Community",
                                                "slug": "community",
                                                "description": "Community pages",
                                                "icon": "users",
                                                "is_active": 1,
                                                "rules": {
                                                    "allowPosting": true
                                                },
                                                "max_pages_per_user": 5,
                                                "requires_approval": 1,
                                                "validation_rules": {
                                                    "slugPattern": "^[a-z0-9-]+$"
                                                },
                                                "created_at": "2026-04-01T12:00:00Z",
                                                "updated_at": "2026-04-10T12:00:00Z",
                                                "total_pages": 12
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "403": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "404": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "409": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                },
                                "examples": {
                                    "example1": {
                                        "value": {
                                            "summary": "Invalid slug format",
                                            "value": {
                                                "success": false,
                                                "error": {
                                                    "code": "invalid_slug_format",
                                                    "message": "Slug must match ^[a-z0-9-]+$"
                                                }
                                            }
                                        }
                                    },
                                    "example2": {
                                        "value": {
                                            "summary": "Name too short",
                                            "value": {
                                                "success": false,
                                                "error": {
                                                    "code": "name_too_short",
                                                    "message": "Name must be at least the minimum length"
                                                }
                                            }
                                        }
                                    },
                                    "example3": {
                                        "value": {
                                            "summary": "Invalid validation rules",
                                            "value": {
                                                "success": false,
                                                "error": {
                                                    "code": "invalid_validation_rules",
                                                    "message": "validation_rules must be an object with valid fields"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "delete": {
                "operationId": "deletePageCategory",
                "tags": [
                    "Categories"
                ],
                "description": "Delete a page category (admin only). Pages that reference this category will be unassigned (category set to null) before deletion to avoid FK errors.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "403": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "404": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/page-categories": {
            "post": {
                "operationId": "createPageCategory",
                "tags": [
                    "Categories"
                ],
                "description": "Create a new page category (admin only).",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "name",
                                    "slug"
                                ],
                                "properties": {
                                    "name": {
                                        "type": "string"
                                    },
                                    "slug": {
                                        "type": "string"
                                    },
                                    "description": {
                                        "type": "string"
                                    },
                                    "icon": {
                                        "type": "string"
                                    },
                                    "is_active": {
                                        "type": "number"
                                    },
                                    "rules": {
                                        "type": [
                                            "object",
                                            "null"
                                        ]
                                    },
                                    "max_pages_per_user": {
                                        "type": [
                                            "number",
                                            "null"
                                        ]
                                    },
                                    "requires_approval": {
                                        "type": [
                                            "number",
                                            "null"
                                        ]
                                    },
                                    "validation_rules": {
                                        "type": [
                                            "object",
                                            "null"
                                        ]
                                    }
                                },
                                "example": {
                                    "name": "Community",
                                    "slug": "community",
                                    "description": "Community pages for user groups, discussions and events.",
                                    "icon": "users",
                                    "is_active": 1,
                                    "rules": {
                                        "allowPosting": true,
                                        "allowMedia": true,
                                        "requireMembership": false,
                                        "profanityFilter": true
                                    },
                                    "max_pages_per_user": 5,
                                    "requires_approval": 1,
                                    "validation_rules": {
                                        "slugPattern": "^[a-z0-9-]+$",
                                        "minNameLength": 3,
                                        "maxNameLength": 60
                                    }
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "name": {
                                                    "type": "string"
                                                },
                                                "slug": {
                                                    "type": "string"
                                                },
                                                "description": {
                                                    "type": "string"
                                                },
                                                "icon": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "is_active": {
                                                    "type": "number"
                                                },
                                                "rules": {
                                                    "type": [
                                                        "null",
                                                        "object"
                                                    ]
                                                },
                                                "max_pages_per_user": {
                                                    "type": [
                                                        "null",
                                                        "number"
                                                    ]
                                                },
                                                "requires_approval": {
                                                    "type": [
                                                        "null",
                                                        "number"
                                                    ]
                                                },
                                                "validation_rules": {
                                                    "type": [
                                                        "null",
                                                        "object"
                                                    ]
                                                },
                                                "created_at": {
                                                    "type": "string"
                                                },
                                                "updated_at": {
                                                    "type": "string"
                                                },
                                                "total_pages": {
                                                    "type": [
                                                        "null",
                                                        "number"
                                                    ],
                                                    "description": "Total pages in this category (provided by GET /page-categories/:id)"
                                                }
                                            },
                                            "example": {
                                                "id": "page-category-uuid",
                                                "name": "Community",
                                                "slug": "community",
                                                "description": "Community pages",
                                                "icon": "users",
                                                "is_active": 1,
                                                "rules": {
                                                    "allowPosting": true
                                                },
                                                "max_pages_per_user": 5,
                                                "requires_approval": 1,
                                                "validation_rules": {
                                                    "slugPattern": "^[a-z0-9-]+$"
                                                },
                                                "created_at": "2026-04-01T12:00:00Z",
                                                "updated_at": "2026-04-10T12:00:00Z",
                                                "total_pages": 12
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "403": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "409": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "error": {
                                            "type": "object",
                                            "properties": {
                                                "code": {
                                                    "type": "string"
                                                },
                                                "message": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "error": {
                                            "code": "profile_already_exists",
                                            "message": "Profile already exists"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                },
                                "examples": {
                                    "example1": {
                                        "value": {
                                            "summary": "Invalid slug format",
                                            "value": {
                                                "success": false,
                                                "error": {
                                                    "code": "invalid_slug_format",
                                                    "message": "Slug must match ^[a-z0-9-]+$"
                                                }
                                            }
                                        }
                                    },
                                    "example2": {
                                        "value": {
                                            "summary": "Name too short",
                                            "value": {
                                                "success": false,
                                                "error": {
                                                    "code": "name_too_short",
                                                    "message": "Name must be at least the minimum length"
                                                }
                                            }
                                        }
                                    },
                                    "example3": {
                                        "value": {
                                            "summary": "Invalid validation rules",
                                            "value": {
                                                "success": false,
                                                "error": {
                                                    "code": "invalid_validation_rules",
                                                    "message": "validation_rules must be an object with valid fields"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/pages/{id}/avatar-file": {
            "post": {
                "operationId": "uploadPageAvatarFile",
                "tags": [
                    "Media",
                    "Pages"
                ],
                "description": "Upload a page avatar file (multipart). Enqueues background job and returns jobId.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "202": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "jobId": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "example": {
                                    "summary": "Job queued",
                                    "value": {
                                        "success": true,
                                        "data": {
                                            "jobId": "job_abc123"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "503": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/pages/{id}/cover-file": {
            "post": {
                "operationId": "uploadPageCoverFile",
                "tags": [
                    "Media",
                    "Pages"
                ],
                "description": "Upload a page cover/banner file (multipart). Enqueues background job and returns jobId.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "202": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "jobId": {
                                                    "type": "string"
                                                }
                                            }
                                        }
                                    }
                                },
                                "example": {
                                    "summary": "Job queued",
                                    "value": {
                                        "success": true,
                                        "data": {
                                            "jobId": "job_def456"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "503": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/pages/{id}/approve": {
            "post": {
                "operationId": "approvePage",
                "tags": [
                    "Pages",
                    "Moderation"
                ],
                "description": "Approve a page (admin only).",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string"
                                                },
                                                "ownerId": {
                                                    "type": "string"
                                                },
                                                "categoryId": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "name": {
                                                    "type": "string"
                                                },
                                                "slug": {
                                                    "type": "string"
                                                },
                                                "description": {
                                                    "type": "string"
                                                },
                                                "avatar": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "coverImage": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "isVerified": {
                                                    "type": "number"
                                                },
                                                "isActive": {
                                                    "type": "number"
                                                },
                                                "isApproved": {
                                                    "type": "number"
                                                },
                                                "approvalNotes": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "approvedAt": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "approvedBy": {
                                                    "type": [
                                                        "null",
                                                        "string"
                                                    ]
                                                },
                                                "metadata": {
                                                    "type": [
                                                        "null",
                                                        "object"
                                                    ]
                                                },
                                                "followers_count": {
                                                    "type": [
                                                        "null",
                                                        "number"
                                                    ],
                                                    "description": "Number of followers for the page (optional; present if calculated/denormalized)"
                                                },
                                                "posts_count": {
                                                    "type": [
                                                        "null",
                                                        "number"
                                                    ],
                                                    "description": "Denormalized post count for the page (optional; present when the pages table maintains a post_count column)"
                                                },
                                                "category_pages_count": {
                                                    "type": [
                                                        "null",
                                                        "number"
                                                    ],
                                                    "description": "Total pages in the page category (optional; present if counted)"
                                                },
                                                "createdAt": {
                                                    "type": "string"
                                                },
                                                "updatedAt": {
                                                    "type": "string"
                                                }
                                            },
                                            "example": {
                                                "id": "page-uuid",
                                                "ownerId": "user-uuid",
                                                "categoryId": "page-category-uuid",
                                                "name": "My Page",
                                                "slug": "my-page",
                                                "description": "A public page",
                                                "avatar": null,
                                                "coverImage": null,
                                                "isVerified": 0,
                                                "isActive": 1,
                                                "isApproved": 1,
                                                "approvalNotes": null,
                                                "approvedAt": "2026-04-20T10:00:00Z",
                                                "approvedBy": "admin-uuid",
                                                "metadata": {
                                                    "theme": "business"
                                                },
                                                "followers_count": 12,
                                                "posts_count": 3,
                                                "category_pages_count": 25,
                                                "createdAt": "2026-04-10T09:00:00Z",
                                                "updatedAt": "2026-04-20T10:00:00Z"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "403": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "404": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/pages/{id}/follow": {
            "post": {
                "operationId": "followPage",
                "tags": [
                    "Pages"
                ],
                "description": "Follow a page",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "description": "Empty body accepted; request requires Authorization header. Server ignores body and uses the authenticated user from the Authorization token.",
                                "properties": {},
                                "example": {
                                    "note": "No body required. Include Authorization: Bearer <token>"
                                }
                            }
                        }
                    },
                    "description": "Empty body accepted; request requires Authorization header. Server ignores body and uses the authenticated user from the Authorization token."
                },
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "following": {
                                                    "type": "boolean"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "message": "Followed successfully.",
                                        "data": {
                                            "following": true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "201": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "following": {
                                                    "type": "boolean"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "message": "Followed successfully.",
                                        "data": {
                                            "following": true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": [
                                                "null",
                                                "object"
                                            ]
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "message": "Token invalid or expired",
                                        "data": null
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "delete": {
                "operationId": "unfollowPage",
                "tags": [
                    "Pages"
                ],
                "description": "Unfollow a page",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": "object",
                                            "properties": {
                                                "following": {
                                                    "type": "boolean"
                                                }
                                            }
                                        }
                                    },
                                    "example": {
                                        "success": true,
                                        "message": "Unfollowed successfully.",
                                        "data": {
                                            "following": false
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "data": {
                                            "type": [
                                                "null",
                                                "object"
                                            ]
                                        }
                                    },
                                    "example": {
                                        "success": false,
                                        "message": "Token invalid or expired",
                                        "data": null
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/pages/{id}/followers": {
            "get": {
                "operationId": "listPageFollowers",
                "tags": [
                    "Pages"
                ],
                "description": "List followers for a page. Returns a paginator payload at the root.",
                "parameters": [
                    {
                        "schema": {
                            "type": "string"
                        },
                        "in": "path",
                        "name": "id",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Default Response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "current_page": {
                                            "type": "number"
                                        },
                                        "data": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "id": {
                                                        "type": "string"
                                                    },
                                                    "page_id": {
                                                        "type": "string"
                                                    },
                                                    "user_id": {
                                                        "type": "string"
                                                    },
                                                    "role": {
                                                        "type": "string"
                                                    },
                                                    "is_notified": {
                                                        "type": "number"
                                                    },
                                                    "is_muted": {
                                                        "type": "number"
                                                    },
                                                    "created_at": {
                                                        "type": "string",
                                                        "format": "date-time"
                                                    },
                                                    "updated_at": {
                                                        "type": "string",
                                                        "format": "date-time"
                                                    },
                                                    "message": {
                                                        "type": [
                                                            "null",
                                                            "string"
                                                        ]
                                                    }
                                                },
                                                "example": {
                                                    "id": "page-follow-uuid",
                                                    "page_id": "page-uuid",
                                                    "user_id": "user-uuid",
                                                    "role": "follower",
                                                    "is_notified": 1,
                                                    "is_muted": 0,
                                                    "created_at": "2026-04-23T10:00:00Z",
                                                    "updated_at": "2026-04-23T10:00:00Z",
                                                    "message": "followed"
                                                }
                                            }
                                        },
                                        "first_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "from": {
                                            "type": [
                                                "null",
                                                "number"
                                            ]
                                        },
                                        "last_page": {
                                            "type": "number"
                                        },
                                        "last_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "links": {
                                            "type": "array",
                                            "items": {
                                                "type": "object"
                                            }
                                        },
                                        "next_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "path": {
                                            "type": "string"
                                        },
                                        "per_page": {
                                            "type": "number"
                                        },
                                        "prev_page_url": {
                                            "type": [
                                                "null",
                                                "string"
                                            ]
                                        },
                                        "to": {
                                            "type": [
                                                "null",
                                                "number"
                                            ]
                                        },
                                        "total": {
                                            "type": "number"
                                        }
                                    },
                                    "example": {
                                        "current_page": 1,
                                        "data": [
                                            {
                                                "id": "page-follow-uuid",
                                                "page_id": "page-uuid",
                                                "user_id": "user-uuid",
                                                "role": "follower",
                                                "is_notified": 1,
                                                "is_muted": 0,
                                                "created_at": "2026-04-23T10:00:00Z",
                                                "updated_at": "2026-04-23T10:00:00Z",
                                                "message": "followed"
                                            }
                                        ],
                                        "first_page_url": "http://localhost:3000/resource?page=1&per_page=20",
                                        "from": 1,
                                        "last_page": 1,
                                        "last_page_url": "http://localhost:3000/resource?page=1&per_page=20",
                                        "links": [],
                                        "next_page_url": null,
                                        "path": "http://localhost:3000/resource",
                                        "per_page": 20,
                                        "prev_page_url": null,
                                        "to": 1,
                                        "total": 1
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    "servers": [
        {
            "url": "http://skills4export.org",
            "description": "Development server"
        }
    ]
}