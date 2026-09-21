# Restaurant ERP & POS SaaS System

A production-ready multi-tenant Restaurant ERP and POS SaaS system inspired by Petpooja, featuring a dual Next.js (frontend) and NestJS (backend) microservice architecture.

---

## Technical Stack

- **Frontend**: Next.js 14 (React + TypeScript)
- **Styling**: Tailwind CSS with dark mode defaults
- **State Management**: Zustand
- **Realtime**: Socket.IO client-server synchronization
- **Backend**: NestJS
- **ORM**: Prisma Client
- **Database**: PostgreSQL
- **Security**: JWT tokens + Role-Based Access Control (RBAC)
- **API Documentation**: Swagger UI
- **Containers**: Docker & Docker Compose

---

## Project Structure

```
restaurant-erp/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma   # PostgreSQL relations (21 models)
│   │   └── seed.ts         # Initial DB seeder
│   ├── src/
│   │   ├── auth/           # RBAC JWT Auth and guards
│   │   ├── complaint/      # Staff complaints & comments
│   │   ├── dashboard/      # Super Admin & Owner Stats
│   │   ├── inventory/      # Stock tracking & suppliers
│   │   ├── menu/           # Category, items & recipes
│   │   ├── order/          # POS KOTs & payment checkout
│   │   ├── prisma/         # PrismaService setup
│   │   ├── realtime/       # Socket.IO gateway
│   │   ├── restaurant/     # Outlets & dining tables
│   │   ├── settings/       # Settings configurations
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/  # Dashboard layouts and subpanels
│   │   │   ├── globals.css # Color variables & scrollbars
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx    # Login with Quick-Demo fills
│   │   └── store/
│   │       └── useStore.ts # Zustand global state
│   └── Dockerfile
├── docker-compose.yml
├── .env
└── README.md
```

---

## Port Mappings

- **Frontend Web App**: `http://localhost:3000`
- **Backend Rest API**: `http://localhost:4000`
- **Swagger Documentation**: `http://localhost:4000/api/docs`
- **PostgreSQL Database**: `localhost:5432`

---

## Quick Start (Docker)

To build and launch all microservices and databases, follow these steps:

1. Clone or navigate to the project directory:
   ```bash
   cd restaurant-erp
   ```

2. Build and start containers:
   ```bash
   docker-compose up --build -d
   ```

3. Initialize the Prisma Client, run migration, and seed the sample data:
   ```bash
   # Run from the host if NodeJS/Prisma is installed locally
   cd backend
   npm install
   npx prisma db push
   npx prisma db seed
   
   # OR run directly inside the Docker container
   docker exec -it erp-backend npx prisma db push
   docker exec -it erp-backend npx prisma db seed
   ```

4. Access the web app at `http://localhost:3000`.

---

## Quick-Demo Credentials

All test accounts share the same password: `password123`

| Panel Target | Email | Role |
| :--- | :--- | :--- |
| **Super Admin** | `admin@restaurant.com` | SUPER_ADMIN |
| **Owner** | `owner@restaurant.com` | OWNER |
| **Cashier Terminal** | `cashier@restaurant.com` | CASHIER |
| **Waiter Screen** | `waiter@restaurant.com` | WAITER |
| **Kitchen Panel** | `kitchen@restaurant.com` | KITCHEN |
| **Inventory Store** | `inventory@restaurant.com` | INVENTORY_STAFF |
| **Menu Settings** | `menu@restaurant.com` | MENU_MANAGER |
