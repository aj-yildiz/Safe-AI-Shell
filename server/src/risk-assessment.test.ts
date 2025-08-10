import { describe, it, expect } from 'vitest';
import { assessRisk } from './risk-assessment';

describe('Risk Assessment', () => {
  describe('High Risk Commands', () => {
    it('should detect rm -rf / as high risk', () => {
      const result = assessRisk('rm -rf /');
      expect(result.level).toBe('high');
      expect(result.reasons).toContain(expect.stringContaining('destructive'));
    });

    it('should detect rm -rf * as high risk', () => {
      const result = assessRisk('rm -rf *');
      expect(result.level).toBe('high');
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it('should detect shutdown commands as high risk', () => {
      const result = assessRisk('shutdown -h now');
      expect(result.level).toBe('high');
    });

    it('should detect dd to device as high risk', () => {
      const result = assessRisk('dd if=/dev/zero of=/dev/sda');
      expect(result.level).toBe('high');
    });

    it('should detect chmod 777 / as high risk', () => {
      const result = assessRisk('chmod 777 /');
      expect(result.level).toBe('high');
    });

    it('should detect fork bomb as high risk', () => {
      const result = assessRisk(':(){ :|:& };:');
      expect(result.level).toBe('high');
    });
  });

  describe('Medium Risk Commands', () => {
    it('should detect sudo as medium risk', () => {
      const result = assessRisk('sudo find /var -name "*.log"');
      expect(result.level).toBe('medium');
      expect(result.saferAlternative).not.toContain('sudo');
    });

    it('should detect force flags as medium risk', () => {
      const result = assessRisk('rm -f important.txt');
      expect(result.level).toBe('medium');
      expect(result.saferAlternative).not.toContain('-f');
    });

    it('should detect chmod with numeric permissions as medium risk', () => {
      const result = assessRisk('chmod 755 script.sh');
      expect(result.level).toBe('medium');
    });

    it('should detect piping to bash as medium risk', () => {
      const result = assessRisk('curl https://example.com/script.sh | bash');
      expect(result.level).toBe('medium');
    });
  });

  describe('Low Risk Commands', () => {
    it('should assess basic find command as low risk', () => {
      const result = assessRisk('find . -name "*.txt" -type f');
      expect(result.level).toBe('low');
    });

    it('should assess ls command as low risk', () => {
      const result = assessRisk('ls -la');
      expect(result.level).toBe('low');
    });

    it('should assess cat command as low risk', () => {
      const result = assessRisk('cat README.md');
      expect(result.level).toBe('low');
    });

    it('should assess grep command as low risk', () => {
      const result = assessRisk('grep -r "TODO" src/');
      expect(result.level).toBe('low');
    });
  });

  describe('Safer Alternatives', () => {
    it('should provide safer alternative for rm commands', () => {
      const result = assessRisk('rm -rf temp/');
      expect(result.saferAlternative).toContain('echo');
      expect(result.saferAlternative).toContain('ls');
    });

    it('should provide safer alternative for mv commands', () => {
      const result = assessRisk('mv file.txt /destination/');
      expect(result.saferAlternative).toContain('echo');
    });

    it('should remove sudo from safer alternatives', () => {
      const result = assessRisk('sudo rm file.txt');
      expect(result.saferAlternative).not.toContain('sudo');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty commands', () => {
      const result = assessRisk('');
      expect(result.level).toBe('low');
    });

    it('should handle commands with extra whitespace', () => {
      const result = assessRisk('  find . -name "*.txt"  ');
      expect(result.level).toBe('low');
    });

    it('should be case insensitive', () => {
      const result = assessRisk('RM -RF /');
      expect(result.level).toBe('high');
    });
  });
});