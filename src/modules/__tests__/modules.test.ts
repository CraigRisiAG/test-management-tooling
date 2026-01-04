jest.mock('figlet', () => ({
  __esModule: true,
  default: { textSync: jest.fn().mockReturnValue('BANNER') },
}));

jest.mock('boxen', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue('[BOX]'),
}));

jest.mock('chalk', () => {
  const passthrough = (s: string) => s;
  const boldFn = Object.assign(passthrough, { underline: passthrough });
  return {
    __esModule: true,
    default: {
      bold: boldFn,
      cyan: passthrough,
      gray: passthrough,
      green: passthrough,
      red: passthrough,
      yellow: passthrough,
      blue: passthrough,
    },
  };
});

import { ConfigModule } from '../config';
import { UIModule } from '../ui';

describe('UIModule', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('printBanner', () => {
    it('should display banner without errors', async () => {
      await UIModule.printBanner();
      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('showHelp', () => {
    it('should display help text', async () => {
      await UIModule.showHelp();
      expect(console.log).toHaveBeenCalled();
      const output = (console.log as jest.Mock).mock.calls.join('\n');
      expect(output).toContain('USAGE');
      expect(output).toContain('COMMANDS');
    });
  });

  describe('showSuccess', () => {
    it('should display success message', () => {
      UIModule.showSuccess('Test success');
      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('showError', () => {
    it('should display error message', () => {
      UIModule.showError('Test error');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('displayCredentials', () => {
    it('should display formatted credentials', async () => {
      const credentials = {
        username: 'admin',
        password: 'secret123',
      };
      
      await UIModule.displayCredentials('TestService', credentials);
      expect(console.log).toHaveBeenCalled();
    });
  });
});

describe('ConfigModule', () => {
  describe('isServiceEnabled', () => {
    it('should return boolean for service status', () => {
      const result = ConfigModule.isServiceEnabled('reporting');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getEnabledServices', () => {
    it('should return array of enabled services', () => {
      const services = ConfigModule.getEnabledServices();
      expect(Array.isArray(services)).toBe(true);
    });
  });

  describe('loadConfig', () => {
    it('should return config object', () => {
      const config = ConfigModule.loadConfig();
      expect(typeof config).toBe('object');
    });
  });

  describe('getConfigValue', () => {
    it('should return undefined for non-existent key', () => {
      const value = ConfigModule.getConfigValue('NON_EXISTENT_KEY');
      expect(value).toBeUndefined();
    });

    it('should return default value when key does not exist', () => {
      const value = ConfigModule.getConfigValue('NON_EXISTENT', 'default');
      expect(value).toBe('default');
    });
  });
});
