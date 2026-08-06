---
trigger: always_on
---

Backend

NestJS

Architecture

Controller
↓

Service
↓

Repository

↓

Prisma

Business logic belongs inside services.

Controllers must remain thin.

Never access Prisma directly from controllers.