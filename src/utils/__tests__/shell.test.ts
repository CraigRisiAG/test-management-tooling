import { ShellExecutor } from '../shell';

describe('ShellExecutor', () => {
  describe('commandExists', () => {
    it('should return true for existing commands', () => {
      const exists = ShellExecutor.commandExists('node');
      expect(typeof exists).toBe('boolean');
    });
  });

  describe('exec', () => {
    it('should execute command and return result', () => {
      const result = ShellExecutor.exec('echo "test"');
      
      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('stdout');
      expect(result).toHaveProperty('stderr');
      expect(typeof result.code).toBe('number');
    });

    it('should handle command failure', () => {
      const result = ShellExecutor.exec('nonexistentcommand12345');
      expect(result.code).not.toBe(0);
    });
  });

  describe('execOrThrow', () => {
    it('should return stdout on success', () => {
      const result = ShellExecutor.execOrThrow('echo "test"');
      expect(typeof result).toBe('string');
    });

    it('should throw error on command failure', () => {
      expect(() => {
        ShellExecutor.execOrThrow('exit 1');
      }).toThrow();
    });
  });

  describe('isDockerAvailable', () => {
    it('should check Docker availability', () => {
      const available = ShellExecutor.isDockerAvailable();
      expect(typeof available).toBe('boolean');
    });
  });

  describe('isDockerComposeAvailable', () => {
    it('should check Docker Compose availability', () => {
      const available = ShellExecutor.isDockerComposeAvailable();
      expect(typeof available).toBe('boolean');
    });
  });

  describe('networkExists', () => {
    it('should return boolean for network existence', () => {
      const exists = ShellExecutor.networkExists('bridge');
      expect(typeof exists).toBe('boolean');
    });
  });
});
