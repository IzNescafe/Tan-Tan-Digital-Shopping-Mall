# Tan Tan Digital Shopping Center

Tan Tan is a full-stack e-commerce marketplace focused on Myanmar customers who want authentic branded goods sourced from outlet malls in Thailand.

The platform connects three core groups:

- Customers who want affordable authentic products
- Retailers who act as personal shoppers in Bangkok
- Admins who manage trust, operations, and subscriptions

## Core idea

Tan Tan is built around a simple promise: authentic products at better prices.

Instead of relying only on normal product listings, the platform also supports a request-based shopping model. Customers can ask for a specific item, set a budget, and receive offers from approved retailers who source from outlet malls.

## Business goals

- Deliver authentic branded products at lower prices
- Build trust through retailer verification and proof of purchase
- Create income opportunities for personal shoppers
- Launch a scalable startup-ready marketplace

## Core features

- Customer authentication and profile management
- Retailer registration with admin approval
- Product listing and browsing
- Product request system
- Order lifecycle tracking
- Real-time chat
- Receipt and real-photo authenticity proof
- Admin dashboard for approvals, analytics, and control

## Tech stack

### Frontend

- React
- Tailwind CSS
- Context API or Redux Toolkit

### Backend

- Node.js
- Express.js
- JWT authentication

### Database

- MongoDB
- Mongoose

## Suggested repository structure

```text
.
|-- apps
|   |-- web
|   `-- api
|-- docs
|   |-- product-requirements.md
|   |-- architecture.md
|   |-- database-design.md
|   |-- brand-theme.md
|   `-- roadmap.md
`-- README.md
```

## Setup steps

1. Install Node.js 18 or newer.
2. Open the project root in your terminal.
3. Install the frontend dependencies:

```bash
cd apps/web
npm install
```

4. Start the frontend development server:

```bash
npm run dev
```

5. Open the local Vite URL shown in the terminal to view the themed Tan Tan web app.

## Current frontend foundation

- React + Vite app in `apps/web`
- Shared pastel design system in `apps/web/src/styles/theme.css`
- Starter landing page with the project-wide theme already applied

## Product workflow

### Customer flow

1. Browse products or submit a custom request
2. Place an order or accept a retailer offer
3. Wait for retailer confirmation
4. View proof of authenticity
5. Track shipping and delivery

### Retailer flow

1. Register and get approved
2. Upload products or respond to requests
3. Accept orders
4. Buy products from outlets
5. Upload receipts and real photos
6. Ship products to the customer

## Trust and security

- JWT-based authentication
- Hashed passwords with bcrypt
- Role-based access control
- Admin approval for retailers
- Receipt and real-photo verification

## Startup roadmap

### Phase 1

- Authentication
- Product marketplace
- Basic customer and retailer dashboards

### Phase 2

- Product request system
- Order management
- Chat system

### Phase 3

- Payments
- Full admin analytics
- Deployment and operational hardening

## Next recommended build order

1. Set up the frontend and backend applications
2. Implement authentication and role management
3. Build product and retailer flows
4. Add request-based shopping
5. Add order tracking, proof uploads, and chat
6. Launch admin workflows

## Documentation

- [Product Requirements](./docs/product-requirements.md)
- [Architecture](./docs/architecture.md)
- [Database Design](./docs/database-design.md)
- [Roadmap](./docs/roadmap.md)
- [Brand Theme](./docs/brand-theme.md)

## Vision

This is not just a class project. The concept is strong enough to support a competition demo, a portfolio flagship, or a real startup launch if execution stays disciplined.
