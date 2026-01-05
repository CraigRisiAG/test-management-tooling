/**
 * @module ldap
 * @description LDAP/Active Directory authentication and user synchronization
 */

import * as ldap from 'ldapjs';
import type { User } from '../../types';

/**
 * LDAP Configuration
 */
export interface LDAPConfig {
  url: string;                    // ldaps://ldap.example.com:636
  bindDN: string;                 // cn=admin,dc=example,dc=com
  bindPassword: string;
  baseDN: string;                 // ou=users,dc=example,dc=com
  usernameAttribute: string;      // sAMAccountName, uid, mail
  groupAttribute: string;         // memberOf
  groupBaseDN?: string;          // ou=groups,dc=example,dc=com
  tlsEnabled: boolean;
  caCertPath?: string;
  timeout?: number;
  connectTimeout?: number;
}

/**
 * LDAP Attribute Mapping
 */
export interface LDAPAttributeMapping {
  username: string;      // sAMAccountName
  email: string;         // mail
  firstName: string;     // givenName
  lastName: string;      // sn
  displayName: string;   // displayName
  phone?: string;        // telephoneNumber
  department?: string;   // department
  title?: string;        // title
  manager?: string;      // manager
}

/**
 * Default LDAP attribute mapping
 */
export const DEFAULT_LDAP_ATTRIBUTES: LDAPAttributeMapping = {
  username: 'sAMAccountName',
  email: 'mail',
  firstName: 'givenName',
  lastName: 'sn',
  displayName: 'displayName',
  phone: 'telephoneNumber',
  department: 'department',
  title: 'title',
  manager: 'manager',
};

/**
 * LDAP User
 */
export interface LDAPUser {
  dn: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  department?: string;
  title?: string;
  manager?: string;
  groups: string[];
  enabled: boolean;
}

/**
 * LDAP Group
 */
export interface LDAPGroup {
  dn: string;
  name: string;
  description?: string;
  members: string[];
}

/**
 * LDAP Authentication Service
 */
export class LDAPService {
  private config: LDAPConfig;
  private attributeMapping: LDAPAttributeMapping;
  private client?: ldap.Client;

  constructor(config: LDAPConfig, attributeMapping: LDAPAttributeMapping = DEFAULT_LDAP_ATTRIBUTES) {
    this.config = config;
    this.attributeMapping = attributeMapping;
  }

  /**
   * Create LDAP client connection
   */
  private createClient(): ldap.Client {
    const clientOpts: ldap.ClientOptions = {
      url: this.config.url,
      timeout: this.config.timeout || 10000,
      connectTimeout: this.config.connectTimeout || 10000,
    };

    if (this.config.tlsEnabled && this.config.caCertPath) {
      const fs = require('fs');
      clientOpts.tlsOptions = {
        ca: [fs.readFileSync(this.config.caCertPath)],
      };
    }

    return ldap.createClient(clientOpts);
  }

  /**
   * Test LDAP connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    const client = this.createClient();

    return new Promise((resolve) => {
      client.bind(this.config.bindDN, this.config.bindPassword, (err) => {
        if (err) {
          client.unbind();
          resolve({
            success: false,
            error: err.message,
          });
        } else {
          client.unbind();
          resolve({ success: true });
        }
      });
    });
  }

  /**
   * Authenticate user with username and password
   */
  async authenticate(username: string, password: string): Promise<LDAPUser | null> {
    const client = this.createClient();

    try {
      // First, bind with admin credentials to search for user
      await this.bind(client, this.config.bindDN, this.config.bindPassword);

      // Search for user
      const userDN = await this.findUserDN(client, username);
      if (!userDN) {
        client.unbind();
        return null;
      }

      // Unbind admin connection
      client.unbind();

      // Now try to bind with user credentials
      const userClient = this.createClient();
      const authenticated = await this.bind(userClient, userDN, password);

      if (!authenticated) {
        userClient.unbind();
        return null;
      }

      // Fetch user details
      const user = await this.getUserDetails(userClient, userDN);
      userClient.unbind();

      return user;
    } catch (error) {
      client.unbind();
      console.error('LDAP authentication error:', error);
      return null;
    }
  }

  /**
   * Bind to LDAP server
   */
  private bind(client: ldap.Client, dn: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      client.bind(dn, password, (err) => {
        resolve(!err);
      });
    });
  }

  /**
   * Find user DN by username
   */
  private findUserDN(client: ldap.Client, username: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const searchOptions: ldap.SearchOptions = {
        filter: `(${this.attributeMapping.username}=${username})`,
        scope: 'sub',
        attributes: ['dn'],
      };

      client.search(this.config.baseDN, searchOptions, (err, res) => {
        if (err) {
          reject(err);
          return;
        }

        let userDN: string | null = null;

        res.on('searchEntry', (entry) => {
          userDN = entry.objectName || null;
        });

        res.on('error', (err) => {
          reject(err);
        });

        res.on('end', () => {
          resolve(userDN);
        });
      });
    });
  }

  /**
   * Get user details
   */
  private getUserDetails(client: ldap.Client, dn: string): Promise<LDAPUser> {
    return new Promise((resolve, reject) => {
      const attributes = Object.values(this.attributeMapping).concat([this.config.groupAttribute]);

      const searchOptions: ldap.SearchOptions = {
        filter: '(objectClass=*)',
        scope: 'base',
        attributes,
      };

      client.search(dn, searchOptions, (err, res) => {
        if (err) {
          reject(err);
          return;
        }

        let userData: any = null;

        res.on('searchEntry', (entry) => {
          userData = entry.attributes.reduce((acc: any, attr: any) => {
            acc[attr.type] = Array.isArray(attr.values) && attr.values.length === 1
              ? attr.values[0]
              : attr.values;
            return acc;
          }, {});
        });

        res.on('error', (err) => {
          reject(err);
        });

        res.on('end', () => {
          if (userData) {
            resolve(this.mapLDAPUser(dn, userData));
          } else {
            reject(new Error('User not found'));
          }
        });
      });
    });
  }

  /**
   * Map LDAP data to LDAPUser
   */
  private mapLDAPUser(dn: string, data: any): LDAPUser {
    const groups = Array.isArray(data[this.config.groupAttribute])
      ? data[this.config.groupAttribute]
      : data[this.config.groupAttribute]
      ? [data[this.config.groupAttribute]]
      : [];

    return {
      dn,
      username: data[this.attributeMapping.username] || '',
      email: data[this.attributeMapping.email] || '',
      firstName: data[this.attributeMapping.firstName],
      lastName: data[this.attributeMapping.lastName],
      displayName: data[this.attributeMapping.displayName],
      phone: data[this.attributeMapping.phone],
      department: data[this.attributeMapping.department],
      title: data[this.attributeMapping.title],
      manager: data[this.attributeMapping.manager],
      groups,
      enabled: !data.userAccountControl || (parseInt(data.userAccountControl) & 2) === 0,
    };
  }

  /**
   * Sync users from LDAP
   */
  async syncUsers(filter?: string): Promise<LDAPUser[]> {
    const client = this.createClient();

    try {
      await this.bind(client, this.config.bindDN, this.config.bindPassword);

      const searchFilter = filter || `(objectClass=person)`;
      const users = await this.searchUsers(client, searchFilter);

      client.unbind();
      return users;
    } catch (error) {
      client.unbind();
      console.error('LDAP sync error:', error);
      throw error;
    }
  }

  /**
   * Search for users
   */
  private searchUsers(client: ldap.Client, filter: string): Promise<LDAPUser[]> {
    return new Promise((resolve, reject) => {
      const users: LDAPUser[] = [];
      const attributes = Object.values(this.attributeMapping).concat([this.config.groupAttribute]);

      const searchOptions: ldap.SearchOptions = {
        filter,
        scope: 'sub',
        attributes,
      };

      client.search(this.config.baseDN, searchOptions, (err, res) => {
        if (err) {
          reject(err);
          return;
        }

        res.on('searchEntry', (entry) => {
          const data = entry.attributes.reduce((acc: any, attr: any) => {
            acc[attr.type] = Array.isArray(attr.values) && attr.values.length === 1
              ? attr.values[0]
              : attr.values;
            return acc;
          }, {});

          users.push(this.mapLDAPUser(entry.objectName || '', data));
        });

        res.on('error', (err) => {
          reject(err);
        });

        res.on('end', () => {
          resolve(users);
        });
      });
    });
  }

  /**
   * Get user groups
   */
  async getUserGroups(username: string): Promise<LDAPGroup[]> {
    const client = this.createClient();

    try {
      await this.bind(client, this.config.bindDN, this.config.bindPassword);

      const userDN = await this.findUserDN(client, username);
      if (!userDN) {
        client.unbind();
        return [];
      }

      const groups = await this.searchGroups(client, userDN);
      client.unbind();

      return groups;
    } catch (error) {
      client.unbind();
      console.error('LDAP get groups error:', error);
      return [];
    }
  }

  /**
   * Search for groups
   */
  private searchGroups(client: ldap.Client, userDN: string): Promise<LDAPGroup[]> {
    return new Promise((resolve, reject) => {
      const groups: LDAPGroup[] = [];
      const baseDN = this.config.groupBaseDN || this.config.baseDN;

      const searchOptions: ldap.SearchOptions = {
        filter: `(member=${userDN})`,
        scope: 'sub',
        attributes: ['cn', 'description', 'member'],
      };

      client.search(baseDN, searchOptions, (err, res) => {
        if (err) {
          reject(err);
          return;
        }

        res.on('searchEntry', (entry) => {
          const data = entry.attributes.reduce((acc: any, attr: any) => {
            acc[attr.type] = Array.isArray(attr.values) && attr.values.length === 1
              ? attr.values[0]
              : attr.values;
            return acc;
          }, {});

          groups.push({
            dn: entry.objectName || '',
            name: data.cn || '',
            description: data.description,
            members: Array.isArray(data.member) ? data.member : data.member ? [data.member] : [],
          });
        });

        res.on('error', (err) => {
          reject(err);
        });

        res.on('end', () => {
          resolve(groups);
        });
      });
    });
  }

  /**
   * Map LDAP groups to application roles
   */
  mapGroupsToRoles(groups: string[], groupMapping: Record<string, string>): string[] {
    const roles: string[] = [];

    for (const group of groups) {
      // Extract CN from DN (e.g., "CN=Admins,OU=Groups,DC=example,DC=com" -> "Admins")
      const cnMatch = group.match(/CN=([^,]+)/i);
      const groupName = cnMatch ? cnMatch[1] : group;

      if (groupMapping[groupName]) {
        roles.push(groupMapping[groupName]);
      }
    }

    // Default role if no mapping found
    if (roles.length === 0) {
      roles.push('user');
    }

    return roles;
  }
}

/**
 * Example LDAP group mapping
 */
export const DEFAULT_LDAP_GROUP_MAPPING: Record<string, string> = {
  'Domain Admins': 'admin',
  'Test Managers': 'admin',
  'Developers': 'user',
  'QA Engineers': 'user',
  'Viewers': 'viewer',
};

/**
 * Active Directory specific helpers
 */
export class ActiveDirectoryService extends LDAPService {
  /**
   * Check if user account is disabled
   */
  isAccountDisabled(userAccountControl: number): boolean {
    // Bit 2 = ACCOUNTDISABLE
    return (userAccountControl & 2) !== 0;
  }

  /**
   * Check if password is expired
   */
  isPasswordExpired(pwdLastSet: number, maxPasswordAge: number): boolean {
    if (pwdLastSet === 0) return true; // Must change password at next login
    
    const passwordAge = Date.now() - this.convertADTimestamp(pwdLastSet);
    return passwordAge > maxPasswordAge;
  }

  /**
   * Convert AD timestamp to JavaScript Date
   */
  convertADTimestamp(timestamp: number): number {
    // AD timestamps are 100-nanosecond intervals since Jan 1, 1601
    const millisecondsPerDay = 86400000;
    const daysBetween16011970 = 134774;
    
    return (timestamp / 10000) - (daysBetween16011970 * millisecondsPerDay);
  }

  /**
   * Get user's manager
   */
  async getUserManager(username: string): Promise<LDAPUser | null> {
    const client = this.createClient();

    try {
      await this.bind(client, this.config.bindDN, this.config.bindPassword);

      const userDN = await this.findUserDN(client, username);
      if (!userDN) {
        client.unbind();
        return null;
      }

      const user = await this.getUserDetails(client, userDN);
      if (!user.manager) {
        client.unbind();
        return null;
      }

      const manager = await this.getUserDetails(client, user.manager);
      client.unbind();

      return manager;
    } catch (error) {
      client.unbind();
      console.error('Error getting manager:', error);
      return null;
    }
  }
}
