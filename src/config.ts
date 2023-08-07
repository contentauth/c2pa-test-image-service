/**
 * Copyright 2023 Adobe
 * All Rights Reserved.
 *
 * NOTICE: Adobe permits you to use, modify, and distribute this file in
 * accordance with the terms of the Adobe license agreement accompanying
 * it.
 */

import jitiFactory from "jiti";
import { transform } from "sucrase";
import { deepmerge } from "deepmerge-ts";
import { createAsset, createFixtureStore } from "./fixtureBuilder.js";
import type { SignedAssetDescriptor } from "./createdSignedAssetBuffer.js";

export interface C2paTestImageServiceConfig {
  port: number;
  certificatePath?: string;
  privateKeyPath?: string;
  fixtures: Record<string, SignedAssetDescriptor>;
}

const defaultConfig: C2paTestImageServiceConfig = {
  port: 1337,
  fixtures: createFixtureStore()
    .addDefaultFixure(
      createAsset({
        image: { r: 255, g: 0, b: 0 },
        title: "test-image-service.jpg",
      }).toJpeg()
    )
    .toFixtureData(),
};

function loadConfigFromFile(path: string): C2paTestImageServiceConfig {
  console.log(`Loading config from ${path}`);

  const jiti = jitiFactory(import.meta.url, {
    transform: (opts) => {
      return transform(opts.source, {
        transforms: ["typescript", "imports"],
      });
    },
  });

  return jiti(path).default;
}

export function getConfig(path?: string): C2paTestImageServiceConfig {
  let config: C2paTestImageServiceConfig | null = null;
  return (
    config ??
    (config = path
      ? deepmerge(defaultConfig, loadConfigFromFile(path))
      : defaultConfig)
  );
}
