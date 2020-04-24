#!/usr/bin/env sh

npm run lint &&
npm run coverage &&
npm run test-doclint &&
npm run test-types
