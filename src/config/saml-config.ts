/**
 * @file saml-config.ts
 * @description SAML 2.0 configuration for enterprise SSO
 */

export interface SAMLConfig {
  entryPoint: string;
  issuer: string;
  cert?: string;
  privateKey?: string;
  callbackUrl: string;
  decryptionPvk?: string;
  identifierFormat?: string;
  wantAssertionsSigned?: boolean;
  wantAuthnResponseSigned?: boolean;
  signMetadata?: boolean;
  requestIdAttributeName?: string;
  skipRequestCompression?: boolean;
  nameIdentifierFormat?: string;
  acceptedClockSkewMs?: number;
}

/**
 * Azure AD SAML Configuration Template
 * 
 * Steps to configure:
 * 1. Go to https://portal.azure.com/
 * 2. Azure Active Directory → Enterprise applications → New application
 * 3. Create or integrate a SAML application
 * 4. Fill in "Basic SAML Configuration":
 *    - Identifier (Entity ID): testmgr-app
 *    - Reply URL (Assertion Consumer Service URL): https://yourdomain.com/api/auth/saml/acs
 *    - Sign on URL: https://yourdomain.com/api/auth/saml/login
 * 5. Download "Federation Metadata XML"
 * 6. Extract values below
 */
export const AZURE_AD_SAML_CONFIG: SAMLConfig = {
  entryPoint: process.env.SAML_AZURE_ENTRY_POINT || 'https://login.microsoftonline.com/{tenant-id}/saml2',
  issuer: 'testmgr-app',
  cert: process.env.SAML_AZURE_CERT,
  callbackUrl: process.env.SAML_CALLBACK_URL || 'https://yourdomain.com/api/auth/saml/acs',
  wantAssertionsSigned: true,
  wantAuthnResponseSigned: true,
  identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
};

/**
 * Okta SAML Configuration Template
 * 
 * Steps to configure:
 * 1. Go to your Okta admin console
 * 2. Applications → Create App Integration
 * 3. Choose "SAML 2.0"
 * 4. App settings:
 *    - App name: TestMgr
 *    - Single sign on URL: https://yourdomain.com/api/auth/saml/acs
 *    - Audience URI (SP Entity ID): testmgr-app
 * 5. Download metadata
 * 6. Extract identity provider metadata
 */
export const OKTA_SAML_CONFIG: SAMLConfig = {
  entryPoint: process.env.SAML_OKTA_ENTRY_POINT || 'https://{oktadomain}.okta.com/app/amazonsaml/exk/sso/saml',
  issuer: 'testmgr-app',
  cert: process.env.SAML_OKTA_CERT,
  callbackUrl: process.env.SAML_CALLBACK_URL || 'https://yourdomain.com/api/auth/saml/acs',
  wantAssertionsSigned: true,
  identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
};

/**
 * OneLogin SAML Configuration Template
 * 
 * Steps to configure:
 * 1. Go to your OneLogin admin console
 * 2. Applications → Add App
 * 3. Search for "SAML" or create "Custom SAML"
 * 4. Configuration:
 *    - SAML Consumer URL (ACS URL): https://yourdomain.com/api/auth/saml/acs
 *    - SAML Entity ID: testmgr-app
 *    - SAML Issuer URL: testmgr-app
 * 5. Download certificate and metadata
 */
export const ONELOGIN_SAML_CONFIG: SAMLConfig = {
  entryPoint: process.env.SAML_ONELOGIN_ENTRY_POINT || 'https://{OneLogin-Domain}.onelogin.com/trust/saml2/http-post/sso/{app-id}',
  issuer: 'testmgr-app',
  cert: process.env.SAML_ONELOGIN_CERT,
  callbackUrl: process.env.SAML_CALLBACK_URL || 'https://yourdomain.com/api/auth/saml/acs',
  wantAssertionsSigned: true,
  identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
};

/**
 * Ping Identity SAML Configuration Template
 * 
 * Steps to configure:
 * 1. Go to Ping Admin Console
 * 2. Applications → Create Application
 * 3. Choose "SAML Application"
 * 4. Enter application details
 * 5. Configure URLs:
 *    - Assertion Consumer Service (ACS) URL: https://yourdomain.com/api/auth/saml/acs
 *    - SP Entity ID: testmgr-app
 * 6. Export metadata
 */
export const PING_IDENTITY_SAML_CONFIG: SAMLConfig = {
  entryPoint: process.env.SAML_PING_ENTRY_POINT || 'https://{environment-id}.pingone.com/sso',
  issuer: 'testmgr-app',
  cert: process.env.SAML_PING_CERT,
  callbackUrl: process.env.SAML_CALLBACK_URL || 'https://yourdomain.com/api/auth/saml/acs',
  wantAssertionsSigned: true,
  identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
};

/**
 * ADFS (Active Directory Federation Services) SAML Configuration Template
 * 
 * Steps to configure:
 * 1. Open ADFS Management Console
 * 2. Actions → Add Relying Party Trust
 * 3. Data source: "Enter data about the relying party manually"
 * 4. Set identifiers:
 *    - Identifier: testmgr-app
 * 5. Configure endpoints:
 *    - SAML Assertion Consumer Service: https://yourdomain.com/api/auth/saml/acs
 * 6. Export metadata from ADFS: https://{adfs-server}/FederationMetadata/2007-06/FederationMetadata.xml
 */
export const ADFS_SAML_CONFIG: SAMLConfig = {
  entryPoint: process.env.SAML_ADFS_ENTRY_POINT || 'https://{adfs-server}/adfs/ls/idpinitiatedsignon.aspx',
  issuer: 'testmgr-app',
  cert: process.env.SAML_ADFS_CERT,
  callbackUrl: process.env.SAML_CALLBACK_URL || 'https://yourdomain.com/api/auth/saml/acs',
  wantAssertionsSigned: true,
  identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
};

/**
 * Get SAML configuration based on provider
 */
export function getSAMLConfig(provider: string): SAMLConfig | null {
  switch (provider.toLowerCase()) {
    case 'azure':
    case 'azure-ad':
      return AZURE_AD_SAML_CONFIG;
    case 'okta':
      return OKTA_SAML_CONFIG;
    case 'onelogin':
      return ONELOGIN_SAML_CONFIG;
    case 'ping':
    case 'ping-identity':
      return PING_IDENTITY_SAML_CONFIG;
    case 'adfs':
      return ADFS_SAML_CONFIG;
    default:
      return null;
  }
}

/**
 * Validate SAML configuration
 */
export function validateSAMLConfig(config: SAMLConfig, provider: string): string[] {
  const errors: string[] = [];

  if (!config.entryPoint) {
    errors.push(`${provider}: Missing SAML entry point (IdP SSO URL)`);
  }

  if (!config.issuer) {
    errors.push(`${provider}: Missing SAML issuer (Entity ID)`);
  }

  if (!config.cert) {
    errors.push(`${provider}: Missing SAML certificate (IdP public cert)`);
  }

  if (!config.callbackUrl) {
    errors.push(`${provider}: Missing SAML callback URL (Assertion Consumer Service URL)`);
  }

  return errors;
}

/**
 * Common SAML attribute mappings
 */
export const SAML_ATTRIBUTE_MAPPINGS = {
  email: ['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress', 'email', 'mail'],
  firstName: [
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
    'firstName',
    'givenName',
    'name',
  ],
  lastName: [
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
    'lastName',
    'surname',
    'sn',
  ],
  groups: [
    'http://schemas.xmlsoap.org/claims/Group',
    'groups',
    'memberOf',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/groups',
  ],
  department: [
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/organizationalunit',
    'department',
    'ou',
  ],
  role: ['http://schemas.microsoft.com/ws/2008/06/identity/claims/role', 'role', 'title'],
  phone: ['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/mobilephone', 'phone', 'telephoneNumber'],
  upn: ['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn', 'upn'],
};

/**
 * Environment variables template for .env file
 */
export const ENV_TEMPLATE = `
# SAML Configuration
SAML_ENABLED=true
SAML_PROVIDER=azure # azure, okta, onelogin, ping, adfs

# Azure AD
SAML_AZURE_ENTRY_POINT=https://login.microsoftonline.com/{tenant-id}/saml2
SAML_AZURE_CERT=-----BEGIN CERTIFICATE-----\\n...\\n-----END CERTIFICATE-----

# Okta
SAML_OKTA_ENTRY_POINT=https://{okta-domain}.okta.com/app/...
SAML_OKTA_CERT=-----BEGIN CERTIFICATE-----\\n...\\n-----END CERTIFICATE-----

# OneLogin
SAML_ONELOGIN_ENTRY_POINT=https://{onelogin-domain}.onelogin.com/trust/saml2/http-post/sso/{app-id}
SAML_ONELOGIN_CERT=-----BEGIN CERTIFICATE-----\\n...\\n-----END CERTIFICATE-----

# Ping Identity
SAML_PING_ENTRY_POINT=https://{environment-id}.pingone.com/sso
SAML_PING_CERT=-----BEGIN CERTIFICATE-----\\n...\\n-----END CERTIFICATE-----

# ADFS
SAML_ADFS_ENTRY_POINT=https://{adfs-server}/adfs/ls/idpinitiatedsignon.aspx
SAML_ADFS_CERT=-----BEGIN CERTIFICATE-----\\n...\\n-----END CERTIFICATE-----

# Common SAML
SAML_CALLBACK_URL=https://yourdomain.com/api/auth/saml/acs
SAML_ISSUER=testmgr-app
SAML_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----
`;
