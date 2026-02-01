# Tyaga

## System Overview
Tyaga is a comprehensive system composed of 14 microservices. This repository hosts the source code for the entire platform, structured as a monorepo.

## Phase 1: Foundation
The initial phase focuses on the core infrastructure and essential services:

1.  **Auth Service**: Identity and Access Management.
2.  **API Gateway**: Central entry point and routing.
3.  **Brand Management**: Handling brand entities and metadata.
4.  **Rights Tracking**: Managing intellectual property rights and usage.

## Directory Structure

*   `services/`: Individual microservices.
    *   `auth/`
    *   `api-gateway/`
    *   `brand-management/`
    *   `rights-tracking/`
*   `shared/`: Shared libraries and utilities.
*   `infra/`: Infrastructure configuration (Docker, Nginx, Kubernetes).
