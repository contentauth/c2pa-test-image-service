# c2pa-test-image-service

c2pa-test-image-service is a Node.js service (built using [Express](https://github.com/expressjs/express), [c2pa-node](https://github.com/contentauth/c2pa-node) and the awesome [sharp](https://github.com/lovell/sharp) image-processing library) intended to provide on-the-fly generation of [C2PA](https://c2pa.org/)-enabled images for testing purposes.

## Installation

##### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- [Rust](https://www.rust-lang.org/) (v1.18 or later to power [c2pa-node](https://github.com/contentauth/c2pa-node))

Before installation, ensure that you are in an active node project with a `package.json` file. If you are not, run [`npm init`](https://docs.npmjs.com/creating-a-package-json-file) to create one. Then, install the package:

```sh
npm install c2pa-test-image-service
```

## Usage

To start the server, run:

```sh
npx c2pa-test-image-service
```

If all is successful, you should be greeted with:

```
Listening on port 1337
```

Navigating to http://localhost:1337 should display a single image - a red square. Check it out on [Verify](https://verify.contentauthenticity.org/inspect?source=http://localhost:1337/) to inspect the C2PA data embedded within.

This is a great start, but the power of this service is in its ability to provide custom C2PA images. To do so, a configuration file must be provided. Read on...

## Configuration

To get started, create a configuration file in your project directory. This file should export a single default object.

##### **Javascript**

```js
// c2pa-test-image-service.config.js
export default {
  port: 8080,
  fixtures: {
    default: {
      image: { r: 0, g: 0, b: 255, width: 100, height: 100 },
      manifest: {
        title: "test-image.jpg",
        claim_generator: "test-image-service",
        format: "image/jpeg",
      },
    },
  },
};
```

##### **Typescript**

[TypeScript](https://www.typescriptlang.org/) is strongly recommended, as it will provide type-checking and auto-completion for your configuration file. You can add TypeScript to your project with:

```sh
npm install typescript
```

```ts
// c2pa-test-image-service.config.ts
import { C2paTestImageServiceConfig } from "c2pa-test-image-service";

export default {
  port: 8080,
  fixtures: {
    default: {
      image: { r: 0, g: 0, b: 255, width: 100, height: 100 },
      manifest: {
        title: "test-image.jpg",
        claim_generator: "test-image-service",
        format: "image/jpeg",
      },
    },
  },
} satisfies C2paTestImageServiceConfig;
```

Specify this configuration file when starting the server by using the `--config` flag and a path to the file:

```sh
npx c2pa-test-image-service --config c2pa-test-image-service.config.js
```

This bare-bones configuration file specifies a port for the service to listen on and a single basic fixture. In general, the "fixtures" property is an object with keys corresponding to fixture names and values representing the details of the asset to generate and sign. The `default` fixture is special, and will be used if no fixture name is provided in the request URL. To add another fixture, simply add another key-value pair to the `fixtures` object:

```js
export default {
  port: 8080,
  fixtures: {
    default: {
      /* ... */
    },
    "another-fixture": {
      image: { r: 255, g: 0, b: 255 },
      manifest: {
        title: "yet-another-fixture.jpg",
        claim_generator: "test-image-service",
        format: "image/jpeg",
      },
      ingredients: [
        {
          title: "ingredient.jpg",
          image: { r: 255, g: 0, b: 255 },
          manifest: {
            title: "ingredient-asset.jpg",
            claim_generator: "test-image-service",
            format: "image/jpeg",
            assertions: [
              {
                label: "stds.schema-org.CreativeWork",
                data: {
                  author: [
                    {
                      "@type": "Person",
                      name: "Jane Smith",
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  },
};
```

This asset is available at http://localhost:8080/another-fixture – note the fixture name in the URL.

Additionally, this fixture configuration demonstrates two important features of the service: the ability to specify multiple ingredients, and the ability to specify custom assertions. Assertions can be provided to any `manifest`, not just within ingredients. More information on ingredients and assertions can be found in the [C2PA specification](https://c2pa.org/specifications/).

### Fixture builder

While specifying fixture configuration as a raw javascript object works, it is easy to see how such a configuration could quickly become unwieldy. To help with this, c2pa-test-image-service provides a fixture builder utility.

#### Example

Here is the above configuration re-written using the fixture builder:

```js
const defaultFixtureData = createAsset({
  title: "test-image.jpg",
  image: { r: 0, g: 0, b: 255, width: 100, height: 100 },
}).toJpeg();

const ingredientData = createAsset({
  title: "ingredient-asset.jpg",
  image: { r: 255, g: 0, b: 255 },
})
  .addAssertion("stds.schema-org.CreativeWork", {
    author: [
      {
        "@type": "Person",
        name: "Jane Smith",
      },
    ],
  })
  .toJpeg();

const complexFixtureData = createAsset({
  title: "yet-another-fixture.jpg",
  image: { r: 0, g: 255, b: 255 },
})
  .addIngredient("ingredient.jpg", ingredientData)
  .toJpeg();

const fixtureStore = createFixtureStore()
  .addDefaultFixure(defaultFixtureData)
  .addFixture("another-fixture", complexFixtureData)
  .toFixtureData();

export default {
  port: 1337,
  fixtures: fixtureStore,
};
```

#### API

##### `createFixtureStore()`

Creates the top-level fixture store to be provided in the configuration object.

**Returns**

Returns an object with the following methods:

- **`addDefaultFixture(signedAssetDescriptor)`**
  - Adds a default fixture to the store. `signedAssetDescriptor` should be an asset, as returned by the `createAsset()` method.
- **`addFixture(name, signedAssetDescriptor)`**
  - Adds a fixture to the store with a given `name`. `signedAssetDescriptor` should be an asset, as returned by the `createAsset()` method.
- **`toFixtureData()`**
  - Exports the fixture store as a fixture data object in the format expected by the configuration file. Call this method when you are done adding fixtures to the store.

##### `createAsset(assetData)`

Utility for creating `signedAssetDescriptor` objects.

**Parameters**

**`assetData`** is an object with the following properties:

- **`title`** (required)
  - The title of the asset.
- **`image`** (optional)
  - An object describing the image to be generated. If not provided, the asset will be a 100x100 white square. If provided, it should be an object with the following properties:
    - **`r`** (required)
      - The red component of the image's color.
    - **`g`** (required)
      - The green component of the image's color.
    - **`b`** (required)
      - The blue component of the image's color.
    - **`width`** (optional)
      - The width of the image. Defaults to 100.
    - **`height`** (optional)
      - The height of the image. Defaults to 100.

**Returns**

Returns an object with the following methods:

- **`addAssertion(label, data)`**
  - Adds an assertion to the asset. `label` should be a string representing the assertion's label, and `data` should be an object representing the assertion's data.
- **`addAssertions(assertions)`**
  - Accepts an array of assertions as objects with `label` and `data` properties and adds them to the asset.
- **`addIngredient(title, signedAssetDescriptor)`**
  - Adds an ingredient to the asset. `title` should be a string representing the ingredient's title, and `signedAssetDescriptor` should be an asset, as returned by the `createAsset()` method.
- **`toJpeg()`**
  - Exports the asset as a signed asset descriptor for a JPEG image. Call this method when you are done adding assertions and ingredients to the asset.
