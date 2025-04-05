import { readFileSync, writeFileSync } from 'fs';

// Read commit message from temporary file
const commitMsgFile = process.argv[2];
const commitMsg = readFileSync(commitMsgFile, 'utf8').trim();

const typeToEmoji = {
  'refacto': ':recycle:',
  'feat': ':sparkles:',
  'fix': ':bug:',
  'wip': ':construction:',
  'test': ':test_tube:',
  'docs': ':memo:',
  'deadcode': ':coffin:'
};

// Pattern to extract type and message
const commitPattern = /^([a-zA-Z]+)\(\):\s(.+)$/;

const wordCount = commitMsg.split(/\s+/).length;

const match = commitMsg.match(commitPattern);
if (!match) {
  console.error('\x1b[31m\x1b[1m%s\x1b[0m\x1b[31m%s\x1b[0m', '❌ Commit failed:', ' Format de commit invalide');
  console.error('\x1b[32m%s\x1b[0m\x1b[34m%s\x1b[0m','type():',' message'); 
  console.error('\x1b[33m\x1b[1m\x1b[4m%s\x1b[0m', 'Types acceptés:','feat, refacto, fix, wip, test, docs, deadcode');
  console.error('\x1b[33m%s\x1b[0m', 'Exemples:');
  console.error('\x1b[33m%s\x1b[0m', '  • feat(): nouvelle fonctionnalité');
  console.error('\x1b[33m%s\x1b[0m', '  • refacto(): refactorisation de l\'authentification');
  console.error('\x1b[33m%s\x1b[0m', '  • fix(): correction de bug');
  console.error('\x1b[33m%s\x1b[0m', '  • wip(): travail en cours');
  console.error('\x1b[33m%s\x1b[0m', '  • test(): ajout de tests');
  console.error('\x1b[33m%s\x1b[0m', '  • docs(): mise à jour de la documentation');
  console.error('\x1b[33m%s\x1b[0m', '  • deadcode(): suppression de code mort');
  process.exit(1);
}

const [, type] = match;

if (!typeToEmoji[type]) {
  console.error('\x1b[31m\x1b[1m%s\x1b[0m\x1b[31m%s\x1b[0m', '❌ Commit failed:', ' Unauthorized type');
  console.error('\x1b[33m\x1b[1m\x1b[4m%s\x1b[0m', 'Authorized types:');

  Object.entries(typeToEmoji).forEach(([validType]) => {
    console.error('\x1b[33m%s\x1b[0m', ` • ${validType}`);
  });
  process.exit(1);
}

if (wordCount > 50) {
  console.error('\x1b[31m\x1b[1m%s\x1b[0m\x1b[31m%s\x1b[0m', '❌ Commit failed:', ' Message too long');
  console.error('\x1b[33m%s\x1b[0m', `Message contains ${wordCount} words. Maximum 50 words allowed.`);
  process.exit(1);
}

// Add emoji to the commit message
const newCommitMsg = `${typeToEmoji[type]} ${commitMsg}`;
writeFileSync(commitMsgFile, newCommitMsg);

process.exit(0); 