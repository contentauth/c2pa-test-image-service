/**
 * Copyright 2023 Adobe
 * All Rights Reserved.
 *
 * NOTICE: Adobe permits you to use, modify, and distribute this file in
 * accordance with the terms of the Adobe license agreement accompanying
 * it.
 */

import { createC2pa, createTestSigner } from "c2pa-node";
import pMemoize from "p-memoize";

async function createSdk() {
  const signer = await createTestSigner();
  return createC2pa({ signer });
}

export const getSdk = pMemoize(createSdk);
