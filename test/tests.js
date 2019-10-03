describe('Adwords forwarder', function () {
    var MessageType = {
        SessionStart: 1,
        SessionEnd: 2,
        PageView: 3,
        PageEvent: 4,
        CrashReport: 5,
        OptOut: 6,
        Commerce: 16
    },
        EventType = {
            Unknown: 0,
            Navigation: 1,
            Location: 2,
            Search: 3,
            Transaction: 4,
            UserContent: 5,
            UserPreference: 6,
            Social: 7,
            Other: 8,
            Media: 9,
            getName: function () {
                return 'blahblah';
            }
        },
        ProductActionType = {
            Unknown: 0,
            AddToCart: 1,
            RemoveFromCart: 2,
            Checkout: 3,
            CheckoutOption: 4,
            Click: 5,
            ViewDetail: 6,
            Purchase: 7,
            Refund: 8,
            AddToWishlist: 9,
            RemoveFromWishlist: 10,
        },
        IdentityType = {
            Other: 0,
            CustomerId: 1,
            Facebook: 2,
            Twitter: 3,
            Google: 4,
            Microsoft: 5,
            Yahoo: 6,
            Email: 7,
            Alias: 8,
            FacebookCustomAudienceId: 9,
            getName: function () { return 'CustomerID'; }
        },
        ReportingService = function () {
            var self = this;

            this.id = null;
            this.event = null;

            this.cb = function (id, event) {
                self.id = id;
                self.event = event;
            };

            this.reset = function () {
                this.id = null
                this.event = null;
            };
        },
        google_trackConversion_mock = function (data) {
            window.google_track_data = data;
            window.google_track_called = true;
        },
        google_track_data = null,
        google_track_called = false,
        reportService = new ReportingService();

    before(function () {
        mParticle.EventType = EventType;
        mParticle.ProductActionType = ProductActionType;
        mParticle.IdentityType = IdentityType;
        mParticle.generateHash = function (name) {
            var hash = 0,
                i = 0,
                character;

            if (!name) {
                return null;
            }

            name = name.toString().toLowerCase();

            if (Array.prototype.reduce) {
                return name.split("").reduce(function (a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
            }

            if (name.length === 0) {
                return hash;
            }

            for (i = 0; i < name.length; i++) {
                character = name.charCodeAt(i);
                hash = ((hash << 5) - hash) + character;
                hash = hash & hash;
            }

            return hash;
        };

        window.google_trackConversion = google_trackConversion_mock;
    });

    function checkCommonProperties(){
        window.google_track_data.should.have.property("google_conversion_language", "en");
        window.google_track_data.should.have.property("google_conversion_color", "ffffff")
        window.google_track_data.should.have.property("google_conversion_format", "3")
        window.google_track_data.should.have.property("google_conversion_id", 'AW-123123123')
    }

    describe("Page View Conversion Label", function () {
        before(function () {

            var map = [{ "maptype": "EventClassDetails.Id", "value": "pageViewLabel123", "map": "0", "jsmap": mParticle.generateHash(MessageType.PageView + "" + 'Homepage') }]

            mParticle.forwarder.init({
                labels: JSON.stringify(map),
                conversionId: 'AW-123123123'
            }, reportService.cb, 1, true);
        });


        it('should have conversion labels for page view', function (done) {
            var successMessage = mParticle.forwarder.process({
                EventName: 'Homepage',
                EventDataType: MessageType.PageView,
                EventAttributes: {
                    showcase: 'something',
                    test: 'thisoneshouldgetmapped',
                    mp: 'rock'
                }
            });

            successMessage.should.not.be.null();
            successMessage.should.be.equal("Successfully sent to GoogleAdWords")
            checkCommonProperties();
            window.google_track_data.should.have.property('google_conversion_label', "pageViewLabel123");

            done();
        });
    });

    describe("Page Event Conversion Label", function () {
        before(function () {

            var map = [{ "maptype": "EventClass.Id", "value": "pageEventLabel123", "map": "0", "jsmap": mParticle.generateHash(MessageType.PageEvent + "" +  EventType.Navigation + 'Homepage') }]

            mParticle.forwarder.init({
                labels: JSON.stringify(map),
                conversionId: 'AW-123123123'
            }, reportService.cb, 1, true);
        });


        it('should have conversion labels for page event', function (done) {

            var successMessage = mParticle.forwarder.process({
                EventName: 'Homepage',
                EventDataType: MessageType.PageEvent,
                EventCategory: EventType.Navigation,
                EventAttributes: {
                    showcase: 'something',
                    test: 'thisoneshouldgetmapped',
                    mp: 'rock'
                }
            });

            successMessage.should.not.be.null();
            successMessage.should.be.equal("Successfully sent to GoogleAdWords")
            checkCommonProperties();
            window.google_track_data.should.have.property('google_conversion_label', "pageEventLabel123");

            done();
        });
    });


    describe("Commerce Event Conversion Label", function () {
        before(function () {

            var map = [{ "maptype": "EventClassDetails.Id", "value": "commerceLabel123", "map": "0", "jsmap": mParticle.generateHash(MessageType.Commerce + "" + "eCommerce - Purchase") }]

            mParticle.forwarder.init({
                labels: JSON.stringify(map),
                conversionId: 'AW-123123123'
            }, reportService.cb, 1, true);
        });

        it('should have conversion labels for commerce event', function (done) {
            var successMessage = mParticle.forwarder.process({
                EventName: "eCommerce - Purchase",
                EventDataType: MessageType.Commerce,
                ProductAction: {
                    ProductActionType: ProductActionType.Purchase,
                    ProductList: [
                        {
                            Sku: '12345',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 400,
                            CouponCode: null,
                            Quantity: 1
                        }
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TotalAmount: 450,
                    TaxAmount: 40,
                    ShippingAmount: 10,
                },
                CurrencyCode: "USD"
            });

            successMessage.should.not.be.null();
            successMessage.should.be.equal("Successfully sent to GoogleAdWords")
            checkCommonProperties();
            window.google_track_data.should.have.property('google_conversion_label', "commerceLabel123");

            done();
        });
    })

    describe("Custom Parameters", function () {
        before(function () {

            var labels = [{ "maptype": "EventClass.Id", "value": "pageEventLabel123", "map": "0", "jsmap": mParticle.generateHash(MessageType.PageEvent + "" + EventType.Navigation + 'Homepage') }]
            var attr = [{ "maptype": "EventAttributeClass.Id", "value": "mycustomprop", "map": "0", "jsmap": mParticle.generateHash(MessageType.PageEvent + "" + EventType.Navigation + 'attributekey') }]

            mParticle.forwarder.init({
                labels: JSON.stringify(labels),
                customParameters: JSON.stringify(attr),
                conversionId: 'AW-123123123'
            }, reportService.cb, 1, true);
        });

        it('should have custom params for page event', function (done) {

            var successMessage = mParticle.forwarder.process({
                EventName: 'Homepage',
                EventDataType: MessageType.PageEvent,
                EventCategory: EventType.Navigation,
                EventAttributes: {
                    attributekey: 'attributevalue'
                }
            });

            successMessage.should.not.be.null();
            successMessage.should.be.equal("Successfully sent to GoogleAdWords")
            checkCommonProperties();
            window.google_track_data.should.have.property('google_custom_params');
            Object.keys(window.google_track_data.google_custom_params).length.should.be.equal(1);
            window.google_track_data.google_custom_params.should.have.property('mycustomprop', 'attributevalue')
            done();
        });
    });

    describe("Unmapped conversion labels", function () {
        before(function () {

            var map = [{ "maptype": "EventClassDetails.Id", "value": "commerceLabel123", "map": "0", "jsmap": mParticle.generateHash(MessageType.Commerce + "" + "eCommerce - Purchase") }]

            mParticle.forwarder.init({
                labels: JSON.stringify(map),
                conversionId: 'AW-123123123'
            }, reportService.cb, 1, true);
        });

        it('should not forward unmapped events', function (done) {
            var failMessage = mParticle.forwarder.process({
                EventName: 'Something random',
                EventDataType: MessageType.Commerce,
                EventAttributes: {
                    showcase: 'something'
                }
            });

            failMessage.should.not.be.null();
            failMessage.should.be.containEql("Can't send to forwarder")
            done();
        });
    });


    describe("Bad Label Json", function () {
        before(function () {
            // The ids are calculated based on the events used in the tests below so they must match exactly.
            mParticle.forwarder.init({
                labels: 'baaaaaddddddd json',
                conversionId: 'AW-123123123'
            }, reportService.cb, 1, true);
        });


        it('should not forward with bad labels json', function (done) {

            var failMessage = mParticle.forwarder.process({
                EventName: 'Something random',
                EventDataType: MessageType.Commerce,
                EventAttributes: {
                    showcase: 'something'
                }
            });

            failMessage.should.not.be.null();
            failMessage.should.be.containEql("Can't send to forwarder")
            done();
        });
    });


    describe("Bad Custom Parameters Json", function () {
        before(function () {
            // The ids are calculated based on the events used in the tests below so they must match exactly.
            mParticle.forwarder.init({
                customParameters: 'sdpfuhasdflasdjfnsdjfsdjfn really baddd json',
                conversionId: 'AW-123123123'
            }, reportService.cb, 1, true);
        });


        it('should not forward with bad custom parameters json', function (done) {

            var failMessage = mParticle.forwarder.process({
                EventName: 'Something random',
                EventDataType: MessageType.Commerce,
                EventAttributes: {
                    showcase: 'something'
                }
            });

            failMessage.should.not.be.null();
            failMessage.should.be.containEql("Can't send to forwarder")
            done();
        });
    });

});
