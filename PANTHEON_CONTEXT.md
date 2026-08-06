# PANTHEON_CONTEXT.md

# Pantheon

> AI-Powered Collaborative Game Production & Talent Management Platform

Version: 1.0.0

---

# Purpose

Pantheon is a full-stack SaaS platform built specifically for the game development industry.

Its purpose is to unify the fragmented workflow of game development into a single platform where developers, artists, designers, writers, composers, producers, and studios can collaborate throughout the entire production lifecycle.

Pantheon is NOT:

- A game engine
- A game publishing platform
- A source control platform
- A replacement for Discord, GitHub or Trello

Pantheon is a collaboration and production management platform that integrates and organizes the complete game production workflow.

---

# Vision

Create the definitive operating system for game development teams.

Pantheon should become the place where game projects begin, teams are built, production is managed, and progress is tracked.

---

# Core Philosophy

Every feature must answer at least one of these questions:

• Does it help developers collaborate?
• Does it improve project organization?
• Does it reduce production friction?
• Does it improve talent discovery?
• Does it improve production visibility?

If the answer is no, the feature probably doesn't belong.

---

# AI Philosophy

Artificial Intelligence is an assistant.

It is NOT a replacement for people.

The AI never performs work autonomously.

The AI assists users by:

- Recommending talent
- Extracting skills from resumes
- Analyzing project health
- Predicting production risks
- Recommending missing roles
- Organizing information
- Summarizing activity
- Providing insights

Final decisions always belong to humans.

---

# User Model

There are only two authorization roles.

User

Administrator

Every game development professional registers as a User.

Examples include:

- Programmer
- Artist
- UI Designer
- Level Designer
- Writer
- Music Composer
- Sound Designer
- QA Tester
- Producer
- Technical Artist

These are NOT authorization roles.

They are profile attributes.

A user becomes a Founder by creating a project.

This is represented using profile metadata rather than a separate authentication role.

---

# Semester Roadmap

## Semester 1

Authentication

User Profiles

Resume Upload

Portfolio Upload

AI Skill Extraction

Public Project Discovery

Project Creation

Founder Workflow

Recruitment

Invitations

Task Management

Basic Notifications

---

## Semester 2

Asset Management

Project Documentation

Advanced Analytics

AI Project Health

Activity Timeline

Integrations

Studio Workspaces

Advanced Search

Messaging

Real-time Collaboration

---

# Technology Stack

Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- Zustand
- React Hook Form
- Zod

Backend

- NestJS
- Prisma
- PostgreSQL
- JWT
- Passport
- bcrypt
- Swagger
- Pino Logger

Infrastructure

- pnpm Monorepo
- Railway
- Neon PostgreSQL
- Vercel

---

# Repository Structure

apps/

api/

web/

packages/

docs/

.agents/

scripts/

infrastructure/

---

# Backend Architecture

Controllers

↓

Services

↓

Repositories

↓

Prisma

↓

PostgreSQL

Rules

Controllers contain no business logic.

Business logic belongs inside services.

Services never access HTTP objects.

Repositories isolate database access.

Always use DTOs.

Always validate requests.

Never access Prisma directly from controllers.

---

# Frontend Architecture

Pages

↓

Layouts

↓

Features

↓

Components

↓

Hooks

↓

Services

↓

API

Reusable components should be preferred.

Business logic belongs inside hooks or services.

Pages should remain lightweight.

---

# Design Philosophy

Pantheon should look premium.

Inspired by:

- Linear
- Stripe
- Vercel
- Framer
- Raycast
- Notion

Characteristics

Dark-first

Minimal

Modern

Professional

Spacious

Engineering aesthetic

Fast

Accessible

Consistent

Avoid unnecessary decoration.

Avoid visual clutter.

Whitespace is a feature.

---

# Branding

Primary Color

Pantheon Gold

#D4AF37

Primary Background

Near Black

Typography

Modern geometric sans-serif.

Rounded corners

16px

Spacing

8px spacing system.

Icons

Lucide Icons

Animations

Subtle

Fast

Purposeful

Never distracting.

---

# UI Principles

Always use reusable components.

Never duplicate UI.

Maintain consistent spacing.

Maintain consistent typography.

Support responsive layouts.

Desktop first.

Fully responsive.

Accessibility is mandatory.

---

# Coding Standards

Strict TypeScript.

No "any".

Prefer interfaces.

Prefer composition.

Dependency Injection.

Meaningful naming.

Small reusable functions.

Keep files modular.

Avoid deeply nested logic.

Never leave dead code.

Never ignore lint errors.

---

# Naming Conventions

Components

PascalCase

Hooks

useCamelCase

Variables

camelCase

Constants

UPPER_SNAKE_CASE

Interfaces

PascalCase

Enums

PascalCase

Files

Match exported component names.

---

# Database Rules

UUID primary keys.

Always include

createdAt

updatedAt

Soft delete where appropriate.

Foreign keys must be explicit.

Indexes for searchable fields.

Never bypass Prisma.

Always use migrations.

---

# API Standards

RESTful APIs.

Consistent response structure.

Meaningful HTTP status codes.

Input validation required.

Swagger documentation required.

Authentication required where appropriate.

---

# Authentication

JWT

Refresh Tokens

Password hashing using bcrypt.

Never expose sensitive fields.

Never trust frontend validation.

---

# Security

Validate all inputs.

Escape user-generated content.

Never expose secrets.

Never commit .env files.

Use least privilege.

Sanitize uploads.

Rate limiting where required.

---

# Logging

Use Pino.

Meaningful logs.

Never log passwords.

Never log tokens.

---

# Testing

Unit tests.

Integration tests.

Reusable test utilities.

Mock external services.

---

# Git Workflow

Conventional commits.

feat:

fix:

docs:

refactor:

style:

test:

build:

chore:

Never commit broken code.

---

# Performance Goals

Reusable components.

Lazy loading.

Code splitting.

Optimized bundle size.

Efficient rendering.

Avoid unnecessary re-renders.

---

# AI Development Rules

Before implementing any feature:

Understand existing architecture.

Reuse existing components.

Avoid duplication.

Follow established naming conventions.

Maintain consistency.

If uncertain:

Ask instead of assuming.

Never invent architecture.

Never create parallel implementations.

Always integrate into the existing project structure.

---

# Things Pantheon Must Never Become

Do not turn Pantheon into:

A social media platform

A generic project management tool

A game marketplace

A game launcher

A game engine

An AI game generator

A crypto platform

A blockchain project

A generic freelancer website

Everything must reinforce the mission of collaborative game production.

---

# Long-Term Goal

Pantheon should eventually become the central workspace for professional game development teams by combining collaboration, production management, talent discovery, project intelligence, and AI-powered insights into one cohesive platform.

Every new feature must align with this vision.