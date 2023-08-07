#! /usr/bin/env node

/**
 * Copyright 2023 Adobe
 * All Rights Reserved.
 *
 * NOTICE: Adobe permits you to use, modify, and distribute this file in
 * accordance with the terms of the Adobe license agreement accompanying
 * it.
 */

import express from "express";
import cors from "cors";
import { createSignedAssetBuffer } from "./createdSignedAssetBuffer.js";
import { getConfig } from "./config.js";
import { resolve } from "path";
import { getCliOptions } from "./cli.js";

const { configPath } = getCliOptions();

const config = getConfig(
  configPath ? resolve(process.cwd(), configPath) : undefined
);

const app = express();

app.use(cors());

app.get("/:id?", async (req, res) => {
  const manifestId = (req.params?.id as string) ?? "default";

  if (config.fixtures[manifestId]) {
    const signedAssetBuffer = await createSignedAssetBuffer(
      config.fixtures[manifestId]
    );

    res.set("Content-Type", "image/jpeg");
    res.send(signedAssetBuffer);
  } else {
    res.sendStatus(404);
  }
});

app.listen(config.port, () => {
  console.log(`Listening on port ${config.port}`);
});
