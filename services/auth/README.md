# Auth Service

## User Roles & Management

### Roles
The system uses the following roles (defined in `src/enums/user-role.enum.ts`):
- `VIEWER` (Default for new sign-ups)
- `ADMIN`
- `EDITOR`

### Automatic Role Assignment
All new users registering via `/auth/register` are automatically assigned the `VIEWER` role.

### Admin Management
Admins can manage user roles via the API:
- `GET /users`: List all users.
- `PATCH /users/:id/role`: Update a user's role.
  - Body: `{ "role": "ADMIN" }`

### Handover / Setup
To promote a user to ADMIN (e.g., for Christopher), use the provided script:

```bash
# Run from services/auth directory
npx ts-node src/scripts/promote-admin.ts <email_address>
```

Example:
```bash
npx ts-node src/scripts/promote-admin.ts christopher@tyaga.com
```

This will directly update the database to set the user's role to `ADMIN`.
