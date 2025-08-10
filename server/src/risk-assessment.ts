import type { RiskAssessment } from './types';

// Patterns that indicate dangerous commands
const HIGH_RISK_PATTERNS = [
  // File system destruction
  /rm\s+.*-rf?\s+\//,                    // rm -rf /
  /rm\s+.*-rf?\s+\*/,                    // rm -rf *
  /rm\s+.*-rf?\s+~$/,                    // rm -rf ~
  /rmdir\s+.*\/$/,                       // rmdir /
  
  // System manipulation
  /mkfs/,                                // Format filesystem
  /mount\s+.*\/dev/,                     // Mount devices
  /umount\s+.*\/dev/,                    // Unmount devices
  /fdisk/,                               // Disk partitioning
  /dd\s+.*of=\/dev/,                     // Direct disk write
  
  // System control
  /shutdown|reboot|halt|poweroff/,       // System shutdown/reboot
  /init\s+[06]/,                         // System runlevel change
  /kill\s+-9\s+1$/,                      // Kill init process
  
  // Permission changes
  /chmod\s+777\s+\//,                    // World writable root
  /chown\s+.*-R\s+\//,                   // Recursive ownership change on root
  /chgrp\s+.*-R\s+\//,                   // Recursive group change on root
  
  // Network/system exposure
  /nc\s+.*-l.*-e/,                       // Netcat with shell execution
  /bash\s+.*\/dev\/tcp/,                 // Bash reverse shell
  
  // Fork bombs and resource exhaustion
  /:\(\)\{.*:\|:.*\}&.*:/,               // Classic fork bomb
  /while\s+true.*do.*done/,              // Infinite loop
  
  // Package management abuse
  /pip\s+install.*--break-system-packages/,
  /npm\s+.*-g.*\/$/,                     // Global npm install in root
  
  // Environment manipulation
  /export\s+PATH=.*\$PATH/,              // PATH manipulation (could be innocent but risky)
  /alias.*=.*rm/,                        // Dangerous aliases
];

const MEDIUM_RISK_PATTERNS = [
  // File operations with potential for accidents
  /rm\s+.*-rf?\s+\w/,                    // rm -rf on specific directories
  /mv\s+.*\/.*\s+\//,                    // Moving files to root
  /cp\s+.*-r.*\/.*\s+\//,                // Copying recursively to root
  
  // Permission changes
  /chmod\s+[0-7]{3,4}/,                  // Numeric permission changes
  /chown\s+\w+/,                         // Ownership changes
  
  // Network operations
  /curl\s+.*\|\s*bash/,                  // Pipe to bash
  /wget\s+.*\|\s*bash/,                  // Pipe to bash
  /ssh\s+.*-o\s+StrictHostKeyChecking=no/, // SSH without host key checking
  
  // System information gathering
  /ps\s+aux/,                            // Process listing (usually safe but can expose info)
  /netstat/,                             // Network connections
  /lsof/,                                // Open files
  
  // Compression/archiving with potential overwrites
  /tar\s+.*-x.*-f/,                      // Extract archives (could overwrite)
  /unzip\s+.*-o/,                        // Overwrite existing files
];

export function assessRisk(command: string): RiskAssessment {
  const commandLower = command.toLowerCase();
  const reasons: string[] = [];
  
  // Check for high-risk patterns
  for (const pattern of HIGH_RISK_PATTERNS) {
    if (pattern.test(commandLower)) {
      reasons.push(`Contains potentially destructive pattern: ${pattern.source}`);
    }
  }
  
  if (reasons.length > 0) {
    return {
      level: 'high',
      reasons,
      saferAlternative: generateSaferAlternative(command),
    };
  }
  
  // Check for medium-risk patterns
  for (const pattern of MEDIUM_RISK_PATTERNS) {
    if (pattern.test(commandLower)) {
      reasons.push(`Contains potentially risky pattern: ${pattern.source}`);
    }
  }
  
  if (reasons.length > 0) {
    return {
      level: 'medium',
      reasons,
      saferAlternative: generateSaferAlternative(command),
    };
  }
  
  // Additional heuristics
  if (commandLower.includes('sudo') && !commandLower.includes('find')) {
    reasons.push('Uses sudo which requires elevated privileges');
    return {
      level: 'medium',
      reasons,
      saferAlternative: command.replace(/sudo\s+/, ''),
    };
  }
  
  if (commandLower.includes('--force') || commandLower.includes('-f')) {
    reasons.push('Uses force flag which bypasses safety checks');
    return {
      level: 'medium',
      reasons,
      saferAlternative: command.replace(/--force|-f/g, ''),
    };
  }
  
  // Low risk - basic read-only operations
  return {
    level: 'low',
    reasons: ['Command appears to be safe - read-only operation'],
  };
}

function generateSaferAlternative(command: string): string {
  let safer = command;
  
  // Add dry-run flags where possible
  if (safer.includes('rm ') && !safer.includes('--dry-run')) {
    safer = safer.replace('rm ', 'echo "Would remove: "; ls ');
  }
  
  if (safer.includes('mv ') && !safer.includes('--dry-run')) {
    safer = safer.replace(/mv\s+/, 'echo "Would move: "; ls -la ');
  }
  
  if (safer.includes('cp ') && !safer.includes('--dry-run')) {
    safer = safer.replace(/cp\s+/, 'echo "Would copy: "; ls -la ');
  }
  
  // Remove dangerous flags
  safer = safer.replace(/--force|-f/g, '');
  safer = safer.replace(/sudo\s+/, '');
  
  // Add safety flags where appropriate
  if (safer.includes('find ')) {
    safer = safer.replace('find ', 'find . -maxdepth 3 ');
  }
  
  return safer.trim();
}