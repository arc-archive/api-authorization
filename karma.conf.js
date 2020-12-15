/* eslint-disable import/no-extraneous-dependencies */
const { createDefaultConfig } = require('@open-wc/testing-karma');
const merge = require('deepmerge');

module.exports = (config) => {
  config.set(
    merge(createDefaultConfig(config), {
      files: [
        // runs all files ending with .test in the test folder,
        // can be overwritten by passing a --grep flag. examples:
        //
        // npm run test -- --grep test/foo/bar.test.js
        // npm run test -- --grep test/bar/*
        { pattern: config.grep ? config.grep : 'test/**/*.test.js', type: 'module' },
        {
          pattern: 'node_modules/cryptojslib/components/core.js',
          type: 'js'
        },
        {
          pattern: 'node_modules/cryptojslib/rollups/sha1.js',
          type: 'js'
        },
        {
          pattern: 'node_modules/cryptojslib/components/enc-base64-min.js',
          type: 'js'
        },
        {
          pattern: 'node_modules/cryptojslib/rollups/md5.js',
          type: 'js'
        },
        {
          pattern: 'node_modules/cryptojslib/rollups/hmac-sha1.js',
          type: 'js'
        },
        {
          pattern: 'node_modules/@api-components/api-view-model-transformer/api-view-model-transformer.js',
          type: 'module'
        }
      ],

      esm: {
        nodeResolve: true
      },
      client: {
        mocha: {
          timeout: 10000
        }
      }
    })
  );
  return config;
};
