# System Architecture

## Overview

Tan Tan is best structured as a two-app MERN system:

- `apps/web` for the React frontend
- `apps/api` for the Express backend

MongoDB is used as the primary data store, and the system communicates through REST APIs in the first version.

## High-level architecture

```text
Customer / Retailer / Admin
            |
            v
      React Frontend
            |
            v
      Express REST API
            |
            v
         MongoDB
```

## Frontend responsibilities

- Authentication UI
- Product catalog and filters
- Product request submission
- Order tracking
- Chat interface
- Admin dashboard

## Backend responsibilities

- Authentication and JWT issuing
- Role-based middleware
- Product, request, order, and message APIs
- Retailer approval workflows
- Proof upload validation and storage integration

## Recommended backend modules

- `auth`
- `users`
- `retailers`
- `products`
- `requests`
- `orders`
- `messages`
- `subscriptions`
- `admin`

## Recommended frontend pages

- Home
- Product listing
- Product detail
- Request product
- Cart or order confirmation
- Customer dashboard
- Retailer dashboard
- Admin dashboard
- Chat
- Login and registration

## Infrastructure direction

### Development

- Frontend local dev server
- Backend local API server
- MongoDB local instance or Atlas dev cluster

### Deployment

- Frontend on Vercel or Netlify
- Backend on Render or Railway
- MongoDB Atlas
- Cloud storage for images and receipts in a later phase

## Security baseline

- bcrypt password hashing
- JWT access tokens
- Protected routes
- Input validation
- File upload restrictions
- Admin approval gates for retailers

## Future architecture upgrades

- Socket-based real-time chat
- Payment gateway integration
- Notification service
- Centralized shipping module
- Background jobs for reminders and status sync
