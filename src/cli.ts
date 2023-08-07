/**
 * Copyright 2023 Adobe
 * All Rights Reserved.
 *
 * NOTICE: Adobe permits you to use, modify, and distribute this file in
 * accordance with the terms of the Adobe license agreement accompanying
 * it.
 */

interface CliOptions {
  configPath: string | undefined;
}

export function getCliOptions(): CliOptions {
  const configArgIndex = process.argv.findIndex((arg) => arg === "--config");
  const configPath =
    configArgIndex > -1 ? process.argv[configArgIndex + 1] : undefined;

  return {
    configPath,
  };
}
