# ZeroMarket API Documentation

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "username": "player123",
  "email": "player@example.com",
  "password": "securepass123"
}

Response: 201 Created
{
  "id": 1,
  "username": "player123",
  "email": "player@example.com",
  "balance": 1000.0,
  "is_active": true,
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-15T10:30:00"
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "username": "player123",
  "password": "securepass123"
}

Response: 200 OK
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

---

### 2. Items

#### List Items
```http
GET /items?skip=0&limit=20&search=&sort_by=name

Query Parameters:
- skip: int (default: 0) - Offset for pagination
- limit: int (default: 20, max: 100) - Number of items per page
- search: str (optional) - Search term
- sort_by: str (name|price|rarity) - Sort field

Response: 200 OK
{
  "items": [
    {
      "id": 1,
      "name": "Legendary Sword",
      "description": "A powerful legendary sword",
      "current_price": 500.0,
      "base_price": 500.0,
      "total_copies": 10,
      "available_copies": 8,
      "is_legacy": false,
      "rarity_index": 9.5,
      "created_at": "2024-01-15T10:30:00",
      "updated_at": "2024-01-15T10:30:00"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20
}
```

#### Get Item Details
```http
GET /items/{item_id}

Response: 200 OK
{
  "id": 1,
  "name": "Legendary Sword",
  "description": "A powerful legendary sword",
  "current_price": 500.0,
  "base_price": 500.0,
  "total_copies": 10,
  "available_copies": 8,
  "is_legacy": false,
  "rarity_index": 9.5,
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-15T10:30:00"
}
```

#### Create Item (Admin)
```http
POST /items
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "New Item",
  "description": "Item description",
  "base_price": 100.0,
  "total_copies": 50,
  "is_legacy": false
}

Response: 201 Created
{ ... item object ... }
```

---

### 3. Orders

#### Create Order (Purchase)
```http
POST /orders
Content-Type: application/json
Authorization: Bearer <token>

{
  "item_id": 1,
  "quantity": 1
}

Response: 201 Created
{
  "id": 1,
  "user_id": 1,
  "item_id": 1,
  "quantity": 1,
  "unit_price": 500.0,
  "total_price": 500.0,
  "status": "completed",
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-15T10:30:00"
}

Response: 400 Bad Request (insufficient balance)
{
  "detail": "Insufficient balance"
}

Response: 400 Bad Request (out of stock)
{
  "detail": "Not enough stock available"
}
```

#### Get Order
```http
GET /orders/{order_id}
Authorization: Bearer <token>

Response: 200 OK
{ ... order object ... }
```

---

### 4. Inventory

#### Get User Inventory
```http
GET /inventory
Authorization: Bearer <token>

Response: 200 OK
{
  "items": [
    {
      "item_id": 1,
      "item_name": "Legendary Sword",
      "quantity": 2,
      "unit_price": 500.0,
      "total_value": 1000.0
    }
  ],
  "total_value": 1000.0
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Description of the error"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Access denied"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Rate Limiting

Currently no rate limiting implemented. Implement in MVP 2.0.

---

## Versioning

API Version: 1.0
Contract: Stable for MVP 1.0
Next Version: 2.0 (Marketplace features)
