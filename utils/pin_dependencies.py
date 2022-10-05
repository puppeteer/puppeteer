#!/usr/bin/env python3

"""
 Copyright 2022 Google Inc. All rights reserved.
 
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 
     http://www.apache.org/licenses/LICENSE-2.0
 
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
"""

from glob import glob
from os import rename
from tempfile import mktemp


def main():
  for package_json_path in glob("**/package.json"):
    tmp_file_path = mktemp()
    with open(tmp_file_path, 'w') as tmp_file:
      with open(package_json_path, "r") as package_json_file:
        start_replace = False
        for line in package_json_file.readlines():
          if not start_replace:
            if line.startswith("devDependencies") or line.startswith("dependencies"):
              start_replace = True
          else:
            tmp_file.write(line.replace('^', ''))
    rename(tmp_file_path, package_json_path)

if __name__ == "__main__":
  main()