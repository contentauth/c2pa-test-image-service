/**
 * Copyright 2023 Adobe
 * All Rights Reserved.
 *
 * NOTICE: Adobe permits you to use, modify, and distribute this file in
 * accordance with the terms of the Adobe license agreement accompanying
 * it.
 */

import { ImageData, SignedAssetDescriptor } from "./createdSignedAssetBuffer";

interface FixtureOptions {
  image?: ImageData;
  claimGenerator?: string;
  title: string;
}

interface AssertionData {
  label: string;
  data: unknown;
}

interface FixtureStoreApi {
  addDefaultFixure: (asset: SignedAssetDescriptor) => FixtureStoreApi;
  addFixture: (id: string, asset: SignedAssetDescriptor) => FixtureStoreApi;
  toFixtureData: () => Record<string, SignedAssetDescriptor>;
}

export function createFixtureStore() {
  const fixtures: Record<string, SignedAssetDescriptor> = {};

  const fixtureStoreApi: FixtureStoreApi = {
    addDefaultFixure: (asset: SignedAssetDescriptor) => {
      fixtures.default = asset;
      return fixtureStoreApi;
    },
    addFixture: (id: string, asset: SignedAssetDescriptor) => {
      fixtures[id] = asset;
      return fixtureStoreApi;
    },
    toFixtureData: () => fixtures,
  };

  return fixtureStoreApi;
}

export function createAsset(options: FixtureOptions) {
  const fixtureData: SignedAssetDescriptor = {
    image: options.image ?? { r: 255, g: 255, b: 255 },
    manifest: {
      claim_generator:
        options.claimGenerator ?? "c2pa-test-image-service/1.0.0",
      title: options.title,
      format: "",
      assertions: [],
    },
    ingredients: [],
  };

  const manifestFixtureApi = {
    addAssertion: (label: string, assertionData: unknown) => {
      fixtureData.manifest.assertions.push({
        label,
        data: assertionData,
      });
      return manifestFixtureApi;
    },
    addAssertions: (assertions: AssertionData[]) => {
      fixtureData.manifest.assertions.push(...assertions);
      return manifestFixtureApi;
    },
    addIngredient: (title: string, ingredient: SignedAssetDescriptor) => {
      fixtureData.ingredients?.push({
        ...ingredient,
        title,
      });
      return manifestFixtureApi;
    },
    toJpeg: (): SignedAssetDescriptor => ({
      image: fixtureData.image,
      manifest: {
        ...fixtureData.manifest,
        format: "image/jpeg",
      },
      ingredients: fixtureData.ingredients,
    }),
  };

  return manifestFixtureApi;
}
