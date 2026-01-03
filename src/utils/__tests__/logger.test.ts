import { Logger } from '../logger';

describe('Logger', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'table').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('info', () => {
    it('should log info message', () => {
      Logger.info('Test info message');
      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('success', () => {
    it('should log success message', () => {
      Logger.success('Test success');
      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      Logger.warn('Test warning');
      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should log error message', () => {
      Logger.error('Test error');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    it('should not log when debug disabled', () => {
      Logger.disableDebug();
      Logger.debug('Debug message');
      expect(console.log).not.toHaveBeenCalled();
    });

    it('should log when debug enabled', () => {
      Logger.enableDebug();
      Logger.debug('Debug message');
      expect(console.log).toHaveBeenCalled();
      Logger.disableDebug();
    });
  });

  describe('log', () => {
    it('should route to appropriate log level', () => {
      Logger.log('info', 'Info test');
      Logger.log('success', 'Success test');
      Logger.log('warn', 'Warn test');
      Logger.log('error', 'Error test');
      
      expect(console.log).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('table', () => {
    it('should display table data', () => {
      const data = [
        { name: 'Service1', status: 'running' },
        { name: 'Service2', status: 'stopped' },
      ];
      
      Logger.table(data);
      expect(console.table).toHaveBeenCalledWith(data);
    });
  });
});
