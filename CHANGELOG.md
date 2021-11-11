# [2.2.0](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/compare/v2.1.1...v2.2.0) (2021-11-11)


### Features

* Add support for enhanced conversions ([7c3c5d6](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/commit/7c3c5d6092b0574c3f54ca5651c27a2b3d8edb4c))

## [2.1.1](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/compare/v2.1.0...v2.1.1) (2021-11-11)


### Bug Fixes

* Correct send_to in gtag API ([#23](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/issues/23)) ([af01adc](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/commit/af01adc2b04453f77845e228bff4aa6c49824fde))
* Prevent unmapped events from being forwarded ([#22](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/issues/22)) ([50e6d27](https://github.com/mparticle-integrations/mparticle-javascript-integration-adwords/commit/50e6d279dff666f5621e585878672707a21d911f))

## Releases
--

#### 2.1.0 - 2021-10-25
* Implement Google Site Tag (GTAG) support as an opt-in feature

#### 2.0.5 - 2020-11-11
* There are no code changes in this commit. NPM published 2.0.4 but with the dist/ file from 2.0.3. This commit will include the correct dist/ file as we bump to 2.0.5

#### 2.0.4 - 2020-11-10
* Bugfix - Check window for node environments
* Bugfix - rename event --> adWordEvent

#### 2.0.3 - 2020-02-03
* Update package.json

#### 2.0.2 - 2019-10-03
* Bugfix - Remove parseInt(conversionId) which could result in NaN and data not sent to AdWords
* Turn src file into an ESM module
* Remove isObject dependency

#### 2.0.1 - 2019-08-12
* Bugfix - Refactor calculateJSHash
