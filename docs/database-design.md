# Database Design

## Overview

MongoDB collections should reflect the marketplace flow while leaving room for startup growth. The schema below is a strong first version rather than a final locked design.

## Users

```text
_id
name
email
passwordHash
role
phone
status
createdAt
updatedAt
```

Notes:

- `role` should be one of `customer`, `retailer`, `admin`
- `status` can help represent retailer approval state

## RetailerProfiles

```text
_id
userId
shopName
bangkokArea
subscriptionStatus
trialEndsAt
approvedAt
rejectedAt
createdAt
updatedAt
```

## Products

```text
_id
title
description
brand
category
price
discountPercent
currency
images
retailerId
stock
status
createdAt
updatedAt
```

Notes:

- `status` can be `draft`, `active`, or `archived`

## Requests

```text
_id
userId
productName
description
budget
currency
referenceImages
status
selectedOfferId
createdAt
updatedAt
```

Suggested statuses:

- `open`
- `offered`
- `accepted`
- `closed`
- `cancelled`

## RequestOffers

```text
_id
requestId
retailerId
offeredPrice
notes
estimatedDays
status
createdAt
updatedAt
```

## Orders

```text
_id
userId
retailerId
productId
requestId
offerId
status
quantity
subtotal
shippingFee
serviceFee
totalPrice
proofFiles
trackingCode
createdAt
updatedAt
```

Suggested statuses:

- `pending`
- `accepted`
- `purchased`
- `shipped`
- `delivered`
- `cancelled`

## Messages

```text
_id
conversationId
senderId
receiverId
message
attachments
readAt
createdAt
```

## Conversations

```text
_id
customerId
retailerId
orderId
requestId
lastMessageAt
createdAt
updatedAt
```

## AdminAuditLogs

```text
_id
adminId
action
targetType
targetId
metadata
createdAt
```

## Relationships summary

- One user can have one retailer profile
- One retailer can own many products
- One customer can create many requests
- One request can receive many offers
- One accepted offer can become one order
- One order can contain proof files and a linked conversation
