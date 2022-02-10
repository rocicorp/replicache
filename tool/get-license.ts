#!/usr/bin/env node

// If developing Replicache locally, run `npm link` to link the
// command. Then you can run this command with `npx get-license`.
// You should just be able to run `npx get-license` if you are
// in a package that has Replicache as a local depenency. (Note:
// if not, the binary lives under node_modules/.bin/, we would
// need to run it from there instead.)

import * as licensingCLI from '@rocicorp/licensing/src/cli';

licensingCLI.main();
