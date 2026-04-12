# Development Roadmap

## Phase 1: Foundation

Goal: launch the first usable marketplace flow.

### Deliverables

- Monorepo or dual-app setup
- Authentication
- Role management
- Retailer approval workflow
- Product CRUD
- Product listing and detail pages
- Basic customer and retailer dashboards

## Phase 2: Marketplace differentiation

Goal: build the feature that makes Tan Tan unique.

### Deliverables

- Product request system
- Request offers from retailers
- Order management lifecycle
- Proof upload support
- Basic chat

## Phase 3: Operations and scale

Goal: make the platform business-ready.

### Deliverables

- Payment integration
- Admin analytics dashboard
- Subscription management
- Deployment pipeline
- Error monitoring and logging

## Recommended implementation order

1. Initialize `apps/web` and `apps/api`
2. Set up shared environment configuration
3. Add authentication and role middleware
4. Build retailer approval flow
5. Build product management APIs and UI
6. Build request and offer flows
7. Build orders and proof uploads
8. Add chat
9. Add admin analytics and subscriptions

## Testing strategy

- Unit tests for backend services and validation
- API tests for core flows
- UI tests for auth, product browsing, and orders
- User acceptance testing with real scenario walkthroughs

## Launch checklist

- Admin can approve retailers
- Retailers can upload products
- Customers can browse and request
- Orders can move through lifecycle
- Proof files are visible
- Basic reporting exists for admin
