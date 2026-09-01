const fs = require('fs-extra');
const path = require('path');
const open = require('open');
const chalk = require('chalk');
const { execSync } = require('child_process');
const { Asker, setPackageKey, log } = require('./utils');
const { ORGANIZATIONS } = require('./constants');

const TEMPLATE_DOC_URL =
  'https://docs.google.com/document/d/1JV2fVhKWMo1MHIJqL3oq10mRSOrWPO_iRnRkmD92N5g/edit';

module.exports = async function () {
  // Confirm repository name as default slug, or input a new one. Slug input
  // error should not be caught.
  const asker = new Asker();
  const slug = await asker.confirmSlugOrAsk(path.basename(process.cwd()));
  const currentDir = process.cwd();

  // Set package name to slug
  await setPackageKey('name', slug);
  
  console.log();
  const repo_choice = await asker.selectFromChoices(ORGANIZATIONS);
    
  // Check if repository exists
  let repositoryExists;
  try {
    execSync(`git ls-remote git@github.com:${repo_choice}/${slug}.git`, {
      stdio: 'ignore',
    });
    repositoryExists = true;
  } catch (err) {
    log.error(`Repository ${repo_choice}/${slug} doesn't exist.`);
  }

  // Add remote origin if repository exists
  if (repositoryExists) {
    try {
      const remoteOrigin = `git@github.com:${repo_choice}/${slug}.git`;
      execSync('git remote add origin ' + remoteOrigin, { stdio: 'ignore' });
      console.log(
        chalk.green('success'),
        'Added remote origin ' + remoteOrigin,
      );
    } catch (e) {
      log.error(
        'A remote origin already exists:',
        execSync('git remote get-url origin').toString().trim(),
      );
    }
  }

  // Check if this is a piece for The Eye, and set NAV flags accordingly.
  console.log();
  const eyeAnswer = await asker.question({
    message: 'Is this a piece for The Eye?',
    options: '(n/y)',
    validate: () => ({ success: true }),
  });
  const isEyePiece = eyeAnswer === 'y';
  await setPackageKey('USE_EYE_NAV', isEyePiece, true);
  await setPackageKey('USE_NEWS_NAV', !isEyePiece, true);
//   log.success(`Set USE_EYE_NAV to ${isEyePiece} and USE_NEWS_NAV to ${!isEyePiece} in the "spectate" key in package.json.`);

  console.log(path.join(currentDir,'.posthtmlrc'));

  if (fs.existsSync(path.join(currentDir, '.posthtmlrc'))){
  // Ask for Google Doc
    const url = await asker.questionWithRetries({
      message: 'Enter a Google Docs URL',
      validate: isValidGoogleDocsURL,
      commands: {
        o: {
          description: 'open template',
          action: async () => await open(TEMPLATE_DOC_URL),
        },
      },
    })
    if (url) {
      await setPackageKey('DOC_URL', url, true);
      log.success('Set DOC_URL in the "spectate" key in package.json.');
  
      console.log();
      console.log(
        `Running ${chalk.cyan(
          'spectate download',
        )} since Google Docs link updated.`,
      );
      await require('./download-doc')();
    }
  }
    // At the very end, close the asker
    asker.close();

  // Set google doc url in config
};

function isValidGoogleDocsURL(s) {
  if (/docs\.google\.com\/document(\/u\/\d)?\/d\/[-\w]{25,}/.test(s))
    return { success: true };
  return { error: 'Invalid Google Docs link.' };
}
