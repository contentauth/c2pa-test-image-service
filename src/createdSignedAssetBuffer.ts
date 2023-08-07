/**
 * Copyright 2023 Adobe
 * All Rights Reserved.
 *
 * NOTICE: Adobe permits you to use, modify, and distribute this file in
 * accordance with the terms of the Adobe license agreement accompanying
 * it.
 */

import {
  type BaseManifestDefinition,
  ManifestBuilder,
  type C2pa,
  StorableIngredient,
} from "c2pa-node";
import sharp from "sharp";
import { getSdk } from "./sdk.js";

export interface ImageData {
  r: number;
  g: number;
  b: number;
  width?: number;
  height?: number;
}

export interface SignedAssetDescriptor {
  image: ImageData;
  manifest: BaseManifestDefinition;
  ingredients?: SignedIngredientDescriptor[];
}

export interface SignedIngredientDescriptor extends SignedAssetDescriptor {
  title: string;
}

export async function createSignedAssetBuffer(
  descriptor: SignedAssetDescriptor
): Promise<Buffer> {
  const { width, height, ...background } = descriptor.image;

  const imageBuffer = await sharp({
    create: {
      width: width ?? 100,
      height: height ?? 100,
      channels: 3,
      background,
    },
  })
    .jpeg()
    .toBuffer();

  const c2pa = await getSdk();
  const manifest = await getManifest(descriptor, c2pa);

  const { signedAsset } = await c2pa.sign({
    asset: { buffer: imageBuffer, mimeType: descriptor.manifest.format },
    manifest,
  });

  return signedAsset.buffer;
}

async function getManifest(
  descriptor: SignedAssetDescriptor,
  c2pa: C2pa
): Promise<ManifestBuilder> {
  const manifest = new ManifestBuilder(descriptor.manifest);

  const ingredients = await Promise.all(
    (descriptor.ingredients ?? []).map(
      async (ingredient) => await getSignedIngredient(ingredient, c2pa)
    )
  );

  for (const ingredient of ingredients) {
    manifest.addIngredient(ingredient);
  }

  return manifest;
}

async function getSignedIngredient(
  ingredientDescriptor: SignedIngredientDescriptor,
  c2pa: C2pa
): Promise<StorableIngredient> {
  const ingredientManifest = await getManifest(ingredientDescriptor, c2pa);

  const ingredientImageBuffer = await sharp({
    create: {
      width: ingredientDescriptor.image.width ?? 100,
      height: ingredientDescriptor.image.height ?? 100,
      channels: 3,
      background: ingredientDescriptor.image,
    },
  })
    .jpeg()
    .toBuffer();

  const { signedAsset } = await c2pa.sign({
    asset: {
      buffer: ingredientImageBuffer,
      mimeType: ingredientDescriptor.manifest.format,
    },
    manifest: ingredientManifest,
  });

  const ingredient = await c2pa.createIngredient({
    asset: signedAsset,
    title: ingredientDescriptor.title,
  });

  return ingredient;
}
