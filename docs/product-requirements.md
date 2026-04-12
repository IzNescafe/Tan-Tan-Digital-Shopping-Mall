# Product Requirements

## Product summary

Tan Tan Digital Shopping Center is a marketplace for Myanmar customers who want authentic branded goods from Thailand at outlet prices. The platform combines a normal e-commerce catalog with a request-based shopping flow powered by approved retailers.

## Users

### Customer

- Register and log in
- Browse and search products
- Request specific items
- Place orders
- Track order status
- Chat with retailers
- Review proof of authenticity

### Retailer

- Register and wait for approval
- Manage product listings
- Respond to product requests
- Accept and manage orders
- Upload proof of purchase and product photos
- Track earnings

### Admin

- Approve or reject retailers
- Manage users, products, and orders
- Review platform activity
- Manage retailer subscriptions
- Monitor analytics

## Functional requirements

### Authentication and authorization

- Users can sign up and log in
- Roles include `customer`, `retailer`, and `admin`
- Only approved retailers can publish listings or accept requests

### Marketplace

- Retailers can create, update, and archive product listings
- Customers can browse by category, discount, brand, and price
- Each product shows retailer information and authenticity details

### Product request system

- Customers can submit a request with product name, description, budget, and reference images in a future version
- Retailers can respond with offers
- Customers can accept one of the offers and convert it into an order

### Orders

Supported order statuses:

- `pending`
- `accepted`
- `purchased`
- `shipped`
- `delivered`
- `cancelled`

### Chat

- Customers and retailers can send messages tied to orders or requests
- Admins can review disputes if required

### Authenticity verification

- Retailers upload outlet receipts
- Retailers upload real product photos before shipping
- Customers can view proof from the order detail page

## Non-functional requirements

- Mobile-friendly interface
- Basic auditability for admin actions
- Scalable API structure
- Secure password handling
- Clear validation and error handling

## Success metrics

- Number of approved retailers
- Number of active listings
- Request-to-order conversion rate
- Repeat purchase rate
- Proof-upload compliance rate

## Risks

- Fake listings or counterfeit items
- Low retailer activity
- Delayed fulfillment
- Customer trust issues during early launch

## Mitigations

- Retailer approval workflow
- Verification proof requirements
- Clear order statuses and ETA expectations
- Subscription incentives and featured listing tools
