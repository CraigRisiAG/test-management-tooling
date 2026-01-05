# Complete Authentication Setup Guide

## Overview

This guide covers the complete setup of the authentication system including:
- Database migrations
- OAuth providers (Google, Microsoft, Apple, GitHub, GitLab)
- SAML SSO (Azure AD, Okta, OneLogin, Ping, ADFS)
- LDAP/Active Directory
- API Keys
- MFA setup

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Environment Configuration](#environment-configuration)
4. [OAuth Setup](#oauth-setup)
5. [SAML Setup](#saml-setup)
6. [LDAP Setup](#ldap-setup)
7. [Running Tests](#running-tests)
8. [Deployment Checklist](#deployment-checklist)

---

## Prerequisites

### Required Software
- Node.js 18+
- npm 8+
- PostgreSQL 12+ (or MySQL 8+)
- Redis 6+ (for production sessions)

### Install Dependencies
```bash
npm install bcrypt jsonwebtoken speakeasy qrcode
npm install passport passport-google-oauth20 passport-microsoft passport-github2 passport-gitlab2 passport-saml
npm install ldapjs
npm install express cors helmet
npm install --save-dev @types/bcrypt @types/jsonwebtoken @types/passport @types/express jest supertest @types/jest
```

---

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE testmgr_auth;

# Create user
CREATE USER testmgr_user WITH PASSWORD 'secure_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE testmgr_auth TO testmgr_user;
```

### 2. Run Migrations

```bash
# Migration 1: Create authentication tables
psql -U testmgr_user -d testmgr_auth -f src/migrations/001_create_auth_tables.sql

# Migration 2: Create roles and permissions
psql -U testmgr_user -d testmgr_auth -f src/migrations/002_create_roles_permissions.sql
```

### 3. Verify Tables

```bash
psql -U testmgr_user -d testmgr_auth

# List all tables
\dt

# Verify users table
\d users

# Verify oauth_connections table
\d oauth_connections

# Verify api_keys table
\d api_keys
```

### Expected Tables After Migration:
- `users` - User accounts with auth fields
- `password_history` - Password change history
- `oauth_connections` - OAuth provider connections
- `saml_sessions` - SAML session data
- `mfa_backup_codes` - MFA backup codes
- `api_keys` - API key management
- `password_reset_tokens` - Password reset tokens
- `email_verification_tokens` - Email verification tokens
- `trusted_devices` - Trusted device management
- `otp_codes` - One-time password codes
- `security_audit_log` - Audit trail
- `api_key_rate_limits` - Rate limiting data
- `sessions` - Session management
- `ldap_sync_history` - LDAP sync tracking
- `roles` - User roles
- `permissions` - Permission definitions
- `role_permissions` - Role-permission mapping
- `user_roles` - User-role assignment

---

## Environment Configuration

### Create .env File

```bash
cp .env.example .env
```

### Edit .env with These Values

#### Database
```bash
DATABASE_URL=postgresql://testmgr_user:secure_password_here@localhost:5432/testmgr_auth
```

#### JWT Configuration
```bash
JWT_SECRET=your-super-secret-key-change-in-production-min-32-chars
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
```

#### Password Policy
```bash
PASSWORD_MIN_LENGTH=12
PASSWORD_EXPIRY_DAYS=90
PASSWORD_HISTORY_LIMIT=5
```

#### MFA Configuration
```bash
MFA_ISSUER=TestMgr
MFA_BACKUP_CODES=10
MFA_TOTP_WINDOW=2
```

#### Rate Limiting
```bash
RATE_LIMIT_LOGIN_ATTEMPTS=5
RATE_LIMIT_LOGIN_WINDOW_MINUTES=15
RATE_LIMIT_API_DEFAULT=1000
RATE_LIMIT_API_WINDOW_HOURS=1
```

---

## OAuth Setup

### Google OAuth

#### Step 1: Create Google Cloud Project
```
1. Go to https://console.cloud.google.com/
2. Create a new project named "TestMgr"
3. Enable APIs:
   - Click "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"
4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Add Authorized redirect URIs:
     * http://localhost:4001/api/auth/oauth/google/callback
     * https://yourdomain.com/api/auth/oauth/google/callback
   - Copy Client ID and Client Secret
```

#### Step 2: Add to .env
```bash
OAUTH_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
OAUTH_GOOGLE_CLIENT_SECRET=your-client-secret
OAUTH_GOOGLE_CALLBACK_URL=http://localhost:4001/api/auth/oauth/google/callback
```

---

### Microsoft / Azure AD OAuth

#### Step 1: Register Application in Azure
```
1. Go to https://portal.azure.com/
2. Navigate to Azure Active Directory
3. Click "App registrations" → "New registration"
4. Fill in:
   - Name: TestMgr
   - Supported account types: Accounts in any organizational directory
5. After creation, copy:
   - Application (client) ID
   - Directory (tenant) ID
6. Create Client Secret:
   - Go to "Certificates & secrets"
   - Click "New client secret"
   - Copy the secret value
7. Configure redirect URIs:
   - Go to "Authentication"
   - Add "Web" platform with URIs:
     * http://localhost:4001/api/auth/oauth/microsoft/callback
     * https://yourdomain.com/api/auth/oauth/microsoft/callback
```

#### Step 2: Add to .env
```bash
OAUTH_MICROSOFT_CLIENT_ID=your-client-id
OAUTH_MICROSOFT_CLIENT_SECRET=your-client-secret
OAUTH_MICROSOFT_TENANT_ID=your-tenant-id
OAUTH_MICROSOFT_CALLBACK_URL=http://localhost:4001/api/auth/oauth/microsoft/callback
```

---

### Apple Sign In

#### Step 1: Get Apple Developer Credentials
```
1. Go to https://developer.apple.com/
2. Sign in with your Apple Developer account
3. Go to "Certificates, Identifiers & Profiles"
4. Select "Identifiers" → "App IDs"
5. Create or select existing App ID
6. Enable "Sign in with Apple" capability
7. Go to "Keys"
8. Create a new key
9. Enable "Sign in with Apple" and check "Email and name access"
10. Download the key (save safely)
11. Note your:
    - Team ID (10-character code)
    - Key ID (from the downloaded key)
    - App ID
```

#### Step 2: Add to .env
```bash
OAUTH_APPLE_CLIENT_ID=com.yourcompany.testmgr
OAUTH_APPLE_TEAM_ID=ABCDE12345
OAUTH_APPLE_KEY_ID=ABC123DEF4
OAUTH_APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
OAUTH_APPLE_CALLBACK_URL=https://yourdomain.com/api/auth/oauth/apple/callback

# Note: Apple requires HTTPS in production
# For local development, use ngrok:
# ngrok http 4001
# Then use the ngrok URL in Apple Developer console
```

---

### GitHub OAuth

#### Step 1: Register OAuth Application
```
1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - Application name: TestMgr
   - Homepage URL: http://localhost:4001
   - Authorization callback URL: http://localhost:4001/api/auth/oauth/github/callback
4. Copy:
   - Client ID
   - Client Secret
```

#### Step 2: Add to .env
```bash
OAUTH_GITHUB_CLIENT_ID=your-client-id
OAUTH_GITHUB_CLIENT_SECRET=your-client-secret
OAUTH_GITHUB_CALLBACK_URL=http://localhost:4001/api/auth/oauth/github/callback
```

---

### GitLab OAuth

#### Step 1: Register OAuth Application
```
1. Go to https://gitlab.com/-/profile/applications (or your GitLab instance)
2. Click "Add new application"
3. Fill in:
   - Name: TestMgr
   - Redirect URI: http://localhost:4001/api/auth/oauth/gitlab/callback
   - Scopes: read_user, read_repository, write_repository
4. Copy:
   - Application ID
   - Secret
```

#### Step 2: Add to .env
```bash
OAUTH_GITLAB_CLIENT_ID=your-client-id
OAUTH_GITLAB_CLIENT_SECRET=your-client-secret
OAUTH_GITLAB_CALLBACK_URL=http://localhost:4001/api/auth/oauth/gitlab/callback
```

---

## SAML Setup

### Azure AD SAML Configuration

#### Step 1: Create Enterprise Application
```
1. Go to https://portal.azure.com/
2. Navigate to Azure Active Directory → Enterprise applications
3. Click "New application" → "Create your own application"
4. Choose "Integrate any other application you don't find in the gallery"
5. Enter: TestMgr
```

#### Step 2: Set Up SAML
```
1. Under "Manage", click "Single sign-on"
2. Choose "SAML"
3. In "Basic SAML Configuration":
   - Identifier (Entity ID): testmgr-app
   - Reply URL (Assertion Consumer Service URL): https://yourdomain.com/api/auth/saml/acs
   - Sign on URL: https://yourdomain.com/login
4. Copy the Certificate (Base64) from "SAML Signing Certificate"
4. Copy SAML metadata URL
```

#### Step 3: Add to .env
```bash
SAML_ENABLED=true
SAML_PROVIDER=azure
SAML_AZURE_ENTRY_POINT=https://login.microsoftonline.com/{tenant-id}/saml2
SAML_AZURE_CERT=-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----
SAML_CALLBACK_URL=https://yourdomain.com/api/auth/saml/acs
SAML_ISSUER=testmgr-app
```

---

### Okta SAML Configuration

#### Step 1: Create SAML App
```
1. Go to your Okta Admin Console
2. Applications → Create App Integration
3. Choose "SAML 2.0"
4. Fill in:
   - App name: TestMgr
   - Single sign on URL: https://yourdomain.com/api/auth/saml/acs
   - Audience URI (SP Entity ID): testmgr-app
5. Attribute mappings:
   - Email: user.email
   - First Name: user.firstName
   - Last Name: user.lastName
6. Download certificate and metadata
```

#### Step 2: Add to .env
```bash
SAML_ENABLED=true
SAML_PROVIDER=okta
SAML_OKTA_ENTRY_POINT=https://{okta-domain}.okta.com/app/...
SAML_OKTA_CERT=-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----
```

---

### OneLogin SAML Configuration

#### Step 1: Create SAML App
```
1. Go to OneLogin Admin Console
2. Applications → Add App
3. Search "SAML"
4. Select "Custom SAML"
5. Fill in:
   - SAML Consumer URL (ACS URL): https://yourdomain.com/api/auth/saml/acs
   - SAML Entity ID: testmgr-app
6. Download certificate and metadata
```

#### Step 2: Add to .env
```bash
SAML_ENABLED=true
SAML_PROVIDER=onelogin
SAML_ONELOGIN_ENTRY_POINT=https://{onelogin-domain}.onelogin.com/trust/saml2/...
SAML_ONELOGIN_CERT=-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----
```

---

### Ping Identity SAML Configuration

#### Step 1: Create SAML Application
```
1. Go to Ping Admin Console
2. Applications → Create Application
3. Choose "SAML Application"
4. Fill in URLs:
   - Assertion Consumer Service (ACS) URL: https://yourdomain.com/api/auth/saml/acs
   - SP Entity ID: testmgr-app
5. Export metadata
```

#### Step 2: Add to .env
```bash
SAML_ENABLED=true
SAML_PROVIDER=ping
SAML_PING_ENTRY_POINT=https://{environment-id}.pingone.com/sso
SAML_PING_CERT=-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----
```

---

### ADFS SAML Configuration

#### Step 1: Configure ADFS
```
1. Open ADFS Management Console on ADFS server
2. Actions → Add Relying Party Trust
3. Enter data about relying party manually
4. Identifiers:
   - Relying party trust identifier: testmgr-app
   - Endpoints:
     * SAML Assertion Consumer Service: https://yourdomain.com/api/auth/saml/acs
5. Export metadata from ADFS:
   - https://{adfs-server}/FederationMetadata/2007-06/FederationMetadata.xml
```

#### Step 2: Add to .env
```bash
SAML_ENABLED=true
SAML_PROVIDER=adfs
SAML_ADFS_ENTRY_POINT=https://{adfs-server}/adfs/ls/idpinitiatedsignon.aspx
SAML_ADFS_CERT=-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----
```

---

## LDAP Setup

### Active Directory Configuration

#### Step 1: Prepare AD Server
```
1. Ensure LDAP port (389) or LDAPS (636) is open
2. Create a service account for LDAP queries:
   - Username: testmgr_ldap_service
   - Password: secure_ldap_service_password
   - Grant minimal permissions (read-only)
3. Test connectivity:
   ldapsearch -H ldaps://ldap.example.com:636 -D "cn=testmgr_ldap_service,cn=users,dc=example,dc=com" -W
```

#### Step 2: Add to .env
```bash
LDAP_ENABLED=true
LDAP_URL=ldaps://ldap.example.com:636
LDAP_BIND_DN=cn=testmgr_ldap_service,cn=users,dc=example,dc=com
LDAP_BIND_PASSWORD=secure_ldap_service_password
LDAP_BASE_DN=cn=users,dc=example,dc=com
LDAP_USERNAME_ATTRIBUTE=sAMAccountName
LDAP_EMAIL_ATTRIBUTE=mail
LDAP_GROUP_ATTRIBUTE=memberOf
LDAP_TLS_ENABLED=true
LDAP_TLS_CERT_PATH=/path/to/ldap-cert.pem

# Optional: Group mapping
LDAP_ADMIN_GROUPS=CN=TestMgr Admins,CN=groups,DC=example,DC=com
LDAP_USER_GROUPS=CN=TestMgr Users,CN=groups,DC=example,DC=com
```

#### Step 3: Test LDAP Configuration
```bash
# Test connection
npm run test:ldap

# Sync users
npm run ldap:sync

# View sync history
npm run ldap:history
```

---

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Integration Tests Only
```bash
npm test -- auth.integration.test.ts
```

### Run Specific Test Suite
```bash
npm test -- auth.integration.test.ts --testNamePattern="Local Password Authentication"
```

### Run with Coverage
```bash
npm test -- --coverage
```

### Run OAuth Tests
```bash
npm test -- oauth.test.ts
```

### Run SAML Tests
```bash
npm test -- saml.test.ts
```

### Run LDAP Tests
```bash
npm test -- ldap.test.ts
```

### Run MFA Tests
```bash
npm test -- mfa.test.ts
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] OAuth apps created for all providers
- [ ] SAML metadata exchanged with IdP
- [ ] LDAP service account created
- [ ] Certificates and keys in secure vault
- [ ] Rate limiting configured appropriately
- [ ] Session storage (Redis) configured
- [ ] Email service configured
- [ ] SMS provider configured (for SMS OTP)

### Testing

- [ ] Unit tests passing (100% coverage for auth modules)
- [ ] Integration tests passing
- [ ] OAuth flow tested with each provider
- [ ] SAML SSO tested with IdP
- [ ] LDAP authentication tested
- [ ] MFA enrollment and verification tested
- [ ] API key generation and validation tested
- [ ] Rate limiting verified
- [ ] Account lockout tested
- [ ] Password reset tested

### Security

- [ ] All secrets in environment variables (not in code)
- [ ] HTTPS enabled in production
- [ ] CORS configured appropriately
- [ ] Security headers configured (helmet.js)
- [ ] JWT signing key is secure (min 32 characters)
- [ ] Password hashing cost factor is 12+ (bcrypt)
- [ ] Token expiration times are appropriate
- [ ] Rate limiting thresholds set appropriately
- [ ] Audit logging enabled
- [ ] Suspicious login detection enabled

### Infrastructure

- [ ] PostgreSQL database set up with backups
- [ ] Redis configured for session storage
- [ ] Application monitoring configured
- [ ] Error tracking (Sentry/etc) configured
- [ ] Email service configured and tested
- [ ] SMS service configured (if needed)
- [ ] Load balancer configured (if applicable)
- [ ] SSL/TLS certificates installed

### Documentation

- [ ] API documentation updated
- [ ] User guides for MFA enrollment created
- [ ] OAuth provider setup documented
- [ ] SAML configuration documented for admins
- [ ] LDAP setup guide created
- [ ] Troubleshooting guide created
- [ ] Runbooks created for common issues

### Post-Deployment

- [ ] Monitor authentication metrics
- [ ] Track failed login attempts
- [ ] Review audit logs daily
- [ ] Test all OAuth providers in production
- [ ] Verify SAML SSO works in production
- [ ] Check email delivery for password resets
- [ ] Monitor API key usage
- [ ] Review and rotate secrets regularly

---

## Troubleshooting

### OAuth Issues

**Problem**: "Invalid client" error
- Solution: Verify client ID and secret in .env
- Check that callback URL matches exactly in OAuth provider settings

**Problem**: "Redirect URI mismatch"
- Solution: Ensure callback URL registered in OAuth provider matches exactly
- No trailing slashes or protocol mismatches

### SAML Issues

**Problem**: "SAML assertion validation failed"
- Solution: Check certificate expiration
- Verify that clock skew is within acceptable range
- Ensure response is signed if wantAuthnResponseSigned is true

**Problem**: "Cannot find attribute"
- Solution: Check attribute mapping in SAML config
- Verify attribute names match your IdP configuration

### LDAP Issues

**Problem**: "Cannot connect to LDAP server"
- Solution: Verify LDAP server is running and accessible
- Check firewall rules (389 for LDAP, 636 for LDAPS)
- Test with: `ldapsearch -H ldaps://server:636 -x`

**Problem**: "Invalid bind credentials"
- Solution: Verify service account DN is correct
- Check password is correct
- Ensure service account has read permissions

### General Issues

**Problem**: "Token verification failed"
- Solution: Check JWT_SECRET environment variable is set
- Verify token hasn't expired

**Problem**: "Rate limiting too strict"
- Solution: Adjust RATE_LIMIT_LOGIN_ATTEMPTS
- Increase RATE_LIMIT_LOGIN_WINDOW_MINUTES

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs in `logs/` directory
3. Check security audit log in database
4. Run tests to identify specific failure point

---

**Last Updated**: January 5, 2026  
**Version**: 1.0.0  
**Status**: Production Ready
