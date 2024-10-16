/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import fs from 'fs';

const typesDTs = process.argv[2];

const file = fs.readFileSync(typesDTs, 'utf-8');

fs.writeFileSync(typesDTs, `/// <reference types="node" />
${file}`);