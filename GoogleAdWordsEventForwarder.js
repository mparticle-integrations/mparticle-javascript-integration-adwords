var mpAdWordsKit = (function (exports) {
  /*!
   * isobject <https://github.com/jonschlinkert/isobject>
   *
   * Copyright (c) 2014-2017, Jon Schlinkert.
   * Released under the MIT License.
   */

  function isObject(val) {
    return val != null && typeof val === 'object' && Array.isArray(val) === false;
  }

  /* eslint-disable no-undef*/

  //
  //  Copyright 2017 mParticle, Inc.
  //
  //  Licensed under the Apache License, Version 2.0 (the "License");
  //  you may not use this file except in compliance with the License.
  //  You may obtain a copy of the License at
  //
  //      http://www.apache.org/licenses/LICENSE-2.0
  //
  //  Unless required by applicable law or agreed to in writing, software
  //  distributed under the License is distributed on an "AS IS" BASIS,
  //  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  //  See the License for the specific language governing permissions and
  //  limitations under the License.

      

      var name = 'GoogleAdWords',
          moduleId = 82,
          MessageType = {
              SessionStart: 1,
              SessionEnd: 2,
              PageView: 3,
              PageEvent: 4,
              CrashReport: 5,
              OptOut: 6,
              Commerce: 16
          };


      var constructor = function () {
          var self = this,
              isInitialized = false,
              forwarderSettings,
              labels,
              customAttributeMappings,
              reportingService,
              eventQueue = [];

          self.name = name;

          function processEvent(event) {
              var reportEvent = false;

              if (isInitialized) {
                  try {

                      if (event.EventDataType == MessageType.PageView) {
                          reportEvent = logPageEvent(event, false);
                      }
                      else if (event.EventDataType == MessageType.PageEvent) {
                          reportEvent = logPageEvent(event, true);
                      }
                      else if (event.EventDataType == MessageType.Commerce) {
                          reportEvent = logCommerce(event);
                      }

                      if (reportEvent && reportingService) {
                          reportingService(self, event);

                          return 'Successfully sent to ' + name;
                      }
                  }
                  catch (e) {
                      return 'Failed to send to: ' + name + ' ' + e;
                  }
              }

              return 'Can\'t send to forwarder ' + name + ', not initialized';
          }

          function sendOrQueueEvent(adWordEvent) {
              if (window.google_trackConversion) {
                  window.google_trackConversion(adWordEvent);
              } else {
                  eventQueue.push(event);
              }
          }

          function logCommerce(event) {
              if (event.ProductAction
                  && event.ProductAction.ProductList
                  && event.ProductAction.ProductActionType) {

                  var isPageEvent = false;
                  var conversionLabel = getConversionLabel(event, isPageEvent);

                  if (typeof (conversionLabel) !== 'string') {
                      return false;
                  }

                  var adWordEvent = getBaseAdWordEvent();
                  adWordEvent.google_conversion_label = conversionLabel;


                  if (event.ProductAction.ProductActionType === mParticle.ProductActionType.Purchase
                      && event.ProductAction.TransactionId) {
                      adWordEvent.google_conversion_order_id = event.ProductAction.TransactionId;
                  }

                  if (event.CurrencyCode) {
                      adWordEvent.google_conversion_currency = event.CurrencyCode;
                  }

                  if (event.ProductAction.TotalAmount) {
                      adWordEvent.google_conversion_value = event.ProductAction.TotalAmount;
                  }

                  adWordEvent.google_custom_params = getCustomProps(event, isPageEvent);

                  sendOrQueueEvent(adWordEvent);

                  return true;
              }

              return false;
          }

          function logPageEvent(event, isPageEvent) {
              var conversionLabel = getConversionLabel(event, isPageEvent);
              if (typeof (conversionLabel) != 'string') {
                  return false;
              }

              var adWordEvent = getBaseAdWordEvent();
              adWordEvent.google_conversion_label = conversionLabel;
              adWordEvent.google_custom_params = getCustomProps(event, isPageEvent);

              sendOrQueueEvent(adWordEvent);

              return true;
          }

          function getBaseAdWordEvent() {
              var adWordEvent = {};

              adWordEvent.google_conversion_value = 0;
              adWordEvent.google_conversion_language = 'en';
              adWordEvent.google_conversion_format = '3';
              adWordEvent.google_conversion_color = 'ffffff';
              adWordEvent.google_remarketing_only = forwarderSettings.remarketingOnly == 'True';
              adWordEvent.google_conversion_id = parseInt(forwarderSettings.conversionId);
              return adWordEvent;
          }

          function getConversionLabel(event, isPageEvent) {

              var jsHash = calculateJSHash(event.EventDataType, event.EventCategory, event.EventName);
              var type = isPageEvent ? 'EventClass.Id' : 'EventClassDetails.Id';
              var conversionLabel = null;
              var mappingEntry = findValueInMapping(jsHash, type, labels);

              if (mappingEntry) {
                  conversionLabel = mappingEntry.value;
              }

              return conversionLabel;
          }

          function getCustomProps(event, isPageEvent) {

              var customProps = {};
              var attributes = event.EventAttributes;
              var type = isPageEvent ? 'EventAttributeClass.Id' : 'EventAttributeClassDetails.Id';

              if (attributes) {
                  for (var attributeKey in attributes) {
                      if (attributes.hasOwnProperty(attributeKey)) {
                          var jsHash = calculateJSHash(event.EventDataType, event.EventCategory, attributeKey);
                          var mappingEntry = findValueInMapping(jsHash, type, customAttributeMappings);
                          if (mappingEntry) {
                              customProps[mappingEntry.value] = attributes[attributeKey];
                          }
                      }
                  }
              }

              return customProps;
          }

          function findValueInMapping(jsHash, type, mapping) {
              if (mapping) {
                  var filteredArray = mapping.filter(function (mappingEntry) {

                      if (mappingEntry.jsmap && mappingEntry.maptype && mappingEntry.value) {
                          return mappingEntry.jsmap == jsHash && mappingEntry.maptype == type;
                      }

                      return false;
                  });

                  if (filteredArray && filteredArray.length > 0) {
                      return filteredArray[0];
                  }
              }
              return null;
          }

          function calculateJSHash(eventDataType, eventCategory, name) {
              var preHash = [eventDataType, eventCategory, name].join('');

              return mParticle.generateHash(preHash);
          }

          function initForwarder(settings, service, testMode) {
              forwarderSettings = settings;
              reportingService = service;

              try {
                  if (testMode !== true) {
                      (function () {
                          var googleAdwords = document.createElement('script');
                          googleAdwords.type = 'text/javascript';
                          googleAdwords.async = true;
                          googleAdwords.onload = function() {
                              if (eventQueue.length) {
                                  eventQueue.forEach(function(adWordEvent) {
                                      window.google_trackConversion(adWordEvent);
                                  });
                                  eventQueue = [];
                              }
                          };
                          googleAdwords.src = ('https:' == document.location.protocol ? 'https' : 'http') + '://www.googleadservices.com/pagead/conversion_async.js';
                          var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(googleAdwords, s);
                      })();
                  }

                  if (!forwarderSettings.conversionId) {
                      return 'Can\'t initialize forwarder: ' + name + ', conversionId is not defined';
                  }

                  forwarderSettings.remarketingOnly = forwarderSettings.remarketingOnly == 'True';

                  try {
                      if (forwarderSettings.labels) {
                          labels = JSON.parse(forwarderSettings.labels.replace(/&quot;/g, '"'));
                      }

                      if (forwarderSettings.customParameters) {
                          customAttributeMappings = JSON.parse(forwarderSettings.customParameters.replace(/&quot;/g, '"'));
                      }
                  } catch (e) {
                      return 'Can\'t initialize forwarder: ' + name + ', Could not process event to label mapping';
                  }

                  isInitialized = true;

                  return 'Successfully initialized: ' + name;
              }
              catch (e) {
                  return 'Failed to initialize: ' + name;
              }
          }

          this.init = initForwarder;
          this.process = processEvent;
      };

      function getId() {
          return moduleId;
      }

      function register(config) {
          if (!config) {
              window.console.log('You must pass a config object to register the kit ' + name);
              return;
          }

          if (!isObject(config)) {
              window.console.log('\'config\' must be an object. You passed in a ' + typeof config);
              return;
          }

          if (isObject(config.kits)) {
              config.kits[name] = {
                  constructor: constructor
              };
          } else {
              config.kits = {};
              config.kits[name] = {
                  constructor: constructor
              };
          }
          window.console.log('Successfully registered ' + name + ' to your mParticle configuration');
      }

      if (window && window.mParticle && window.mParticle.addForwarder) {
          window.mParticle.addForwarder({
              name: name,
              constructor: constructor,
              getId: getId
          });
      }

      var GoogleAdWordsEventForwarder = {
          register: register
      };
  var GoogleAdWordsEventForwarder_1 = GoogleAdWordsEventForwarder.register;

  exports.default = GoogleAdWordsEventForwarder;
  exports.register = GoogleAdWordsEventForwarder_1;

  return exports;

}({}));
