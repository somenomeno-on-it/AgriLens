## AgriLens

AgriLens is a **MERN-stack web platform** for agricultural monitoring and transparency. It connects **farmers**, **local verification agents**, **administrators**, and **public guests** to register farms, list produce, verify quality, and visualize agricultural data on an interactive map.

The main goal of AgriLens is to **increase transparency and trust** in agricultural information by providing a centralized, verified source of produce and farm data.

[SRS Document Link](https://docs.google.com/document/d/1fNGJRJD6vrpOMHT2-VAeqvZ3Kw0Ip0IhH9V8B-tNzVA/edit?fbclid=IwY2xjawQX-WRleHRuA2FlbQIxMQBzcnRjBmFwcF9pZAEwAAEeO8tnCyCtOJZFs9oqL9-CO-3GPWG101b8qiafLrJm_1MMLFEXHtflfC1CpLI_aem_OdrUg1zbrr74h3A1e0oK_w&tab=t.0)

# Team members:
1. Shahriar Zaman Samin - 23241029
2. Mansib Tasnim - 23201422
3. Dhrubo Imtiaz - 23201505
4. Anika Nawar - 23201114


## Features

- **Farmer Module**
  - **Farmer & Farm Profiles**: Register as a farmer, manage personal profile and multiple farms with location details.
  - **Produce Listings**: Create, edit, and delete listings with crop type, expected harvest date, availability window, and quantity.
  - **Inventory Tracking**: Update remaining quantities as produce is sold or reserved.
  - **History & Analytics**: View historical listings, prices, and quantities over time.
  - **Photo Uploads**: Attach images of crops for verification and quality assessment.
  - **Notifications**: Receive status updates when listings are approved or rejected.
  - **Agent Complaints**: Submit complaints against local verification agents with evidence.

- **Local Verification Agent Module**
  - **Submission Review**: Review produce listings submitted by farmers.
  - **Approval / Rejection Workflow**: Approve or reject listings with feedback.
  - **Quality Grading**: Assign quality grades (e.g. A/B/C or numeric scores).
  - **Fraud Flagging**: Flag suspicious or potentially fraudulent submissions.
  - **Regional Dashboard**: View activity only within assigned geographic regions.

- **Admin Module**
  - **System Dashboard**: Real-time overview of active users, new listings, verification activity, and platform usage.
  - **User Management**: Manage farmers and agents, search profiles, view activity, and delete accounts.
  - **Agent Assignment & Performance**: Assign agents to regions and monitor their workload and efficiency.
  - **Content Moderation**: Remove incorrect or harmful listings.
  - **Platform Announcements**: Broadcast notices and updates to targeted user groups or regions.
  - **Complaint Management**: View, track, and respond to complaints against agents (with threshold-based notifications).

- **Guest / Public Module**
  - **Geo-Tagged Farms**: View farm locations stored with geographic coordinates.
  - **Map-Based Search**: Search for produce by district, upazila, or radius.
  - **Market Insights**: Explore public statistics on crop distribution and production trends via an interactive map.

- **Customer Module**
  - **Account & Profile**:: Register/login, manage personal details, phone number, and delivery address.
  - **Marketplace Browsing**: Browse and filter approved produce listings by crop type, region, price, and availability.
  - **Ordering**: Place orders on live listings with quantity selection and delivery contact details.
  - **Order Tracking**: Monitor real-time order status from placement through to delivery with full status history.
  - **Notifications**: Receive in-app alerts on every order status change from confirmation to delivery.
  - **Complaints**: Submit and track complaints about orders or delivery issues with resolution status.

## System Architecture

AgriLens is a **web-based application** built on the **MERN stack**:

- **Frontend**
  - `React.js` (with HTML5, CSS3, JavaScript ES6+)
  - Responsive UI for desktop, tablet, and mobile
  - Role-based dashboards for Farmers, Agents, Admins, and Guests
  - Interactive map UI for farm locations and crop distribution

- **Backend**
  - `Node.js` runtime
  - `Express.js` RESTful API server
  - `JWT`-based authentication (for farmers, agents, and admins)
  - Role-Based Access Control (RBAC) for permissions

- **Database**
  - `MongoDB` for:
    - User accounts (farmers, agents, admins)
    - Farm profiles and locations
    - Produce listings and inventory
    - Verification records and quality grades
    - Complaints and system announcements

- **External Services**
  - Mapping API (e.g. **OpenStreetMap** or similar) for map visualization and geographic search
  - Optional email/notification service for approval/rejection and announcements

- **Communication**
  - Frontend ↔ Backend via **RESTful JSON APIs**
  - Secured over **HTTPS**

## Key Requirements (Summary)

- **Functional**
  - Farmer registration, profile and farm management
  - Produce listing lifecycle (create, edit, delete, verify)
  - Inventory updates and basic analytics for farmers
  - Agent verification workflow (review, approve/reject, grade, flag fraud)
  - Admin user & agent management, assignments, complaints, announcements
  - Public interactive map, search by region, and data insights

- **Non-Functional**
  - **Performance**: Reasonable response times under normal load and multiple concurrent users.
  - **Security**: Authentication, RBAC, HTTPS-secured communication.
  - **Reliability**: High availability, data integrity, controlled access.
  - **Usability**: Simple, intuitive UI suitable for users with basic technical knowledge, with clear feedback and notifications.

## Tools & Technologies

- **Frontend**
  - React.js
  - HTML5
  - CSS3
  - JavaScript (ES6+)

- **Backend**
  - Node.js
  - Express.js

- **Database**
  - MongoDB

- **Other**
  - JWT Authentication
  - OpenStreetMap / other mapping libraries
  - Cloud hosting platform (for deployment)
  - HTTPS for secure communication


### Prerequisites

- Node.js (LTS)
- npm or yarn
- MongoDB instance (local or cloud)
- Environment variables for:
  - MongoDB connection string
  - JWT secret
  - Mapping API keys (if required)
  - Frontend/backend URLs

### Clone the Repository

```bash
git clone https://github.com/somenomeno-on-it/AgriLens.git
cd Agrilens
```

### Backend Setup

```bash
cd agrilens-backend   
npm install
npm run dev  # or npm start
```

### Frontend Setup

```bash
cd agrilens-frontend  
npm install
npm run dev  # or npm start / npm run build
```

Then open the frontend URL in your browser (e.g. `http://localhost:3000`).

## Usage

- **Farmers**: Register/login, create farm profiles, add produce listings, upload images, monitor inventory, and view analytics.
- **Local Agents**: Review pending listings, approve/reject with feedback, assign quality grades, and flag suspicious activity.
- **Admins**: Oversee system metrics, manage users, assign agents, moderate content, handle complaints, and publish announcements.
- **Guests**: Browse the interactive map, search for produce by region, and explore high-level agricultural insights.
- **Customer**: Register/login, browse the marketplace, place orders on verified produce, track delivery status, and manage their profile and complaints 

## Class Diagram

The high-level class diagram for AgriLens is available here:  
[AgriLens Class Diagram](https://drive.google.com/file/d/1LSipEyFBFjIaCZE3v3WHis5P9lrvULNu/view?usp=sharing)
