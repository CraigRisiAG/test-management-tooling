/**
 * @module saml
 * @description SAML 2.0 integration for enterprise SSO
 */

import { Strategy as SamlStrategy, Profile, VerifiedCallback } from 'passport-saml';
import * as fs from 'fs';
import * as crypto from 'crypto';
import type { User } from '../../types';

/**
 * SAML Configuration
 */
export interface SAMLConfig {
  entryPoint: string;           // IdP SSO URL
  issuer: string;               // SP Entity ID
  callbackUrl: string;          // SP ACS URL
  cert: string;                 // IdP certificate
  privateCert?: string;         // SP private key (for signing)
  signatureAlgorithm?: string;  // rsa-sha256
  digestAlgorithm?: string;     // sha256
  wantAssertionsSigned?: boolean;
  wantAuthnResponseSigned?: boolean;
}

/**
 * SAML Attribute Mapping
 */
export interface SAMLAttributeMapping {
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  groups?: string;
  department?: string;
  title?: string;
}

/**
 * SAML Profile
 */
export interface SAMLProfile {
  nameID: string;
  nameIDFormat: string;
  sessionIndex?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  groups?: string[];
  attributes: Record<string, any>;
}

/**
 * SAML Session
 */
export interface SAMLSession {
  id: string;
  userId: string;
  nameID: string;
  sessionIndex?: string;
  assertion: string;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Default SAML attribute mapping
 */
export const DEFAULT_SAML_ATTRIBUTES: SAMLAttributeMapping = {
  email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
  firstName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
  lastName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
  displayName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
  groups: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/groups',
};

/**
 * Configure SAML Strategy
 */
export function configureSAMLStrategy(
  config: SAMLConfig,
  attributeMapping: SAMLAttributeMapping = DEFAULT_SAML_ATTRIBUTES,
  onAuthenticate: (profile: SAMLProfile) => Promise<User>
): SamlStrategy {
  return new SamlStrategy(
    {
      entryPoint: config.entryPoint,
      issuer: config.issuer,
      callbackUrl: config.callbackUrl,
      cert: config.cert,
      privateCert: config.privateCert,
      signatureAlgorithm: config.signatureAlgorithm || 'sha256',
      digestAlgorithm: config.digestAlgorithm || 'sha256',
      wantAssertionsSigned: config.wantAssertionsSigned ?? true,
      wantAuthnResponseSigned: config.wantAuthnResponseSigned ?? true,
      decryptionPvk: config.privateCert,
    },
    async (profile: Profile, done: VerifiedCallback) => {
      try {
        const samlProfile: SAMLProfile = {
          nameID: profile.nameID,
          nameIDFormat: profile.nameIDFormat,
          sessionIndex: profile.sessionIndex,
          email: extractAttribute(profile, attributeMapping.email),
          firstName: extractAttribute(profile, attributeMapping.firstName),
          lastName: extractAttribute(profile, attributeMapping.lastName),
          displayName: extractAttribute(profile, attributeMapping.displayName),
          groups: extractArrayAttribute(profile, attributeMapping.groups),
          attributes: profile,
        };

        const user = await onAuthenticate(samlProfile);
        done(null, user);
      } catch (error) {
        done(error as Error);
      }
    }
  );
}

/**
 * Extract single attribute from SAML profile
 */
function extractAttribute(profile: any, attributeName?: string): string {
  if (!attributeName) return '';
  
  const value = profile[attributeName] || profile.attributes?.[attributeName];
  if (Array.isArray(value)) return value[0];
  return value || '';
}

/**
 * Extract array attribute from SAML profile
 */
function extractArrayAttribute(profile: any, attributeName?: string): string[] {
  if (!attributeName) return [];
  
  const value = profile[attributeName] || profile.attributes?.[attributeName];
  if (Array.isArray(value)) return value;
  if (value) return [value];
  return [];
}

/**
 * SAML Service for managing sessions and metadata
 */
export class SAMLService {
  private sessions: Map<string, SAMLSession> = new Map();
  private config: SAMLConfig;

  constructor(config: SAMLConfig) {
    this.config = config;
  }

  /**
   * Save SAML session
   */
  async saveSession(session: Omit<SAMLSession, 'id' | 'createdAt'>): Promise<SAMLSession> {
    const newSession: SAMLSession = {
      ...session,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    this.sessions.set(session.nameID, newSession);

    // Auto-cleanup after expiry
    const timeout = session.expiresAt.getTime() - Date.now();
    setTimeout(() => {
      this.sessions.delete(session.nameID);
    }, timeout);

    return newSession;
  }

  /**
   * Get SAML session by nameID
   */
  async getSession(nameID: string): Promise<SAMLSession | null> {
    return this.sessions.get(nameID) || null;
  }

  /**
   * Delete SAML session
   */
  async deleteSession(nameID: string): Promise<boolean> {
    return this.sessions.delete(nameID);
  }

  /**
   * Get all sessions for user
   */
  async getUserSessions(userId: string): Promise<SAMLSession[]> {
    return Array.from(this.sessions.values()).filter(s => s.userId === userId);
  }

  /**
   * Generate SAML metadata XML
   */
  generateMetadata(): string {
    const entityId = this.config.issuer;
    const acsUrl = this.config.callbackUrl;
    const sloUrl = this.config.callbackUrl.replace('/acs', '/slo');

    let metadata = `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" 
                  entityID="${entityId}">
  <SPSSODescriptor 
      AuthnRequestsSigned="true" 
      WantAssertionsSigned="true" 
      protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    
    <KeyDescriptor use="signing">
      <KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
        <X509Data>
          <X509Certificate>${this.getPublicCertificate()}</X509Certificate>
        </X509Data>
      </KeyInfo>
    </KeyDescriptor>
    
    <SingleLogoutService 
        Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" 
        Location="${sloUrl}" />
    
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:persistent</NameIDFormat>
    
    <AssertionConsumerService 
        Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" 
        Location="${acsUrl}" 
        index="1" 
        isDefault="true" />
  </SPSSODescriptor>
</EntityDescriptor>`;

    return metadata;
  }

  /**
   * Get public certificate (without headers)
   */
  private getPublicCertificate(): string {
    if (!this.config.privateCert) return '';
    
    // Extract certificate from private key file or use provided cert
    // This is a simplified version - in production, properly extract from key pair
    return this.config.cert
      .replace('-----BEGIN CERTIFICATE-----', '')
      .replace('-----END CERTIFICATE-----', '')
      .replace(/\n/g, '');
  }
}

/**
 * Create SAML Logout Request
 */
export function createLogoutRequest(nameID: string, sessionIndex?: string): string {
  const requestId = '_' + crypto.randomUUID();
  const issueInstant = new Date().toISOString();

  let request = `<samlp:LogoutRequest 
    xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" 
    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" 
    ID="${requestId}" 
    Version="2.0" 
    IssueInstant="${issueInstant}">
    <saml:Issuer>${nameID}</saml:Issuer>
    <saml:NameID>${nameID}</saml:NameID>`;

  if (sessionIndex) {
    request += `<samlp:SessionIndex>${sessionIndex}</samlp:SessionIndex>`;
  }

  request += `</samlp:LogoutRequest>`;

  return request;
}

/**
 * Parse SAML Logout Response
 */
export function parseLogoutResponse(response: string): {
  success: boolean;
  statusCode?: string;
  statusMessage?: string;
} {
  // Simplified parser - in production use proper XML parser
  const successMatch = response.match(/StatusCode.*?Value="([^"]+)"/);
  const statusCode = successMatch ? successMatch[1] : '';
  const success = statusCode.includes('Success');

  return {
    success,
    statusCode,
    statusMessage: success ? 'Logout successful' : 'Logout failed',
  };
}

/**
 * Load SAML certificate from file
 */
export function loadCertificate(path: string): string {
  try {
    return fs.readFileSync(path, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to load SAML certificate from ${path}: ${error}`);
  }
}

/**
 * Validate SAML assertion
 */
export function validateAssertion(assertion: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required fields
  if (!assertion.nameID) {
    errors.push('Missing nameID in assertion');
  }

  // Check expiration
  if (assertion.sessionNotOnOrAfter) {
    const expiryDate = new Date(assertion.sessionNotOnOrAfter);
    if (expiryDate < new Date()) {
      errors.push('SAML assertion has expired');
    }
  }

  // Check audience
  if (assertion.audience && !assertion.audience.includes(process.env.SAML_ISSUER || '')) {
    errors.push('Audience restriction failed');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Map SAML groups to application roles
 */
export function mapGroupsToRoles(groups: string[], groupMapping: Record<string, string>): string[] {
  const roles: string[] = [];

  for (const group of groups) {
    if (groupMapping[group]) {
      roles.push(groupMapping[group]);
    }
  }

  // Default role if no mapping found
  if (roles.length === 0) {
    roles.push('user');
  }

  return roles;
}

/**
 * Example group mapping configuration
 */
export const DEFAULT_GROUP_MAPPING: Record<string, string> = {
  'CN=Administrators,OU=Groups,DC=example,DC=com': 'admin',
  'CN=TestManagers,OU=Groups,DC=example,DC=com': 'admin',
  'CN=Developers,OU=Groups,DC=example,DC=com': 'user',
  'CN=QAEngineers,OU=Groups,DC=example,DC=com': 'user',
  'CN=Viewers,OU=Groups,DC=example,DC=com': 'viewer',
};
