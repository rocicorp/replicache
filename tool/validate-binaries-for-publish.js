#!/usr/bin/env node
'use strict';

// This file is used to ensure that we are not trying to publish the downloaded
// binaries.

const {existsSync, statSync} = require('fs');
const {join} = require('path');

function validateFile(name) {
  const p = join(__dirname, '..', 'bin', name);
  if (!existsSync(p)) {
    console.error(`${name} does not exist`);
    process.exit(1);
  }

  // If it exists, make sure that this is not the compiled binary.
  const stat = statSync(p);
  if (stat.size > 10000) {
    console.error(
      `${name} looks too large. Has it been replaced by the binary?`,
    );
    process.exit(1);
  }
}

validateFile('diff-server');
