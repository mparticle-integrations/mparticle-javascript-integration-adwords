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
            eventQueue = [],
            gtagSiteId;

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

                    return 'Can\'t send to forwarder: ' + name + '. Event not mapped';
                }
                catch (e) {
                    return 'Can\'t send to forwarder: ' + name + ' ' + e;
                }
            }

            return 'Can\'t send to forwarder ' + name + ', not initialized';
        }

        // Converts an mParticle Event into either Legacy or gtag Event
        function generateEvent(mPEvent, conversionLabel, isPageEvent) {
            if (window.gtag && forwarderSettings.enableGtag == 'True') {
                return generateGtagEvent(mPEvent, conversionLabel, isPageEvent);
            } else if (window.google_trackConversion) {
                return generateAdwordsEvent(mPEvent, conversionLabel, isPageEvent);
            } else {
                console.error('Unrecognized Event', mPEvent);
                return false;
            }
        }

        // Converts an mParticle Commerce Event into either Legacy or gtag Event
        function generateCommerceEvent(mPEvent, conversionLabel, isPageEvent) {
            if (mPEvent.ProductAction
                && mPEvent.ProductAction.ProductList
                && mPEvent.ProductAction.ProductActionType) {

                if (window.gtag && forwarderSettings.enableGtag == 'True') {
                    return generateGtagCommerceEvent(mPEvent, conversionLabel, isPageEvent);
                } else if (window.google_trackConversion) {
                    return generateAdwordsCommerceEvent(mPEvent, conversionLabel, isPageEvent);
                } else {
                    console.error('Unrecognized Commerce Event', mPEvent);
                    return false;
                }
                    
            } else {
                return false;
            }
        }


        // ** Adwords Events

        function getBaseAdWordEvent() {
            var adWordEvent = {};
            adWordEvent.google_conversion_value = 0;
            adWordEvent.google_conversion_language = 'en';
            adWordEvent.google_conversion_format = '3';
            adWordEvent.google_conversion_color = 'ffffff';
            adWordEvent.google_remarketing_only = forwarderSettings.remarketingOnly == 'True';
            adWordEvent.google_conversion_id = forwarderSettings.conversionId;
            return adWordEvent;
        }

        function generateAdwordsEvent(mPEvent, conversionLabel, isPageEvent) {
            var adWordEvent = getBaseAdWordEvent();
            adWordEvent.google_conversion_label = conversionLabel;
            adWordEvent.google_custom_params = getCustomProps(mPEvent, isPageEvent);

            return adWordEvent;
        }

        function generateAdwordsCommerceEvent(mPEvent, conversionLabel, isPageEvent) {
            var adWordEvent = getBaseAdWordEvent();
            adWordEvent.google_conversion_label = conversionLabel;

            if (mPEvent.ProductAction.ProductActionType === mParticle.ProductActionType.Purchase
                && mPEvent.ProductAction.TransactionId) {
                adWordEvent.google_conversion_order_id = mPEvent.ProductAction.TransactionId;
            }

            if (mPEvent.CurrencyCode) {
                adWordEvent.google_conversion_currency = mPEvent.CurrencyCode;
            }

            if (mPEvent.ProductAction.TotalAmount) {
                adWordEvent.google_conversion_value = mPEvent.ProductAction.TotalAmount;
            }

            adWordEvent.google_custom_params = getCustomProps(mPEvent, isPageEvent);
            return adWordEvent;
        }

        // gtag Events
        function generateGtagEvent(mPEvent, conversionLabel, isPageEvent) {
            var conversionPayload = {
                'send-to': gtagSiteId + '/' + conversionLabel
            };

            var customProps = getCustomProps(mPEvent, isPageEvent);

            var payload = Object.assign({}, conversionPayload, customProps);

            return payload;
        }

        function generateGtagCommerceEvent(mPEvent, conversionLabel, isPageEvent) {
            var conversionPayload = {
                'send-to': gtagSiteId + '/' + conversionLabel
            };

            var customProps = getCustomProps(mPEvent, isPageEvent);

            if (mPEvent.ProductAction.ProductActionType === mParticle.ProductActionType.Purchase
                && mPEvent.ProductAction.TransactionId) {
                if (event.ProductAction.ProductActionType === mParticle.ProductActionType.Purchase
                    && event.ProductAction.TransactionId) {
                    adWordEvent.google_conversion_order_id = event.ProductAction.TransactionId;
                }
                conversionPayload.order_id = mPEvent.ProductAction.TransactionId;
            }

            if (mPEvent.CurrencyCode) {
                conversionPayload.currency = mPEvent.CurrencyCode;
            }

            if (mPEvent.ProductAction.TotalAmount) {
                conversionPayload.value = mPEvent.ProductAction.TotalAmount;
            }

            var payload = Object.assign({}, conversionPayload, customProps);

            return payload;
        }

        // Sends final event to Google or queues if Google isn't ready
        function sendOrQueueEvent(conversionPayload) {
            if (window.gtag && forwarderSettings.enableGtag == 'True') {
                gtag('event', 'conversion', conversionPayload);
            } else if (window.google_trackConversion) {
                window.google_trackConversion(conversionPayload);
            } else {
                eventQueue.push(conversionPayload);
            }
        }

        function logCommerce(event, isPageEvent) {
            var isPageEvent = false;
            var conversionLabel = getConversionLabel(event, isPageEvent);

            if (typeof (conversionLabel) !== 'string') {
                return false;
            }

            var eventPayload = generateCommerceEvent(event, conversionLabel, isPageEvent);

            if (!eventPayload) {
                return false;
            }

            sendOrQueueEvent(eventPayload);

            return true;
        }

        function logPageEvent(event, isPageEvent) {
            var conversionLabel = getConversionLabel(event, isPageEvent);
            if (typeof (conversionLabel) != 'string') {
                return false;
            }

            var eventPayload = generateEvent(event, conversionLabel, isPageEvent);

            if (!eventPayload) {
                return false;
            }

            sendOrQueueEvent(eventPayload);

            return true;
        }


        // Looks up an Event's conversionLabel from customAttributeMappings based on computed jsHash value
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

        // Filters Event.EventAttributes for attributes that are in customAttributeMappings
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

        function loadGtagSnippet() {
            (function () {
                window.dataLayer = window.dataLayer || [];
                window.gtag = function(){dataLayer.push(arguments);}

                var gTagScript = document.createElement('script');
                gTagScript.async = true;
                gTagScript.onload = function () {
                    gtag('js', new Date());
                    gtag('config', gtagSiteId);
                };
                gTagScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + gtagSiteId;
                document.getElementsByTagName('head')[0].appendChild(gTagScript);
            })();
        }

        function loadLegacySnippet() {
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

        function initForwarder(settings, service, testMode) {

            forwarderSettings = settings;
            reportingService = service;

            try {
                if (!forwarderSettings.conversionId) {
                    return 'Can\'t initialize forwarder: ' + name + ', conversionId is not defined';
                }

                gtagSiteId = "AW-" + forwarderSettings.conversionId;

                if (testMode !== true) {
                    if (forwarderSettings.enableGtag == 'True') {
                        loadGtagSnippet();
                    } else {
                        loadLegacySnippet();
                    }
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
            console.log('You must pass a config object to register the kit ' + name);
            return;
        }

        if (!isObject(config)) {
            console.log('\'config\' must be an object. You passed in a ' + typeof config);
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
        console.log('Successfully registered ' + name + ' to your mParticle configuration');
    }

    function isObject(val) {
        return val != null && typeof val === 'object' && Array.isArray(val) === false;
    }

    if (typeof window !== 'undefined') {
        if (window && window.mParticle && window.mParticle.addForwarder) {
            window.mParticle.addForwarder({
                name: name,
                constructor: constructor,
                getId: getId
            });
        }
    }

    export default {
        register: register
    };
