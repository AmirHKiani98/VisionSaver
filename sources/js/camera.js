var $jscomp = $jscomp || {};
$jscomp.scope = {};
$jscomp.findInternal = function(z, M, G) {
    z instanceof String && (z = String(z));
    for (var U = z.length, Q = 0; Q < U; Q++) {
        var xa = z[Q];
        if (M.call(G, xa, Q, z))
            return {
                i: Q,
                v: xa
            }
    }
    return {
        i: -1,
        v: void 0
    }
}
;
$jscomp.ASSUME_ES5 = !1;
$jscomp.ASSUME_NO_NATIVE_MAP = !1;
$jscomp.ASSUME_NO_NATIVE_SET = !1;
$jscomp.SIMPLE_FROUND_POLYFILL = !1;
$jscomp.defineProperty = $jscomp.ASSUME_ES5 || "function" == typeof Object.defineProperties ? Object.defineProperty : function(z, M, G) {
    z != Array.prototype && z != Object.prototype && (z[M] = G.value)
}
;
$jscomp.getGlobal = function(z) {
    z = ["object" == typeof window && window, "object" == typeof self && self, "object" == typeof global && global, z];
    for (var M = 0; M < z.length; ++M) {
        var G = z[M];
        if (G && G.Math == Math)
            return G
    }
    throw Error("Cannot find global object");
}
;
$jscomp.global = $jscomp.getGlobal(this);
$jscomp.polyfill = function(z, M, G, U) {
    if (M) {
        G = $jscomp.global;
        z = z.split(".");
        for (U = 0; U < z.length - 1; U++) {
            var Q = z[U];
            Q in G || (G[Q] = {});
            G = G[Q]
        }
        z = z[z.length - 1];
        U = G[z];
        M = M(U);
        M != U && null != M && $jscomp.defineProperty(G, z, {
            configurable: !0,
            writable: !0,
            value: M
        })
    }
}
;
$jscomp.polyfill("Array.prototype.find", function(z) {
    return z ? z : function(z, G) {
        return $jscomp.findInternal(this, z, G).v
    }
}, "es6", "es3");
function Actions() {
    this.timerCommand = this.timerID = this.delay = this.carrier = this.outputToken = this.tour = this.preset = this.ftpPath = this.ftpPassword = this.ftpUser = this.ftpPort = this.ftpServer = this.ftpProtocol = this.imageCount = this.subjectFormat = this.recipients = this.smtpSender = this.smtpServerToken = this.fileName = this.type = this.name = "."
}
function AnalogVideo() {
    this.videoSource = ".";
    this.state = !1;
    this.mode = "."
}
function CameraCapabilities() {
    this.flipMode = this.highWind = this.parkConfig = this.hitachi231Extensions = this.bitRateControl = this.sector = this.privacyMask = this.dateTimeFormat = this.inverted = this.wiperConfig = "."
}
function DIO_Details() {
    this.logicalState = this.trigger = this.state = this.direction = this.idleState = this.delay = this.mode = this.type = this.token = "."
}
function DIO() {
    this.io = [new DIO_Details, new DIO_Details, new DIO_Details, new DIO_Details]
}
function DeviceInfo() {
    this.wiperState = this.sensorState = this.tiltState = this.panState = this.pressure = this.temperature = this.hardware = this.serialNumber = this.firmwareVersion = this.model = this.manufacturer = "."
}
function ExtensionOptions() {
    this.thermalMaxOpticalZoom = this.visibleMaxOpticalZoom = "."
}
function HttpsCertificate() {
    this.certificationPathID = this.keyID = this.signature = this.version = this.certificateContent = this.alias = this.certificateID = ".";
    this.assigned = !1;
    this.publicKey = this.validUntil = this.validFrom = this.subject = this.issuer = this.algorithm = this.serial = ".";
    this.selfSigned = !1
}
function HttpsUnusedKeys() {
    this.unusedKeys = ["."]
}
function HttpsConfiguration() {
    this.httpsState = !1;
    this.certificates = [new HttpsCertificate, new HttpsCertificate, new HttpsCertificate, new HttpsCertificate, new HttpsCertificate, new HttpsCertificate, new HttpsCertificate, new HttpsCertificate, new HttpsCertificate, new HttpsCertificate];
    this.unusedKeys = []
}
function ImagingOptions() {
    this.maxGain = this.maxFarLimit = this.maxNearLimit = "."
}
function MaxDigitalZoom() {
    this.maxThermalDigitalZoomLimit = this.maxVisibleDigitalZoomLimit = "."
}
function NetworkProtocolDescription() {
    this.protocolPort = this.protocolEnabled = this.protocolName = "."
}
function NetworkConfiguration() {
    this.dhcp_dns2 = this.dhcp_dns1 = this.dns2 = this.dns1 = this.dnsType = this.fromDHCP = this.gateway = this.port = this.protocol = this.hostname = this.hostnameFromDHCP = this.dhcpAddressPrefix = this.dhcpAddress = this.dhcp = this.ipAddressPrefix = this.ipAddress = this.ipv4Enabled = this.interfaceType = this.duplexSet = this.speedSet = this.autoNegotiateSet = this.duplex = this.speed = this.autoNegotiate = this.mtu = this.mac = this.enabled = ".";
    this.transportProtocols = [new NetworkProtocolDescription, new NetworkProtocolDescription, new NetworkProtocolDescription];
    this.serialProtocolAddress = this.serialProtocolStopBits = this.serialProtocolCharacterLength = this.serialProtocolParity = this.serialProtocolBaudRate = this.serialProtocolType = this.serialProtocolName = this.legacyNetworkTimeout = this.networkProtocolPort = this.networkProtocol = "."
}
function Osd() {
    this.order = this.backgroundTransparent = this.backgroundColorZ = this.backgroundColorY = this.backgroundColorX = this.fontColorTransparent = this.fontColorZ = this.fontColorY = this.fontColorX = this.fontSize = this.positionY = this.positionX = this.position = this.text = this.textStringType = this.type = this.token = ".";
    this.deleted = !1;
    this.originalType = ".";
    this.inCamera = !1;
    this.logoTransparency = this.timeFormat = this.dateFormat = this.filename = "."
}
function OSDBanner() {
    this.bottomColor = this.topColor = this.bottom = this.top = "."
}
function PMask() {
    this.enabled = !1;
    this.seeThrough = this.color = this.transparency = this.gradation = this.upperLimit = ".";
    this.mosaic = !1
}
function PMaskElement() {
    this.token = this.y = this.x = this.width = this.height = this.backgroundColor = ".";
    this.inCamera = !1
}
function Preset() {
    this.token = this.name = "."
}
function PresetForTour() {
    this.preset = new Preset;
    this.order = this.dwell = this.speedY = this.speedX = ".";
    this.deleted = !1;
    this.id = "."
}
function Positioner() {
    this.parkIndex = this.parkActivity = this.parkTimeout = this.parkState = this.autoFocusOnPTZ = this.proportionalPTZ = this.freezeVideo = this.intertedMount = this.highWind = this.autoFlip = ".";
    this.presets = [new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset, new Preset];
    this.tours = []
}
function RtspDigest() {
    this.state = !1
}
function Server() {
    this.path = this.security = this.password = this.username = this.port = this.address = this.name = this.type = "."
}
function SnapshotCapabilities() {
    this.visibleSnapshotResolutions = [];
    this.thermalSnapshotResolutions = []
}
function SnapshotProperties() {
    this.quality = this.height = this.width = this.videoSource = "."
}
function SnmpSettings() {
    this.state = !1;
    this.trapDestination = this.communityName = this.version = ".";
    this.traps = [new SnmpTrap, new SnmpTrap, new SnmpTrap, new SnmpTrap, new SnmpTrap];
    this.v3UserConfigured = !1
}
function SnmpTrap() {
    this.name = ".";
    this.state = !1
}
function Stages() {
    this.percentage = this.name = "."
}
function Sector() {
    this.token = this.title = this.upperLimit = this.lowerLimit = ".";
    this.deleted = !1
}
function ThermalServiceCapabilities() {
    this.resolution = this.model = "";
    this.enabled = !1
}
function ThermalImageSettings() {
    this.imageStabilizationLevel = this.imageStabilizationMode = this.noiseReductionLevel = this.sharpness = this.contrast = this.brightness = this.gainMode = this.gain = this.noiseReductionMode = this.rOI = this.colorPallete = this.picturePolarity = this.nucTimeInterval = "."
}
function ThermalZoomMode() {
    this.syncMode = "."
}
function Triggers() {
    this.scheduleType = this.presetToken = this.inputToken = this.type = this.name = ".";
    this.Saturday = this.Friday = this.Thursday = this.Wednesday = this.Tuesday = this.Monday = this.Sunday = !1;
    this.actions = this.secondStart = this.minuteStart = this.hourStart = this.yearStart = this.dayStart = this.monthStart = this.secondEnd = this.minuteEnd = this.hourEnd = this.yearEnd = this.dayEnd = this.monthEnd = this.year = this.day = this.month = this.second = this.minute = this.hour = this.day = ".";
    this.enabled = !1
}
function Tour() {
    this.time = this.duration = this.autoStart = this.direction = this.name = this.state = this.token = ".";
    this.presets = []
}
function VideoStream() {
    this.videoSource = this.jpegUtilization = this.h264Utilization = this.iframeburst = this.constrained = this.avgBitRate = this.bitRateMode = this.frameRate = this.rtspTimeout = this.multicastAutostart = this.multicastTTL = this.multicastPort = this.multicastAddr = this.multicastAddrType = this.h264Profile = this.govLength = this.bitrateLimit = this.encodingInterval = this.frameRateLimit = this.quality = this.height = this.width = this.encoding = this.useCount = this.name = ".";
    this.resolutionsAvailable = ["."]
}
function VideoProfile() {
    this.videoSource = this.multicast = this.streamName = this.profileName = "."
}
function User() {
    this.securityLevel = this.username = "."
}
var SOAP = function(z, M, G) {
    function U() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
            var f = 16 * Math.random() | 0;
            return ("x" === c ? f : f & 3 | 8).toString(16)
        })
    }
    function Q(c) {
        c = $(c).find("SOAP-ENV\\:Fault");
        return 0 < c.length ? (c = $(c).find("SOAP-ENV\\:Reason").text(),
        debugConsoleMessage(c, 3),
        c) : ""
    }
    function xa(c, f, k, h, m, d, a) {
        c = {};
        anonymousMode && (c = {
            "Rise-Anonymous": "Anonymous"
        });
        console.log(
            "c: {0} f: {1} k: {2} h: {3} m: {4} d: {5} a: {6}".format(c, f, k, h, m, d, a),
            "In SOAP::xa()"
        )
        $.ajax({
            url: m,
            type: "POST",
            contentType: "application/soap+xml; charset=utf-8",
            dataType: "xml",
            headers: c,
            beforeSend: function(c) {
                null !== f && f(c)
            },
            async: !0,
            data: d,
            timeout: Vb,
            success: function(c, d, f) {
                var m = Q(f.responseText);
                if ("" === m)
                    m = $(f.responseText).find("RebootNeeded"),
                    0 < m.length && m.text(),
                    null !== k && k(c, d, f, k, h);
                else {
                    debugConsoleMessage(m, 3);
                    switch (m) {
                    case "Sender not Authorized":
                        d = "Invalid username or password provided.";
                        break;
                    case "Not Implemented":
                        d = "This function is not available in the camera.";
                        break;
                    case "Validation constraint violation: invalid value in element 'extension:AutoFocusSensitivity'":
                        d = "The command sent to the camera was not formatted properly.";
                        break;
                    default:
                        d = 0 <= m.indexOf("Validation constraint violation: malformed XML in element") ? "The command sent to the camera was not formatted properly." : m
                    }
                    h(c, d, f)
                }
            },
            error: function(c, d, f) {
                switch (f) {
                case "timeout":
                    c = "The camera did not respond within the timeout range.";
                    break;
                case "Not Found":
                    c = "The camera did not find an interpretor for the command.";
                    break;
                default:
                    if ("string" === typeof f)
                        c = "" === f ? "An error occured while processing your request." : f;
                    else if (c = Q(f.responseXML),
                    null === c || void 0 === c)
                        c = "Unknown SOAP error occured."
                }
                debugConsoleMessage("Error sending SOAP request.  Status:{0} Reason:{1}".format(d, c), 3);
                null !== h && null !== c && h(null, c, null)
            }
        })
    }
    function jb(c, f) {
        console.log("In SOAP::jb() c: {0} f: {1}".format(c, f));
        var k = U().substr(0, 19);
        k = CryptoJS.enc.Utf8.parse(k);
        k = CryptoJS.enc.Base64.stringify(k);
        var h = CryptoJS.enc.Base64.parse(k).toString(CryptoJS.enc.Latin1)
          , m = (new Date).toISOString();
        f = CryptoJS.SHA1(CryptoJS.enc.Latin1.parse(h + m + f));
        f = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Hex.parse(f.toString()));
        return "<s:Header xmlns:s='http://www.w3.org/2003/05/soap-envelope'><wsse:Security xmlns:wsse='http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd' xmlns:wsu='http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd'><wsse:UsernameToken><wsse:Username>" + c + "</wsse:Username><wsse:Password Type='http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest'>" + f + "</wsse:Password><wsse:Nonce>" + k + "</wsse:Nonce><wsu:Created>" + m + "</wsu:Created></wsse:UsernameToken></wsse:Security></s:Header>"
    }
    function g(c, f, k) {
        var h = "all"
          , m = $(c).first();
        console.log("In SOAP::g() c: {0} f: {1} k: {2}".format(c, f, k));
        if (0 < m.length)
            switch (m = m[0].nodeName,
            m.substr(0, m.indexOf(":")).toLowerCase()) {
            case "imaging":
                h = ja.imaging;
                break;
            case "device":
                h = ja.device;
                break;
            case "media":
                h = ja.media;
                break;
            case "ptz":
                h = ja.ptz;
                break;
            case "dio":
                h = ja.dio;
                break;
            case "events":
                h = ja.events;
                break;
            case "actions":
                h = ja.actions;
                break;
            case "extension":
                h = ja.extension;
                break;
            case "thermal":
                h = ja.thermal;
                break;
            case "advsecurity":
                h = ja.advsecurity
            }
        c = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<soap:Envelope xmlns:soap='http://www.w3.org/2003/05/soap-envelope' xmlns:schema='http://www.onvif.org/ver10/schema' xmlns:device='http://www.onvif.org/ver10/device/wsdl' xmlns:imaging='http://www.onvif.org/ver20/imaging/wsdl' xmlns:media='http://www.onvif.org/ver10/media/wsdl' xmlns:ptz='http://www.onvif.org/ver20/ptz/wsdl' xmlns:dio='http://www.onvif.org/ver10/deviceIO/wsdl' xmlns:events='http://www.onvif.org/ver10/events/wsdl' xmlns:actions='http://updates.costarhd.com/ver1/riseactionengine/wsdl' xmlns:thermal='http://updates.costarhd.com/ver1/risethermal/wsdl' xmlns:advsecurity='http://www.onvif.org/ver10/advancedsecurity/wsdl' xmlns:extension='http://updates.costarhd.com/ver1/extension/wsdl'>{0}<soap:Body>{1}</soap:Body></soap:Envelope>".format(jb(Wb, Xb), c);
        m = "http:" === Ba ? "80" : "443";
        var d = "" === Yb ? m : Yb;
        m = Ba + "//" + kb + ":" + d + "/" + h;
        d = Ba + "//" + kb + ":" + d + "/onvif/" + h;
        "events" === h && (d = m);
        xa(h, null, f, k, d, c, null)
        return c
    }
    function Pa(c, f, k, h, m, d, a) {
        var b = new FormData;
        "configuration" === f ? b.append("file", new Blob([c],{
            type: "application/octet-stream"
        })) : b.append("file", c);
        lb = a;
        $.ajax({
            type: "POST",
            url: k,
            data: b,
            processData: !1,
            contentType: !1,
            cache: !1,
            dataType: "json",
            timeout: null === h ? 12E5 : h,
            beforeSend: function(c, d) {
                da(null, null, "Started")
            },
            complete: function(c, f) {
                200 === c.status && (debugConsoleMessage("File upload complete message received. rc={0} {0}".format(c.status, f), 1),
                null !== a && a(null, null, "recd"),
                null !== m && null !== d && null != a ? Ca(m, d, a, 1E3) : m())
            },
            statusCode: {
                200: function() {
                    da(null, 100, "Transferred");
                    debugConsoleMessage("The camera responded with 200: Upload Successfull", 4)
                },
                201: function() {
                    debugConsoleMessage("The camera responded with 201: Created", 3);
                    d(null, "File upload completed.  New resource created. HTTP-201")
                },
                202: function() {
                    debugConsoleMessage("The camera responded with 202: Accepted", 3);
                    d(null, "File upload completed.  Process continuing. HTTP-202")
                },
                203: function() {
                    debugConsoleMessage("The camera responded with 203: Partial", 3);
                    d(null, "File upload completed.  HTTP-203");
                    I = !0
                },
                204: function() {
                    debugConsoleMessage("The camera responded with 204: No Response", 3);
                    d(null, "File upload completed.  No response required. HTTP-204");
                    I = !0
                },
                205: function() {
                    debugConsoleMessage("The camera responded with 205: No content", 3);
                    d(null, "File upload completed.  No content received. HTTP-205");
                    I = !0
                },
                206: function() {
                    debugConsoleMessage("The camera responded with 206: Partial", 3);
                    d(null, "File upload completed.  Partial content returned. HTTP-206");
                    I = !0
                },
                301: function() {
                    debugConsoleMessage("The camera responded with 301: URI Moved Perminently", 3);
                    d(null, "File upload error.  URI Moved Permanently. HTTP-301")
                },
                302: function() {
                    debugConsoleMessage("The camera responded with 202: URI Moved Temporarily", 3);
                    d(null, "File upload error.  URI Moved Temporarily. HTTP-302")
                },
                303: function() {
                    debugConsoleMessage("The camera responded with 303: URI is not at this location", 3);
                    d(null, "File upload error.  URI is not at this location. HTTP-303");
                    I = !0
                },
                304: function() {
                    debugConsoleMessage("The camera responded with 304: Resource has changed", 3);
                    d(null, "File upload error.  URI has changed since last request. HTTP-304");
                    I = !0
                },
                305: function() {
                    debugConsoleMessage("The camera responded with 305: New Proxy Required", 3);
                    d(null, "File upload error.  A new proxy connection is required. HTTP-305");
                    I = !0
                },
                307: function() {
                    debugConsoleMessage("The camera responded with 307: Repeat request at another URI", 3);
                    d(null, "File upload error.  Repeat request at new location. HTTP-307");
                    I = !0
                },
                400: function() {
                    debugConsoleMessage("The camera responded with 400: Bad Request", 3);
                    d(null, "File upload error.  The request was not properly formed. HTTP-400");
                    I = !0
                },
                401: function() {
                    debugConsoleMessage("The camera responded with 401: Unauthorized", 3);
                    d(null, "File upload error.  The user is not authorized. HTTP-401");
                    I = !0
                },
                402: function() {
                    debugConsoleMessage("The camera responded with 402: Payment Required", 3);
                    d(null, "File upload error.  HTTP-402");
                    I = !0
                },
                403: function() {
                    debugConsoleMessage("The camera responded with 403: Forbidden", 3);
                    d(null, "File upload error.  Server refused to process file. HTTP-403");
                    I = !0
                },
                404: function() {
                    debugConsoleMessage("The camera responded with 404: Not Found", 3);
                    d(null, "File upload error.  The resource was not found. HTTP-404");
                    I = !0
                },
                405: function() {
                    debugConsoleMessage("The camera responded with 405: Not Supported", 3);
                    d(null, "File upload error.  This method is not supported by the camera. HTTP-405");
                    I = !0
                },
                406: function() {
                    debugConsoleMessage("The camera responded with 406: Payment Required", 3);
                    d(null, "File upload error.  The camera cannot generate the content. HTTP-406");
                    I = !0
                },
                408: function() {
                    debugConsoleMessage("The camera responded with 408: Time Out", 3);
                    d(null, "File upload error.  The file transfer timed out. HTTP-408");
                    I = !0
                },
                409: function() {
                    debugConsoleMessage("The camera responded with 409: Header Conflict", 3);
                    d(null, "File upload error.  The header did not match the URI. HTTP-409");
                    I = !0
                },
                410: function() {
                    debugConsoleMessage("The camera responded with 410: No Longer Available", 3);
                    d(null, "File upload error.  The resource is no longer available. HTTP-410");
                    I = !0
                },
                411: function() {
                    debugConsoleMessage("The camera responded with 411: Length Not Specified", 3);
                    d(null, "File upload error.  The request did not specify the required length. HTTP-411");
                    I = !0
                },
                412: function() {
                    debugConsoleMessage("The camera responded with 412: Precondition", 3);
                    d(null, "File upload error.  The server cannot satisfy on of the preconditions. HTTP-4123");
                    I = !0
                },
                413: function() {
                    debugConsoleMessage("The camera responded with 413: File Too Large", 3);
                    d(null, "File upload error.  The file was too large. HTTP-413");
                    I = !0
                },
                414: function() {
                    debugConsoleMessage("The camera responded with 414: URI Too Long", 3);
                    d(null, "File upload error.  The requested URI is too long. HTTP-414");
                    I = !0
                },
                415: function() {
                    debugConsoleMessage("The camera responded with 415: Media Type Not Supported", 3);
                    d(null, "File upload error.  The requested media type is not supported. HTTP-415");
                    I = !0
                },
                416: function() {
                    debugConsoleMessage("The camera responded with 416: Range Does Not Exist", 3);
                    d(null, "File upload error.  The content range does not exist. HTTP-416");
                    I = !0
                },
                417: function() {
                    debugConsoleMessage("The camera responded with 417: Header Requirements", 3);
                    d(null, "File upload error.  The server cannot satisfy the header requirements. HTTP-417");
                    I = !0
                },
                444: function() {
                    debugConsoleMessage("The camera responded with 444: Connection Closed", 3);
                    d(null, "File upload error.  The connection was closed with no response from the client. HTTP-444");
                    I = !0
                },
                500: function() {
                    debugConsoleMessage("The camera responded with 500: Internal Error.", 3);
                    d(null, "File upload error.  The server experienced a configuration error. HTTP-500");
                    I = !0
                },
                501: function() {
                    debugConsoleMessage("The camera responded with 501: Not Implemented.", 3);
                    d(null, "File upload error.  The server did not recognize the command. HTTP-501");
                    I = !0
                },
                503: function() {
                    debugConsoleMessage("The camera responded with 503: Server Unavailable.", 3);
                    d(null, "File upload error.  The server is currently unavailable. HTTP-503");
                    I = !0
                },
                504: function() {
                    debugConsoleMessage("The camera responded with 504: Gateway Timeout.", 3);
                    d(null, "File upload error.  The server gateway timed out waiting for another server. HTTP-504");
                    I = !0
                },
                505: function() {
                    debugConsoleMessage("The camera responded with 505: HTTP Not Supported.", 3);
                    d(null, "File upload error.  HTTP is not supported by the server. HTTP-505");
                    I = !0
                },
                507: function() {
                    debugConsoleMessage("The camera responded with 507: Insufficient Storage.", 3);
                    d(null, "File upload error.  The server is out of storage space. HTTP-507");
                    I = !0
                }
            },
            xhr: function() {
                var c = $.ajaxSettings.xhr();
                c.upload && c.upload.addEventListener("progress", da, !1);
                return c
            }
        })
    }
    function da(c, f, k) {
        null != lb && lb(c, f, k)
    }
    function Ca(c, f, k, h) {
        var m = "/upload/firmware/progress";
        "" !== getURLParameter("StatusPath") && (m = getURLParameter("StatusPath"));
        $.ajax({
            url: m,
            type: "POST",
            async: !0,
            success: function(c, f, k) {
                c = [new Stages, new Stages, new Stages, new Stages, new Stages, new Stages, new Stages, new Stages, new Stages, new Stages];
                f = k.getResponseHeader("Error");
                console.log("{0}::{1}".format("Error", f));
                null !== f && da(null, f, "Error");
                f = k.getResponseHeader("Unpacking");
                console.log("{0}::{1}".format("Unpacking", f));
                da(null, f, "Unpacking");
                f = k.getResponseHeader("Verification");
                console.log("{0}::{1}".format("Verification", f));
                da(null, f, "Verification");
                f = k.getResponseHeader("InstallStages");
                if (null !== f) {
                    f = f.split(",");
                    for (var d = 0; d < f.length; d++)
                        c[d].name = f[d],
                        c[d].percentage = k.getResponseHeader(f[d]),
                        console.log("{0}::{1}".format(c[d].name, c[d].percentage)),
                        da(null, c[d].percentage, c[d].name)
                }
                c = k.getResponseHeader("Reboot");
                console.log("{0}::{1}".format("Reboot", c));
                da(null, c, "Reboot");
                k = k.getResponseHeader("InstallComplete");
                console.log("{0}::{1}".format("Installation Complete", k));
                da(null, k, "InstallComplete")
            },
            error: function(c, f, k) {
                debugConsoleMessage("POST to {0} resulted in an error {1}".format(m, k), 3)
            }
        }).done(function(d) {
            I || Sc || setTimeout(function() {
                Ca(c, f, k, h)
            }, h)
        }).fail(function() {
            setTimeout(function() {
                Ca(c, f, k, h)
            }, h)
        })
    }
    function mb(c, f, k, h, m, d, a, b) {
        m ? g(H.StartFirmwareUpgrade, function(f, m, Rc) {
            f = k;
            null === f && (f = $(Rc.responseText).find("tds\\:UploadUri").text());
            debugConsoleMessage("Sent <d:StartFirmwareUpgrade/>.  Response:{0}".format(f), 1);
            Pa(c, "firmware", f, h, d, a, b)
        }, a) : Pa(c, f, k, h, d, a, b)
    }
    function nb(c, f, k) {
        c = r.ZoomMagnification.format(c);
        g(c, function(c, m, d) {
            Q(d.responseXML) && k(c, m, d);
            var h = $(d.responseText).find("tcohu\\:Magnification").text();
            "" !== h ? (debugConsoleMessage("Current Magnification is {0}x".format(Math.floor(Number(h) + .02)), 1),
            f(h)) : k(c, m, d)
        }, k)
    }
    function ob(c, f, k, h) {
        c = r.Login.format(c);
        g(c, function(c, d, f) {
            c = $(f.responseText).find("tcohu\\:String").text();
            d = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(c));
            "" !== d ? (c = "",
            d = n(d, null, "UserType", 0),
            "strEmpty" !== d.text() && (c = d.text()),
            debugConsoleMessage("User Type: {0}".format(c), 1),
            debugConsoleMessage("humanMsgTimeout changed to: {0}".format(humanMsgTimeout), 0),
            null !== k && k(c)) : h(null, "Invalid response from the camera.")
        }, h)
    }
    function u(c, f, k) {
        var h = -1
          , a = -1;
        f = c.indexOf(f);
        return 0 <= f ? (h = c.indexOf(k, f),
        0 <= h && (a = c.indexOf('"', h + k.length + 2),
        0 <= a) ? c = c.substring(h + k.length + 2, a) : a) : h
    }
    function B(c, f) {
        var k = -1;
        var h = c.indexOf(f + "=", 0);
        return 0 <= h && (k = c.indexOf('"', h + f.length + 2),
        0 <= k) ? c = c.substring(h + f.length + 2, k) : k
    }
    function n(c, f, k, h, a) {
        var d = f;
        "Chrome" === Qa() && null !== d && (d = f.split(":"),
        d = 2 <= d.length ? f + ", " + d : f);
        if (null !== d && (c = $(c).find(d),
        jQuery.isEmptyObject(c)))
            return h(null, "Error parsing response from camera. 0x00{0}:0".format(a)),
            "strEmpty";
        if (null !== k && void 0 !== k) {
            d = k;
            "Chrome" === Qa() && (d = k.split(":"),
            d = 2 <= d.length ? k + ", " + d : k);
            c = $(c).find(d);
            if (jQuery.isEmptyObject(c))
                return h(null, "Error parsing response from camera. 0x00{0}:1".format(a)),
                "strEmpty";
            debugConsoleMessage("{0} {1} ONVIF response.  Found: {2}".format(f, k, c.text()), 0)
        }
        return c
    }
    function p(c) {
        for (var f = 0; 8 > f; f++)
            if (t[f].name === c)
                return f;
        return -1
    }
    function pb(c) {
        x[c].name = ".";
        x[c].type = ".";
        x[c].fileName = ".";
        x[c].smtpServerToken = ".";
        x[c].smtpSender = ".";
        x[c].recipients = ".";
        x[c].subjectFormat = ".";
        x[c].imageCount = ".";
        x[c].ftpProtocol = ".";
        x[c].ftpServer = ".";
        x[c].ftpPort = ".";
        x[c].ftpUser = ".";
        x[c].ftpPassword = ".";
        x[c].ftpPath = ".";
        x[c].preset = ".";
        x[c].tour = ".";
        x[c].outputToken = ".";
        x[c].carrier = ".";
        x[c].delay = ".";
        x[c].timerID = ".";
        x[c].timerCommand = "."
    }
    function qb(c) {
        E.certificates[c].alias = ".";
        E.certificates[c].certificateID = ".";
        E.certificates[c].certificateContent = ".";
        E.certificates[c].version = ".";
        E.certificates[c].signature = ".";
        E.certificates[c].keyID = ".";
        E.certificates[c].certificationPathID = ".";
        E.certificates[c].assigned = !1;
        E.certificates[c].serial = ".";
        E.certificates[c].algorithm = ".";
        E.certificates[c].issuer = ".";
        E.certificates[c].subject = ".";
        E.certificates[c].validFrom = ".";
        E.certificates[c].validUntil = ".";
        E.certificates[c].publicKey = ".";
        E.certificates[c].selfSigned = !1
    }
    function rb(c) {
        A[c].token = ".";
        A[c].type = ".";
        A[c].textStringType = ".";
        A[c].text = ".";
        A[c].position = ".";
        A[c].positionX = ".";
        A[c].positionY = ".";
        A[c].fontSize = ".";
        A[c].fontColorX = ".";
        A[c].fontColorY = ".";
        A[c].fontColorZ = ".";
        A[c].fontColorTransparent = ".";
        A[c].backgroundColorX = ".";
        A[c].backgroundColorY = ".";
        A[c].backgroundColorZ = ".";
        A[c].backgroundTransparent = ".";
        A[c].order = ".";
        A[c].deleted = !1;
        A[c].originalType = ".";
        A[c].inCamera = !1;
        A[c].filename = ".";
        A[c].dateFormat = ".";
        A[c].timeFormat = "."
    }
    function sb(c) {
        Z[c].backgroundColor = ".";
        Z[c].height = ".";
        Z[c].width = ".";
        Z[c].x = ".";
        Z[c].y = ".";
        Z[c].token = ".";
        Z[c].inCamera = !1
    }
    function tb(c) {
        ka[c].lowerLimit = ".";
        ka[c].upperLimit = ".";
        ka[c].title = ".";
        ka[c].token = ".";
        ka[c].deleted = !1
    }
    function ub(c) {
        T[c].name = ".";
        T[c].address = ".";
        T[c].port = ".";
        T[c].username = ".";
        T[c].password = ".";
        T[c].security = ".";
        T[c].type = ".";
        T[c].path = "."
    }
    function vb(c) {
        v[c].name = ".";
        v[c].type = ".";
        v[c].inputToken = ".";
        v[c].presetToken = ".";
        v[c].scheduleType = ".";
        v[c].Sunday = !1;
        v[c].Monday = !1;
        v[c].Tuesday = !1;
        v[c].Wednesday = !1;
        v[c].Thursday = !1;
        v[c].Friday = !1;
        v[c].Saturday = !1;
        v[c].day = ".";
        v[c].hour = ".";
        v[c].minute = ".";
        v[c].second = ".";
        v[c].month = ".";
        v[c].day = ".";
        v[c].year = ".";
        v[c].monthEnd = ".";
        v[c].dayEnd = ".";
        v[c].yearEnd = ".";
        v[c].hourEnd = ".";
        v[c].minuteEnd = ".";
        v[c].secondEnd = ".";
        v[c].monthStart = ".";
        v[c].dayStart = ".";
        v[c].yearStart = ".";
        v[c].hourStart = ".";
        v[c].minuteStart = ".";
        v[c].secondStart = ".";
        v[c].actions = "."
    }
    function wb(c) {
        K.presets[c].name = ".";
        K.presets[c].token = "."
    }
    function Ra(c) {
        X[c].multicast = ".";
        X[c].streamName = ".";
        X[c].profileName = ".";
        X[c].videoSource = "."
    }
    function Sa(c) {
        t[c].name = ".";
        t[c].useCount = ".";
        t[c].encoding = ".";
        t[c].width = ".";
        t[c].height = ".";
        t[c].quality = ".";
        t[c].frameRateLimit = ".";
        t[c].encodingInterval = ".";
        t[c].bitrateLimit = ".";
        t[c].govLength = ".";
        t[c].h264Profile = ".";
        t[c].multicastAddrType = ".";
        t[c].multicastAddr = ".";
        t[c].multicastPort = ".";
        t[c].multicastTTL = ".";
        t[c].multicastAutostart = ".";
        t[c].rtspTimeout = ".";
        t[c].frameRate = ".";
        t[c].bitRateMode = ".";
        t[c].avgBitRate = ".";
        t[c].constrained = ".";
        t[c].iframeburst = "."
    }
    function xb(c) {
        oa[c].username = ".";
        oa[c].securityLevel = "."
    }
    function Qa() {
        var c = !!window.opr && !!opr.addons || !!window.opera || 0 <= navigator.userAgent.indexOf(" OPR/")
          , f = "undefined" !== typeof InstallTrigger
          , k = 0 < Object.prototype.toString.call(window.HTMLElement).indexOf("Constructor")
          , h = !!document.documentMode;
        return h ? "InternetExplorer" : window.chrome && window.chrome.webstore ? "Chrome" : f ? "Firefox" : k ? "Safari" : c ? "Opera" : !h && window.StyleMedia ? "Microsoft Edge" : "Unknown"
    }
    function yb(c, f, k, h, a) {
        f = c = "";
        a = $(k.responseText).find("tas\\:KeyID");
        0 < a.length && (c = a[0].textContent);
        $(this);
        a = $(k.responseText).find("tas\\:EstimatedCreationTime");
        0 < a.length && (f = readDurationFromXMLString(a[0].textContent)[5]);
        h(c, f)
    }
    function zb(c, f, k, h, a) {
        var d = ""
          , m = ""
          , b = 0
          , e = "";
        for (c = 0; 64 > c; c++)
            pb(c);
        $(k.responseText).find("tRiseAE\\:Action").each(function() {
            d = $(this);
            m = $(this);
            d = d.find("tRiseAE\\:token");
            0 < d.length && (x[b].name = d[0].textContent);
            d = m;
            d = d.find("tRiseAE\\:actionID");
            0 < d.length && (x[b].type = d[0].textContent);
            d = m;
            d = d.find("tRiseAE\\:actionConfiguration");
            0 < d.length && (d = d.find("tRiseAE\\:outputToken"),
            0 < d.length && (x[b].outputToken = d[0].textContent.slice(d[0].textContent.length - 1, d[0].textContent.length)),
            d = $(this),
            d = d.find("tRiseAE\\:userText"),
            0 < d.length && (e = d[0].textContent),
            d = $(this),
            d = d.find("tRiseAE\\:presetToken"),
            0 < d.length && (x[b].preset = d[0].textContent),
            d = $(this),
            d = d.find("tRiseAE\\:tourToken"),
            0 < d.length && (x[b].tour = d[0].textContent),
            d = $(this),
            d = d.find("tRiseAE\\:emailServerToken"),
            0 < d.length && (x[b].smtpServerToken = d[0].textContent),
            d = $(this),
            d = d.find("tRiseAE\\:fileNameOptions"),
            0 < d.length && ($(this),
            x[b].fileName = "",
            d = d.find("tRiseAE\\:option").each(function() {
                var c = $(this);
                c = c.find("tRiseAE\\:userText");
                0 < c.length && (e = c[0].textContent);
                x[b].fileName = 0 < x[b].fileName.length ? "UserText" !== this.textContent ? "TriggerToken" !== this.textContent ? "TriggerName" !== this.textContent ? x[b].fileName + "_ " + this.textContent + " " : x[b].fileName + "_ TriggerType " : x[b].fileName + "_ TriggerName " : x[b].fileName + "_" + e : "UserText" !== this.textContent ? "TriggerToken" !== this.textContent ? "TriggerName" !== this.textContent ? " " + this.textContent + " " : " TriggerType " : " TriggerName " : e
            })));
            d = m;
            d = d.find("tRiseAE\\:imageCount");
            0 < d.length && (x[b].imageCount = d[0].textContent);
            d = m;
            d = d.find("tRiseAE\\:sendEmailConfiguration");
            0 === d.length && (d = m,
            d = d.find("tRiseAE\\:email"));
            0 < d.length && (m = d,
            d = d.find("tRiseAE\\:emailServerToken"),
            0 < d.length && (x[b].smtpServerToken = d[0].textContent),
            d = m,
            d = d.find("tRiseAE\\:recipients"),
            0 < d.length && (x[b].recipients = d[0].textContent),
            0 < d[0].textContent.indexOf("att.net") && (x[b].carrier = "ATT"),
            0 < d[0].textContent.indexOf("sprintpcs.com") && (x[b].carrier = "Sprint"),
            0 < d[0].textContent.indexOf("sprint.com") && (x[b].carrier = "Sprint"),
            0 < d[0].textContent.indexOf("tmomail.net") && (x[b].carrier = "T-Mobile"),
            0 < d[0].textContent.indexOf("uscc.net") && (x[b].carrier = "US Cellular"),
            0 < d[0].textContent.indexOf("vtext.com") && (x[b].carrier = "Verizon"),
            0 < d[0].textContent.indexOf("vzwpix.com") && (x[b].carrier = "Verizon"),
            d = m,
            d = d.find("tRiseAE\\:sender"),
            0 < d.length && (x[b].smtpSender = d[0].textContent),
            d = m,
            d = d.find("tRiseAE\\:subjectFormat"),
            0 < d.length && (x[b].subjectFormat = "",
            $(this),
            d = d.find("tRiseAE\\:option").each(function() {
                var c = m;
                e = "";
                c = c.find("tRiseAE\\:userText");
                0 < c.length && (e = c[0].textContent);
                x[b].subjectFormat = 0 < x[b].subjectFormat.length ? "UserText" !== this.textContent ? "TriggerToken" !== this.textContent ? "TriggerName" !== this.textContent ? x[b].subjectFormat + "_ " + this.textContent + " " : x[b].subjectFormat + "_ TriggerType " : x[b].subjectFormat + "_ TriggerName " : x[b].subjectFormat + "_" + e : "UserText" !== this.textContent ? "TriggerToken" !== this.textContent ? "TriggerName" !== this.textContent ? " " + this.textContent + " " : " TriggerType " : " TriggerName " : e
            })));
            d = $(this);
            d = d.find("tRiseAE\\:ftpSnapshotConfiguration");
            0 < d.length && (m = $(this),
            d = d.find("tRiseAE\\:imageCount"),
            0 < d.length && (x[b].imageCount = d[0].textContent),
            d = m,
            d = d.find("tRiseAE\\:ftpServerToken"),
            0 < d.length && (x[b].ftpServer = d[0].textContent),
            d = m,
            d = d.find("tRiseAE\\:fileNameOptions"),
            0 < d.length && ($(this),
            x[b].fileName = "",
            d = d.find("tRiseAE\\:option").each(function() {
                var c = $(this);
                c = c.find("tRiseAE\\:userText");
                0 < c.length && (e = c[0].textContent);
                x[b].fileName = 0 < x[b].fileName.length ? "UserText" !== this.textContent ? "TriggerToken" !== this.textContent ? "TriggerName" !== this.textContent ? x[b].fileName + "_ " + this.textContent + " " : x[b].fileName + "_ TriggerType " : x[b].fileName + "_ TriggerName " : x[b].fileName + "_" + e : "UserText" !== this.textContent ? "TriggerToken" !== this.textContent ? "TriggerName" !== this.textContent ? " " + this.textContent + " " : " TriggerType " : " TriggerName " : e
            })));
            d = $(this);
            d = d.find("tRiseAE\\:Delay");
            0 < d.length && (x[b].delay = d[0].textContent);
            d = $(this);
            d = d.find("tRiseAE\\:controlTimerScheduler");
            0 < d.length && (m = $(this),
            d = d.find("tRiseAE\\:timerSchedulerId"),
            0 < d.length && (x[b].timerID = d[0].textContent),
            d = m,
            d = d.find("tRiseAE\\:timerSchedulerCommand"),
            0 < d.length && (x[b].timerCommand = d[0].textContent));
            b++
        });
        h()
    }
    function Ab(c, f, k, h, a) {
        var d = ""
          , b = ""
          , m = 0;
        for (c = 0; 32 > c; c++)
            vb(c);
        $(k.responseText).find("tRiseAE\\:ActionTrigger").each(function() {
            d = $(this);
            d = d.find("tRiseAE\\:token");
            0 < d.length && (v[m].name = d[0].textContent);
            d = $(this);
            d = d.find("tRiseAE\\:actionTriggerID");
            0 < d.length && (v[m].type = d[0].textContent);
            d = $(this);
            d = d.find("tRiseAE\\:inputToken");
            0 < d.length && (v[m].inputToken = d[0].textContent.slice(d[0].textContent.length - 1, d[0].textContent.length));
            d = $(this);
            d = d.find("tRiseAE\\:presetToken");
            0 < d.length && (v[m].presetToken = d[0].textContent);
            d = $(this);
            d = d.find("tRiseAE\\:Weekdays").each(function() {
                d = $(this);
                0 < d.length && ("Sunday" === d[0].textContent && (v[m].Sunday = !0),
                "Monday" === d[0].textContent && (v[m].Monday = !0),
                "Tuesday" === d[0].textContent && (v[m].Tuesday = !0),
                "Wednesday" === d[0].textContent && (v[m].Wednesday = !0),
                "Thursday" === d[0].textContent && (v[m].Thursday = !0),
                "Friday" === d[0].textContent && (v[m].Friday = !0),
                "Saturday" === d[0].textContent && (v[m].Saturday = !0))
            });
            d = $(this);
            d = d.find("tRiseAE\\:actionTriggerConfiguration");
            0 < d.length && (d = $(this),
            d = d.find("tRiseAE\\:type"),
            0 < d.length && (v[m].scheduleType = d[0].textContent));
            d = $(this);
            d = d.find("tRiseAE\\:Time");
            0 < d.length && (d = $(this),
            d = d.find("tt\\:Hour"),
            0 < d.length && (v[m].hour = d[0].textContent),
            d = $(this),
            d = d.find("tt\\:Minute"),
            0 < d.length && (v[m].minute = d[0].textContent),
            d = $(this),
            d = d.find("tt\\:Second"),
            0 < d.length && (v[m].second = d[0].textContent));
            d = $(this);
            d = d.find("tRiseAE\\:Schedule");
            0 < d.length && (d = $(this),
            d = d.find("tt\\:Year"),
            0 < d.length && (v[m].year = d[0].textContent),
            d = $(this),
            d = d.find("tt\\:Month"),
            0 < d.length && (v[m].month = d[0].textContent),
            d = $(this),
            d = d.find("tt\\:Day"),
            0 < d.length && (v[m].day = d[0].textContent),
            d = $(this),
            d = d.find("tt\\:Hour"),
            0 < d.length && (v[m].hour = d[0].textContent),
            d = $(this),
            d = d.find("tt\\:Minute"),
            0 < d.length && (v[m].minute = d[0].textContent),
            d = $(this),
            d = d.find("tt\\:Second"),
            0 < d.length && (v[m].second = d[0].textContent));
            d = $(this);
            d = d.find("tRiseAE\\:schedulerConfiguration");
            0 < d.length && (d = $(this),
            d = d.find("tRiseAE\\:enabled"),
            0 < d.length && (v[m].enabled = "true" === d[0].textContent ? !0 : !1));
            d = $(this);
            d = d.find("tRiseAE\\:timerConfiguration");
            0 < d.length && (d = $(this),
            d = d.find("tRiseAE\\:days"),
            0 < d.length && (v[m].day = d[0].textContent),
            d = $(this),
            d = d.find("tRiseAE\\:hours"),
            0 < d.length && (v[m].hour = d[0].textContent),
            d = $(this),
            d = d.find("tRiseAE\\:minutes"),
            0 < d.length && (v[m].minute = d[0].textContent),
            d = $(this),
            d = d.find("tRiseAE\\:seconds"),
            0 < d.length && (v[m].second = d[0].textContent),
            d = $(this),
            d = d.find("tRiseAE\\:start"),
            0 < d.length && (d = $(this),
            d = d.find("tt\\:Time"),
            0 < d.length && (d = $(this),
            d = d.find("tt\\:Hour"),
            0 < d.length && (v[m].hourStart = d[0].textContent),
            d = $(this),
            d = d.find("tt\\:Minute"),
            0 < d.length && (v[m].minuteStart = d[0].textContent),
            d = $(this),
            d = d.find("tt\\:Second"),
            0 < d.length && (v[m].secondStart = d[0].textContent)),
            d = $(this),
            d = d.find("tt\\:Date"),
            0 < d.length && (d = $(this),
            d = d.find("tt\\:Year"),
            0 < d.length && (v[m].yearStart = d[0].textContent),
            d = $(this),
            d = d.find("tt\\:Month"),
            0 < d.length && (v[m].monthStart = d[0].textContent),
            d = $(this),
            d = d.find("tt\\:Day"),
            0 < d.length && (v[m].dayStart = d[0].textContent))),
            d = $(this),
            d = d.find("tRiseAE\\:End"),
            0 < d.length && (b = d,
            d = d.find("tt\\:Time"),
            0 < d.length && (d = d.find("tt\\:Hour"),
            0 < d.length && (v[m].hourEnd = d[0].textContent),
            d = b,
            d = d.find("tt\\:Minute"),
            0 < d.length && (v[m].minuteEnd = d[0].textContent),
            d = b,
            d = d.find("tt\\:Second"),
            0 < d.length && (v[m].secondEnd = d[0].textContent)),
            d = b,
            d = d.find("tt\\:Date"),
            0 < d.length && (d = d.find("tt\\:Year"),
            0 < d.length && (v[m].yearEnd = d[0].textContent),
            d = b,
            d = d.find("tt\\:Month"),
            0 < d.length && (v[m].monthEnd = d[0].textContent),
            d = b,
            d = d.find("tt\\:Day"),
            0 < d.length && (v[m].dayEnd = d[0].textContent))),
            d = $(this),
            d = d.find("tRiseAE\\:enabled"),
            0 < d.length && (v[m].enabled = "true" === d[0].textContent ? !0 : !1));
            d = $(this);
            d = d.find("tRiseAE\\:actionList");
            0 < d.length && (d = d.find("tRiseAE\\:actionToken").each(function() {
                d = $(this);
                0 < d.length && (v[m].actions = "." === v[m].actions ? d[0].textContent : v[m].actions + "&" + d[0].textContent)
            }));
            m++
        });
        h()
    }
    function Bb(c, f, k, h, m) {
        var d = ""
          , b = 0;
        for (c = 0; c < E.certificates.length; c++)
            qb(c);
        $(k.responseText).find("tas\\:Certificate").each(function() {
            d = $(this).find("tas\\:CertificateID");
            0 < d.length && (E.certificates[b].certificateID = d[0].textContent);
            d = $(this).find("tas\\:KeyID");
            0 < d.length && (E.certificates[b].keyID = d[0].textContent);
            d = $(this).find("tas\\:Alias");
            0 < d.length && (E.certificates[b].alias = d[0].textContent);
            d = $(this).find("tas\\:CertificateContent");
            if (0 < d.length) {
                E.certificates[b].certificateContent = d[0].textContent;
                var c = new X509;
                c.readCertPEM("-----BEGIN CERTIFICATE-----" + E.certificates[b].certificateContent + "-----END CERTIFICATE-----");
                E.certificates[b].serial = c.getSerialNumberHex();
                E.certificates[b].issuer = c.getIssuerString();
                E.certificates[b].validFrom = zulutodate(c.getNotBefore());
                E.certificates[b].validUntil = zulutodate(c.getNotAfter());
                E.certificates[b].subject = c.getSubjectString();
                E.certificates[b].publicKey = c.getPublicKeyHex();
                E.certificates[b].algorithm = c.getSignatureAlgorithmName();
                E.certificates[b].version = c.getVersion();
                E.certificates[b].signature = c.getSignatureValueHex()
            }
            b++
        });
        h()
    }
    function Cb(c, f, k, h, m) {
        var d = ""
          , b = []
          , a = 0;
        $(k.responseText).find("tas\\:CertificationPathID").each(function() {
            d = $(this);
            0 < d.length && (b[a] = d[0].textContent,
            a++)
        });
        h(b)
    }
    function Db(c, f, k, h, m) {
        var d = ".";
        $(k.responseText).find("tcohu\\:GetAnalogVideoResponse").each(function() {
            d = $(this);
            d = d.find("tcohu\\:VideoSourceToken");
            0 < d.length && (Ta.videoSource = d[0].textContent);
            d = $(this);
            d = d.find("tcohu\\:State");
            0 < d.length && (Ta.state = d[0].textContent);
            d = $(this);
            d = d.find("tcohu\\:Mode");
            0 < d.length && (Ta.mode = d[0].textContent)
        });
        h()
    }
    function la(c, f, k, h) {
        f = p(c);
        for (k = 0; 4 > k; k++)
            switch (k) {
            case 0:
                c = n(h.responseXML, "tcohu\\:GetBitRateResponse", "tcohu\\:BitRateMode", k);
                "strEmpty" !== c.text() && (t[f].bitRateMode = c.text());
                break;
            case 1:
                c = n(h.responseXML, "tcohu\\:GetBitRateResponse", "tcohu\\:GOP", k);
                "strEmpty" !== c.text() && (t[f].govLength = c.text());
                break;
            case 2:
                c = n(h.responseXML, "tcohu\\:GetBitRateResponse", "tcohu\\:FrameRate", k);
                "strEmpty" !== c.text() && (t[f].frameRate = c.text());
                break;
            case 3:
                t[f].avgBitRate = u(h.responseText, "tcohu:Constant", "AvgBitRate")
            }
    }
    function Eb(c, f, k, h, m) {
        var d = ""
          , b = ""
          , a = ""
          , e = ""
          , q = "";
        $(k.responseText).find("tas\\:Certificate").each(function() {
            d = $(this).find("tas\\:CertificateID");
            0 < d.length && (b = d[0].textContent);
            d = $(this).find("tas\\:KeyID");
            0 < d.length && (a = d[0].textContent);
            d = $(this).find("tas\\:Alias");
            0 < d.length && (e = d[0].textContent);
            d = $(this).find("tas\\:CertificateContent");
            0 < d.length && (q = d[0].textContent)
        });
        h(b, a, e, q)
    }
    function Fb(c, f, k, h, b, d) {
        var m = ""
          , a = ""
          , e = !1;
        $(h.responseText).find("tas\\:CertificationPath").each(function() {
            m = $(this).find("tas\\:CertificateID");
            0 < m.length && (a = m[0].textContent,
            e = !0)
        });
        if (e)
            for (f = 0; f < E.certificates.length; f++)
                if (a === E.certificates[f].certificateID) {
                    E.certificates[f].certificationPathID = c;
                    break
                }
        b()
    }
    function ma(c, f, k, h) {
        f = p(c);
        for (k = 0; 1 > k; k++)
            switch (k) {
            case 0:
                c = n(h.responseXML, "tcohu\\:GetConstraintModeResponse", "tcohu\\:State", k),
                "strEmpty" !== c.text() && (t[f].constrained = c.text())
            }
    }
    function na(c, f, k, h) {
        f = p(c);
        for (k = 0; 1 > k; k++)
            switch (k) {
            case 0:
                c = n(h.responseXML, "tcohu\\:GetIFrameBurstSettingResponse", "tcohu\\:BurstSetting", k),
                "strEmpty" !== c.text() && (t[f].iframeburst = c.text())
            }
    }
    function Gb(c, f, k, h, b) {
        var d, m = 0;
        $(k.responseText).find("tmd\\:DigitalInputs").each(function() {
            d = $(this);
            0 < d.length && (m = parseInt(B(d[0].outerHTML, "token"), 10),
            aa.io[m].token = m,
            aa.io[m].direction = "Input")
        });
        h()
    }
    function Hb(c, f, k, h, m) {
        var d, b = 0;
        $(k.responseText).find("tcohu\\:DigitalOutput").each(function() {
            d = $(this).find("tcohu\\:LogicalState");
            0 < d.length && (aa.io[b].logicalState = d[0].textContent);
            b++
        });
        h()
    }
    function Ua(c, f, k, h, b) {
        var d = ""
          , m = "";
        $(k.responseText).find("tcohu\\:Item").each(function() {
            d = $(this).find("tcohu\\:Name");
            if (0 < d.length)
                switch (m = $(this).find("tcohu\\:Status"),
                d[0].textContent) {
                case "PanState":
                    0 < m.length && (ha.panState = m[0].textContent);
                    break;
                case "SensorState":
                    0 < m.length && (ha.sensorState = m[0].textContent);
                    break;
                case "SystemTemperature":
                    0 < m.length && (ha.temperature = m[0].textContent);
                    break;
                case "SystemPressure":
                    0 < m.length && (ha.pressure = m[0].textContent);
                    break;
                case "TiltState":
                    0 < m.length && (ha.tiltState = m[0].textContent);
                    break;
                case "WiperState":
                    0 < m.length && (ha.wiperState = m[0].textContent)
                }
        });
        h()
    }
    function Ib(c, f, k, h, m) {
        var d = "";
        c = "";
        $(k.responseText).find("tcohu\\:Font").each(function() {
            d = d + $(this)[0].textContent + ";"
        });
        k = n(k.responseXML, "tcohu\\:GetFontResponse", "tcohu\\:Current", "0x0001");
        "strEmpty" !== k.text() && (c = k.text());
        h(d, c)
    }
    function Jb(c, f, k, h, m, d) {
        var b = "";
        $(h.responseText).find("timg\\:ImagingSettings").each(function() {
            b = $(this);
            b = b.find("tt\\:Mode");
            0 < b.length && "Thermal Camera" === c && (ca.gainMode = b[0].textContent);
            b = $(this);
            b = b.find("tt\\:Gain");
            0 < b.length && "Thermal Camera" === c && (ca.gain = b[0].textContent)
        });
        ca.brightness = n(h.responseXML, "timg\\:ImagingSettings", "tt\\:Brightness", 0).text();
        ca.contrast = n(h.responseXML, "timg\\:ImagingSettings", "tt\\:Contrast", 0).text();
        ca.sharpness = n(h.responseXML, "timg\\:ImagingSettings", "tt\\:Sharpness", 0).text();
        ca.imageStabilizationLevel = n(h.responseText, "tt\\:ImageStabilization", "tt\\:Level").text();
        ca.imageStabilizationMode = n(h.responseText, "tt\\:ImageStabilization", "tt\\:Mode").text();
        ca.noiseReductionLevel = n(h.responseText, "tt\\:NoiseReduction", "tt\\:Level").text();
        m()
    }
    function ya(c, f, k, b, m) {
        c = parseInt(B(k.responseText, "PortNum"), 10);
        aa.io[c].trigger = B(k.responseText, "Trigger");
        aa.io[c].state = B(k.responseText, "State")
    }
    function Kb(c, f, k, b, m, d) {
        var h = "";
        $(b.responseText).find("tcohu\\:GetMaxDigitalZoomLimitResponse").each(function() {
            h = $(this);
            h = h.find("tcohu\\:MaxDigitalZoomLimit");
            0 < h.length && ("Visible Camera" === c ? Lb.maxVisibleDigitalZoomLimit = h[0].textContent : Lb.maxThermalDigitalZoomLimit = h[0].textContent)
        });
        m()
    }
    function Da(c, f, k, b, m) {
        for (f = 0; 3 > f; f++)
            switch (f) {
            case 0:
                c = n(k.responseXML, "tcohu\\:GetNetworkProtocolResponse", "tcohu\\:Protocol", f);
                "strEmpty" !== c.text() ? C.protocol = c.text() : m(null, "Response from camera was not properly formated. (0x16)");
                break;
            case 1:
                c = n(k.responseXML, "tcohu\\:GetNetworkProtocolResponse", "tcohu\\:Port", f),
                "strEmpty" !== c.text() ? C.port = c.text() : m(null, "Response from camera was not properly formated. (0x17)")
            }
        b()
    }
    function Va(c, f, k, b, m) {
        for (f = 0; 3 > f; f++)
            switch (f) {
            case 0:
                c = n(k.responseXML, "tds\\:NetworkProtocols", "tt\\:Name", f);
                "strEmpty" !== c.text() && (c.length = 3) ? (C.transportProtocols[0].protocolName = c[0].textContent,
                C.transportProtocols[1].protocolName = c[1].textContent,
                C.transportProtocols[2].protocolName = c[2].textContent) : m(null, "Response from camera was not properly formated. (0x18)");
                break;
            case 1:
                c = n(k.responseXML, "tds\\:NetworkProtocols", "tt\\:Enabled", f);
                "strEmpty" !== c.text() && (c.length = 3) ? (C.transportProtocols[0].protocolEnabled = c[0].textContent,
                C.transportProtocols[1].protocolEnabled = c[1].textContent,
                C.transportProtocols[2].protocolEnabled = c[2].textContent) : m(null, "Response from camera was not properly formated. (0x19)");
                break;
            case 2:
                c = n(k.responseXML, "tds\\:NetworkProtocols", "tt\\:Port", f),
                "strEmpty" !== c.text() && (c.length = 3) ? (C.transportProtocols[0].protocolPort = c[0].textContent,
                C.transportProtocols[1].protocolPort = c[1].textContent,
                C.transportProtocols[2].protocolPort = c[2].textContent) : m(null, "Response from camera was not properly formated. (0x1A)")
            }
        b()
    }
    function Mb(c, f, k, b, m) {
        var d, h = "", a = "", e = 0;
        $(k.responseText).find("tt\\:NTPManual").each(function() {
            d = $(this);
            0 === e++ ? (d = d.find("tt\\:Type"),
            "DNS" === d[0].textContent ? (d = $(this),
            d = d.find("tt\\:DNSName")) : (d = $(this),
            d = d.find("tt\\:IPv4Address")),
            0 < d.length && (h = d[0].textContent)) : (d = d.find("tt\\:Type"),
            "DNS" === d[0].textContent ? (d = $(this),
            d = d.find("tt\\:DNSName")) : (d = $(this),
            d = d.find("tt\\:IPv4Address")),
            0 < d.length && (a = d[0].textContent))
        });
        b("{0};{1}".format(h, a))
    }
    function Nb(c, f, k, b, m) {
        var d = ".";
        $(k.responseText).find("tcohu\\:GetOptionsResponse").each(function() {
            d = $(this);
            d = d.find("tcohu\\:ZoomCapability").each(function() {
                d = $(this);
                d = d.find("tcohu\\:VideoSourceToken");
                0 < d.length && "Visible Camera" === d[0].textContent && (d = $(this),
                d = d.find("tcohu\\:MaxOpticalZoomLimit"),
                0 < d.length && (Ob.visibleMaxOpticalZoom = d[0].textContent));
                0 < d.length && "Thermal Camera" === d[0].textContent && (d = $(this),
                d = d.find("tcohu\\:MaxOpticalZoomLimit"),
                0 < d.length && (Ob.thermalMaxOpticalZoom = d[0].textContent))
            })
        });
        b()
    }
    function Pb(c, f, k, b, m) {
        var d = ".";
        $(k.responseText).find("timg\\:GetOptionsResponse").each(function() {
            d = $(this);
            d = d.find("timg\\:ImagingOptions").each(function() {
                d = $(this);
                d = d.find("tt\\:Exposure").each(function() {
                    d = $(this);
                    d = d.find("tt\\:Gain").each(function() {
                        d = $(this);
                        d = d.find("tt\\:Max");
                        0 < d.length && (Wa.maxGain = d[0].textContent)
                    })
                });
                d = $(this);
                d = d.find("tt\\:Focus").each(function() {
                    d = $(this);
                    d = d.find("tt\\:NearLimit").each(function() {
                        d = $(this);
                        d = d.find("tt\\:Max");
                        0 < d.length && (Wa.maxNearLimit = d[0].textContent)
                    });
                    d = $(this);
                    d = d.find("tt\\:FarLimit").each(function() {
                        d = $(this);
                        d = d.find("tt\\:Max");
                        0 < d.length && (Wa.maxFarLimit = d[0].textContent)
                    })
                })
            })
        });
        b()
    }
    function Qb(c, f, k, b, m) {
        var d = 0, h = "", a, e = 0;
        for (c = 0; 9 > c; c++)
            rb(c);
        $(k.responseText).find("trt\\:OSDs").each(function() {
            a = $(this);
            A[d].token = B(a[0].outerHTML, "token");
            a = a.find("tt\\:Type");
            0 < a.length && (A[d].type = a[0].textContent);
            a = $(this);
            h = n(a, "tt\\:Position", "tt\\:Type", d);
            "strEmpty" !== h.text() && (A[d].position = h[0].textContent,
            "Custom" === h[0].textContent && (A[d].order = e++));
            h = n(a, "tt\\:Position", "tt\\:Pos", d);
            0 !== h.length && (A[d].positionX = B(h[0].outerHTML, "x"),
            A[d].positionY = B(h[0].outerHTML, "y"));
            h = n(a, "tt\\:TextString", "tt\\:Type", d);
            "strEmpty" !== h.text() && (A[d].textStringType = h.text(),
            A[d].originalType = h.text());
            h = n(a, "tt\\:TextString", "tt\\:DateFormat", d);
            0 !== h.length && (A[d].dateFormat = h.text());
            h = n(a, "tt\\:TextString", "tt\\:TimeFormat", d);
            0 !== h.length && (A[d].timeFormat = h.text());
            h = n(a, "tt\\:TextString", "tt\\:FontSize", d);
            0 !== h.length && (A[d].fontSize = h.text());
            h = n(a, "tt\\:TextString", "tt\\:PlainText", d);
            "strEmpty" !== h.text() && (A[d].text = h.text());
            h = n(a, "tt\\:TextString", "tt\\:FontColor", d);
            0 !== h.length && (A[d].fontColorTransparent = B(h[0].outerHTML, "transparent"));
            h = n(a, "tt\\:FontColor", "tt\\:Color", d);
            0 !== h.length && (A[d].fontColorX = B(h[0].outerHTML, "x"),
            A[d].fontColorY = B(h[0].outerHTML, "y"),
            A[d].fontColorZ = B(h[0].outerHTML, "z"));
            h = n(a, "tt\\:TextString", "tt\\:BackgroundColor", d);
            0 !== h.length && (A[d].backgroundTransparent = B(h[0].outerHTML, "transparent"));
            h = n(a, "tt\\:BackgroundColor", "tt\\:Color", d);
            0 !== h.length && (A[d].backgroundColorX = B(h[0].outerHTML, "x"),
            A[d].backgroundColorY = B(h[0].outerHTML, "y"),
            A[d].backgroundColorZ = B(h[0].outerHTML, "z"));
            h = n(a, "tt\\:Image", "tt\\:ImgPath", d);
            "strEmpty" !== h.text() && (A[d].filename = h.text());
            A[d].inCamera = !0;
            d++
        });
        Zb(b, m)
    }
    function Rb(c, f, k, h, b) {
        var d = ""
          , m = ""
          , a = "";
        $(k.responseText).find("tcohu\\:List").each(function() {
            d = $(this);
            d = d.find("tcohu\\:Position");
            if (0 < d.length && (d.text(),
            d = $(this),
            d = d.find("tcohu\\:TokenList"),
            0 < d.length && (m = d.text().split(","),
            0 < m.length)))
                for (var c = 0; c < m.length; c++) {
                    a: {
                        for (var f = 0; 7 > f; f++)
                            if (A[f].token === m[c]) {
                                a = f;
                                break a
                            }
                        a = -1
                    }
                    0 <= a && (A[a].order = c)
                }
        });
        h()
    }
    function Ea(c, f, k, h, b) {
        var d, m = 0;
        for (c = 0; 8 > c; c++)
            sb(c);
        $(k.responseText).find("tcohu\\:PrivacyMask").each(function() {
            d = $(this);
            0 < d.length && (Z[m].backgroundColor = B(d[0].outerHTML, "backgroundcolor"),
            Z[m].height = B(d[0].outerHTML, "height"),
            Z[m].width = B(d[0].outerHTML, "width"),
            Z[m].x = B(d[0].outerHTML, "x"),
            Z[m].y = B(d[0].outerHTML, "y"),
            Z[m].token = B(d[0].outerHTML, "token"),
            Z[m].inCamera = !0);
            m++
        });
        h()
    }
    function l(c, f, k, h, b) {
        var d;
        ba.gradation = ".";
        ba.transparency = ".";
        ba.color = ".";
        ba.seeThrough = ".";
        ba.mosaic = !1;
        $(k.responseText).find("tcohu\\:GetPMaskAttributesResponse").each(function() {
            d = $(this);
            d = d.find("tcohu\\:Gradation");
            0 < d.length && (ba.gradation = d[0].textContent);
            d = $(this);
            d = d.find("tcohu\\:Transparency");
            0 < d.length && (ba.transparency = d[0].textContent);
            d = $(this);
            d = d.find("tcohu\\:Color");
            0 < d.length && (ba.color = d[0].textContent);
            d = $(this);
            d = d.find("tcohu\\:SeeThrough");
            0 < d.length && (ba.seeThrough = "true" === d[0].textContent);
            d = $(this);
            d = d.find("tcohu\\:Mosaic");
            0 < d.length && (ba.mosaic = d[0].textContent)
        });
        h()
    }
    function L(c, f, k, h, b) {
        var d;
        ba.enabled = !1;
        ba.upperLimit = ".";
        $(k.responseText).find("tcohu\\:GetPMaskModeResponse").each(function() {
            d = $(this);
            d = d.find("tcohu\\:State");
            0 < d.length && (ba.enabled = "Enable" === d[0].textContent);
            d = $(this);
            d = d.find("tcohu\\:UpperLimit");
            0 < d.length && (ba.upperLimit = d[0].textContent)
        });
        h()
    }
    function N(c, f, k, h, b) {
        var d = 0, m;
        for (c = 0; 256 > c; c++)
            wb(c);
        $(k.responseText).find("tptz\\:Preset").each(function() {
            m = $(this);
            K.presets[d].token = B(m[0].outerHTML, "token");
            m = m.find("tt\\:Name");
            0 < m.length && (K.presets[d].name = m[0].textContent);
            d++
        });
        h()
    }
    function Xa(c, f, k, h, b) {
        var d = 0, m = 0, a;
        c = $(k.responseText).find("tptz\\:PresetTour").length;
        K.tours = [];
        for (f = 0; f < c; f++)
            K.tours.push(new Tour);
        $(k.responseText).find("tptz\\:PresetTour").each(function() {
            a = $(this);
            K.tours[d].token = B(a[0].outerHTML, "token");
            a = a.find("tt\\:Name");
            0 < a.length && (K.tours[d].name = a[0].textContent);
            a = $(this);
            a = a.find("tt\\:Status");
            0 < a.length && (a = a.find("tt\\:State"),
            K.tours[d].state = a[0].textContent);
            a = $(this);
            a = a.find("tt\\:AutoStart");
            0 < a.length && (K.tours[d].autoStart = a[0].textContent);
            a = $(this);
            a = a.find("tt\\:Direction");
            0 < a.length && (K.tours[d].direction = a[0].textContent);
            a = $(this);
            a = a.find("tt\\:RecurringTime");
            K.tours[d].time = 0 < a.length ? a[0].textContent : ".";
            a = $(this);
            a = a.find("tt\\:RecurringDuration");
            K.tours[d].duration = 0 < a.length ? a[0].textContent : ".";
            m = 0;
            a = $(this);
            K.tours[d].presets = [];
            $(a).find("tt\\:TourSpot").each(function() {
                K.tours[d].presets.push(new PresetForTour);
                a = $(this);
                a = a.find("tt\\:PresetToken");
                0 < a.length && (K.tours[d].presets[m].preset.token = a[0].textContent);
                a = $(this);
                a = a.find("tt\\:Speed");
                0 < a.length && (K.tours[d].presets[m].speedY = u(a[0].innerHTML, "tt:pantilt", "y"),
                K.tours[d].presets[m].speedX = u(a[0].innerHTML, "tt:pantilt", "x"));
                a = $(this);
                a = a.find("tt\\:StayTime");
                if (0 < a.length) {
                    var c = 0
                      , f = readDurationFromXMLString(a[0].textContent);
                    c += Number(3600 * Number(f[3]));
                    c += Number(60 * Number(f[4]));
                    c += Number(Number(f[5]));
                    K.tours[d].presets[m].dwell = c
                }
                m++
            });
            d++
        });
        h()
    }
    function Ya(c, f, k, a, b) {
        var d = 0, h = "", m = "", e, q = "", l = "";
        for (c = 0; 8 > c; c++)
            Ra(c);
        d = 0;
        $(k.responseText).find("trt\\:Profiles").each(function() {
            e = $(this);
            m = e.attr("token");
            e = e.find("tt\\:VideoSourceConfiguration");
            l = e.find("tt\\:Name");
            e = $(this);
            e = e.find("tt\\:VideoEncoderConfiguration");
            h = e.attr("token");
            void 0 !== h ? (q = e.find("tt\\:AutoStart"),
            X[d].profileName = m,
            X[d].streamName = h,
            X[d].multicast = q.text(),
            X[d].videoSource = l.text()) : (X[d].profileName = m,
            X[d].streamName = ".",
            X[d].multicast = ".",
            X[d].videoSource = ".");
            d++
        });
        a()
    }
    function Fa(c, f, k, a, m) {
        var d, h = 0;
        $(k.responseText).find("tds\\:RelayOutputs").each(function() {
            d = $(this);
            0 < d.length && (h = parseInt(B(d[0].outerHTML, "token"), 10),
            aa.io[h].token = h,
            aa.io[h].direction = "Output",
            d = $(this),
            d = d.find("tt\\:Mode"),
            0 < d.length && (aa.io[h].mode = d[0].textContent),
            d = $(this),
            d = d.find("tt\\:DelayTime"),
            0 < d.length && (aa.io[h].delay = d[0].textContent),
            d = $(this),
            d = d.find("tt\\:IdleState"),
            0 < d.length && (aa.io[h].idleState = d[0].textContent))
        });
        a()
    }
    function Za(c, f, k, a, m) {
        var d, h = 0;
        for (c = 0; 16 > c; c++)
            tb(c);
        $(k.responseText).find("tcohu\\:Sector").each(function() {
            d = $(this);
            0 < d.length && (ka[h].lowerLimit = B(d[0].outerHTML, "lowerlimit"),
            ka[h].upperLimit = B(d[0].outerHTML, "upperlimit"),
            ka[h].title = B(d[0].outerHTML, "title"),
            ka[h].token = B(d[0].outerHTML, "token"));
            h++
        });
        a()
    }
    function ta(c, f, k, a, m) {
        var d = 0, h, b, e;
        for (c = 0; 16 > c; c++)
            ub(c);
        $(k.responseText).find("tRiseAE\\:servers").each(function() {
            h = $(this);
            h = h.find("tRiseAE\\:token");
            0 < h.length && (T[d].name = h[0].textContent);
            b = h = $(this);
            h = h.find("tRiseAE\\:config");
            0 < h.length && (e = h,
            h = h.find("tRiseAE\\:serverUrl"),
            0 < h.length && (T[d].address = h[0].textContent),
            h = e,
            h = h.find("tRiseAE\\:serverPort"),
            0 < h.length && (T[d].port = h[0].textContent),
            h = e,
            h = h.find("tRiseAE\\:username"),
            0 < h.length && (T[d].username = h[0].textContent),
            h = e,
            h = h.find("tRiseAE\\:password"),
            0 < h.length && (T[d].password = h[0].textContent),
            h = e,
            h = h.find("tRiseAE\\:emailSecurityOptions"),
            0 < h.length && (T[d].security = h[0].textContent),
            h = e,
            h = h.find("tRiseAE\\:ftpOptions"),
            0 < h.length && (b = h,
            h = h.find("tRiseAE\\:Protocol"),
            0 < h.length && (T[d].security = h[0].textContent),
            h = b,
            h = h.find("tRiseAE\\:UploadPath"),
            0 < h.length && (T[d].path = h[0].textContent)));
            h = $(this);
            h = h.find("tRiseAE\\:serverType");
            0 < h.length && (T[d].type = h[0].textContent);
            d++
        });
        a()
    }
    function $a(c, f, k, h, a, d) {
        var b = ""
          , m = ""
          , e = ""
          , q = 0;
        "Visible Camera" === h ? Ga.visibleSnapshotResolutions = [] : Ga.thermalSnapshotResolutions = [];
        $(k.responseText).find("tcohu\\:GetSnapshotCapabilitiesResponse").each(function() {
            b = $(this);
            b = b.find("tcohu\\:ResolutionsAvailable").each(function() {
                b = $(this);
                b = b.find("tt\\:Width");
                0 < b.length && (m = b[0].textContent);
                b = $(this);
                b = b.find("tt\\:Height");
                0 < b.length && (e = b[0].textContent);
                "Visible Camera" === h ? Ga.visibleSnapshotResolutions[q] = "{0}x{1}".format(m, e) : Ga.thermalSnapshotResolutions[q] = "{0}x{1}".format(m, e);
                q++
            })
        });
        a()
    }
    function ab(c, f, k, h, a) {
        c = $(k.responseText).find("tcohu\\:State");
        0 < c.length && (pa.state = c[0].textContent);
        $(this);
        c = $(k.responseText).find("tcohu\\:Version");
        0 < c.length && (pa.version = c[0].textContent);
        h()
    }
    function ua(c, f, k, h, a) {
        var d = 0
          , b = $(k.responseText).find("tcohu\\:DestinationAddress");
        0 < b.length && (pa.trapDestination = b[0].textContent);
        $(k.responseText).find("tcohu\\:GetSnmpTrapSettingsResponse").each(function() {
            b = $(this);
            b = b.find("tcohu\\:SnmpTrap").each(function() {
                d < pa.traps.length && (b = $(this),
                b = b.find("tcohu\\:Name"),
                0 < b.length && (pa.traps[d].name = b[0].textContent),
                b = $(this),
                b = b.find("tcohu\\:State"),
                0 < b.length && (pa.traps[d].state = b[0].textContent),
                d++)
            })
        });
        h()
    }
    function Ha(c, f, k, h, a) {
        var d = "";
        $(k.responseText).find("tRiseThermal\\:GetServiceCapabilitiesResponse").each(function() {
            d = $(this);
            d = d.find("CameraModel");
            0 < d.length && (bb.model = d[0].textContent);
            d = $(this);
            d = d.find("ImageResolution");
            0 < d.length && (bb.resolution = d[0].textContent);
            d = $(this);
            d = d.find("Enabled");
            0 < d.length && (bb.enabled = d[0].textContent)
        });
        h()
    }
    function Ia(c, f, k, h, a) {
        var d = ""
          , b = "";
        $(k.responseText).find("tRiseThermal\\:GetFirmwareVersionResponse").each(function() {
            d = $(this);
            d = d.find("version");
            0 < d.length && (b = d[0].textContent)
        });
        h(b)
    }
    function cb(c, f, k, h, a) {
        var d = "";
        $(k.responseText).find("tRiseThermal\\:GetImagingSettingsResponse").each(function() {
            d = $(this);
            d = d.find("NucTimeInterval");
            0 < d.length && (ca.nucTimeInterval = d[0].textContent);
            d = $(this);
            d = d.find("PicturePolarity");
            0 < d.length && (ca.picturePolarity = d[0].textContent);
            d = $(this);
            d = d.find("ColorPalette");
            0 < d.length && (ca.colorPallete = d[0].textContent);
            d = $(this);
            d = d.find("ROI");
            0 < d.length && (ca.rOI = d[0].textContent);
            d = $(this);
            d = d.find("NoiseReductionMode");
            0 < d.length && (ca.noiseReductionMode = d[0].textContent)
        });
        h()
    }
    function P(c, f, k, h, a) {
        var d = "";
        $(k.responseText).find("tRiseThermal\\:GetZoomModeResponse").each(function() {
            d = $(this);
            d = d.find("ZoomSyncMode");
            0 < d.length && ($b.syncMode = d[0].textContent)
        });
        h()
    }
    function za(c, f, k, h, a) {
        var d = "", b;
        $(k.responseText).find("tRiseAE\\:ActionTrigger").each(function() {
            b = $(this);
            0 < b.length && (d = d + b[0].textContent + ";")
        });
        h(d)
    }
    function Ja(c, f, k, h, a) {
        var d = 0, b;
        E.unusedKeys = [];
        $(k.responseText).find("tcohu\\:KeyIds").each(function() {
            b = $(this);
            0 < b.length && (E.unusedKeys[d] = b[0].textContent,
            d++)
        });
        h()
    }
    function Aa(c, f, k, h, b) {
        var d = 0, a;
        for (c = 0; c < oa.length; c++)
            xb(c);
        $(k.responseText).find("tds\\:User").each(function() {
            d < oa.length && (a = $(this),
            a = a.find("tt\\:Username"),
            0 < a.length && (oa[d].username = a[0].textContent),
            a = $(this),
            a = a.find("tt\\:UserLevel"),
            0 < a.length && (oa[d].securityLevel = a[0].textContent));
            d++
        });
        console.log("User Count: {0}".format(d));
        h(d)
    }
    function db(c, f, k, h, a) {
        var d = ""
          , b = ""
          , m = "";
        $(k.responseText).find("tcohu\\:GetVideoChannel5ResolutionResponse").each(function() {
            d = $(this);
            d = d.find("tcohu\\:VideoSourceToken");
            0 < d.length ? b = d[0].textContent : a(null, "Invalid response from camera", null);
            d = $(this);
            d = d.find("tcohu\\:Resolution");
            0 < d.length ? m = d[0].textContent : a(null, "Invalid response from camera", null)
        });
        h(m, b)
    }
    function Y(c, f, k, h, a, d) {
        var b = ""
          , m = ""
          , e = ""
          , q = 0
          , l = p(h);
        t[l].resolutionsAvailable = [];
        $(k.responseText).find("trt\\:GetVideoEncoderConfigurationOptionsResponse").each(function() {
            b = $(this);
            b = b.find("trt\\:Options").each(function() {
                b = $(this);
                b = b.find("tt\\:H264").each(function() {
                    b = $(this);
                    b = b.find("tt\\:ResolutionsAvailable").each(function() {
                        b = $(this);
                        b = b.find("tt\\:Width");
                        0 < b.length && (m = b[0].textContent);
                        b = $(this);
                        b = b.find("tt\\:Height");
                        0 < b.length && (e = b[0].textContent);
                        t[l].resolutionsAvailable[q] = "{0}x{1}".format(m, e);
                        q++
                    })
                })
            })
        });
        a()
    }
    function S(c, f, k, h, b, d) {
        var a = ""
          , m = "";
        $(k.responseText).find("tcohu\\:GetVideoEncoderSourceResponse").each(function() {
            a = $(this);
            a = a.find("tcohu\\:VideoSourceToken");
            if (0 < a.length)
                if (isNaN(h))
                    for (var c = 0; 8 > c; c++) {
                        if (h === t[c].name) {
                            t[c].videoSource = a[0].textContent;
                            m = a[0].textContent;
                            break
                        }
                    }
                else
                    t[h].videoSource = a[0].textContent
        });
        b(h, m)
    }
    function eb(c, f, k, h, b) {
        c = "";
        f = -1;
        b = $(k.responseText).find("tds\\:UploadUri ");
        0 < b.length && (c = b[0].textContent);
        $(this);
        b = $(k.responseText).find("tds\\:ExpectedDownTime ");
        0 < b.length && (k = readDurationFromXMLString(b[0].textContent),
        f = 60 * k[4] + k[5]);
        h(c, f)
    }
    function Ka(c, f, k, b, a) {
        f = c = "";
        a = $(k.responseText).find("tas\\:CertificateID ");
        0 < a.length && (c = a[0].textContent);
        $(this);
        a = $(k.responseText).find("tas\\:KeyID ");
        0 < a.length && (f = a[0].textContent);
        b(c, f)
    }
    function V(c, f, k) {
        for (var b = "", a = 0; a < c.length; a++)
            b += W.CertificationPath.format(c[a]);
        c = W.CreateCertificationPath.format(b);
        g(c, function(c, k, b) {
            c = $(b.responseText).find("tas\\:CertificationPathID");
            k = "";
            0 < c.length && (k = c[0].textContent);
            f(k)
        }, k)
    }
    function La(c, f, k, b, a) {
        f = y.ActionControlTimerConfig.format(f, k);
        f = y.CreateAction.format(c, "ControlTimer", f);
        g(f, function() {
            b(c)
        }, a)
    }
    function va(c, f) {
        var k = 0
          , b = ""
          , a = ""
          , d = "";
        for (c = c.split(InternalFilenamesAE.delimiter); k < c.length; ) {
            if (" " === c[k].slice(0, 1)) {
                switch (c[k].slice(1, c[k].length - 1)) {
                case "HostName":
                    a = "Hostname";
                    break;
                case "IPAddress":
                    a = "IPAddress";
                    break;
                case "TriggerType":
                    a = "TriggerName";
                    break;
                case "TriggerName":
                    a = "TriggerToken";
                    break;
                case "Date":
                    a = "Date";
                    break;
                case "Time":
                    a = "Time"
                }
                b += y.ActionFilenameOptions.format(a)
            } else
                b += y.ActionFilenameOptions.format("UserText"),
                d = c[k];
            k++
        }
        b = "filename" === f ? y.ActionFilename.format(b) : y.ActionSubjectFormat.format(b);
        "" !== d && (b += y.ActionFilenameUserText.format(d));
        return b
    }
    function ea(c, f, k, b, a, d, e, q, l, w) {
        var h = ""
          , m = "";
        switch (f) {
        case "SendEmailNotification":
        case "SendSMS":
            h = f;
            m = y.ActionEmail.format(k, a, b, va(d, "subject"));
            m = y.ActionEmailNoSnapshot.format(m);
            break;
        case "SendEmailNotificationWithSnapshot":
        case "SendMMS":
            h = f,
            f = va(e, "filename"),
            m = y.ActionEmailSnapshot.format(f, q, y.ActionEmailConfigurationTEMP.format(y.ActionEmailTEMP.format(a, b, k, va(d, "subject"))))
        }
        k = y.CreateAction.format(c, h, m);
        g(k, function() {
            l(c)
        }, w)
    }
    function fb(c, f, k, b, a, d) {
        var h = ""
          , m = "";
        m = "";
        h = "UploadSnapshotToFtp";
        var e = "";
        e = va(k, "filename");
        m = y.ActionFTP.format(f);
        m = y.ActionFTPSnapshot.format(e, b, m);
        f = y.CreateAction.format(c, h, m);
        g(f, function() {
            a(c)
        }, d)
    }
    function gb(c, f, k, b, a) {
        var d = ""
          , h = "";
        switch (f) {
        case "DisplayAlarmOSDText":
            d = y.CreateAction.format(c, f, "");
            break;
        case "ActivateAlarmOutput":
            h = y.ActionDIOAction.format(k);
            d = y.CreateAction.format(c, f, h);
            break;
        case "ActivatePreset":
            h = y.PresetToken.format(k);
            d = y.CreateAction.format(c, f, h);
            break;
        case "ActivateTour":
            h = y.TourToken.format(k);
            d = y.CreateAction.format(c, f, h);
            break;
        case "Delay":
            h = y.ActionDelay.format(k);
            d = y.CreateAction.format(c, f, h);
            break;
        case "ResetCamera":
            d = y.CreateAction.format(c, f, "");
            break;
        case "WiperOn":
            d = y.CreateAction.format(c, f, "")
        }
        g(d, function() {
            b(c)
        }, a)
    }
    function Ma(c, f, k, b, a, d, e) {
        var h = ""
          , m = "";
        switch (f) {
        case "ExternalAlarmInput":
            h = y.InputToken.format(k);
            break;
        case "CameraModuleError":
        case "HeaterError":
        case "TemperatureHigh":
        case "LowFlashSpace":
        case "LowMemory":
        case "PressureLow":
        case "TemperatureLow":
        case "PositionerSystemError":
        case "VideoError":
        case "WiperError":
        case "UserCommand":
        case "FTPError":
        case "InvalidUserLogin":
        case "TourStopped":
        case "ValidUserLogin":
            h = "";
            break;
        case "PresetReached":
            h = y.PresetToken.format(k);
            break;
        case "PTZMoved":
            h = "";
            break;
        case "Scheduler":
            0 < k.indexOf("-") ? (a = k.split("-"),
            b = b.split(":"),
            "PM" === b[3] && "12" !== b[0] && (b[0] = parseInt(b[0], 10) + 12),
            "AM" === b[3] && "12" === b[0] && (b[0] = "0"),
            h = y.ActionTriggerScheduler.format("DateTime", y.ScheduleDateTime.format(b[0], b[1], b[2], a[2], a[0], a[1]))) : (a = "",
            0 <= k.indexOf("Sunday") && (a += y.SecheduleWeekday.format("Sunday")),
            0 <= k.indexOf("Monday") && (a += y.SecheduleWeekday.format("Monday")),
            0 <= k.indexOf("Tuesday") && (a += y.SecheduleWeekday.format("Tuesday")),
            0 <= k.indexOf("Wednesday") && (a += y.SecheduleWeekday.format("Wednesday")),
            0 <= k.indexOf("Thursday") && (a += y.SecheduleWeekday.format("Thursday")),
            0 <= k.indexOf("Friday") && (a += y.SecheduleWeekday.format("Friday")),
            0 <= k.indexOf("Saturday") && (a += y.SecheduleWeekday.format("Saturday")),
            b = b.split(":"),
            "PM" === b[3] && "12" !== b[0] && (b[0] = parseInt(b[0], 10) + 12),
            "AM" === b[3] && "12" === b[0] && (b[0] = "0"),
            h = y.ActionTriggerScheduler.format("DayOfWeek", y.ScheduleDayOfWeek.format(a, b[0], b[1], b[2])));
            break;
        case "Timer":
            h = k.split("|");
            b = b.split("|");
            a = a.split(":");
            k = h[0].split("-");
            h = h[1].split(":");
            var q = b[0].split("-");
            b = b[1].split(":");
            "PM" === h[3] && "12" !== h[0] && (h[0] = parseInt(h[0], 10) + 12);
            "AM" === h[3] && "12" === h[0] && (h[0] = "0");
            "PM" === b[3] && "12" !== b[0] && (b[0] = parseInt(b[0], 10) + 12);
            "AM" === b[3] && "12" === b[0] && (b[0] = "0");
            h = y.TimerConfiguration.format(a[0], a[1], a[2], a[3], h[0], h[1], h[2], k[2], k[0], k[1], b[0], b[1], b[2], q[2], q[0], q[1])
        }
        "" !== h && (m = y.ActionTriggerConfiguration.format(h));
        f = y.CreateActionTrigger.format(c, f, m);
        g(f, function() {
            d(c)
        }, e)
    }
    function hb(c, f, b) {
        c = r.CreateEncoder.format(c);
        g(c, function(c, b, d) {
            b = "";
            for (var k = 0; 1 > k; k++)
                switch (k) {
                case 0:
                    c = n(d.responseXML, "tcohu\\:CreateVideoEncoderResponse", "tcohu\\:VideoEncoderToken", k),
                    "strEmpty" !== c.text() && (b = c.text())
                }
            f(b)
        }, b)
    }
    function a(c, f, b, a, m, d, e, q, l, w, fa, r, Tc, p, t, F, v, R, x, y, u, A) {
        var k = function(c) {
            setTimeout(function() {
                u(c)
            }, 100)
        }
          , h = ""
          , Oa = "";
        "logo" === b ? Oa = D.CreateOSDLogo.format(f, c, m, d, x) : "" !== R && (h = D.CreateOSDPlain.format(R),
        b = "Plain");
        -1 !== r && "." !== r && "100" !== t && (h = D.CreateOSDBackground.format(t, r, Tc, p) + h);
        "." !== F && "Date" === b && (h = D.CreateOSDDate.format(F, v) + h);
        "" === Oa && (Oa = "Custom" === a ? y ? D.CreateOSD.format(f, c, a, D.CreateOSDPos.format(m, d), b, e, fa, q, l, w, h) : D.SetOSD.format(f, c, a, D.CreateOSDPos.format(m, d), b, e, fa, q, l, w, h) : y ? D.CreateOSD.format(f, c, a, "", b, e, fa, q, l, w, h) : D.SetOSD.format(f, c, a, "", b, e, fa, q, l, w, h));
        g(Oa, function(c, d, f) {
            d = "";
            for (var b = 0; 1 > b; b++)
                switch (b) {
                case 0:
                    c = n(f.responseXML, "trt\\:CreateOSDResponse", "trt\\:OSDToken", b),
                    "strEmpty" !== c.text() && (d = c.text())
                }
            k(d)
        }, A)
    }
    function b(c, f, b) {
        c = O.CreatePresetTour.format(c);
        g(c, function(c, k, d) {
            k = "";
            for (var a = 0; 1 > a; a++)
                switch (a) {
                case 0:
                    c = n(d.responseXML, "tptz\\:CreatePresetTourResponse", "tptz\\:PresetTourToken", a),
                    "strEmpty" !== c.text() ? k = c.text() : b(null, "Unexpected response from camera.")
                }
            f(k)
        }, b)
    }
    function e(c, f, b, a) {
        var k = ""
          , d = function(d, f, a) {
            b(c)
        };
        k = D.CreateProfile.format(c, c);
        g(k, function(b, h, m) {
            k = D.AddVideoSource.format(c, f);
            g(k, d, a)
        }, a)
    }
    function q(c, f, b, a, m, d, e, q, l, w) {
        c = W.CreatePKCS10CSR.format(c, f, b, a, m, d, e, q);
        g(c, function(c, d, f) {
            c = "";
            f = $(f.responseText).find("tas\\:PKCS10CSR");
            0 < f.length && (c = f[0].textContent);
            l(c)
        }, w)
    }
    function w(c, f, b) {
        c = W.CreateRSAKeyPair.format(c);
        g(c, function(c, a, d) {
            yb(c, a, d, f, b)
        }, b)
    }
    function F(c, f, b, a, m, d, e, q, l, w, fa) {
        c = W.CreateSelfSignedCertificate.format(c, f, b, a, m, d, e, q, l);
        g(c, function(c, d, f) {
            c = "";
            f = $(f.responseText).find("tas\\:CertificateID");
            0 < f.length && (c = f[0].textContent);
            w(c)
        }, fa)
    }
    function R(c, f, b) {
        var a = r.DeleteEncoder.format(c);
        g(a, function() {
            a: for (var b = 0; 8 > b; b++)
                if (t[b].name === c) {
                    Sa(b);
                    break a
                }
            f()
        }, b)
    }
    function ib(c, f, b) {
        var a = D.DeleteOSD.format(c);
        g(a, function() {
            for (var b = -1, d = 0; 9 > d; d++)
                if (A[d].token === c) {
                    b = d;
                    break
                }
            0 <= b && (A[b].inCamera = !1);
            f()
        }, b)
    }
    function Uc(c, f, b) {
        var a = D.DeleteProfile.format(c);
        g(a, function(b, d, a) {
            a: for (b = 0; 8 > b; b++)
                if (X[b].profileName === c) {
                    Ra(b);
                    break a
                }
            f()
        }, b)
    }
    function Vc(c, f) {
        g(y.GetActions, function(b, a, m) {
            zb(b, a, m, c, f)
        }, f)
    }
    function Wc(c, f) {
        g(y.GetActionTriggers, function(b, a, m) {
            Ab(b, a, m, c, f)
        }, f)
    }
    function Xc(c, f) {
        g(W.GetAllCertificates, function(b, a, m) {
            Bb(b, a, m, c, f)
        }, f)
    }
    function Yc(c, f) {
        g(W.GetAllCertificationPaths, function(b, a, m) {
            Cb(b, a, m, c, f)
        }, f)
    }
    function Zc(c, f) {
        g(r.GetAnalogVideo, function(b, a, m) {
            Db(b, a, m, c, f)
        }, f)
    }
    function $c(c, f) {
        g(r.GetBanners, function(f, b, a) {
            b = f = !1;
            var d = u(a.responseText, "tcohu:Top", "Transparent");
            "strEmpty" !== d && (f = d);
            d = u(a.responseText, "tcohu:Bottom", "Transparent");
            "strEmpty" !== d && (b = d);
            c(f, b, 0, 0)
        }, f)
    }
    function qa(c, f, b, a, m) {
        var d = function(d, k, h) {
            -1 !== p("Stream0") && "." !== t[p("Stream0")].name && la(c, d, k, h);
            qa("Stream1", f, b, a, m)
        }
          , k = function(d, k, h) {
            -1 !== p("Stream1") && "." !== t[p("Stream1")].name && la(c, d, k, h);
            qa("Stream2", f, b, a, m)
        }
          , h = function(d, k, h) {
            -1 !== p("Stream2") && "." !== t[p("Stream2")].name && la(c, d, k, h);
            qa("Stream3", f, b, a, m)
        }
          , e = function(d, k, h) {
            -1 !== p("Stream3") && "." !== t[p("Stream3")].name && la(c, d, k, h);
            qa("Stream4", f, b, a, m)
        }
          , q = function(d, k, h) {
            -1 !== p("Stream4") && "." !== t[p("Stream4")].name && la(c, d, k, h);
            qa("Stream5", f, b, a, m)
        }
          , l = function(d, k, h) {
            -1 !== p("Stream5") && "." !== t[p("Stream5")].name && la(c, d, k, h);
            qa("Stream6", f, b, a, m)
        }
          , w = function(d, k, h) {
            -1 !== p("Stream6") && "." !== t[p("Stream6")].name && la(c, d, k, h);
            qa("Stream7", f, b, a, m)
        }
          , n = function(d, k, h) {
            -1 !== p("Stream7") && "." !== t[p("Stream7")].name && la(c, d, k, h);
            f("Stream0", b, a, m)
        }
          , F = "";
        switch (c) {
        case "Stream0":
            -1 !== p(c) && "." !== t[p(c)].name ? (F = r.GetBitRate.format(c),
            g(F, d, m)) : d(null, null, null);
            break;
        case "Stream1":
            -1 !== p(c) && "." !== t[p(c)].name ? (F = r.GetBitRate.format(c),
            g(F, k, m)) : k(null, null, null);
            break;
        case "Stream2":
            -1 !== p(c) && "." !== t[p(c)].name ? (F = r.GetBitRate.format(c),
            g(F, h, m)) : h(null, null, null);
            break;
        case "Stream3":
            -1 !== p(c) && "." !== t[p(c)].name ? (F = r.GetBitRate.format(c),
            g(F, e, m)) : e(null, null, null);
            break;
        case "Stream4":
            -1 !== p(c) && "." !== t[p(c)].name ? (F = r.GetBitRate.format(c),
            g(F, q, m)) : q(null, null, null);
            break;
        case "Stream5":
            -1 !== p(c) && "." !== t[p(c)].name ? (F = r.GetBitRate.format(c),
            g(F, l, m)) : l(null, null, null);
            break;
        case "Stream6":
            -1 !== p(c) && "." !== t[p(c)].name ? (F = r.GetBitRate.format(c),
            g(F, w, m)) : w(null, null, null);
            break;
        case "Stream7":
            -1 !== p(c) && "." !== t[p(c)].name ? (F = r.GetBitRate.format(c),
            g(F, n, m)) : n(null, null, null)
        }
    }
    function ad(c, f) {
        g(r.GetCapabilities, function(f, b, a) {
            for (f = 0; 1 > f; f++)
                switch (f) {
                case 0:
                    ia.flipMode = u(a.responseText, "tcohu:Capabilities", "EflipMode"),
                    ia.highWind = u(a.responseText, "tcohu:Capabilities", "HighWindMode"),
                    ia.inverted = u(a.responseText, "tcohu:Capabilities", "InvertMode"),
                    ia.dateTimeFormat = u(a.responseText, "tcohu:Capabilities", "DateTimeFormat"),
                    ia.wiperConfig = u(a.responseText, "tcohu:Capabilities", "WiperConfiguration"),
                    ia.privacyMask = u(a.responseText, "tcohu:Capabilities", "PrivacyMask"),
                    ia.sector = u(a.responseText, "tcohu:Capabilities", "Sector"),
                    ia.bitRateControl = u(a.responseText, "tcohu:Capabilities", "BitRateControl"),
                    ia.hitachi231Extensions = u(a.responseText, "tcohu:Capabilities", "Hitachi231Extensions"),
                    ia.parkConfig = u(a.responseText, "tcohu:Capabilities", "ParkConfiguration")
                }
            c()
        }, f)
    }
    function bd(c, f) {
        g(W.GetAssignedServerCertificates, function(f, b, a) {
            f = ".";
            a = $(a.responseText).find("tas\\:CertificationPathID");
            if (0 < a.length)
                for (f = a[0].textContent,
                a = 0; a < E.certificates.length; a++)
                    E.certificates[a].assigned = f === E.certificates[a].certificationPathID ? !0 : !1;
            c(f)
        }, f)
    }
    function cd(c, f, b) {
        c = W.GetCertificate.format(c);
        g(c, function(c, a, d) {
            Eb(c, a, d, f, b)
        }, b)
    }
    function dd(c, f, b) {
        var a = W.GetCertificationPath.format(c);
        g(a, function(a, d, k) {
            Fb(c, a, d, k, f, b)
        }, b)
    }
    function ed(c, f) {
        g(y.GetConcurrencyPolicy, function(f, b, a) {
            f = "";
            a = n(a.responseXML, "tRiseAE\\:GetConcurrencyPolicyResponse", "tRiseAE\\:policy", "0x001A");
            "" !== a.text() && (f = a.text());
            c(f)
        }, f)
    }
    function ra(c, f, b, a) {
        var k = function(d, k, h) {
            -1 !== p("Stream0") && "." !== t[p("Stream0")].name && na(c, d, k, h);
            ra("Stream1", f, b, a)
        }
          , d = function(d, k, h) {
            -1 !== p("Stream1") && "." !== t[p("Stream1")].name && na(c, d, k, h);
            ra("Stream2", f, b, a)
        }
          , h = function(d, k, h) {
            -1 !== p("Stream2") && "." !== t[p("Stream2")].name && na(c, d, k, h);
            ra("Stream3", f, b, a)
        }
          , e = function(d, k, h) {
            -1 !== p("Stream3") && "." !== t[p("Stream3")].name && na(c, d, k, h);
            ra("Stream4", f, b, a)
        }
          , q = function(d, k, h) {
            -1 !== p("Stream4") && "." !== t[p("Stream4")].name && na(c, d, k, h);
            ra("Stream5", f, b, a)
        }
          , l = function(d, k, h) {
            -1 !== p("Stream5") && "." !== t[p("Stream5")].name && na(c, d, k, h);
            ra("Stream6", f, b, a)
        }
          , fa = function(d, k, h) {
            -1 !== p("Stream6") && "." !== t[p("Stream6")].name && na(c, d, k, h);
            ra("Stream7", f, b, a)
        }
          , w = function(d, k, h) {
            -1 !== p("Stream7") && "." !== t[p("Stream7")].name && na(c, d, k, h);
            f(b, a)
        }
          , n = "";
        switch (c) {
        case "Stream0":
            -1 !== p(c) && "." !== t[p(c)].name ? (n = r.GetIFrameBurstSetting.format(c),
            g(n, k, a)) : k(null, null, null);
            break;
        case "Stream1":
            -1 !== p(c) && "." !== t[p(c)].name ? (n = r.GetIFrameBurstSetting.format(c),
            g(n, d, a)) : d(null, null, null);
            break;
        case "Stream2":
            -1 !== p(c) && "." !== t[p(c)].name ? (n = r.GetIFrameBurstSetting.format(c),
            g(n, h, a)) : h(null, null, null);
            break;
        case "Stream3":
            -1 !== p(c) && "." !== t[p(c)].name ? (n = r.GetIFrameBurstSetting.format(c),
            g(n, e, a)) : e(null, null, null);
            break;
        case "Stream4":
            -1 !== p(c) && "." !== t[p(c)].name ? (n = r.GetIFrameBurstSetting.format(c),
            g(n, q, a)) : q(null, null, null);
            break;
        case "Stream5":
            -1 !== p(c) && "." !== t[p(c)].name ? (n = r.GetIFrameBurstSetting.format(c),
            g(n, l, a)) : l(null, null, null);
            break;
        case "Stream6":
            -1 !== p(c) && "." !== t[p(c)].name ? (n = r.GetIFrameBurstSetting.format(c),
            g(n, fa, a)) : fa(null, null, null);
            break;
        case "Stream7":
            -1 !== p(c) && "." !== t[p(c)].name ? (n = r.GetIFrameBurstSetting.format(c),
            g(n, w, a)) : w(null, null, null)
        }
    }
    function wa(c, f, b, a) {
        var k = function(d, k, h) {
            -1 !== p("Stream0") && "." !== t[p("Stream0")].name && ma(c, d, k, h);
            wa("Stream1", f, b, a)
        }
          , d = function(d, k, h) {
            -1 !== p("Stream1") && "." !== t[p("Stream1")].name && ma(c, d, k, h);
            wa("Stream2", f, b, a)
        }
          , h = function(d, k, h) {
            -1 !== p("Stream2") && "." !== t[p("Stream2")].name && ma(c, d, k, h);
            wa("Stream3", f, b, a)
        }
          , e = function(d, k, h) {
            -1 !== p("Stream3") && "." !== t[p("Stream3")].name && ma(c, d, k, h);
            wa("Stream4", f, b, a)
        }
          , q = function(d, k, h) {
            -1 !== p("Stream4") && "." !== t[p("Stream4")].name && ma(c, d, k, h);
            wa("Stream5", f, b, a)
        }
          , l = function(d, k, h) {
            -1 !== p("Stream5") && "." !== t[p("Stream5")].name && ma(c, d, k, h);
            wa("Stream6", f, b, a)
        }
          , fa = function(d, k, h) {
            -1 !== p("Stream6") && "." !== t[p("Stream6")].name && ma(c, d, k, h);
            wa("Stream7", f, b, a)
        }
          , w = function(d, k, h) {
            -1 !== p("Stream7") && "." !== t[p("Stream7")].name && ma(c, d, k, h);
            f(b, a)
        }
          , n = "";
        switch (c) {
        case "Stream0":
            -1 !== p(c) && "." !== t[p(c)].name ? (n = r.GetConstrainedMode.format(c),
            g(n, k, a)) : k(null, null, null);
            break;
        case "Stream1":
            -1 !== p(c) && "." !== t[p(c)].name ? (n = r.GetConstrainedMode.format(c),
            g(n, d, a)) : d(null, null, null);
            break;
        case "Stream2":
            -1 !== p(c) && "." !== t[p(c)].name ? (n = r.GetConstrainedMode.format(c),
            g(n, h, a)) : h(null, null, null);
            break;
        case "Stream3":
            -1 !== p(c) && "." !== t[p(c)].name ? (n = r.GetConstrainedMode.format(c),
            g(n, e, a)) : e(null, null, null);
            break;
        case "Stream4":
            -1 !== p(c) && "." !== t[p(c)].name ? (n = r.GetConstrainedMode.format(c),
            g(n, q, a)) : q(null, null, null);
            break;
        case "Stream5":
            -1 !== p(c) && "." !== t[p(c)].name ? (n = r.GetConstrainedMode.format(c),
            g(n, l, a)) : l(null, null, null);
            break;
        case "Stream6":
            -1 !== p(c) && "." !== t[p(c)].name ? (n = r.GetConstrainedMode.format(c),
            g(n, fa, a)) : fa(null, null, null);
            break;
        case "Stream7":
            -1 !== p(c) && "." !== t[p(c)].name ? (n = r.GetConstrainedMode.format(c),
            g(n, w, a)) : w(null, null, null)
        }
    }
    function fd(c, f) {
        g(H.GetDateTime, function(f, b, a) {
            f = "Manual";
            b = !1;
            for (var d = "UTC", k = "", h = "", m = "", e = "", q = "", l = "", g, w = 0; 9 > w; w++)
                switch (w) {
                case 0:
                    g = n(a.responseXML, "tds\\:SystemDateAndTime", "tt\\:DateTimeType", w);
                    "strEmpty" !== g.text() && (f = g.text());
                    break;
                case 1:
                    g = n(a.responseXML, "tds\\:SystemDateAndTime", "tt\\:DaylightSavings", w);
                    "strEmpty" !== g.text() && (b = g.text());
                    break;
                case 2:
                    g = n(a.responseXML, "tds\\:SystemDateAndTime", "tt\\:TimeZone", w);
                    "strEmpty" !== g.text() && (d = g.text());
                    break;
                case 3:
                    g = n(a.responseXML, "tt\\:Time", "tt\\:Hour", w);
                    0 < g.length && (k = g[0].textContent);
                    break;
                case 4:
                    g = n(a.responseXML, "tt\\:Time", "tt\\:Minute", w);
                    0 < g.length && (h = g[0].textContent);
                    break;
                case 5:
                    g = n(a.responseXML, "tt\\:Time", "tt\\:Second", w);
                    0 < g.length && (m = g[0].textContent);
                    break;
                case 6:
                    g = n(a.responseXML, "tt\\:Date", "tt\\:Month", w);
                    0 < g.length && (e = g[0].textContent);
                    break;
                case 7:
                    g = n(a.responseXML, "tt\\:Date", "tt\\:Day", w);
                    0 < g.length && (q = g[0].textContent);
                    break;
                case 8:
                    g = n(a.responseXML, "tt\\:Date", "tt\\:Year", w),
                    0 < g.length && (l = g[0].textContent)
                }
            c(e, q, l, k, h, m, d, b, f)
        }, f)
    }
    function gd(c, f) {
        g(r.GetDateTimeFormat, function(f, b, a) {
            for (var d = b = "", k = 0; 2 > k; k++)
                switch (k) {
                case 0:
                    f = n(a.responseXML, "tcohu\\:GetDateTimeFormatResponse", "tcohu\\:DateFormat", k);
                    "strEmpty" !== f.text() && (b = f.text());
                    break;
                case 1:
                    f = n(a.responseXML, "tcohu\\:GetDateTimeFormatResponse", "tcohu\\:TimeFormat", k),
                    "strEmpty" !== f.text() && (d = f.text())
                }
            c("{0};{1}".format(b, d))
        }, f)
    }
    function hd(c, f) {
        g(H.GetDeviceInformation, function(b, a, m) {
            for (a = 0; 5 > a; a++)
                switch (a) {
                case 0:
                    b = n(m.responseXML, "tds\\:GetDeviceInformationResponse", "tds\\:Manufacturer", a);
                    "strEmpty" !== b.text() ? ha.manufacturer = b.text() : f(null, "Response from camera was not properly formated. (0x01)");
                    break;
                case 1:
                    b = n(m.responseXML, "tds\\:GetDeviceInformationResponse", "tds\\:Model", a);
                    "strEmpty" !== b.text() ? ha.model = b.text() : f(null, "Response from camera was not properly formated. (0x02)");
                    break;
                case 2:
                    b = n(m.responseXML, "tds\\:GetDeviceInformationResponse", "tds\\:FirmwareVersion", a);
                    "strEmpty" !== b.text() ? ha.firmwareVersion = b.text() : f(null, "Response from camera was not properly formated. (0x03)");
                    break;
                case 3:
                    b = n(m.responseXML, "tds\\:GetDeviceInformationResponse", "tds\\:SerialNumber", a);
                    "strEmpty" !== b.text() ? ha.serialNumber = b.text() : f(null, "Response from camera was not properly formated. (0x04)");
                    break;
                case 4:
                    b = n(m.responseXML, "tds\\:GetDeviceInformationResponse", "tds\\:HardwareId", a),
                    "strEmpty" !== b.text() ? ha.hardware = b.text() : f(null, "Response from camera was not properly formated. (0x05)")
                }
            c()
        }, f)
    }
    function id(c, b) {
        g(r.GetAnonymousAccess, function(b, f, a) {
            b = n(a.responseText, "tcohu\\:State").text();
            c("true" == b)
        }, b)
    }
    function jd(c, b) {
        g(r.GetDiagnosticData, function(f, a, m) {
            Ua(f, a, m, c, b)
        }, b)
    }
    function kd(c, b) {
        var a = ""
          , f = function(d, b, a) {
            null !== d && ya(d, b, a);
            c()
        }
          , m = function(c, d, k) {
            null !== c && ya(c, d, k);
            "Input" === aa.io[3].direction ? (a = r.GetInputConfig.format("3"),
            g(a, f, b)) : f(null, null, null)
        }
          , d = function(c, d, f) {
            null !== c && ya(c, d, f);
            "Input" === aa.io[2].direction ? (a = r.GetInputConfig.format("2"),
            g(a, m, b)) : m(null, null, null)
        }
          , e = function(c, f, k) {
            null !== c && ya(c, f, k);
            "Input" === aa.io[1].direction ? (a = r.GetInputConfig.format("1"),
            g(a, d, b)) : d(null, null, null)
        }
          , q = function() {
            "Input" === aa.io[0].direction ? (a = r.GetInputConfig.format("0"),
            g(a, e, b)) : e(null, null, null)
        };
        a = ac.GetDigitalInputs;
        g(a, function(c, d, a) {
            Gb(c, d, a, q, b)
        }, b)
    }
    function ld(c, b) {
        g(r.GetDigitalOutputState, function(a, f, m) {
            Hb(a, f, m, c, b)
        }, b)
    }
    function md(c, b) {
        g(r.GetFonts, function(a, f, m) {
            Ib(a, f, m, c, b)
        }, b)
    }
    function nd(c, b, a) {
        var f = J.GetImagingSettings.format(c);
        g(f, function(f, d, k) {
            Jb(c, f, d, k, b, a)
        }, a)
    }
    function od(c, b) {
        g(r.GetGeneralSettings, function(b, a, f) {
            for (b = 0; 1 > b; b++)
                switch (b) {
                case 0:
                    K.autoFlip = u(f.responseText, "tcohu:Properties", "AutoFlip"),
                    K.highWind = u(f.responseText, "tcohu:Properties", "HighWind"),
                    K.intertedMount = u(f.responseText, "tcohu:Properties", "InvertedMount"),
                    K.freezeVideo = u(f.responseText, "tcohu:Properties", "FreezeVideo"),
                    K.proportionalPTZ = u(f.responseText, "tcohu:Properties", "ProportionalPTZ"),
                    K.autoFocusOnPTZ = u(f.responseText, "tcohu:Properties", "AutoFocus")
                }
            c()
        }, b)
    }
    function pd(c, b) {
        g(r.GetHeaterState, function(a, f, m) {
            f = "";
            for (var d = 0; 1 > d; d++)
                switch (d) {
                case 0:
                    a = n(m.responseXML, "tcohu\\:GetHeaterStateResponse", "tcohu\\:State", d),
                    "strEmpty" !== a.text() && (f = a)
                }
            0 < f.length ? c(f[0].textContent) : b(null, "Cannot parse response from camera.")
        }, b)
    }
    function qd(c, b, a) {
        c = r.GetHitachi231Settings.format(c);
        g(c, function(c, a, d) {
            for (a = 0; 11 > a; a++)
                switch (a) {
                case 0:
                    c = n(d.responseXML, "tcohu\\:GetHitachi231SettingsResponse", "tcohu\\:DigitalZoom", a);
                    "strEmpty" !== c.text() && (bc = c.text());
                    break;
                case 1:
                    c = n(d.responseXML, "tcohu\\:GetHitachi231SettingsResponse", "tcohu\\:AutoFocusSensitivity", a);
                    "strEmpty" !== c.text() && (cc = c.text());
                    break;
                case 2:
                    c = n(d.responseXML, "tcohu\\:GetHitachi231SettingsResponse", "tcohu\\:AutoFocusSearchType", a);
                    "strEmpty" !== c.text() && (dc = c.text());
                    break;
                case 3:
                    c = n(d.responseXML, "tcohu\\:GetHitachi231SettingsResponse", "tcohu\\:InverseImage", a);
                    "strEmpty" !== c.text() && (ec = c.text());
                    break;
                case 4:
                    c = n(d.responseXML, "tcohu\\:GetHitachi231SettingsResponse", "tcohu\\:IRCorrection", a);
                    "strEmpty" !== c.text() && (fc = c.text());
                    break;
                case 5:
                    gc = u(d.responseText, "tcohu:Defog", "Color");
                    hc = u(d.responseText, "tcohu:Defog", "Strength");
                    ic = u(d.responseText, "tcohu:Defog", "Mode");
                    break;
                case 6:
                    jc = u(d.responseText, "tcohu:Intensity", "Mode");
                    kc = u(d.responseText, "tcohu:Intensity", "Level");
                    break;
                case 7:
                    lc = u(d.responseText, "tcohu:FNR", "Level");
                    mc = u(d.responseText, "tcohu:FNR", "State");
                    nc = u(d.responseText, "tcohu:FNR", "Mode");
                    break;
                case 8:
                    oc = u(d.responseText, "tcohu:Iris", "Action");
                    break;
                case 9:
                    pc = u(d.responseText, "tcohu:EIS", "Correction");
                    qc = u(d.responseText, "tcohu:EIS", "State");
                    break;
                case 10:
                    c = n(d.responseXML, "tcohu\\:GetHitachi231SettingsResponse", "tcohu\\:WhiteBalancePreset", a),
                    "strEmpty" !== c.text() && (rc = c.text())
                }
            b()
        }, a)
    }
    function rd(c, b) {
        g(H.GetNetworkProtocols, function(a, f, m) {
            Va(a, f, m, c, b)
        }, b)
    }
    function sd(c, b, a) {
        var f = J.GetImagingSettings.format(c);
        g(f, function(a, d, f) {
            if ("Thermal Camera" === c)
                a = n(f.responseXML, "tt\\:Focus", "tt\\:AutoFocusMode", 0),
                "strEmpty" !== a.text() && (sc = a.text());
            else
                for (d = 0; 19 > d; d++)
                    switch (d) {
                    case 0:
                        a = n(f.responseXML, "tt\\:BacklightCompensation", "tt\\:Mode", d);
                        "strEmpty" !== a.text() && (tc = a);
                        break;
                    case 1:
                        a = n(f.responseXML, "tt\\:BacklightCompensation", "tt\\:Level", d);
                        "strEmpty" !== a.text() && (uc = a.text());
                        break;
                    case 2:
                        a = n(f.responseXML, "tt\\:Exposure", "tt\\:Mode", d);
                        "strEmpty" !== a.text() && (vc = a.text());
                        break;
                    case 3:
                        a = n(f.responseXML, "tt\\:Exposure", "tt\\:MaxExposureTime", d);
                        "strEmpty" !== a.text() && (wc = a.text());
                        break;
                    case 4:
                        a = n(f.responseXML, "tt\\:Exposure", "tt\\:ExposureTime", d);
                        "strEmpty" !== a.text() && (xc = a.text());
                        break;
                    case 5:
                        a = n(f.responseXML, "tt\\:Exposure", "tt\\:MaxGain", d);
                        "strEmpty" !== a.text() && (yc = a.text());
                        break;
                    case 6:
                        a = n(f.responseXML, "tt\\:Focus", "tt\\:AutoFocusMode", d);
                        "strEmpty" !== a.text() && (zc = a.text());
                        break;
                    case 7:
                        a = n(f.responseXML, "tt\\:Focus", "tt\\:DefaultSpeed", d);
                        "strEmpty" !== a.text() && (Ac = a.text());
                        break;
                    case 8:
                        a = n(f.responseXML, "tt\\:Focus", "tt\\:NearLimit", d);
                        "strEmpty" !== a.text() && (Bc = a.text());
                        break;
                    case 9:
                        a = n(f.responseXML, "tt\\:Focus", "tt\\:FarLimit", d);
                        "strEmpty" !== a.text() && (Cc = a.text());
                        break;
                    case 10:
                        a = n(f.responseXML, "tt\\:IrCutFilter", null, d);
                        "strEmpty" !== a.text() && (Dc = a.text());
                        break;
                    case 11:
                        a = n(f.responseXML, "tt\\:Sharpness", null, d);
                        "strEmpty" !== a.text() && (Ec = a.text());
                        break;
                    case 12:
                        a = n(f.responseXML, "tt\\:WideDynamicRange", "tt\\:Mode", d);
                        "strEmpty" !== a.text() && (Fc = a.text());
                        break;
                    case 13:
                        a = n(f.responseXML, "tt\\:WideDynamicRange", "tt\\:Level", d);
                        "strEmpty" !== a.text() && (Gc = a.text());
                        break;
                    case 14:
                        a = n(f.responseXML, "tt\\:WhiteBalance", "tt\\:Mode", d);
                        "strEmpty" !== a.text() && (Hc = a.text());
                        break;
                    case 15:
                        a = n(f.responseXML, "tt\\:WhiteBalance", "tt\\:CrGain", d);
                        "strEmpty" !== a.text() && (Ic = a.text());
                        break;
                    case 16:
                        a = n(f.responseXML, "tt\\:WhiteBalance", "tt\\:CbGain", d);
                        "strEmpty" !== a.text() && (Jc = a.text());
                        break;
                    case 17:
                        a = n(f.responseXML, "tt\\:Exposure", "tt\\:Priority", d);
                        "strEmpty" !== a.text() && (Kc = a.text());
                        break;
                    case 18:
                        a = n(f.responseXML, "tt\\:Exposure", "tt\\:Gain", d),
                        "strEmpty" !== a.text() && (Lc = a.text())
                    }
            b()
        }, a)
    }
    function td(c, a) {
        g(r.GetLicenseAgreementStatus, function(a, b, f) {
            var d = ""
              , k = $(f.responseText).find("tcohu\\:Accepted");
            0 < k.length && (d = k[0].textContent);
            c(d, a, b, f)
        }, a)
    }
    function ud(c, a) {
        g(r.GetTransparency, function(a, b, f) {
            a = 0;
            f = n(f.responseXML, "tcohu\\:GetTransparencyResponse", "tcohu\\:Level", 0);
            "strEmpty" !== f.text() && (a = f.text());
            for (f = 0; 9 > f; f++)
                if ("Image" === A[f].type) {
                    A[f].logoTransparency = a;
                    break
                }
            c()
        }, a)
    }
    function vd(c, a, b) {
        var f = r.GetMaxDigitalZoomLimit.format(c);
        g(f, function(f, d, k) {
            Kb(c, f, d, k, a, b)
        }, b)
    }
    function wd(c, a, b) {
        var f = function() {
            Mc("AllStreams", a, b)
        }
          , k = function() {
            Sb("AllStreams", f, b)
        }
          , d = function(c, d) {
            xd(k, b)
        };
        Nc(c, function(c, a, b, f) {
            ra(c, d, a, b, f)
        }, function(c, d, a, b, f) {
            qa(c, d, a, b, f)
        }, function(c, a, b, f) {
            wa(c, d, a, b, f)
        }, d, a, b)
    }
    function yd(c, a) {
        var b = function(d, b, f) {
            for (b = 0; 7 > b; b++)
                switch (b) {
                case 0:
                    d = n(f.responseXML, "tcohu\\:GetSerialPortResponse", "tcohu\\:Protocol", b);
                    "strEmpty" !== d.text() ? C.serialProtocolName = d.text() : a(null, "Response from camera was not properly formated. (0x1B)");
                    break;
                case 1:
                    d = n(f.responseXML, "tcohu\\:GetSerialPortResponse", "tcohu\\:Type", b);
                    "strEmpty" !== d.text() ? C.serialProtocolType = d.text() : a(null, "Response from camera was not properly formated. (0x1C)");
                    break;
                case 2:
                    d = n(f.responseXML, "tcohu\\:GetSerialPortResponse", "tcohu\\:BaudRate", b);
                    "strEmpty" !== d.text() ? C.serialProtocolBaudRate = d.text() : a(null, "Response from camera was not properly formated. (0x1D)");
                    break;
                case 3:
                    d = n(f.responseXML, "tcohu\\:GetSerialPortResponse", "tcohu\\:ParityBit", b);
                    "strEmpty" !== d.text() ? C.serialProtocolParity = d.text() : a(null, "Response from camera was not properly formated. (0x1E)");
                    break;
                case 4:
                    d = n(f.responseXML, "tcohu\\:GetSerialPortResponse", "tcohu\\:CharacterLength", b);
                    "strEmpty" !== d.text() ? C.serialProtocolCharacterLength = d.text() : a(null, "Response from camera was not properly formated. (0x1F)");
                    break;
                case 5:
                    d = n(f.responseXML, "tcohu\\:GetSerialPortResponse", "tcohu\\:StopBit", b);
                    "strEmpty" !== d.text() ? C.serialProtocolStopBits = d.text() : a(null, "Response from camera was not properly formated. (0x20)");
                    break;
                case 6:
                    d = n(f.responseXML, "tcohu\\:GetSerialPortResponse", "tcohu\\:Address", b),
                    "strEmpty" !== d.text() ? C.serialProtocolAddress = d.text() : a(null, "Response from camera was not properly formated. (0x21)")
                }
            c()
        }
          , f = function(c, d, f) {
            g(r.GetSerialPort, b, a)
        }
          , m = function(c, d, b) {
            Va(c, d, b, f, a)
        }
          , d = function(c, d, b) {
            g(H.GetNetworkProtocols, m, a)
        }
          , e = function(c, b, f) {
            Da(c, b, f, d, a)
        }
          , q = function(c, d, b) {
            for (d = 0; 1 > d; d++)
                switch (d) {
                case 0:
                    c = n(b.responseXML, "tds\\:NetworkGateway", "tt\\:IPv4Address", d),
                    "strEmpty" !== c.text() ? C.gateway = c.text() : a(null, "Response from camera was not properly formated. (0x06)")
                }
            g(r.GetNetworkProtocol, e, a)
        }
          , l = function(c, d, b) {
            for (d = 0; 4 > d; d++)
                switch (d) {
                case 0:
                    c = n(b.responseXML, "tds\\:DNSInformation", "tt\\:FromDHCP", d);
                    "strEmpty" !== c.text() ? C.fromDHCP = c.text() : a(null, "Response from camera was not properly formated. (0x07)");
                    break;
                case 1:
                    c = n(b.responseXML, "tt\\:DNSManual", "tt\\:Type", d);
                    "strEmpty" !== c.text() ? C.dnsType = c.text() : a(null, "Response from camera was not properly formated. (0x08)");
                    break;
                case 2:
                    c = n(b.responseXML, "tt\\:DNSManual", "tt\\:IPv4Address", d);
                    2 === c.length ? (C.dns1 = c[0].textContent,
                    C.dns2 = c[1].textContent) : "strEmpty" !== c.text() ? (C.dns1 = c.text(),
                    C.dns2 = "") : a(null, "Response from camera was not properly formated. (0x09)");
                    break;
                case 3:
                    c = n(b.responseXML, "tt\\:DNSFromDHCP", "tt\\:IPv4Address", d),
                    0 < c.length && (2 === c.length ? (C.dhcp_dns1 = c[0].textContent,
                    C.dhcp_dns2 = c[1].textContent) : "strEmpty" !== c.text() ? (C.dhcp_dns1 = c.text(),
                    C.dhcp_dns2 = "") : a(null, "Response from camera was not properly formated. (0x09)"))
                }
            g(H.GetDefaultGateway, q, a)
        }
          , w = function(c, d, b) {
            for (d = 0; 3 > d; d++)
                switch (d) {
                case 0:
                    c = n(b.responseXML, "tds\\:HostnameInformation", "tt\\:FromDHCP", d);
                    "strEmpty" !== c.text() ? C.hostnameFromDHCP = c.text() : a(null, "Response from camera was not properly formated. (0x0A)");
                    break;
                case 1:
                    c = n(b.responseXML, "tds\\:HostnameInformation", "tt\\:Name", d),
                    "strEmpty" !== c.text() ? C.hostname = c.text() : a(null, "Response from camera was not properly formated. (0x0B)")
                }
            g(H.GetDNS, l, a)
        };
        g(H.GetNetworkInterfaces, function(c, d, b) {
            manualIPv4Address = n(b.responseXML, "tt\\:Manual", "tt\\:Address").text();
            for (d = 0; 16 > d; d++)
                switch (d) {
                case 0:
                    c = n(b.responseXML, "tds\\:NetworkInterfaces", "tt\\:Enabled", d);
                    "strEmpty" !== c.text() ? C.enabled = c.text() : a(null, "Response from camera was not properly formated. (0x0C)");
                    break;
                case 1:
                    c = n(b.responseXML, "tt\\:Info", "tt\\:HwAddress", d);
                    "strEmpty" !== c.text() ? C.mac = c.text() : a(null, "Response from camera was not properly formated. (0x0D)");
                    break;
                case 2:
                    c = n(b.responseXML, "tt\\:Info", "tt\\:MTU", d);
                    "strEmpty" !== c.text() ? C.mtu = c.text() : a(null, "Response from camera was not properly formated. (0x0E)");
                    break;
                case 3:
                    c = n(b.responseXML, "tt\\:AdminSettings", "tt\\:AutoNegotiation", d);
                    "strEmpty" !== c.text() ? C.autoNegotiate = c.text() : a(null, "Response from camera was not properly formated. (0x0F)");
                    break;
                case 4:
                    c = n(b.responseXML, "tt\\:AdminSettings", "tt\\:Speed", d);
                    "strEmpty" !== c.text() ? C.speed = c.text() : a(null, "Response from camera was not properly formated. (0x10)");
                    break;
                case 5:
                    c = n(b.responseXML, "tt\\:AdminSettings", "tt\\:Duplex", d);
                    "strEmpty" !== c.text() ? C.duplex = c.text() : a(null, "Response from camera was not properly formated. (0x11)");
                    break;
                case 6:
                    c = n(b.responseXML, "tt\\:OperSettings", "tt\\:AutoNegotiation", d);
                    "strEmpty" !== c.text() ? C.autoNegotiateSet = c.text() : a(null, "Response from camera was not properly formated. (0x0F)");
                    break;
                case 7:
                    c = n(b.responseXML, "tt\\:OperSettings", "tt\\:Speed", d);
                    "strEmpty" !== c.text() ? C.speedSet = c.text() : a(null, "Response from camera was not properly formated. (0x10)");
                    break;
                case 8:
                    c = n(b.responseXML, "tt\\:OperSettings", "tt\\:Duplex", d);
                    "strEmpty" !== c.text() ? C.duplexSet = c.text() : a(null, "Response from camera was not properly formated. (0x11)");
                    break;
                case 9:
                    c = n(b.responseXML, "tt\\:Link", "tt\\:InterfaceType", d);
                    "strEmpty" !== c.text() ? C.interfaceType = c.text() : a(null, "Response from camera was not properly formated. (0x12)");
                    break;
                case 10:
                    c = n(b.responseXML, "tt\\:IPv4", "tt\\:Enabled", d);
                    "strEmpty" !== c.text() ? C.ipv4Enabled = c.text() : a(null, "Response from camera was not properly formated. (0x13)");
                    break;
                case 11:
                    c = n(b.responseXML, "tt\\:Manual", "tt\\:Address", d);
                    "strEmpty" !== c.text() ? C.ipAddress = c.text() : a(null, "Response from camera was not properly formated. (0x14)");
                    break;
                case 12:
                    c = n(b.responseXML, "tt\\:Manual", "tt\\:PrefixLength", d);
                    "strEmpty" !== c.text() ? C.ipAddressPrefix = c.text() : a(null, "Response from camera was not properly formated. (0x15)");
                    break;
                case 13:
                    c = n(b.responseXML, "tt\\:Config", "tt\\:DHCP", d);
                    "strEmpty" !== c.text() ? C.dhcp = c.text() : a(null, "Response from camera was not properly formated. (0x16)");
                    break;
                case 14:
                    c = n(b.responseXML, "tt\\:FromDHCP", "tt\\:Address", d);
                    "strEmpty" !== c.text() ? C.dhcpAddress = c.text() : a(null, "Response from camera was not properly formated. (0x17)");
                    break;
                case 15:
                    c = n(b.responseXML, "tt\\:FromDHCP", "tt\\:PrefixLength", d),
                    "strEmpty" !== c.text() ? C.dhcpAddressPrefix = c.text() : a(null, "Response from camera was not properly formated. (0x17)")
                }
            g(H.GetHostName, w, a)
        }, a)
    }
    function zd(c, a) {
        g(r.GetNetworkProtocol, function(b, f, m) {
            Da(b, f, m, c, a)
        }, a)
    }
    function Ad(c, a) {
        g(r.GetLLDPState, function(a, b, f) {
            LLDP_State = n(f.responseText, "tcohu\\:State").text();
            c()
        }, a)
    }
    function Bd(c, a, b) {
        c = r.SetLLDPState.format(c);
        g(c, function(c, f, d) {
            Da(c, f, d, a, b)
        }, b)
    }
    function Cd(c, a) {
        g(H.GetNTP, function(b, f, m) {
            Mb(b, f, m, c, a)
        }, a)
    }
    function Dd(c, a) {
        g(r.GetOptions, function(b, f, m) {
            Nb(b, f, m, c, a)
        }, a)
    }
    function Ed(c, a, b) {
        c = J.GetOptions.format(c);
        g(c, function(c, f, d) {
            Pb(c, f, d, a, b)
        }, b)
    }
    function Fd(c, a) {
        g(D.GetOSDS, function(b, f, m) {
            Qb(b, f, m, c, a)
        }, a)
    }
    function Zb(c, a) {
        g(r.GetOSDOrder, function(b, f, m) {
            Rb(b, f, m, c, a)
        }, a)
    }
    function Gd(c, a) {
        g(r.GetParkConfiguration, function(a, b, f) {
            for (b = 0; 4 > b; b++)
                switch (b) {
                case 0:
                    a = n(f.responseXML, "tcohu\\:GetParkConfigurationResponse", "tcohu\\:State", b);
                    "strEmpty" !== a.text() && (K.parkState = a.text());
                    break;
                case 1:
                    a = n(f.responseXML, "tcohu\\:GetParkConfigurationResponse", "tcohu\\:Timeout", b);
                    "strEmpty" !== a.text() && (K.parkTimeout = a.text());
                    break;
                case 2:
                    a = n(f.responseXML, "tcohu\\:GetParkConfigurationResponse", "tcohu\\:Activity", b);
                    "strEmpty" !== a.text() && (K.parkActivity = a.text());
                    break;
                case 3:
                    a = n(f.responseXML, "tcohu\\:GetParkConfigurationResponse", "tcohu\\:Index", b),
                    "strEmpty" !== a.text() && (K.parkIndex = a.text())
                }
            c()
        }, a)
    }
    function Oc(c, a) {
        g(r.GetPMaskAttributes, function(b, f, m) {
            l(b, f, m, c, a)
        }, a)
    }
    function Pc(c, a) {
        g(r.GetPMaskMode, function(b, f, m) {
            L(b, f, m, c, a)
        }, a)
    }
    function Hd(c, a, b) {
        c = O.GetPresets.format(c);
        g(c, function(c, f, d) {
            N(c, f, d, a, b)
        }, b)
    }
    function Id(c, a, b) {
        c = O.GetPresetTours.format(c);
        g(c, function(c, f, d) {
            Xa(c, f, d, a, b)
        }, b)
    }
    function Jd(c, a, b) {
        c = r.GetPMasks.format(c);
        g(c, function(c, f, d) {
            Ea(c, f, d, a, b)
        }, b)
    }
    function Kd(c, a) {
        g(D.GetProfiles, function(b, f, m) {
            Ya(b, f, m, c, a)
        }, a)
    }
    function Ld(c, a) {
        g(H.GetRelayOutputs, function(b, f, m) {
            Fa(b, f, m, c, a)
        }, a)
    }
    function Md(c, a) {
        g(r.GetRTSPDigestStatus, function(a, b, f) {
            a = $(f.responseText).find("tcohu\\:Status");
            0 < a.length && (Qc.state = a[0].textContent);
            c()
        }, a)
    }
    function Nd(c, a) {
        g(r.GetSectors, function(b, f, m) {
            Za(b, f, m, c, a)
        }, a)
    }
    function Od(c, a) {
        g(y.GetServers, function(b, f, m) {
            ta(b, f, m, c, a)
        }, a)
    }
    function Pd(c, a, b) {
        var f = r.GetSnapshotCapabilities.format(c);
        g(f, function(f, d, k) {
            $a(f, d, k, c, a, b)
        }, b)
    }
    function Qd(c, a) {
        g(r.GetSnapshotProperties, function(a, b, f) {
            a = n(f.responseXML, "tcohu\\:GetSnapshotPropertiesResponse", "tcohu\\:VideoSourceToken", 0);
            "strEmpty" !== a.text() && (Na.videoSource = a.text());
            a = n(f.responseXML, "tcohu\\:Resolution", "tt\\:Width", 0);
            "strEmpty" !== a.text() && (Na.width = a.text());
            a = n(f.responseXML, "tcohu\\:Resolution", "tt\\:Height", 0);
            "strEmpty" !== a.text() && (Na.height = a.text());
            a = n(f.responseXML, "tcohu\\:GetSnapshotPropertiesResponse", "tcohu\\:Quality", 0);
            "strEmpty" !== a.text() && (Na.quality = a.text());
            c()
        }, a)
    }
    function Rd(c, a, b) {
        c = D.GetSnapshotURI.format(c);
        g(c, function(c, b, d) {
            c = "";
            d = n(d.responseXML, "trt\\:GetSnapshotUriResponse", "tt\\:Uri", 0);
            "strEmpty" !== d.text() && (c = d.text());
            a(c)
        }, b)
    }
    function Sd(c, a) {
        g(r.GetSnmpCommunityName, function(a, b, f) {
            a = $(f.responseText).find("tcohu\\:CommunityName");
            0 < a.length && (pa.communityName = a[0].textContent);
            c()
        }, a)
    }
    function Td(c, a) {
        g(r.GetSnmpState, function(b, f, m) {
            ab(b, f, m, c, a)
        }, a)
    }
    function Ud(c, a) {
        g(r.GetSnmpTrapSettings, function(b, f, m) {
            ua(b, f, m, c, a)
        }, a)
    }
    function Vd(c, a) {
        g(r.GetSnmpV3UserStatus, function(a, b, f) {
            a = $(f.responseText).find("tcohu\\:UserConfigured");
            0 < a.length && (pa.v3UserConfigured = a[0].textContent);
            c()
        }, a)
    }
    function Wd(c, a) {
        g(H.GetSystemBackup, function(b, f, m) {
            b = n(m.responseXML, "tt\\:Data", "xop\\:Include", null);
            "strEmpty" !== b.text() ? c(b) : a(null, "Response from camera was not properly formated. (0x23)")
        }, a)
    }
    function Xd(c, a, b) {
        var f = "";
        switch (c) {
        case "systemUptime":
            f = r.GetSystemUptime;
            break;
        case "systemInfo":
            f = H.GetSystemLog;
            break;
        case "systemNetwork":
            f = r.GetNetworkStatus;
            break;
        default:
            b(null, "No log type was specified.", null);
            return
        }
        g(f, function(c, d, b) {
            c = $(b.responseText).find("tt\\:String");
            c = 0 < c.length ? c[0].textContent : "This log file is empty";
            a(c)
        }, b)
    }
    function Yd(c, a) {
        g(r.GetLegacyNetworkTimeout, function(a, b, f) {
            a = readDurationFromXMLString(n(a, "tcohu\\:Timeout").text());
            a = parseInt(86400 * a[2], 10) + parseInt(3600 * a[3], 10) + parseInt(60 * a[4], 10) + parseInt(a[5], 10);
            C.legacyNetworkTimeout = a;
            c()
        }, a)
    }
    function Zd(c, a) {
        g(H.GetSystemUris, function(a, b, f) {
            a = "";
            f = $(f.responseText).find("tds\\:SystemBackupUri");
            0 < f.length && (a = f[0].textContent);
            c(a)
        }, a)
    }
    function $d(c, a) {
        g(sa.GetServiceCapabilities, function(b, f, m) {
            Ha(b, f, m, c, a)
        }, a)
    }
    function ae(c, a) {
        g(sa.GetFirmwareVersion, function(b, f, m) {
            Ia(b, f, m, c, a)
        }, a)
    }
    function be(c, a) {
        g(sa.GetImagingSettings, function(b, f, m) {
            cb(b, f, m, c, a)
        }, a)
    }
    function ce(c, a) {
        g(sa.GetZoomMode, function(b, f, m) {
            P(b, f, m, c, a)
        }, a)
    }
    function de(c, a) {
        g(y.GetTriggerPriorities, function(b, f, m) {
            za(b, f, m, c, a)
        }, a)
    }
    function ee(c, a) {
        g(r.GetUnusedKeyList, function(b, f, m) {
            Ja(b, f, m, c, a)
        }, a)
    }
    function xd(c, a) {
        g(r.GetUtilization, function(a, b, f) {
            for (var d = 0; 2 > d; d++)
                switch (d) {
                case 0:
                    a = n(f.responseXML, "tcohu\\:GetUtilizationResponse", "tcohu\\:H264", d);
                    if ("strEmpty" !== a.text())
                        for (b = 0; 8 > b; b++)
                            t[b].h264Utilization = a.text();
                    break;
                case 1:
                    if (a = n(f.responseXML, "tcohu\\:GetUtilizationResponse", "tcohu\\:MJPEG", d),
                    "strEmpty" !== a.text())
                        for (b = 0; 8 > b; b++)
                            t[b].jpegUtilization = a.text()
                }
            c()
        }, a)
    }
    function fe(c, a) {
        g(H.GetUsers, function(b, f, e) {
            Aa(b, f, e, c, a)
        }, a)
    }
    function ge(c, a) {
        g(r.GetVideoChannel5Resolution, function(b, f, e) {
            db(b, f, e, c, a)
        }, a)
    }
    function Nc(c, a, b, h, e, d, q) {
        g(D.GetVideoEncoderConfig, function(f, k, m) {
            var l;
            "" !== Q(m.responseXML) && q(f, k, m);
            if (-1 !== u(m.responseText, "tt:VideoEncoderConfiguration", "token"))
                for (var g = 0; 17 > g; g++)
                    switch (g) {
                    case 0:
                        f = n(m.responseXML, "trt\\:Configurations", "tt\\:Name", g);
                        for (k = 0; void 0 != f[k]; )
                            t[k].name = f[k].textContent,
                            k++;
                        break;
                    case 1:
                        f = n(m.responseXML, "trt\\:Configurations", "tt\\:UseCount", g);
                        for (k = 0; void 0 != f[k]; )
                            t[k].useCount = f[k].textContent,
                            k++;
                        break;
                    case 2:
                        f = n(m.responseXML, "trt\\:Configurations", "tt\\:Encoding", g);
                        for (k = 0; void 0 != f[k]; )
                            t[k].encoding = f[k].textContent,
                            k++;
                        break;
                    case 3:
                        f = n(m.responseXML, "tt\\:Resolution", "tt\\:Width", g);
                        for (k = 0; void 0 != f[k]; )
                            t[k].width = f[k].textContent,
                            k++;
                        break;
                    case 4:
                        f = n(m.responseXML, "tt\\:Resolution", "tt\\:Height", g);
                        for (k = 0; void 0 != f[k]; )
                            t[k].height = f[k].textContent,
                            k++;
                        break;
                    case 5:
                        f = n(m.responseXML, "trt\\:Configurations", "tt\\:Quality", g);
                        for (k = 0; void 0 != f[k]; )
                            t[k].quality = f[k].textContent,
                            k++;
                        break;
                    case 6:
                        f = n(m.responseXML, "tt\\:RateControl", "tt\\:FrameRateLimit", g);
                        for (k = 0; void 0 != f[k]; )
                            t[k].frameRateLimit = f[k].textContent,
                            k++;
                        break;
                    case 7:
                        f = n(m.responseXML, "tt\\:RateControl", "tt\\:EncodingInterval", g);
                        for (k = 0; void 0 != f[k]; )
                            t[k].encodingInterval = f[k].textContent,
                            k++;
                        break;
                    case 8:
                        f = n(m.responseXML, "tt\\:RateControl", "tt\\:BitrateLimit", g);
                        for (k = 0; void 0 != f[k]; )
                            t[k].bitrateLimit = f[k].textContent,
                            k++;
                        break;
                    case 9:
                        f = n(m.responseXML, "tt\\:H264", "tt\\:GovLength", g);
                        for (l = k = 0; void 0 != f[k]; )
                            "H264" === t[l].encoding && (t[l].govLength = f[k].textContent,
                            k++),
                            l++;
                        break;
                    case 10:
                        f = n(m.responseXML, "tt\\:H264", "tt\\:H264Profile", g);
                        for (l = k = 0; void 0 != f[k]; )
                            "H264" === t[l].encoding && (t[l].h264Profile = f[k].textContent,
                            k++),
                            l++;
                        break;
                    case 11:
                        f = n(m.responseXML, "tt\\:Address", "tt\\:Type", g);
                        for (k = 0; void 0 != f[k]; )
                            t[k].multicastAddrType = f[k].textContent,
                            k++;
                        break;
                    case 12:
                        f = n(m.responseXML, "tt\\:Address", "tt\\:IPv4Address", g);
                        for (k = 0; void 0 != f[k]; )
                            t[k].multicastAddr = f[k].textContent,
                            k++;
                        break;
                    case 13:
                        f = n(m.responseXML, "tt\\:Multicast", "tt\\:Port", g);
                        for (k = 0; void 0 != f[k]; )
                            t[k].multicastPort = f[k].textContent,
                            k++;
                        break;
                    case 14:
                        f = n(m.responseXML, "tt\\:Multicast", "tt\\:TTL", g);
                        for (k = 0; void 0 != f[k]; )
                            t[k].multicastTTL = f[k].textContent,
                            k++;
                        break;
                    case 15:
                        f = n(m.responseXML, "tt\\:Multicast", "tt\\:AutoStart", g);
                        for (k = 0; void 0 != f[k]; )
                            t[k].multicastAutostart = f[k].textContent,
                            k++;
                        break;
                    case 16:
                        for (f = n(m.responseXML, "trt\\:Configurations", "tt\\:SessionTimeout", g),
                        k = 0; void 0 != f[k]; )
                            t[k].rtspTimeout = f[k].textContent,
                            k++
                    }
            null !== b ? (b(c, h, e, d, q),
            a(c, b, h, d, q)) : d()
        }, q)
    }
    function Mc(c, a, b) {
        var f = ""
          , k = -1
          , d = function(c, d, f) {
            Y(c, d, f, "Stream7", a, b)
        }
          , e = function() {
            k = p("Stream7");
            -1 !== k ? (f = D.GetVideoEncoderConfigOptions.format("Stream7"),
            g(f, d, b)) : a()
        }
          , q = function(c, a, d) {
            Y(c, a, d, "Stream6", e, b)
        }
          , l = function() {
            k = p("Stream6");
            -1 !== k ? (f = D.GetVideoEncoderConfigOptions.format("Stream6"),
            g(f, q, b)) : e()
        }
          , w = function(c, a, d) {
            Y(c, a, d, "Stream5", l, b)
        }
          , n = function() {
            k = p("Stream5");
            -1 !== k ? (f = D.GetVideoEncoderConfigOptions.format("Stream5"),
            g(f, w, b)) : l()
        }
          , r = function(c, a, d) {
            Y(c, a, d, "Stream4", n, b)
        }
          , t = function() {
            k = p("Stream4");
            -1 !== k ? (f = D.GetVideoEncoderConfigOptions.format("Stream4"),
            g(f, r, b)) : n()
        }
          , F = function(c, a, d) {
            Y(c, a, d, "Stream3", t, b)
        }
          , R = function() {
            k = p("Stream3");
            -1 !== k ? (f = D.GetVideoEncoderConfigOptions.format("Stream3"),
            g(f, F, b)) : t()
        }
          , v = function(c, a, d) {
            Y(c, a, d, "Stream2", R, b)
        }
          , x = function() {
            k = p("Stream2");
            -1 !== k ? (f = D.GetVideoEncoderConfigOptions.format("Stream2"),
            g(f, v, b)) : R()
        }
          , y = function(c, a, d) {
            Y(c, a, d, "Stream1", x, b)
        }
          , u = function() {
            k = p("Stream1");
            -1 !== k ? (f = D.GetVideoEncoderConfigOptions.format("Stream1"),
            g(f, y, b)) : x()
        }
          , A = function(c, a, d) {
            Y(c, a, d, "Stream0", u, b)
        }
          , C = function(d, f, k) {
            Y(d, f, k, c, a, b)
        };
        "AllStreams" === c ? (k = p("Stream0"),
        -1 !== k ? (f = D.GetVideoEncoderConfigOptions.format("Stream0"),
        g(f, A, b)) : u()) : (f = D.GetVideoEncoderConfigOptions.format(c),
        g(f, C, b))
    }
    function Sb(c, a, b) {
        var f = ""
          , k = -1
          , d = function(c, d, f) {
            S(c, d, f, k, a, b)
        }
          , e = function() {
            k = p("Stream7");
            -1 !== k ? (f = r.GetVideoEncoderSource.format("Stream7"),
            g(f, d, b)) : a()
        }
          , q = function(c, a, d) {
            S(c, a, d, k, e, b)
        }
          , l = function() {
            k = p("Stream6");
            -1 !== k ? (f = r.GetVideoEncoderSource.format("Stream6"),
            g(f, q, b)) : e()
        }
          , w = function(c, a, d) {
            S(c, a, d, k, l, b)
        }
          , n = function() {
            k = p("Stream5");
            -1 !== k ? (f = r.GetVideoEncoderSource.format("Stream5"),
            g(f, w, b)) : l()
        }
          , t = function(c, a, d) {
            S(c, a, d, k, n, b)
        }
          , F = function() {
            k = p("Stream4");
            -1 !== k ? (f = r.GetVideoEncoderSource.format("Stream4"),
            g(f, t, b)) : n()
        }
          , R = function(c, a, d) {
            S(c, a, d, k, F, b)
        }
          , v = function() {
            k = p("Stream3");
            -1 !== k ? (f = r.GetVideoEncoderSource.format("Stream3"),
            g(f, R, b)) : F()
        }
          , x = function(c, a, d) {
            S(c, a, d, k, v, b)
        }
          , y = function() {
            k = p("Stream2");
            -1 !== k ? (f = r.GetVideoEncoderSource.format("Stream2"),
            g(f, x, b)) : v()
        }
          , u = function(c, a, d) {
            S(c, a, d, k, y, b)
        }
          , A = function() {
            k = p("Stream1");
            -1 !== k ? (f = r.GetVideoEncoderSource.format("Stream1"),
            g(f, u, b)) : y()
        }
          , C = function(c, a, d) {
            S(c, a, d, k, A, b)
        }
          , ib = function(d, f, k) {
            S(d, f, k, c, a, b)
        };
        "AllStreams" === c ? (k = p("Stream0"),
        -1 !== k ? (f = r.GetVideoEncoderSource.format("Stream0"),
        g(f, C, b)) : A()) : (f = r.GetVideoEncoderSource.format(c),
        g(f, ib, b))
    }
    function he(c, a) {
        g(D.GetVideoSources, function(b, f, e) {
            Q(e.responseXML) && a(b, f, e);
            -1 === u(e.responseText, "tt:VideoSource", "token") && a(null, "Response from camera was not properly formated. (0x22)");
            c(c, a)
        }, a)
    }
    function ie(c, a) {
        g(r.GetWiper, function(a, b, f) {
            for (var d = b = a = "", k = "", h = 0; 1 > h; h++)
                switch (h) {
                case 0:
                    a = u(f.responseText, "tcohu:Wiper", "State"),
                    b = u(f.responseText, "tcohu:Wiper", "Mode"),
                    d = u(f.responseText, "tcohu:Wiper", "Dwell"),
                    k = u(f.responseText, "tcohu:Wiper", "Value")
                }
            c("{0};{1};{2};{3}".format(a, b, d, k))
        }, a)
    }
    function je(c, a, b, h, e, d, q, l, w, n, r) {
        var f = "";
        f = "";
        var k, m = "";
        m = null !== d ? O.StartingConditionRecurringDura.format(d, l) : null !== q ? O.StartingConditionRecurringTime.format(q, l) : O.StartingConditionContinuous.format(l);
        if (null === w)
            f = O.ModifyPresetTour.format(c, a, b, h, e, m);
        else {
            for (d = 0; d < w.length; d++) {
                for (k = 0; k < w.length && (!1 !== w[k].deleted || w[k].order !== d); k++)
                    ;
                k < w.length && !0 !== w[k].deleted && "." !== w[k].preset.token && (q = w[k].preset.token,
                l = w[k].speedX,
                l /= 100,
                k = createDurationXMLString(["", "", "", "", "", w[k].dwell]),
                f += O.Preset.format(q, l, l, k))
            }
            f = "" !== f ? O.ModifyPresetTourPresets.format(c, a, b, h, e, m, f) : O.ModifyPresetTour.format(c, a, b, h, e, m)
        }
        g(f, function() {
            n(a)
        }, r)
    }
    function Tb(c, a, b) {
        var f = ""
          , k = function() {
            a()
        }
          , d = function() {
            f = D.RemoveVideoSource.format(c);
            g(f, k, b)
        };
        f = D.RemovePTZConfig.format(c);
        g(f, function() {
            f = D.RemoveEncoder.format(c);
            g(f, d, b)
        }, b)
    }
    function ke(c, a, b, h, e) {
        var d = ""
          , f = -1
          , k = ""
          , m = function(a, b, d) {
            Tb(c, h, e)
        }
          , q = function(a, k, m) {
            d = "";
            if (b)
                d = D.StartMulticast.format(c);
            else {
                for (f = 0; 8 > f && X[f].profileName !== c; f++)
                    ;
                8 > f && "true" === X[f].multicast && (d = D.StopMulticast.format(c))
            }
            "" !== d ? g(d, h, e) : h()
        }
          , l = function() {
            d = "Visible Camera" === k ? D.AddPTZConfig.format(c, "HD") : D.AddPTZConfig.format(c, "SD");
            g(d, q, e)
        }
          , w = function() {
            d = D.SaveProfile.format(c, a);
            g(d, l, e)
        }
          , n = function() {
            var b = p(a);
            k = t[b].videoSource;
            d = "Visible Camera" === k ? D.AddVideoSource.format(c, "Source1") : D.AddVideoSource.format(c, "Source2");
            g(d, w, e)
        }
          , r = function() {
            Sb(a, n, e)
        };
        "None" === a ? (d = D.StopMulticast.format(c),
        g(d, m, e)) : Tb(c, r, e)
    }
    function le(c, a, b, h, e, d, q, l, w, n, p, t, F, R, v, x, y, u, A) {
        var f = ""
          , k = function(a, b, d) {
            switch (v) {
            case "CBR":
                f = r.SetBitRateCBR.format(c);
                break;
            case "VBR":
                f = r.SetBitRateVBR.format(c);
                break;
            case "Fixed":
                f = r.SetBitRateFixed.format(c)
            }
            g(f, u, A)
        }
          , m = function(a, b, d) {
            f = r.SetConstrainedMode.format(c, x).format(c, x);
            g(f, k, A)
        };
        f = "Fixed" === v ? D.SetVideoEncoderConfigJPEG.format(c, c, a, b, d, q, h, l, w, t, F, R) : D.SetVideoEncoderConfig.format(c, c, a, b, h, e, d, q, l, w, n, p, t, F, R);
        g(f, function(a, b, d) {
            f = r.SetIFrameBurstSetting.format(c, y);
            g(f, m, A)
        }, A)
    }
    function me(c, a, b, h, e, d, q, l) {
        var f = ""
          , k = function() {
            q()
        };
        f = r.SetPortDirection.format(c, a);
        g(f, function() {
            "Output" === a ? setTimeout(function() {
                f = ac.SetRelayOutputSettings.format(c, h, e, b);
                g(f, k, l)
            }, 100) : setTimeout(function() {
                f = r.SetInputConfiguration.format(c, b, d);
                g(f, k, l)
            }, 100)
        }, l)
    }
    function ne(c, a, b) {
        c = H.SetNetworkProtocol.format(c[0].protocol, c[0].state, c[0].port, c[1].protocol, c[1].state, c[1].port);
        g(c, function(c, b, d) {
            c = "";
            d = $(d.responseText).find("tcohu\\:RebootNeeded");
            0 < d.length && (c = d[0].textContent);
            a(c)
        }, b)
    }
    function oe(c, a, b, h, e, d, q, l, w, n, p, t, F, R) {
        var f = ""
          , k = function(c, a, b) {
            F()
        }
          , m = function(c, a, b) {
            f = H.Reboot;
            g(f, k, R)
        }
          , v = function(d, k, e) {
            f = "false" === h ? r.SetNetworkInterfaces.format(w, h, c, a, b, n, p, t) : r.SetNetworkInterfaces_DHCP.format(w, h, n, p, t);
            g(f, m, R)
        };
        f = H.SetHostName.format(d);
        g(f, function(c, a, b) {
            f = "true" === e ? H.SetDNS_DHCP : H.SetDNS.format(e, q, l);
            g(f, v, R)
        }, R)
    }
    function pe(c, a, b, h, e, d, q, l) {
        var f = ""
          , k = function() {
            Oc(q, l)
        }
          , m = function() {
            setTimeout(function() {
                Pc(k, l)
            }, 1E3)
        };
        f = r.SetPMaskMode.format(c ? "Enable" : "Disable");
        g(f, function() {
            f = r.SetPMaskAttributes.format(a, b, h, e, d);
            g(f, m, l)
        }, l)
    }
    function qe(c, a, b, h, e) {
        var d = function() {
            thisCamera.getLLDP_State(h, e)
        };
        if ("false" == c)
            thisCamera.setLLDP_State("false", function() {
                var a = r.SetSnmpState.format(c, b);
                g(a, d, e)
            }, e);
        else {
            var f = r.SetSnmpState.format(c, b);
            g(f, function() {
                thisCamera.setLLDP_State(a, d, e)
            }, e)
        }
    }
    function re(c, a) {
        g(H.StartSystemRestore, function(b, f, e) {
            eb(b, f, e, c, a)
        }, a)
    }
    function se(c, a, b, h, e) {
        c = W.UploadCertificate.format(c, a, b);
        g(c, function(c, a, b) {
            Ka(c, a, b, h, e)
        }, e)
    }
    function te(c, a, b, h, e, d, l, q, w) {
        var f = "";
        f = "SMTP" === c ? y.ActionValidateEmailServer.format(c, a, b, h, e, d) : y.ActionValidateFtpServer.format(c, a, b, h, e, d, l);
        g(f, function(c, a, b) {
            c = n(b.responseXML, "tRiseAE\\:ValidateServerResponse", "tRiseAE\\:message", "0x0A1");
            q(c.text())
        }, w)
    }
    var Ba = z
      , kb = M
      , Yb = G
      , Wb = ""
      , Xb = ""
      , I = !1
      , tc = "."
      , uc = "."
      , vc = "."
      , Kc = "."
      , xc = "."
      , wc = "."
      , Lc = "."
      , yc = "."
      , zc = "."
      , sc = "."
      , Ac = "."
      , Bc = "."
      , Cc = "."
      , Dc = "."
      , Ec = "."
      , Fc = "."
      , Gc = "."
      , Hc = "."
      , Ic = "."
      , Jc = "."
      , bc = "."
      , cc = "."
      , dc = "."
      , ec = "."
      , fc = "."
      , gc = "."
      , hc = "."
      , ic = "."
      , kc = "."
      , jc = "."
      , lc = "."
      , mc = "."
      , nc = "."
      , oc = "."
      , pc = "."
      , qc = "."
      , rc = "."
      , Ta = new AnalogVideo
      , ia = new CameraCapabilities
      , ha = new DeviceInfo
      , Ob = new ExtensionOptions
      , E = new HttpsConfiguration;
    new HttpsUnusedKeys;
    var Wa = new ImagingOptions
      , Lb = new MaxDigitalZoom
      , t = [new VideoStream, new VideoStream, new VideoStream, new VideoStream, new VideoStream, new VideoStream, new VideoStream, new VideoStream]
      , C = new NetworkConfiguration
      , A = [new Osd, new Osd, new Osd, new Osd, new Osd, new Osd, new Osd, new Osd, new Osd];
    new OSDBanner;
    for (var X = [new VideoProfile, new VideoProfile, new VideoProfile, new VideoProfile, new VideoProfile, new VideoProfile, new VideoProfile, new VideoProfile], K = new Positioner, Qc = new RtspDigest, ka = [new Sector, new Sector, new Sector, new Sector, new Sector, new Sector, new Sector, new Sector, new Sector, new Sector, new Sector, new Sector, new Sector, new Sector, new Sector, new Sector], Ga = new SnapshotCapabilities, Na = new SnapshotProperties, pa = new SnmpSettings, oa = [new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User], ba = new PMask, Z = [new PMaskElement, new PMaskElement, new PMaskElement, new PMaskElement, new PMaskElement, new PMaskElement, new PMaskElement, new PMaskElement], lb = null, Sc = !1, v = [new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers], x = [new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions], aa = new DIO, T = [new Server, new Server, new Server, new Server, new Server, new Server, new Server, new Server, new Server, new Server, new Server, new Server, new Server, new Server, new Server, new Server], bb = new ThermalServiceCapabilities, ca = new ThermalImageSettings, $b = new ThermalZoomMode, Vb = 3E4, Ub = 0; 8 > Ub; Ub++)
        Sa(Ub);
    var ja = {
        device: "device",
        imaging: "imaging",
        media: "media",
        ptz: "ptz",
        dio: "deviceio",
        events: "events",
        actions: "action",
        extension: "extension",
        thermal: "risethermal",
        advsecurity: "advancedsecurity"
    }
      , ue = {
        AutoFocusOnePush: "tptz:CameraProfile/AFOnePush",
        AutoFocusSensitivity: "tptz:CameraProfile/AFSensitivity",
        CameraDefaultEvent: "tptz:CameraProfile/CameraDefaultEvent",
        CameraMode: "tptz:CameraProfile/CameraMode",
        DigitalZoom: "tptz:CameraProfile/DigitalZoom",
        FocusAction: "tptz:CameraProfile/FocusAction",
        FocusLength: "tptz:CameraProfile/FocusLength",
        FocusMode: "tptz:CameraProfile/FocusMode",
        HardReset: "tptz:CameraProfile/HardReset",
        ImageProperty: "tptz:CameraProfile/ImageProperty",
        IrisAction: "tptz:CameraProfile/IrisAction",
        IrisMode: "tptz:CameraProfile/IrisMode",
        PrivacyMask: "tptz:CameraProfile/PrivacyMask",
        PrivacyMaskAttribute: "tptz:CameraProfile/MaskAttrib",
        PrivacyMaskPosition: "tptz:CameraProfile/MaskPosition",
        PresetMode: "tptz:CameraProfile/PresetMode",
        ShutterSpeed: "tptz:CameraProfile/ShutterSpeed",
        SoftReset: "tptz:CameraProfile/SoftReset",
        ZoomMagnification: "tptz:CameraProfile/ZoomMagnification",
        ZoomMotion: "tptz:CameraProfile/ZoomMotion",
        ZoomPosition: "tptz:CameraProfile/ZoomPosition",
        ZoomSpeed: "tptz:CameraProfile/ZoomSpeed",
        ZoomStop: "tptz:CameraProfile/ZoomStop",
        FanFailure: "tptz:Device/FanFailure",
        PowerSupplyFailure: "tptz:Device/PowerSupplyFailure",
        StorageFailure: "tptz:Device/StorageFailure",
        TemperatureCritical: "tptz:Device/TemperatureCritical",
        Port: "dn:IO/Port",
        Relay: "dn:IO/Relay",
        AutoParkDisabled: "tptz:MotionEngine/AutoParkDisabled",
        AutoParkEnabled: "tptz:MotionEngine/AutoParkEnabled",
        AutoParkState: "tptz:MotionEngine/AutoParkState",
        CompassUpdate: "tptz:MotionEngine/CompassUpdate",
        GotoPresetFailed: "tptz:MotionEngine/GotoPresetFailed",
        LeftFromPreset: "tptz:MotionEngine/LeftFromPreset",
        LeftfromSector: "tptz:MotionEngine/LeftFromSector",
        MovingToPreset: "tptz:MotionEngine/MovingToPreset",
        PresetCreated: "tptz:MotionEngine/PresetCreated",
        PresetReached: "tptz:MotionEngine/PresetReached",
        PresetRemoved: "tptz:MotionEngine/PresetRemoved",
        SectorCreated: "tptz:MotionEngine/SectorCreated",
        SectorReached: "tptz:MotionEngine/SectorReached",
        SectorRemoved: "tptz:MotionEngine/SectorRemoved",
        TourCreated: "tptz:MotionEngine/TourCreated",
        TourPaused: "tptz:MotionEngine/TourPaused",
        TourRemoved: "tptz:MotionEngine/TourPaused",
        TourStarted: "tptz:MotionEngine/TourStarted",
        TourStopped: "tptz:MotionEngine/TourStopped",
        GotoHome: "tptz:PositionerEngine/GotoHome",
        NewHome: "tptz:PositionerEngine/NewHome",
        PanMotion: "tptz:PositionerEngine/PanMotion",
        PanStop: "tptz:PositionerEngine/PanStop",
        SeekHomeStart: "tptz:PositionerEngine/SeekHomeStart",
        SeekHomeStop: "tptz:PositionerEngine/SeekHomeStop",
        TiltMotion: "tptz:PositionerEngine/TiltMotion",
        TiltStop: "tptz:PositionerEngine/TiltStop",
        LastBackup: "tptz:Monitoring/Backup/Last",
        LastClockSynchronization: "tptz:Monitoring/OperatingTime/LastClockSynchronization",
        LastReboot: "tptz:Monitoring/OperatingTime/LastReboot",
        LastReset: "tptz:Monitoring/OperatingTime/LastReset",
        ProcessorUsage: "tptz:Monitoring/ProcessorUsage"
    }
      , y = {
        ActionEmailTEMP: "<actions:recipients>{0}</actions:recipients><actions:sender>{1}</actions:sender><actions:emailServerToken>{2}</actions:emailServerToken>{3}",
        ActionControlTimerConfig: "<actions:controlTimerScheduler><actions:timerSchedulerId>{0}</actions:timerSchedulerId><actions:timerSchedulerCommand>{1}</actions:timerSchedulerCommand></actions:controlTimerScheduler>",
        ActionCreateEmailServer: "<actions:CreateServerConfiguration><actions:token>{0}</actions:token><actions:serverType>{1}</actions:serverType><actions:serverConfig><actions:serverUrl>{2}</actions:serverUrl><actions:serverPort>{3}</actions:serverPort><actions:username>{4}</actions:username><actions:password>{5}</actions:password><actions:emailSecurityOptions>{6}</actions:emailSecurityOptions></actions:serverConfig></actions:CreateServerConfiguration>",
        ActionCreateFtpServer: "<actions:CreateServerConfiguration><actions:token>{0}</actions:token><actions:serverType>{1}</actions:serverType><actions:serverConfig><actions:serverUrl>{2}</actions:serverUrl><actions:serverPort>{3}</actions:serverPort><actions:username>{4}</actions:username><actions:password>{5}</actions:password><actions:ftpOptions><actions:Protocol>{6}</actions:Protocol><actions:UploadPath>{7}</actions:UploadPath></actions:ftpOptions></actions:serverConfig></actions:CreateServerConfiguration>",
        ActionDelay: "<actions:Delay>{0}</actions:Delay>",
        ActionDIOTrigger: "<actions:inputToken>{0}</actions:inputToken>",
        ActionDIOAction: "<actions:outputToken>{0}</actions:outputToken>",
        ActionDeleteServer: "<actions:DeleteServer><actions:token>{0}</actions:token></actions:DeleteServer>",
        ActionEmail: "<actions:emailServerToken>{0}</actions:emailServerToken><actions:recipients>{1}</actions:recipients><actions:sender>{2}</actions:sender>{3}",
        ActionEmailNoSnapshot: "<actions:sendEmailConfiguration>{0}</actions:sendEmailConfiguration>",
        ActionEmailSnapshot: "<actions:sendEmailSnapshotConfiguration>{0}<actions:imageCount>{1}</actions:imageCount>{2}</actions:sendEmailSnapshotConfiguration>",
        ActionEmailConfiguration: "<actions:emailConfiguration>{0}</actions:emailConfiguration>",
        ActionEmailConfigurationTEMP: "<actions:email>{0}</actions:email>",
        ActionEmailSubject: "<actions:subjectFormat>{0}</actions:subjectFormat>",
        ActionEmailSubjectOption: "<actions:option>{0}</actions:option>",
        ActionFilename: "<actions:fileNameOptions>{0}</actions:fileNameOptions>",
        ActionFilenameOptions: "<actions:option>{0}</actions:option>",
        ActionFilenameUserText: "<actions:userText>{0}</actions:userText>",
        ActionFTP: "<actions:ftpServerToken>{0}</actions:ftpServerToken>",
        ActionFTPSnapshot: "<actions:ftpSnapshotConfiguration>{0}<actions:imageCount>{1}</actions:imageCount>{2}</actions:ftpSnapshotConfiguration>",
        ActionTrigger: "<actions:ActionTrigger>{0}</actions:ActionTrigger>",
        ActionTriggerConfiguration: "<actions:actionTriggerConfiguration>{0}</actions:actionTriggerConfiguration>",
        ActionTriggerScheduler: "<actions:schedulerConfiguration><actions:type>{0}</actions:type>{1}</actions:schedulerConfiguration>",
        ActionValidateEmailServer: "<actions:ValidateServer><actions:serverType>{0}</actions:serverType><actions:serverConfig><actions:serverUrl>{1}</actions:serverUrl><actions:serverPort>{2}</actions:serverPort><actions:username>{3}</actions:username><actions:password>{4}</actions:password><actions:emailSecurityOptions>{5}</actions:emailSecurityOptions></actions:serverConfig></actions:ValidateServer>",
        ActionValidateFtpServer: "<actions:ValidateServer><actions:serverType>{0}</actions:serverType><actions:serverConfig><actions:serverUrl>{1}</actions:serverUrl><actions:serverPort>{2}</actions:serverPort><actions:username>{3}</actions:username><actions:password>{4}</actions:password><actions:ftpOptions><actions:Protocol>{5}</actions:Protocol><actions:UploadPath>{6}</actions:UploadPath></actions:ftpOptions></actions:serverConfig></actions:ValidateServer>",
        AssignActions: "<actions:AssignActions><actions:token>{0}</actions:token><actions:actionList>{1}</actions:actionList></actions:AssignActions>",
        AssignActionsItem: "<actions:actionToken>{0}</actions:actionToken>",
        ActionSubjectFormat: "<actions:subjectFormat>{0}</actions:subjectFormat>",
        ActivateUserCommand: "<actions:ActivateUserCommand><actions:token>{0}</actions:token></actions:ActivateUserCommand>",
        CreateAction: "<actions:CreateAction><actions:token>{0}</actions:token><actions:actionType>{1}</actions:actionType><actions:actionConfiguration>{2}</actions:actionConfiguration></actions:CreateAction>",
        CreateActionTrigger: "<actions:CreateActionTrigger><actions:token>{0}</actions:token><actions:actionTriggerID>{1}</actions:actionTriggerID>{2}</actions:CreateActionTrigger>",
        DeleteAction: "<actions:DeleteAction><actions:token>{0}</actions:token></actions:DeleteAction>",
        DeleteActionTrigger: "<actions:DeleteActionTrigger><actions:token>{0}</actions:token></actions:DeleteActionTrigger>",
        GetActions: "<actions:GetActions/>",
        GetActionTriggers: "<actions:GetActionTriggers/>",
        GetConcurrencyPolicy: "<actions:GetConcurrencyPolicy/>",
        GetServers: "<actions:GetServers/>",
        GetTriggerPriorities: "<actions:GetTriggerPriorities/>",
        InputToken: "<actions:inputToken>{0}</actions:inputToken>",
        PresetToken: "<actions:presetToken>{0}</actions:presetToken>",
        ScheduleDayOfWeek: "<actions:weekDaySchedule>{0}<actions:Time><schema:Hour>{1}</schema:Hour><schema:Minute>{2}</schema:Minute><schema:Second>{3}</schema:Second></actions:Time></actions:weekDaySchedule>",
        ScheduleDateTime: "<actions:dateTimeSchedule><actions:Schedule><schema:Time><schema:Hour>{0}</schema:Hour><schema:Minute>{1}</schema:Minute><schema:Second>{2}</schema:Second></schema:Time><schema:Date><schema:Year>{3}</schema:Year><schema:Month>{4}</schema:Month><schema:Day>{5}</schema:Day></schema:Date></actions:Schedule></actions:dateTimeSchedule>",
        SecheduleWeekday: "<actions:Weekdays>{0}</actions:Weekdays>",
        SetConcurrencyPolicy: "<actions:SetConcurrencyPolicy><actions:policy>{0}</actions:policy></actions:SetConcurrencyPolicy>",
        SetTriggerPriorities: "<actions:SetTriggerPriorities><actions:TriggerPriorities>{0}</actions:TriggerPriorities></actions:SetTriggerPriorities>",
        TimerConfiguration: "<actions:timerConfiguration><actions:days>{0}</actions:days><actions:hours>{1}</actions:hours><actions:minutes>{2}</actions:minutes><actions:seconds>{3}</actions:seconds><actions:Start><schema:Time><schema:Hour>{4}</schema:Hour><schema:Minute>{5}</schema:Minute><schema:Second>{6}</schema:Second></schema:Time><schema:Date><schema:Year>{7}</schema:Year><schema:Month>{8}</schema:Month><schema:Day>{9}</schema:Day></schema:Date></actions:Start><actions:End><schema:Time><schema:Hour>{10}</schema:Hour><schema:Minute>{11}</schema:Minute><schema:Second>{12}</schema:Second></schema:Time><schema:Date><schema:Year>{13}</schema:Year><schema:Month>{14}</schema:Month><schema:Day>{15}</schema:Day></schema:Date></actions:End></actions:timerConfiguration>",
        TourToken: "<actions:tourToken>{0}</actions:tourToken>"
    }
      , W = {
        AddServerCertificateAssignment: "<advsecurity:AddServerCertificateAssignment><advsecurity:CertificationPathID>{0}</advsecurity:CertificationPathID></advsecurity:AddServerCertificateAssignment>",
        CreateCertificationPath: "<advsecurity:CreateCertificationPath><advsecurity:CertificateIDs>{0}</advsecurity:CertificateIDs></advsecurity:CreateCertificationPath>",
        CertificationPath: "<advsecurity:CertificateID>{0}</advsecurity:CertificateID>",
        CreatePKCS10CSR: "<advsecurity:CreatePKCS10CSR><advsecurity:Subject><advsecurity:CommonName>{0}</advsecurity:CommonName><advsecurity:Country>{1}</advsecurity:Country><advsecurity:StateOrProvinceName>{2}</advsecurity:StateOrProvinceName><advsecurity:Locality>{3}</advsecurity:Locality><advsecurity:Organization>{4}</advsecurity:Organization><advsecurity:OrganizationalUnit>{5}</advsecurity:OrganizationalUnit></advsecurity:Subject><advsecurity:KeyID>{6}</advsecurity:KeyID><advsecurity:SignatureAlgorithm><advsecurity:algorithm>{7}</advsecurity:algorithm></advsecurity:SignatureAlgorithm></advsecurity:CreatePKCS10CSR>",
        CreateSelfSignedCertificate: "<advsecurity:CreateSelfSignedCertificate><advsecurity:Subject><advsecurity:CommonName>{0}</advsecurity:CommonName><advsecurity:Country>{1}</advsecurity:Country><advsecurity:StateOrProvinceName>{2}</advsecurity:StateOrProvinceName><advsecurity:Locality>{3}</advsecurity:Locality><advsecurity:Organization>{4}</advsecurity:Organization><advsecurity:OrganizationalUnit>{5}</advsecurity:OrganizationalUnit></advsecurity:Subject><advsecurity:KeyID>{6}</advsecurity:KeyID><advsecurity:Alias>{7}</advsecurity:Alias><advsecurity:SignatureAlgorithm><advsecurity:algorithm>{8}</advsecurity:algorithm></advsecurity:SignatureAlgorithm></advsecurity:CreateSelfSignedCertificate>",
        CreateRSAKeyPair: "<advsecurity:CreateRSAKeyPair><advsecurity:KeyLength>{0}</advsecurity:KeyLength></advsecurity:CreateRSAKeyPair>",
        DeleteCertificate: "<advsecurity:DeleteCertificate><advsecurity:CertificateID>{0}</advsecurity:CertificateID></advsecurity:DeleteCertificate>",
        DeleteCertificationPath: "<advsecurity:DeleteCertificationPath><advsecurity:CertificationPathID>{0}</advsecurity:CertificationPathID></advsecurity:DeleteCertificationPath>",
        DeleteKey: "<advsecurity:DeleteKey><advsecurity:KeyID>{0}</advsecurity:KeyID></advsecurity:DeleteKey>",
        GetAllCertificates: "<advsecurity:GetAllCertificates></advsecurity:GetAllCertificates>",
        GetAllCertificationPaths: "<advsecurity:GetAllCertificationPaths></advsecurity:GetAllCertificationPaths>",
        GetAssignedServerCertificates: "<advsecurity:GetAssignedServerCertificates></advsecurity:GetAssignedServerCertificates>",
        GetCertificate: "<advsecurity:GetCertificate><advsecurity:CertificateID>{0}</advsecurity:CertificateID></advsecurity:GetCertificate>",
        GetCertificationPath: "<advsecurity:GetCertificationPath><advsecurity:CertificationPathID>{0}</advsecurity:CertificationPathID></advsecurity:GetCertificationPath>",
        RemoveServerCertificateAssignment: "<advsecurity:RemoveServerCertificateAssignment><advsecurity:CertificationPathID>{0}</advsecurity:CertificationPathID></advsecurity:RemoveServerCertificateAssignment>",
        ReplaceServerCertificateAssignment: "<advsecurity:ReplaceServerCertificateAssignment><advsecurity:OldCertificationPathID>{0}</advsecurity:OldCertificationPathID><advsecurity:NewCertificationPathID>{1}</advsecurity:NewCertificationPathID></advsecurity:ReplaceServerCertificateAssignment>",
        UploadCertificate: "<advsecurity:UploadCertificate><advsecurity:Certificate>{0}</advsecurity:Certificate><advsecurity:Alias>{1}</advsecurity:Alias><advsecurity:PrivateKeyRequired>{2}</advsecurity:PrivateKeyRequired></advsecurity:UploadCertificate>"
    }
      , H = {
        CreateUser: "<device:CreateUsers><device:User><schema:Username>{0}</schema:Username><schema:Password>{1}</schema:Password><schema:UserLevel>{2}</schema:UserLevel></device:User></device:CreateUsers>",
        DeleteUser: "<device:DeleteUsers><device:Username>{0}</device:Username></device:DeleteUsers>",
        GetCertificateInformation: "<device:CertificateInformation><device:IssuerDN>{0}</device:IssuerDN><device:SubjectDN>{0}</device:SubjectDN><device:KeyLength>{0}</device:KeyLength><device:Version>{0}</device:Version><device:SerialNum>{0}</device:SerialNum><device:SignatureAlgorithm>{0}</device:SignatureAlgorithm><device:Validity><device:From>{0}</device:From><device:Until>{0}</device:Until></device:Validity></device:CertificateInformation>",
        GetDefaultGateway: "<device:GetNetworkDefaultGateway></device:GetNetworkDefaultGateway>",
        GetDNS: "<device:GetDNS></device:GetDNS>",
        GetDateTime: "<device:GetSystemDateAndTime></device:GetSystemDateAndTime>",
        GetDeviceInformation: "<device:GetDeviceInformation></device:GetDeviceInformation>",
        GetHostName: "<device:GetHostname></device:GetHostname>",
        GetNetworkProtocols: "<device:GetNetworkProtocols></device:GetNetworkProtocols>",
        GetNetworkInterfaces: "<device:GetNetworkInterfaces></device:GetNetworkInterfaces>",
        GetNTP: "<device:GetNTP></device:GetNTP>",
        GetRelayOutputs: "<device:GetRelayOutputs></device:GetRelayOutputs>",
        GetSystemBackup: "<device:GetSystemBackup></device:GetSystemBackup>",
        GetSystemLog: "<device:GetSystemLog><device:LogType>System</device:LogType></device:GetSystemLog>",
        GetSystemUris: "<device:GetSystemUris></device:GetSystemUris>",
        GetUsers: "<device:GetUsers></device:GetUsers>",
        Reboot: "<device:SystemReboot/>",
        SetFactoryDefault: "<device:SetSystemFactoryDefault><device:FactoryDefault>{0}</device:FactoryDefault></device:SetSystemFactoryDefault>",
        SetDateTimeManual: "<device:SetSystemDateAndTime><device:DateTimeType>Manual</device:DateTimeType><device:DaylightSavings>{0}</device:DaylightSavings><device:TimeZone><schema:TZ>{1}</schema:TZ></device:TimeZone><device:UTCDateTime><schema:Time><schema:Hour>{2}</schema:Hour><schema:Minute>{3}</schema:Minute><schema:Second>{4}</schema:Second></schema:Time><schema:Date><schema:Year>{5}</schema:Year><schema:Month>{6}</schema:Month><schema:Day>{7}</schema:Day></schema:Date></device:UTCDateTime></device:SetSystemDateAndTime>",
        SetDateTimeNTP: "<device:SetSystemDateAndTime><device:DateTimeType>NTP</device:DateTimeType><device:DaylightSavings>{0}</device:DaylightSavings><device:TimeZone><schema:TZ>{1}</schema:TZ></device:TimeZone></device:SetSystemDateAndTime>",
        SetDNS: "<device:SetDNS><device:FromDHCP>{0}</device:FromDHCP><device:DNSManual><schema:Type>IPv4</schema:Type><schema:IPv4Address>{1}</schema:IPv4Address></device:DNSManual><device:DNSManual><schema:Type>IPv4</schema:Type><schema:IPv4Address>{2}</schema:IPv4Address></device:DNSManual></device:SetDNS>",
        SetDNS_DHCP: "<device:SetDNS><device:FromDHCP>true</device:FromDHCP></device:SetDNS>",
        SetHostName: "<device:SetHostname><device:Name>{0}</device:Name></device:SetHostname>",
        SetNetworkProtocol: "<device:SetNetworkProtocols><device:NetworkProtocols><schema:Name>{0}</schema:Name><schema:Enabled>{1}</schema:Enabled><schema:Port>{2}</schema:Port></device:NetworkProtocols><device:NetworkProtocols><schema:Name>{3}</schema:Name><schema:Enabled>{4}</schema:Enabled><schema:Port>{5}</schema:Port></device:NetworkProtocols></device:SetNetworkProtocols>",
        SetNTP0: "<device:SetNTP><device:FromDHCP>false</device:FromDHCP></device:SetNTP>",
        SetNTP1: "<device:SetNTP><device:FromDHCP>false</device:FromDHCP>{0}</device:SetNTP>",
        SetNTP2: "<device:SetNTP><device:FromDHCP>false</device:FromDHCP>{0}{1}</device:SetNTP>",
        SetNTP_DNS: "<device:NTPManual><schema:Type>DNS</schema:Type><schema:DNSname>{0}</schema:DNSname></device:NTPManual>",
        SetNTP_IPv4: "<device:NTPManual><schema:Type>IPv4</schema:Type><schema:IPv4Address>{0}</schema:IPv4Address></device:NTPManual>",
        SetRelayOutputState: "<device:SetRelayOutputState><device:RelayOutputToken>{0}</device:RelayOutputToken><device:LogicalState>{1}</device:LogicalState></device:SetRelayOutputState>",
        SetUser: "<device:SetUser><device:User><schema:Username>{0}</schema:Username><schema:Password>{1}</schema:Password><schema:UserLevel>{2}</schema:UserLevel></device:User></device:SetUser>",
        StartFirmwareUpgrade: "<device:StartFirmwareUpgrade/>",
        StartSystemRestore: "<device:StartSystemRestore></device:StartSystemRestore>"
    }
      , ac = {
        GetDigitalInputs: "<dio:GetDigitalInputs></dio:GetDigitalInputs>",
        SetDigitalInputConfigurations: "<dio:SetDigitalInputConfigurations><dio:DigitalInputs><dio:token>{0}</dio:token><dio:IdleState>{1}</dio:IdleState></dio:DigitalInputs></dio:SetDigitalInputConfigurations>",
        SetRelayOutputSettings: "<dio:SetRelayOutputSettings><dio:RelayOutput token='{0}'><schema:Properties><schema:Mode>{1}</schema:Mode><schema:DelayTime>{2}</schema:DelayTime><schema:IdleState>{3}</schema:IdleState></schema:Properties></dio:RelayOutput></dio:SetRelayOutputSettings>"
    }
      , r = {
        CalibratePositioner: "<extension:CalibratePositioner></extension:CalibratePositioner>",
        ClearNorth: "<extension:ClearNorth></extension:ClearNorth>",
        ClearPMask: "<extension:ClearPMask><extension:ProfileToken>{0}</extension:ProfileToken><extension:PrivacyMaskToken>{1}</extension:PrivacyMaskToken></extension:ClearPMask>",
        CreateEncoder: "<extension:CreateVideoEncoder><extension:VideoSourceToken>{0}</extension:VideoSourceToken></extension:CreateVideoEncoder>",
        DefaultAdvancedPt2: "<extension:SetHitachi231Settings><extension:ProfileToken>{0}</extension:ProfileToken><extension:WhiteBalancePreset>Normal</extension:WhiteBalancePreset><extension:FNR Mode='Normal' Level='50'></extension:FNR><schema:Sharpness>1</schema:Sharpness><extension:Intensity Mode='Off' ></extension:Intensity><extension:EIS State='false' ></extension:EIS><extension:IRCorrection>VisibleRay</extension:IRCorrection></extension:SetHitachi231Settings>",
        DefaultDefog: "<extension:SetHitachi231Settings><extension:ProfileToken>{0}</extension:ProfileToken><extension:Defog Mode='Auto' Strength='0' Color='75' /></extension:SetHitachi231Settings>",
        DefaultLens: "<extension:SetHitachi231Settings><extension:ProfileToken>{0}</extension:ProfileToken><extension:AutoFocusSensitivity>Normal</extension:AutoFocusSensitivity><extension:AutoFocusSearchType>Off</extension:AutoFocusSearchType></extension:SetHitachi231Settings>",
        DeleteEncoder: "<extension:DeleteVideoEncoder><extension:VideoEncoderToken>{0}</extension:VideoEncoderToken></extension:DeleteVideoEncoder>",
        DeleteSector: "<extension:DeleteSector><extension:SectorToken>{0}</extension:SectorToken></extension:DeleteSector>",
        DoIrisCommand: "<extension:SetHitachi231Settings><extension:ProfileToken>{0}</extension:ProfileToken><extension:Iris Action='{1}'></extension:Iris></extension:SetHitachi231Settings>",
        GetVideoChannel5Resolution: "<extension:GetVideoChannel5Resolution></extension:GetVideoChannel5Resolution>",
        GetAnalogVideo: "<extension:GetAnalogVideo></extension:GetAnalogVideo>",
        GetBanners: "<extension:GetBanner/>",
        GetBitRate: "<extension:GetBitRate><extension:VideoEncoderToken>{0}</extension:VideoEncoderToken></extension:GetBitRate>",
        GetCapabilities: "<extension:GetServiceCapabilities/>",
        GetConstrainedMode: "<extension:GetConstraintMode><extension:VideoEncoderToken>{0}</extension:VideoEncoderToken></extension:GetConstraintMode>",
        GetIFrameBurstSetting: "<extension:GetIFrameBurstSetting><extension:VideoEncoderToken>{0}</extension:VideoEncoderToken></extension:GetIFrameBurstSetting>",
        GetDateTimeFormat: "<extension:GetDateTimeFormat></extension:GetDateTimeFormat>",
        GetDiagnosticData: "<extension:GetDiagnosticData></extension:GetDiagnosticData>",
        GetDigitalOutputState: "<extension:GetDigitalOutputState></extension:GetDigitalOutputState>",
        GetFonts: "<extension:GetFont></extension:GetFont>",
        GetGeneralSettings: "<extension:GetGeneralSettings></extension:GetGeneralSettings>",
        GetHitachi231Settings: "<extension:GetHitachi231Settings><extension:ProfileToken>{0}</extension:ProfileToken></extension:GetHitachi231Settings>",
        GetHeaterState: "<extension:GetHeaterState></extension:GetHeaterState>",
        GetInputConfig: "<extension:GetInputConfig><extension:PortNum>{0}</extension:PortNum></extension:GetInputConfig>",
        GetLicenseAgreementStatus: "<extension:GetLicenseAgreementStatus></extension:GetLicenseAgreementStatus>",
        GetLLDPState: "<extension:GetLLDPState/>",
        GetOptions: "<extension:GetOptions></extension:GetOptions>",
        GetMaxDigitalZoomLimit: "<extension:GetMaxDigitalZoomLimit><extension:VideoSourceToken>{0}</extension:VideoSourceToken></extension:GetMaxDigitalZoomLimit>",
        GetNetworkProtocol: "<extension:GetNetworkProtocol></extension:GetNetworkProtocol>",
        GetNetworkStatus: "<extension:GetDataLog><extension:LogToken>NetworkStatus</extension:LogToken></extension:GetDataLog>",
        GetLegacyNetworkTimeout: "<extension:GetLegacyNetworkTimeout/>",
        GetOSDOrder: "<extension:GetOSDOrder/>",
        GetParkConfiguration: "<extension:GetParkConfiguration></extension:GetParkConfiguration>",
        GetPMaskAttributes: "<extension:GetPMaskAttributes></extension:GetPMaskAttributes>",
        GetPMaskMode: "<extension:GetPMaskMode></extension:GetPMaskMode>",
        GetPMasks: "<extension:GetPMasks><extension:ProfileToken>{0}</extension:ProfileToken></extension:GetPMasks>",
        GetSectors: "<extension:GetSectors></extension:GetSectors>",
        GetSnapshotCapabilities: "<extension:GetSnapshotCapabilities><extension:VideoSourceToken>{0}</extension:VideoSourceToken></extension:GetSnapshotCapabilities>",
        GetSnapshotProperties: "<extension:GetSnapshotProperties></extension:GetSnapshotProperties>",
        GetSnmpCommunityName: "<extension:GetSnmpCommunityName></extension:GetSnmpCommunityName>",
        GetSnmpState: "<extension:GetSnmpState></extension:GetSnmpState>",
        GetSnmpTrapSettings: "<extension:GetSnmpTrapSettings></extension:GetSnmpTrapSettings>",
        GetSnmpV3UserStatus: "<extension:GetSnmpV3UserStatus></extension:GetSnmpV3UserStatus>",
        GetUnusedKeyList: "<extension:GetUnusedKeyList></extension:GetUnusedKeyList>",
        GetUtilization: "<extension:GetUtilization></extension:GetUtilization>",
        GetRTSPDigestStatus: "<extension:GetRTSPDigestStatus></extension:GetRTSPDigestStatus>",
        GetSerialPort: "<extension:GetSerialPort token='SerialPort'></extension:GetSerialPort>",
        GetSystemUptime: "<extension:GetDataLog><extension:LogToken>SystemStatus</extension:LogToken></extension:GetDataLog>",
        GetTransparency: "<extension:GetTransparency><extension:Token>9</extension:Token></extension:GetTransparency>",
        GetVideoEncoderSource: "<extension:GetVideoEncoderSource><extension:Token>{0}</extension:Token></extension:GetVideoEncoderSource>",
        GetWiper: "<extension:GetWiper></extension:GetWiper>",
        GetZoomMagnification: "<extension:GetZoomMagnification></extension:GetZoomMagnification>",
        Login: "<extension:GetUiAccessDoc><extension:User>{0}</extension:User></extension:GetUiAccessDoc>",
        MarkPMask: "<extension:MarkPMask><extension:ProfileToken>{0}</extension:ProfileToken><extension:PrivacyMaskToken>{1}</extension:PrivacyMaskToken><extension:Timeout>{2}</extension:Timeout></extension:MarkPMask>",
        OnePushAutoFocus: "<extension:OnePushAutoFocus><extension:VideoSourceToken>{0}</extension:VideoSourceToken></extension:OnePushAutoFocus>",
        SetAnalogVideo: "<extension:SetAnalogVideo><extension:VideoSourceToken>{0}</extension:VideoSourceToken><extension:State>{1}</extension:State><extension:Mode>{2}</extension:Mode></extension:SetAnalogVideo>",
        SetAutoFocusSensitivity: "<extension:SetHitachi231Settings><extension:ProfileToken>{0}</extension:ProfileToken><extension:AutoFocusSensitivity>{1}</extension:AutoFocusSensitivity></extension:SetHitachi231Settings>",
        SetAutoFocusType: "<extension:SetHitachi231Settings><extension:ProfileToken>{0}</extension:ProfileToken><extension:AutoFocusSearchType>{1}</extension:AutoFocusSearchType></extension:SetHitachi231Settings>",
        SetBanners: "<extension:SetBanner><extension:Top Transparent='{0}'><schema:Color X='{1}' Y='{2}' Z='{3}'/></extension:Top><extension:Bottom Transparent='{4}'><schema:Color X='{5}' Y='{6}' Z='{7}'/></extension:Bottom></extension:SetBanner>",
        SetBitRateCBR: "<extension:SetBitRate><extension:VideoEncoderToken>{0}</extension:VideoEncoderToken><extension:BitRateMode>CBR</extension:BitRateMode></extension:SetBitRate>",
        SetBitRateFixed: "<extension:SetBitRate><extension:VideoEncoderToken>{0}</extension:VideoEncoderToken><extension:BitRateMode>FixQp</extension:BitRateMode></extension:SetBitRate>",
        SetBitRateVBR: "<extension:SetBitRate><extension:VideoEncoderToken>{0}</extension:VideoEncoderToken><extension:BitRateMode>VBR</extension:BitRateMode></extension:SetBitRate>",
        SetConstrainedMode: "<extension:SetConstraintMode><extension:VideoEncoderToken>{0}</extension:VideoEncoderToken><extension:State>{1}</extension:State></extension:SetConstraintMode>",
        SetIFrameBurstSetting: "<extension:SetIFrameBurstSetting><extension:VideoEncoderToken>{0}</extension:VideoEncoderToken><extension:BurstSetting>{1}</extension:BurstSetting></extension:SetIFrameBurstSetting>",
        SetDateTimeFormat: "<extension:SetDateTimeFormat><extension:DateFormat>{0}</extension:DateFormat><extension:TimeFormat>{1}</extension:TimeFormat></extension:SetDateTimeFormat>",
        SetDefogColor: "<extension:SetHitachi231Settings><extension:ProfileToken>{0}</extension:ProfileToken><extension:Defog Color='{1}' ></extension:Defog></extension:SetHitachi231Settings>",
        SetDefogMode: "<extension:SetHitachi231Settings><extension:ProfileToken>{0}</extension:ProfileToken><extension:Defog Mode='{1}' ></extension:Defog></extension:SetHitachi231Settings>",
        SetDefogLevel: "<extension:SetHitachi231Settings><extension:ProfileToken>{0}</extension:ProfileToken><extension:Defog Strength='{1}' ></extension:Defog></extension:SetHitachi231Settings>",
        setDigitalZoom: "<extension:SetHitachi231Settings><extension:ProfileToken>{0}</extension:ProfileToken><extension:DigitalZoom>{1}</extension:DigitalZoom></extension:SetHitachi231Settings>",
        SetEISMode: "<extension:SetHitachi231Settings><extension:ProfileToken>{0}</extension:ProfileToken><extension:EIS State='{1}' ></extension:EIS></extension:SetHitachi231Settings>",
        SetFont: "<extension:SetFont><extension:Font>{0}</extension:Font></extension:SetFont>",
        SetGeneralSettings: "<extension:SetGeneralSettings><extension:Properties AutoFocus='{0}' ProportionalPTZ='{1}' FreezeVideo='{2}' InvertedMount='{3}' AutoFlip='{4}' HighWind='{5}'></extension:Properties></extension:SetGeneralSettings>",
        SetHeaterState: "<extension:SetHeaterState><extension:State>{0}</extension:State></extension:SetHeaterState>",
        SetInputConfiguration: "<extension:SetInputConfig><extension:Input PortNum='{0}' State='{1}' Trigger='{2}'/></extension:SetInputConfig>",
        SetIntensityLevel: "<extension:SetHitachi231Settings><extension:ProfileToken>{0}</extension:ProfileToken><extension:Intensity Level='{1}' ></extension:Intensity></extension:SetHitachi231Settings>",
        SetIntensityMode: "<extension:SetHitachi231Settings><extension:ProfileToken>{0}</extension:ProfileToken><extension:Intensity Mode='{1}' ></extension:Intensity></extension:SetHitachi231Settings>",
        SetMaxDigitalZoomLimit: "<extension:SetMaxDigitalZoomLimit><extension:VideoSourceToken>{0}</extension:VideoSourceToken><extension:MaxDigitalZoomLimit>{1}</extension:MaxDigitalZoomLimit></extension:SetMaxDigitalZoomLimit>",
        SetNetworkProtocol: "<extension:SetNetworkProtocol><extension:Protocol>{0}</extension:Protocol><extension:Port>{1}</extension:Port></extension:SetNetworkProtocol>",
        SetLegacyNetworkTimeout: "<extension:SetLegacyNetworkTimeout><extension:Timeout>{0}</extension:Timeout></extension:SetLegacyNetworkTimeout>",
        SetNetworkInterfaces: "<extension:SetNetworkSettings><extension:InterfaceToken>eth0</extension:InterfaceToken><extension:NetworkInterface><extension:MTU>{0}</extension:MTU><extension:IPv4><extension:DHCP>{1}</extension:DHCP><extension:Manual><extension:IPAddress>{2}</extension:IPAddress><extension:SubnetMask>{3}</extension:SubnetMask><extension:DefaultGatewayAddress>{4}</extension:DefaultGatewayAddress></extension:Manual></extension:IPv4><extension:Link><extension:AutoNegotiation>{5}</extension:AutoNegotiation><extension:Speed>{6}</extension:Speed><extension:Duplex>{7}</extension:Duplex></extension:Link></extension:NetworkInterface></extension:SetNetworkSettings>",
        SetNetworkInterfaces_DHCP: "<extension:SetNetworkSettings><extension:InterfaceToken>eth0</extension:InterfaceToken><extension:NetworkInterface><extension:MTU>{0}</extension:MTU><extension:IPv4><extension:DHCP>{1}</extension:DHCP></extension:IPv4><extension:Link><extension:AutoNegotiation>{2}</extension:AutoNegotiation><extension:Speed>{3}</extension:Speed><extension:Duplex>{4}</extension:Duplex></extension:Link></extension:NetworkInterface></extension:SetNetworkSettings>",
        SetNoiseReduction: "<extension:SetHitachi231Settings><extension:ProfileToken>{0}</extension:ProfileToken><extension:FNR Mode='{1}' ></extension:FNR></extension:SetHitachi231Settings>",
        SetNoiseReductionLevel: "<extension:SetHitachi231Settings><extension:ProfileToken>{0}</extension:ProfileToken><extension:FNR Level='{1}' ></extension:FNR></extension:SetHitachi231Settings>",
        SetNorth: "<extension:SetNorth><extension:SetNorth>{0}</extension:SetNorth></extension:SetNorth>",
        SetOSDOrder: "<extension:SetOSDOrder><extension:List><extension:Position>UpperLeft</extension:Position><extension:TokenList>{0}</extension:TokenList></extension:List><extension:List><extension:Position>UpperRight</extension:Position><extension:TokenList>{1}</extension:TokenList></extension:List><extension:List><extension:Position>LowerLeft</extension:Position><extension:TokenList>{2}</extension:TokenList></extension:List><extension:List><extension:Position>LowerRight</extension:Position><extension:TokenList>{3}</extension:TokenList></extension:List><extension:List><extension:Position>Center</extension:Position><extension:TokenList>{4}</extension:TokenList></extension:List></extension:SetOSDOrder>",
        SetParkConfiguration: "<extension:SetParkConfiguration><extension:State>{0}</extension:State><extension:Timeout>{1}</extension:Timeout><extension:Activity>{2}</extension:Activity><extension:Index>{3}</extension:Index></extension:SetParkConfiguration>",
        SetPMask: "<extension:SetPMask><extension:ProfileToken>{0}</extension:ProfileToken><extension:PrivacyMask Token='{1}' X='{2}' Y='{3}' Width='{4}' Height='{5}'></extension:PrivacyMask></extension:SetPMask>",
        SetPMaskAttributes: "<extension:SetPMaskAttributes><extension:Gradation>{0}</extension:Gradation><extension:Transparency>{1}</extension:Transparency><extension:Color>{2}</extension:Color><extension:SeeThrough>{3}</extension:SeeThrough><extension:Mosaic>{4}</extension:Mosaic></extension:SetPMaskAttributes>",
        SetPMaskMode: "<extension:SetPMaskMode><extension:State>{0}</extension:State></extension:SetPMaskMode>",
        SetPortDirection: "<extension:SetPortDirection><extension:PortNum>{0}</extension:PortNum><extension:Direction>{1}</extension:Direction></extension:SetPortDirection>",
        SetRTSPDigestStatus: "<extension:SetRTSPDigestStatus><extension:Status>{0}</extension:Status></extension:SetRTSPDigestStatus>",
        SetSector: "<extension:SetSector><extension:Sector Token='{0}' Title='{1}'></extension:Sector></extension:SetSector>",
        SetSectorLimit: "<extension:SetSectorLimit><extension:SectorToken>{0}</extension:SectorToken><extension:Limit>{1}</extension:Limit></extension:SetSectorLimit>",
        SetSerialPort: "<extension:SetSerialPort token='SerialPort'><extension:Protocol>{0}</extension:Protocol><extension:Type>{1}</extension:Type><extension:BaudRate>{2}</extension:BaudRate><extension:ParityBit>{3}</extension:ParityBit><extension:CharacterLength>{4}</extension:CharacterLength><extension:StopBit>{5}</extension:StopBit><extension:Address>{6}</extension:Address></extension:SetSerialPort>",
        SetSnapshotProperties: "<extension:SetSnapshotProperties><extension:VideoSourceToken>{0}</extension:VideoSourceToken><extension:Resolution><schema:Width>{1}</schema:Width><schema:Height>{2}</schema:Height></extension:Resolution><extension:Quality>{3}</extension:Quality></extension:SetSnapshotProperties>",
        SetSnmpCommunityName: "<extension:SetSnmpCommunityName><extension:CommunityName>{0}</extension:CommunityName></extension:SetSnmpCommunityName>",
        SetSnmpState: "<extension:SetSnmpState><extension:State>{0}</extension:State><extension:Version>{1}</extension:Version></extension:SetSnmpState>",
        SetSnmpTrapSettings: "<extension:SetSnmpTrapSettings><extension:DestinationAddress>{0}</extension:DestinationAddress>{1}</extension:SetSnmpTrapSettings>",
        SetSnmpV3User: "<extension:SetSnmpV3User><extension:Name>{0}</extension:Name><extension:Authentication><extension:Protocol>{1}</extension:Protocol><extension:Password>{2}</extension:Password></extension:Authentication><extension:Privacy><extension:Protocol>{3}</extension:Protocol><extension:Password>{4}</extension:Password></extension:Privacy></extension:SetSnmpV3User>",
        SnmpTrap: "<extension:SnmpTrap><extension:Name>{0}</extension:Name><extension:State>{1}</extension:State></extension:SnmpTrap>",
        SetLicenseAgreement: "<extension:SetLicenseAgreement><extension:Address>{0}</extension:Address><extension:Timestamp>{1}</extension:Timestamp></extension:SetLicenseAgreement>",
        SetLLDPState: "<extension:SetLLDPState><extension:State>{0}</extension:State></extension:SetLLDPState>",
        SetLogoTransparency: "<extension:SetTransparency><extension:Token>9</extension:Token><extension:Level>{0}</extension:Level></extension:SetTransparency>",
        SetVideoChannel5Resolution: "<extension:SetVideoChannel5Resolution><extension:VideoSourceToken>{0}</extension:VideoSourceToken><extension:Resolution>{1}</extension:Resolution></extension:SetVideoChannel5Resolution>",
        SetWhiteBalancePreset: "<extension:SetHitachi231Settings><extension:ProfileToken>{0}</extension:ProfileToken><extension:WhiteBalancePreset>{1}</extension:WhiteBalancePreset></extension:SetHitachi231Settings>",
        SetWiper: "<extension:SetWiper><extension:Wiper Token='0' State='{0}' Dwell='{1}' Mode='{2}' Value='{3}' ></extension:Wiper></extension:SetWiper>",
        SetAnonymousAccess: "<extension:SetAnonymousAccess><extension:State>{0}</extension:State></extension:SetAnonymousAccess>",
        GetAnonymousAccess: "<extension:GetAnonymousAccess/>",
        ZoomMagnification: "<extension:GetZoomMagnification><extension:VideoSourceToken>{0}</extension:VideoSourceToken></extension:GetZoomMagnification>"
    }
      , J = {
        DefaultAdvancedPt1: "<imaging:SetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:ImagingSettings><schema:Sharpness>2</schema:Sharpness><schema:WhiteBalance><schema:Mode>AUTO</schema:Mode></schema:WhiteBalance></imaging:ImagingSettings></imaging:SetImagingSettings>",
        DefaultExposure: "<imaging:SetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:ImagingSettings><schema:IrCutFilter>AUTO</schema:IrCutFilter><schema:Exposure><schema:ExposureTime>0</schema:ExposureTime><schema:MaxGain>48</schema:MaxGain><schema:Mode>AUTO</schema:Mode><schema:MaxExposureTime>500000.0</schema:MaxExposureTime></schema:Exposure><schema:WideDynamicRange><schema:Level>0</schema:Level><schema:Mode>OFF</schema:Mode></schema:WideDynamicRange><schema:BacklightCompensation><schema:Mode>OFF</schema:Mode></schema:BacklightCompensation></imaging:ImagingSettings></imaging:SetImagingSettings>",
        DoFocusContinuous: "<imaging:Move><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:Focus><schema:Continuous><schema:Speed>{1}</schema:Speed></schema:Continuous></imaging:Focus></imaging:Move>",
        DoFocusRelative: "<imaging:Move><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:Focus><schema:Relative><schema:Distance>{1}</schema:Distance><schema:Speed>{2}</schema:Speed></schema:Relative></imaging:Focus></imaging:Move>",
        SetAGCValue_AutoExposure: "<imaging:SetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:ImagingSettings><schema:Exposure><schema:MaxGain>{1}</schema:MaxGain><schema:Mode>AUTO</schema:Mode></schema:Exposure></imaging:ImagingSettings></imaging:SetImagingSettings>",
        SetAGCValue_AutoExposure_WithPriority: "<imaging:SetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:ImagingSettings><schema:Exposure><schema:MaxGain>{1}</schema:MaxGain><schema:Mode>AUTO</schema:Mode><schema:Priority>{2}</schema:Priority></schema:Exposure></imaging:ImagingSettings></imaging:SetImagingSettings>",
        SetAGCValue_ManualExposure: "<imaging:SetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:ImagingSettings><schema:Exposure><schema:Gain>{1}</schema:Gain><schema:Mode>MANUAL</schema:Mode></schema:Exposure></imaging:ImagingSettings></imaging:SetImagingSettings>",
        SetBacklightCompensation: "<imaging:SetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:ImagingSettings><schema:BacklightCompensation><schema:Mode>{1}</schema:Mode></schema:BacklightCompensation></imaging:ImagingSettings></imaging:SetImagingSettings>",
        SetBacklightCompValue: "<imaging:SetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:ImagingSettings><schema:BacklightCompensation><schema:Mode>ON</schema:Mode><schema:Level>{1}</schema:Level></schema:BacklightCompensation></imaging:ImagingSettings></imaging:SetImagingSettings>",
        SetDSS_WithExposureMode: "<imaging:SetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:ImagingSettings><schema:Exposure><schema:MaxExposureTime>{1}</schema:MaxExposureTime><schema:Mode>{2}</schema:Mode></schema:Exposure></imaging:ImagingSettings></imaging:SetImagingSettings>",
        SetDSS_WithExposureMode_Priority: "<imaging:SetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:ImagingSettings><schema:Exposure><schema:MaxExposureTime>{1}</schema:MaxExposureTime><schema:Mode>{2}</schema:Mode><schema:Priority>{3}</schema:Priority></schema:Exposure></imaging:ImagingSettings></imaging:SetImagingSettings>",
        SetFocusMode: "<imaging:SetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:ImagingSettings><schema:Focus><schema:AutoFocusMode>{1}</schema:AutoFocusMode></schema:Focus></imaging:ImagingSettings></imaging:SetImagingSettings>",
        SetBrightnessContrast: "<imaging:SetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:ImagingSettings><schema:Brightness>{1}</schema:Brightness><schema:Contrast>{2}</schema:Contrast></imaging:ImagingSettings></imaging:SetImagingSettings>",
        SetBrightness: "<imaging:SetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:ImagingSettings><schema:Brightness>{1}</schema:Brightness></imaging:ImagingSettings></imaging:SetImagingSettings>",
        SetContrast: "<imaging:SetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:ImagingSettings><schema:Contrast>{1}</schema:Contrast></imaging:ImagingSettings></imaging:SetImagingSettings>",
        SetGain: "<imaging:SetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:ImagingSettings><schema:Exposure><schema:Mode>{1}</schema:Mode><schema:Gain>{2}</schema:Gain></schema:Exposure></imaging:ImagingSettings></imaging:SetImagingSettings>",
        SetSharpness: "<imaging:SetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:ImagingSettings><schema:Sharpness>{1}</schema:Sharpness></imaging:ImagingSettings></imaging:SetImagingSettings>",
        SetStabilization: "<imaging:SetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:ImagingSettings><schema:Extension><schema:ImageStabilization><schema:Mode>{1}</schema:Mode><schema:Level>{2}</schema:Level></schema:ImageStabilization></schema:Extension></imaging:ImagingSettings></imaging:SetImagingSettings>",
        SetNoiseReduction: "<imaging:SetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:ImagingSettings><schema:Extension><schema:Extension><schema:Extension><schema:NoiseReduction><schema:Level>{1}</schema:Level></schema:NoiseReduction></schema:Extension></schema:Extension></schema:Extension></imaging:ImagingSettings></imaging:SetImagingSettings>",
        SetGainMode: "<imaging:SetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:ImagingSettings><schema:Exposure><schema:Mode>{1}</schema:Mode></schema:Exposure></imaging:ImagingSettings></imaging:SetImagingSettings>",
        GetGain: "<imaging:GetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken></imaging:GetImagingSettings >",
        GetImagingSettings: "<imaging:GetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken></imaging:GetImagingSettings>",
        SetImageDayNightMode: "<imaging:SetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:ImagingSettings><schema:IrCutFilter>{1}</schema:IrCutFilter></imaging:ImagingSettings></imaging:SetImagingSettings>",
        SetIrisMode: "<imaging:SetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:ImagingSettings><schema:Exposure><schema:Mode>{1}</schema:Mode></schema:Exposure></imaging:ImagingSettings></imaging:SetImagingSettings>",
        SetIrisModeWithPriority: "<imaging:SetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:ImagingSettings><schema:Exposure><schema:Mode>{1}</schema:Mode><schema:Priority>{2}</schema:Priority></schema:Exposure></imaging:ImagingSettings></imaging:SetImagingSettings>",
        GetOptions: "<imaging:GetOptions><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken></imaging:GetOptions>",
        SetSharpnessLevel: "<imaging:SetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:ImagingSettings><schema:Sharpness>{1}</schema:Sharpness></imaging:ImagingSettings></imaging:SetImagingSettings>",
        SetShutterSpeed: "<imaging:SetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:ImagingSettings><schema:Exposure><schema:ExposureTime>{1}</schema:ExposureTime><schema:Mode>{2}</schema:Mode></schema:Exposure></imaging:ImagingSettings></imaging:SetImagingSettings>",
        SetShutterSpeedPriority: "<imaging:SetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:ImagingSettings><schema:Exposure><schema:ExposureTime>{1}</schema:ExposureTime><schema:Mode>{2}</schema:Mode><schema:Priority>{3}</schema:Priority></schema:Exposure></imaging:ImagingSettings></imaging:SetImagingSettings>",
        SetWDR_Mode: "<imaging:SetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:ImagingSettings><schema:WideDynamicRange><schema:Mode>{1}</schema:Mode></schema:WideDynamicRange></imaging:ImagingSettings></imaging:SetImagingSettings>",
        SetWDR_Level: "<imaging:SetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:ImagingSettings><schema:WideDynamicRange><schema:Mode>{1}</schema:Mode><schema:Level>{2}</schema:Level></schema:WideDynamicRange></imaging:ImagingSettings></imaging:SetImagingSettings>",
        SetWhiteBalanceMode: "<imaging:SetImagingSettings><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken><imaging:ImagingSettings><schema:WhiteBalance><schema:Mode>{1}</schema:Mode></schema:WhiteBalance></imaging:ImagingSettings></imaging:SetImagingSettings>",
        Stop: "<imaging:Stop><imaging:VideoSourceToken>{0}</imaging:VideoSourceToken></imaging:Stop>"
    }
      , D = {
        AddPTZConfig: "<media:AddPTZConfiguration><media:ProfileToken>{0}</media:ProfileToken><media:ConfigurationToken>{1}</media:ConfigurationToken></media:AddPTZConfiguration>",
        AddVideoSource: "<media:AddVideoSourceConfiguration><media:ProfileToken>{0}</media:ProfileToken><media:ConfigurationToken>{1}</media:ConfigurationToken></media:AddVideoSourceConfiguration>",
        CreateOSD: '<media:CreateOSD><media:OSD token=\'{0}\'><schema:VideoSourceConfigurationToken>{1}</schema:VideoSourceConfigurationToken><schema:Type>Text</schema:Type><schema:Position><schema:Type>{2}</schema:Type>{3}</schema:Position><schema:TextString><schema:Type>{4}</schema:Type><schema:FontSize>{5}</schema:FontSize><schema:FontColor Transparent=\'{6}\'><schema:Color X="{7}" Y="{8}" Z="{9}"/></schema:FontColor>{10}</schema:TextString></media:OSD></media:CreateOSD>',
        CreateOSDBackground: '<schema:BackgroundColor Transparent="{0}"><schema:Color X="{1}" Y="{2}" Z="{3}"/></schema:BackgroundColor>',
        CreateOSDDate: "<schema:DateFormat>{0}</schema:DateFormat><schema:TimeFormat>{1}</schema:TimeFormat>",
        CreateOSDLogo: "<media:CreateOSD><media:OSD token='{0}'><schema:VideoSourceConfigurationToken>{1}</schema:VideoSourceConfigurationToken><schema:Type>Image</schema:Type><schema:Position><schema:Type>Custom</schema:Type><schema:Pos x='{2}' y='{3}'></schema:Pos></schema:Position><schema:Image><schema:ImgPath>{4}</schema:ImgPath></schema:Image></media:OSD></media:CreateOSD>",
        CreateOSDPlain: "<schema:PlainText>{0}</schema:PlainText>",
        CreateOSDPos: "<schema:Pos x='{0}' y='{1}'></schema:Pos>",
        CreateProfile: "<media:CreateProfile><media:Name>{0}</media:Name><media:Token>{1}</media:Token></media:CreateProfile>",
        DeleteProfile: "<media:DeleteProfile><media:ProfileToken>{0}</media:ProfileToken></media:DeleteProfile>",
        DeleteOSD: "<media:DeleteOSD><media:OSDToken>{0}</media:OSDToken></media:DeleteOSD>",
        GetOSDS: "<media:GetOSDs></media:GetOSDs>",
        GetProfiles: "<media:GetProfiles></media:GetProfiles>",
        GetSnapshotURI: "<media:GetSnapshotUri><media:ProfileToken>{0}</media:ProfileToken></media:GetSnapshotUri>",
        GetVideoSources: "<media:GetVideoSources></media:GetVideoSources>",
        GetVideoEncoderConfig: "<media:GetVideoEncoderConfigurations></media:GetVideoEncoderConfigurations>",
        GetVideoEncoderConfigOptions: "<media:GetVideoEncoderConfigurationOptions><media:ConfigurationToken>{0}</media:ConfigurationToken></media:GetVideoEncoderConfigurationOptions>",
        RemoveEncoder: "<media:RemoveVideoEncoderConfiguration><media:ProfileToken>{0}</media:ProfileToken></media:RemoveVideoEncoderConfiguration>",
        RemovePTZConfig: "<media:RemovePTZConfiguration><media:ProfileToken>{0}</media:ProfileToken></media:RemovePTZConfiguration>",
        RemoveVideoSource: "<media:RemoveVideoSourceConfiguration><media:ProfileToken>{0}</media:ProfileToken></media:RemoveVideoSourceConfiguration>",
        SaveProfile: "<media:AddVideoEncoderConfiguration><media:ProfileToken>{0}</media:ProfileToken><media:ConfigurationToken>{1}</media:ConfigurationToken></media:AddVideoEncoderConfiguration>",
        SetOSD: '<media:SetOSD><media:OSD token=\'{0}\'><schema:VideoSourceConfigurationToken>{1}</schema:VideoSourceConfigurationToken><schema:Type>Text</schema:Type><schema:Position><schema:Type>{2}</schema:Type>{3}</schema:Position><schema:TextString><schema:Type>{4}</schema:Type><schema:FontSize>{5}</schema:FontSize><schema:FontColor Transparent=\'{6}\'><schema:Color X="{7}" Y="{8}" Z="{9}"/></schema:FontColor>{10}</schema:TextString></media:OSD></media:SetOSD>',
        SetVideoEncoderConfig: "<media:SetVideoEncoderConfiguration><media:Configuration token='{0}'><schema:Name>{1}</schema:Name><schema:UseCount>{2}</schema:UseCount><schema:Encoding>{3}</schema:Encoding><schema:RateControl><schema:FrameRateLimit>{4}</schema:FrameRateLimit><schema:BitrateLimit>{5}</schema:BitrateLimit></schema:RateControl><schema:Resolution><schema:Width>{6}</schema:Width><schema:Height>{7}</schema:Height></schema:Resolution><schema:Quality>{8}</schema:Quality><schema:SessionTimeout>{9}</schema:SessionTimeout><schema:H264><schema:GovLength>{10}</schema:GovLength><schema:H264Profile>{11}</schema:H264Profile></schema:H264><schema:Multicast><schema:Address><schema:Type>IPv4</schema:Type><schema:IPv4Address>{12}</schema:IPv4Address></schema:Address><schema:Port>{13}</schema:Port><schema:TTL>{14}</schema:TTL></schema:Multicast></media:Configuration><media:ForcePersistence>false</media:ForcePersistence></media:SetVideoEncoderConfiguration>",
        SetVideoEncoderConfigJPEG: "<media:SetVideoEncoderConfiguration><media:Configuration token='{0}'><schema:Name>{1}</schema:Name><schema:UseCount>{2}</schema:UseCount><schema:Encoding>{3}</schema:Encoding><schema:Resolution><schema:Width>{4}</schema:Width><schema:Height>{5}</schema:Height></schema:Resolution><schema:RateControl><schema:FrameRateLimit>{6}</schema:FrameRateLimit></schema:RateControl><schema:Quality>{7}</schema:Quality><schema:SessionTimeout>{8}</schema:SessionTimeout><schema:Multicast><schema:Address><schema:Type>IPv4</schema:Type><schema:IPv4Address>{9}</schema:IPv4Address></schema:Address><schema:Port>{10}</schema:Port><schema:TTL>{11}</schema:TTL></schema:Multicast></media:Configuration><media:ForcePersistence>true</media:ForcePersistence></media:SetVideoEncoderConfiguration>",
        StartMulticast: "<media:StartMulticastStreaming><media:ProfileToken>{0}</media:ProfileToken></media:StartMulticastStreaming>",
        StopMulticast: "<media:StopMulticastStreaming><media:ProfileToken>{0}</media:ProfileToken></media:StopMulticastStreaming>"
    }
      , O = {
        AbsoluteMoveX: "<ptz:AbsoluteMove><ptz:ProfileToken>{0}</ptz:ProfileToken><ptz:Position><schema:PanTilt x='{1}'/></ptz:Position></ptz:AbsoluteMove>",
        AbsoluteMoveY: "<ptz:AbsoluteMove><ptz:ProfileToken>{0}</ptz:ProfileToken><ptz:Position><schema:PanTilt y='{1}'/></ptz:Position></ptz:AbsoluteMove>",
        AbsoluteMoveXY: "<ptz:AbsoluteMove><ptz:ProfileToken>{0}</ptz:ProfileToken><ptz:Position><schema:PanTilt x='{1}' y='{2}'/></ptz:Position></ptz:AbsoluteMove>",
        CreatePresetTour: "<ptz:CreatePresetTour><ptz:ProfileToken>{0}</ptz:ProfileToken></ptz:CreatePresetTour>",
        GetPresets: "<ptz:GetPresets><ptz:ProfileToken>{0}</ptz:ProfileToken></ptz:GetPresets>",
        GetPresetTours: "<ptz:GetPresetTours><ptz:ProfileToken>{0}</ptz:ProfileToken></ptz:GetPresetTours>",
        GotoHomePosition: "<ptz:GotoHomePosition><ptz:ProfileToken>{0}</ptz:ProfileToken></ptz:GotoHomePosition>",
        GotoPreset: "<ptz:GotoPreset><ptz:ProfileToken>{0}</ptz:ProfileToken><ptz:PresetToken>{1}</ptz:PresetToken></ptz:GotoPreset>",
        ModifyPresetTour: "<ptz:ModifyPresetTour><ptz:ProfileToken>{0}</ptz:ProfileToken><ptz:PresetTour token='{1}'><schema:Name>{2}</schema:Name><schema:Status><schema:State>{3}</schema:State></schema:Status><schema:AutoStart>{4}</schema:AutoStart>{5}</ptz:PresetTour></ptz:ModifyPresetTour>",
        ModifyPresetTourPresets: "<ptz:ModifyPresetTour><ptz:ProfileToken>{0}</ptz:ProfileToken><ptz:PresetTour token='{1}'><schema:Name>{2}</schema:Name><schema:Status><schema:State>{3}</schema:State></schema:Status><schema:AutoStart>{4}</schema:AutoStart>{5}{6}</ptz:PresetTour></ptz:ModifyPresetTour>",
        PanTilt: "<ptz:ContinuousMove><ptz:ProfileToken>{0}</ptz:ProfileToken><ptz:Velocity><schema:PanTilt x='{1}' y='{2}' /></ptz:Velocity></ptz:ContinuousMove>",
        PanTiltStop: "<ptz:Stop><ptz:ProfileToken>{0}</ptz:ProfileToken><ptz:PanTilt>true</ptz:PanTilt></ptz:Stop>",
        Preset: "<schema:TourSpot><schema:PresetDetail><schema:PresetToken>{0}</schema:PresetToken></schema:PresetDetail><schema:Speed><schema:PanTilt x='{1}' y='{2}'></schema:PanTilt></schema:Speed><schema:StayTime>{3}</schema:StayTime></schema:TourSpot>",
        RemovePreset: "<ptz:RemovePreset><ptz:ProfileToken>{0}</ptz:ProfileToken><ptz:PresetToken>{1}</ptz:PresetToken></ptz:RemovePreset>",
        RemovePresetTour: "<ptz:RemovePresetTour><ptz:ProfileToken>{0}</ptz:ProfileToken><ptz:PresetTourToken>{1}</ptz:PresetTourToken></ptz:RemovePresetTour>",
        SetPreset: "<ptz:SetPreset><ptz:ProfileToken>{0}</ptz:ProfileToken><ptz:PresetName>{1}</ptz:PresetName><ptz:PresetToken>{2}</ptz:PresetToken></ptz:SetPreset>",
        CreatePreset: "<ptz:SetPreset><ptz:ProfileToken>{0}</ptz:ProfileToken><ptz:PresetName>{1}</ptz:PresetName></ptz:SetPreset>",
        StartingConditionContinuous: "<schema:StartingCondition><schema:Direction>{0}</schema:Direction></schema:StartingCondition>",
        StartingConditionRecurringDura: "<schema:StartingCondition><schema:RecurringDuration>{0}</schema:RecurringDuration><schema:Direction>{1}</schema:Direction></schema:StartingCondition>",
        StartingConditionRecurringTime: "<schema:StartingCondition><schema:RecurringTime>{0}</schema:RecurringTime><schema:Direction>{1}</schema:Direction></schema:StartingCondition>",
        StartTour: "<ptz:OperatePresetTour><ptz:ProfileToken>{0}</ptz:ProfileToken><ptz:PresetTourToken>{1}</ptz:PresetTourToken><ptz:Operation>Start</ptz:Operation></ptz:OperatePresetTour>",
        StopTour: "<ptz:OperatePresetTour><ptz:ProfileToken>{0}</ptz:ProfileToken><ptz:PresetTourToken>{1}</ptz:PresetTourToken><ptz:Operation>Stop</ptz:Operation></ptz:OperatePresetTour>",
        Zoom: "<ptz:ContinuousMove><ptz:ProfileToken>{0}</ptz:ProfileToken><ptz:Velocity><schema:Zoom x='{1}'></schema:Zoom></ptz:Velocity></ptz:ContinuousMove>",
        ZoomAbsoluteMove: "<ptz:AbsoluteMove><ptz:ProfileToken>{0}</ptz:ProfileToken><ptz:Position><schema:Zoom x='{1}' ></schema:Zoom></ptz:Position></ptz:AbsoluteMove>",
        ZoomStop: "<ptz:Stop><ptz:ProfileToken>{0}</ptz:ProfileToken><ptz:Zoom>true</ptz:Zoom></ptz:Stop>"
    }
      , sa = {
        GetFirmwareVersion: "<thermal:GetFirmwareVersion></thermal:GetFirmwareVersion>",
        GetImagingSettings: "<thermal:GetImagingSettings></thermal:GetImagingSettings>",
        GetServiceCapabilities: "<thermal:GetServiceCapabilities></thermal:GetServiceCapabilities>",
        GetZoomMode: "<thermal:GetZoomMode></thermal:GetZoomMode>",
        ManualNUC: "<thermal:ManualNUC></thermal:ManualNUC>",
        SetImagingSettings: "<thermal:SetImagingSettings><NucTimeInterval>{0}</NucTimeInterval><PicturePolarity>{1}</PicturePolarity><ColorPalette>{2}</ColorPalette><ROI>{3}</ROI><NoiseReductionMode>{4}</NoiseReductionMode></thermal:SetImagingSettings>",
        SetVentusSettings: "<thermal:SetImagingSettings><PicturePolarity>{0}</PicturePolarity><ColorPalette>{1}</ColorPalette><ROI>{2}</ROI></thermal:SetImagingSettings>",
        SetInfiniteFocus: "<thermal:SetInfiniteFocus></thermal:SetInfiniteFocus>",
        SetZoomMode: "<thermal:SetZoomMode><ZoomSyncMode>{0}</ZoomSyncMode></thermal:SetZoomMode>"
    };
    this.absoluteMove = function(c, a, b, h, e) {
        null === a ? c = O.AbsoluteMoveY.format(c, b) : (a = 0 <= a && 180 >= a ? a / 180 : (a - 360) / 180,
        c = null === b ? O.AbsoluteMoveX.format(c, a) : O.AbsoluteMoveXY.format(c, a, b));
        g(c, success, e)
    }
    ;
    this._activateUserCommand = function(c, a, b) {
        c = y.ActivateUserCommand.format(c);
        g(c, a, b)
    }
    ;
    this.addServerCertificateAssignment = function(c, a, b) {
        c = W.AddServerCertificateAssignment.format(c);
        g(c, a, b)
    }
    ;
    this.assignActions2Trigger = function(c, a, b, h) {
        var f = "";
        a = a.split("&");
        for (var d = 0; d < a.length; d++)
            f = 0 === a.length && 0 === d ? y.AssignActionsItem.format("") : f + y.AssignActionsItem.format(a[d]);
        c = y.AssignActions.format(c, f);
        g(c, b, h)
    }
    ;
    this.calibratePositioner = function(c, a) {
        g(r.CalibratePositioner, c, a)
    }
    ;
    this.cancelFirmwareUpgrade = function() {}
    ;
    this.createActionTrigger = function(c, a, b, h, e, d, l) {
        Ma(c, a, b, h, e, d, l)
    }
    ;
    this.createCertificationPath = function(c, a, b) {
        V(c, a, b)
    }
    ;
    this.createControlTimerAction = function(c, a, b, h, e) {
        La(c, a, b, h, e)
    }
    ;
    this.createEmailAction = function(c, a, b, h, e, d, l, q, g, w) {
        ea(c, a, b, h, e, d, l, q, g, w)
    }
    ;
    this.createEmailServer = function(c, a, b, h, e, d, l, q) {
        c = y.ActionCreateEmailServer.format(c, "SMTP", a, b, h, e, d);
        g(c, l, q)
    }
    ;
    this.createFtpServer = function(c, a, b, h, e, d, l, q, w) {
        c = y.ActionCreateFtpServer.format(c, "FTP", a, b, h, e, d, l);
        g(c, q, w)
    }
    ;
    this.createEncoder = function(c, a, b) {
        hb(c, a, b)
    }
    ;
    this.createEventSubscription = function(c, a, b) {
        var f = "";
        if (null !== c && void 0 !== c) {
            c = c.split(",");
            for (var k = 0; k < c.length; k++)
                f += "<wsnt:TopicExpression Dialect='http://www.onvif.org/ver10/tev/topicExpression/ConcreteSet' xmlns:wsnt='http://docs.oasis-open.org/wsn/b-2' xmlns:tptz='http://www.onvif.org/ver20/ptz/wsdl'>{0}</wsnt:TopicExpression>".format(ue[c[k]])
        }
        "" === f ? f = "<events:CreatePullPointSubscription><events:InitialTerminationTime>PT60S</events:InitialTerminationTime>{0}</events:CreatePullPointSubscription>".format("") : (f = "<Filter>{0}</Filter>".format(f),
        f = "<events:CreatePullPointSubscription><events:InitialTerminationTime>PT60S</events:InitialTerminationTime>{0}</events:CreatePullPointSubscription>".format(f));
        g(f, a, b)
    }
    ;
    this.createFTPAction = function(c, a, b, h, e, d) {
        fb(c, a, b, h, e, d)
    }
    ;
    this.createSimpleAction = function(c, a, b, h, e) {
        gb(c, a, b, h, e)
    }
    ;
    this.createOSD = function(c, b, k, h, e, d, l, q, g, w, n, r, p, t, F, R, v, x, y, A, u, C) {
        a(c, b, k, h, e, d, l, q, g, w, n, r, p, t, F, R, v, x, y, A, u, C)
    }
    ;
    this.createPresetTour = function(c, a, k) {
        b(c, a, k)
    }
    ;
    this.createProfile = function(c, a, b, h) {
        e(c, a, b, h)
    }
    ;
    this.createPKCS10CSR = function(c, a, b, h, e, d, l, g, w, n) {
        q(c, a, b, h, e, d, l, g, w, n)
    }
    ;
    this.createRSAKeyPair = function(c, a, b) {
        w(c, a, b)
    }
    ;
    this.createSelfSignedCertificate = function(c, a, b, h, e, d, l, q, g, w, n) {
        F(c, a, b, h, e, d, l, q, g, w, n)
    }
    ;
    this.createUser = function(c, a, b, h, e) {
        c = H.CreateUser.format(c, a, b);
        g(c, h, e)
    }
    ;
    this.deleteAction = function(c, a, b) {
        c = y.DeleteAction.format(c);
        g(c, a, b)
    }
    ;
    this.deleteActionTrigger = function(c, a, b) {
        c = y.DeleteActionTrigger.format(c);
        g(c, a, b)
    }
    ;
    this.deleteProfile = function(c, a, b) {
        Uc(c, a, b)
    }
    ;
    this.deleteEncoder = function(c, a, b) {
        R(c, a, b)
    }
    ;
    this.deleteCertificate = function(c, a, b) {
        c = W.DeleteCertificate.format(c);
        g(c, a, b)
    }
    ;
    this.deleteCertificationPath = function(c, a, b) {
        c = W.DeleteCertificationPath.format(c);
        g(c, a, b)
    }
    ;
    this.deleteKey = function(c, a, b) {
        c = W.DeleteKey.format(c);
        g(c, a, b)
    }
    ;
    this.deleteOSD = function(c, a, b) {
        ib(c, a, b)
    }
    ;
    this.deletePMask = function(c, a, b, h) {
        c = r.ClearPMask.format(c, a);
        g(c, b, h)
    }
    ;
    this.deletePreset = function(c, a, b, h) {
        c = O.RemovePreset.format(c, a);
        g(c, b, h)
    }
    ;
    this.deletePresetTour = function(c, a, b, h) {
        c = O.RemovePresetTour.format(c, a);
        g(c, b, h)
    }
    ;
    this.deleteSector = function(c, a, b) {
        c = r.DeleteSector.format(c);
        g(c, a, b)
    }
    ;
    this.deleteServer = function(c, a, b) {
        c = y.ActionDeleteServer.format(c);
        g(c, a, b)
    }
    ;
    this.deleteUser = function(c, a, b) {
        c = H.DeleteUser.format(c);
        g(c, a, b)
    }
    ;
    this.doFocusCommand = function(c, a, b, h) {
        c = "0.0" === a ? J.Stop.format(c) : J.DoFocusContinuous.format(c, a);
        g(c, b, h)
    }
    ;
    this.doFocusRelative = function(c, a, b, h, e) {
        c = J.DoFocusRelative.format(c, a, b);
        g(c, h, e)
    }
    ;
    this.doIrisCommand = function(c, a, b, e) {
        c = r.DoIrisCommand.format(c, a);
        g(c, b, e)
    }
    ;
    this.flashPMask = function(c, a, b, e, m) {
        c = r.MarkPMask.format(c, a, b);
        g(c, e, m)
    }
    ;
    this.getActions = function(c, a) {
        Vc(c, a)
    }
    ;
    this.getActionTriggers = function(c, a) {
        Wc(c, a)
    }
    ;
    this.getAllCertificates = function(c, a) {
        Xc(c, a)
    }
    ;
    this.getAllCertificationPaths = function(c, a) {
        Yc(c, a)
    }
    ;
    this.getAnalogVideo = function(c, a) {
        Zc(c, a)
    }
    ;
    this.getBanners = function(c, a) {
        $c(c, a)
    }
    ;
    this.getBitRate = function(c, a, b) {
        qa(c, a, b)
    }
    ;
    this.getCapapabilities = function(c, a) {
        ad(c, a)
    }
    ;
    this.getAssignedServerCertificates = function(c, a) {
        bd(c, a)
    }
    ;
    this.getCertificate = function(c, a, b) {
        cd(c, a, b)
    }
    ;
    this.getCertificationPath = function(c, a, b) {
        dd(c, a, b)
    }
    ;
    this.getConcurrencyPolicy = function(c, a) {
        ed(c, a)
    }
    ;
    this.getDateTime = function(c, a) {
        fd(c, a)
    }
    ;
    this.GetDiagnosticData = function(c, a) {
        jd(c, a)
    }
    ;
    this.getDateTimeFormat = function(c, a) {
        gd(c, a)
    }
    ;
    this.getAnonymousAccess = function(c, a) {
        id(c, a)
    }
    ;
    this.setAnonymousAccess = function(c, a, b) {
        c = r.SetAnonymousAccess.format(c);
        g(c, a, b)
    }
    ;
    this.getDeviceInformation = function(c, a) {
        hd(c, a)
    }
    ;
    this.getDigitalInputs = function(c, a) {
        kd(c, a)
    }
    ;
    this.getDigitalOutputState = function(c, a) {
        ld(c, a)
    }
    ;
    this.getImageSettings = function(c, a, b) {
        nd(c, a, b)
    }
    ;
    this.getGeneralSettings = function(c, a) {
        od(c, a)
    }
    ;
    this.getFonts = function(c, a) {
        md(c, a)
    }
    ;
    this.getHeaterState = function(c, a) {
        pd(c, a)
    }
    ;
    this.getNetworkProtocolsInfo = function(c, a) {
        rd(c, a)
    }
    ;
    this.getHitachi231Settings = function(c, a, b) {
        qd(c, a, b)
    }
    ;
    this.getLicenseAgreementStatus = function(c, a) {
        td(c, a)
    }
    ;
    this.getLogoTransparency = function(c, a) {
        ud(c, a)
    }
    ;
    this.getMaxDigitalZoomLimit = function(c, a, b) {
        vd(c, a, b)
    }
    ;
    this.getMediaSettings = function(c, a, b) {
        wd(c, a, b)
    }
    ;
    this.getNetworkProtocols = function(c, a) {
        zd(c, a)
    }
    ;
    this.getNetworkSettings = function(c, a) {
        yd(c, a)
    }
    ;
    this.getLLDP_State = function(c, a) {
        Ad(c, a)
    }
    ;
    this.setLLDP_State = function(c, a, b) {
        Bd(c, a, b)
    }
    ;
    this.getNTP = function(c, a) {
        Cd(c, a)
    }
    ;
    this.getOptionsExtension = function(c, a) {
        Dd(c, a)
    }
    ;
    this.getOptionsImaging = function(c, a, b) {
        Ed(c, a, b)
    }
    ;
    this.getOSDS = function(c, a) {
        Fd(c, a)
    }
    ;
    this.getOSDOrder = function(c, a) {
        Zb(c, a)
    }
    ;
    this.getParkConfiguration = function(c, a) {
        Gd(c, a)
    }
    ;
    this.getPMasks = function(c, a, b) {
        Jd(c, a, b)
    }
    ;
    this.getPMaskMode = function(c, a) {
        Pc(c, a)
    }
    ;
    this.GetPMaskAttributes = function(c, a) {
        Oc(c, a)
    }
    ;
    this.getPresets = function(c, a, b) {
        Hd(c, a, b)
    }
    ;
    this.getPresetTours = function(c, a, b) {
        Id(c, a, b)
    }
    ;
    this.getProfileSettings = function(c, a) {
        Kd(c, a)
    }
    ;
    this.getRelayOutputs = function(c, a) {
        Ld(c, a)
    }
    ;
    this.getRtspDigestStatus = function(c, a) {
        Md(c, a)
    }
    ;
    this.getSectors = function(c, a) {
        Nd(c, a)
    }
    ;
    this.getServers = function(c, a) {
        Od(c, a)
    }
    ;
    this.getSnapshotCapabilities = function(c, a, b) {
        Pd(c, a, b)
    }
    ;
    this.getSnapshotProperties = function(c, a) {
        Qd(c, a)
    }
    ;
    this.getSnapshotUri = function(c, a, b) {
        Rd(c, a, b)
    }
    ;
    this.getSnmpCommunityName = function(c, a) {
        Sd(c, a)
    }
    ;
    this.getSnmpState = function(c, a) {
        Td(c, a)
    }
    ;
    this.getSnmpTrapSettings = function(c, a) {
        Ud(c, a)
    }
    ;
    this.getSnmpV3UserStatus = function(c, a) {
        Vd(c, a)
    }
    ;
    this.getSystemBackup = function(c, a) {
        Wd(c, a)
    }
    ;
    this.getSystemInformation = function(c, a, b) {
        Xd(c, a, b)
    }
    ;
    this.getSystemURIs = function(c, a) {
        Zd(c, a)
    }
    ;
    this.getLegacyNetworkTimeout = function(c, a) {
        Yd(c, a)
    }
    ;
    this.getThermalCapabilities = function(c, a) {
        $d(c, a)
    }
    ;
    this.getThermalFirmwareVersion = function(c, a) {
        ae(c, a)
    }
    ;
    this.getThermalImagingSettings = function(c, a) {
        be(c, a)
    }
    ;
    this.getThermalZoomMode = function(c, a) {
        ce(c, a)
    }
    ;
    this.getTriggerPriorities = function(c, a) {
        de(c, a)
    }
    ;
    this.getUnusedKeyList = function(c, a) {
        ee(c, a)
    }
    ;
    this.getUsers = function(c, a) {
        fe(c, a)
    }
    ;
    this.getVideoChannel5Resolutions = function(c, a) {
        ge(c, a)
    }
    ;
    this.getIFrameBurstSetting = function(c, a) {
        ra(c, a)
    }
    ;
    this.getVideoEncoderConfig = function(c, a) {
        Nc(null, null, null, null, null, c, a)
    }
    ;
    this.getVideoEncoderConfigOptions = function(c, a, b) {
        Mc(c, a, b)
    }
    ;
    this.getVideoEncoderSource = function(c, a, b) {
        Sb(c, a, b)
    }
    ;
    this.getVideoSources = function(c, a) {
        he(c, a)
    }
    ;
    this.getVideoSettings = function(c, a, b) {
        sd(c, a, b)
    }
    ;
    this.getWiper = function(c, a) {
        ie(c, a)
    }
    ;
    this.getZoomMagnification = function(c, a, b) {
        nb(c, a, b)
    }
    ;
    this.gotoHome = function(c, a, b) {
        c = O.GotoHomePosition.format(c);
        g(c, a, b)
    }
    ;
    this.gotoPreset = function(c, a, b, e) {
        c = O.GotoPreset.format(c, a);
        g(c, b, e)
    }
    ;
    this.login = function(c, a, b, e) {
        Wb = c;
        Xb = a;
        window.username = c;
        window.password = a;
        ob(c, a, b, e)
    }
    ;
    this.modifyPresetTour = function(c, a, b, e, m, d, l, q, g, w, n) {
        je(c, a, b, e, m, d, l, q, g, w, n)
    }
    ;
    this.manualNUC = function(c, a) {
        g(sa.ManualNUC, c, a)
    }
    ;
    this.maxUsersAllowed = function() {
        return oa.length
    }
    ;
    this.panTilt = function(c, a, b, e, m) {
        c = O.PanTilt.format(c, a, b);
        dfasjfgns = g(c, e, m);
        console.log(dfasjfgns)
    }
    ;
    this.panTiltStop = function(c, a, b) {
        c = O.PanTiltStop.format(c);
        g(c, a, b)
    }
    ;
    this.removeProfileConfigurations = function(c, a, b) {
        Tb(c, a, b)
    }
    ;
    this.removeServerCertificateAssignment = function(c, a, b) {
        c = W.RemoveServerCertificateAssignment.format(c);
        g(c, a, b)
    }
    ;
    this.replaceServerCertificateAssignment = function(c, a, b, e) {
        c = W.ReplaceServerCertificateAssignment.format(c, a);
        g(c, b, e)
    }
    ;
    this.restartCamera = function(c, a) {
        g(H.Reboot, c, a)
    }
    ;
    this.retrieveActions = function() {
        return x
    }
    ;
    this.retrieveAnalogVideo = function() {
        return Ta
    }
    ;
    this.retrieveCameraCapabilities = function() {
        return ia
    }
    ;
    this.retrieveDeviceInformation = function() {
        return ha
    }
    ;
    this.retrieveDIO = function() {
        return aa
    }
    ;
    this.retrieveExtensionOptions = function() {
        return Ob
    }
    ;
    this.retrieveHttpsConfiguration = function() {
        return E
    }
    ;
    this.retrieveImagingOptions = function() {
        return Wa
    }
    ;
    this.retrieveImagingSettings = function(c) {
        c.imagingBacklightCompensationMode = tc;
        c.imagingBacklightCompensationLevel = uc;
        c.imagingExposureMode = vc;
        c.imagingExposurePriority = Kc;
        c.exposureTime = xc;
        c.imagingExposureMaxExposureTime = wc;
        c.imagingExposureMaxGain = yc;
        c.imagingExposureGain = Lc;
        c.imagingFocusAutoFocusMode = zc;
        c.imagingFocusAutoFocusModeThermal = sc;
        c.imagingFocusDefaultSpeed = Ac;
        c.imagingFocusNearLimit = Bc;
        c.imagingFocusFarLimit = Cc;
        c.imagingIrCutFilter = Dc;
        c.imagingSharpness = Ec;
        c.imagingWideDynamicRangeMode = Fc;
        c.imagingWideDynamicRangeLevel = Gc;
        c.imagingWhiteBalanceMode = Hc;
        c.imagingWhiteBalanceRed = Ic;
        c.imagingWhiteBalanceBlue = Jc
    }
    ;
    this.retrieveHitachi231Settings = function(c) {
        c.hitachiDigitalZoom = bc;
        c.hitachiAutoFocusSensitivity = cc;
        c.hitachiAutoFocusType = dc;
        c.hitachiInverseImage = ec;
        c.hitachiIRCorrection = fc;
        c.hitachiDefogColor = gc;
        c.hitachiDefogStrength = hc;
        c.hitachiDefogMode = ic;
        c.hitachiIntensityLevel = kc;
        c.hitachiIntensityMode = jc;
        c.hitachiFNRLevel = lc;
        c.hitachiFNRState = mc;
        c.hitachiFNRMode = nc;
        c.hitachiIrisAction = oc;
        c.hitachiEISCorrection = pc;
        c.hitachiEISState = qc;
        c.hitachiWhiteBalancePreset = rc
    }
    ;
    this.retrieveMaxDigitalZoom = function() {
        return Lb
    }
    ;
    this.retrieveNetworkSettings = function() {
        return C
    }
    ;
    this.retrieveOSDS = function() {
        return A
    }
    ;
    this.retrievePMask = function() {
        return ba
    }
    ;
    this.retrievePMasks = function() {
        return Z
    }
    ;
    this.retrievePositionerSettings = function() {
        return K
    }
    ;
    this.retrieveProfileConfigurations = function(c) {
        for (var a = 0; 8 > a; a++)
            c[a] = X[a]
    }
    ;
    this.retrieveRtspDigestStatus = function() {
        return Qc
    }
    ;
    this.retrieveSectors = function() {
        return ka
    }
    ;
    this.retrieveServers = function() {
        return T
    }
    ;
    this.retrieveSnapshotCapabilities = function() {
        return Ga
    }
    ;
    this.retrieveSnapshotProperties = function() {
        return Na
    }
    ;
    this.retrieveSnmpSettings = function() {
        return pa
    }
    ;
    this.retrieveThermalCapabilities = function() {
        return bb
    }
    ;
    this.retrieveThermalImagingSettings = function() {
        return ca
    }
    ;
    this.retrieveThermalZoomMode = function() {
        return $b
    }
    ;
    this.retrieveTriggers = function() {
        return v
    }
    ;
    this.retrieveUserConfiguration = function(c) {
        for (var a = 0; a < oa.length; a++)
            c[a] = oa[a]
    }
    ;
    this.retrieveVideoConfigurations = function(c) {
        for (var a = 0; 8 > a; a++)
            c[a] = t[a]
    }
    ;
    this.saveProfileSetup = function(c, a, b, e, m) {
        ke(c, a, b, e, m)
    }
    ;
    this.saveStreamSetup = function(c, a, b, e, m, d, l, q, g, w, n, r, p, t, F, R, v, x, y) {
        le(c, a, b, e, m, d, l, q, g, w, n, r, p, t, F, R, v, x, y)
    }
    ;
    this.sendFile = function(c, a, b, e, m, d, l, q) {
        mb(c, a, b, e, m, d, l, q)
    }
    ;
    this.setAGC_Value = function(c, a, b, e, m, d) {
        c = b ? J.SetAGCValue_ManualExposure.format(c, a) : "" == e ? J.SetAGCValue_AutoExposure.format(c, a) : J.SetAGCValue_AutoExposure_WithPriority.format(c, a, e);
        g(c, m, d)
    }
    ;
    this.setAnalogVideo = function(c, a, b, e, m) {
        c = r.SetAnalogVideo.format(c, a, b);
        g(c, e, m)
    }
    ;
    this.setAutoFocusSensitivity = function(c, a, b, e) {
        switch (a) {
        case 0:
            a = "Low";
            break;
        case 1:
            a = "Normal";
            break;
        case 2:
            a = "High";
            break;
        case 3:
            a = "SuperHigh"
        }
        c = r.SetAutoFocusSensitivity.format(c, a);
        g(c, b, e)
    }
    ;
    this.setAutoFocusType = function(c, a, b, e) {
        var f = "";
        switch (a) {
        case 0:
            f = "Off";
            break;
        case 1:
            f = "Normal";
            break;
        case 2:
            f = "BrightScene";
            break;
        case 3:
            f = "PointSource"
        }
        "" === f && e(null, "Invalid Auto Focus Type Specified", null);
        c = r.SetAutoFocusType.format(c, f);
        g(c, b, e)
    }
    ;
    this.setBacklightMode = function(c, a, b, e) {
        c = J.SetBacklightCompensation.format(c, a);
        g(c, b, e)
    }
    ;
    this.setBacklightValue = function(c, a, b, e) {
        c = J.SetBacklightCompValue.format(c, a);
        g(c, b, e)
    }
    ;
    this.setBanners = function(c, a, b, e) {
        c = r.SetBanners.format(c ? "1" : "0", "0", "0", "0", a ? "1" : "0", "0", "0", "0");
        g(c, b, e)
    }
    ;
    this.setCameraProtocol = function(c, a, b) {
        Ba = c
    }
    ;
    this.setConcurrencyPolicy = function(c, a, b) {
        c = y.SetConcurrencyPolicy.format(c);
        g(c, a, b)
    }
    ;
    this.setDateTime = function(c, a, b, e, m, d, l, q, w, n) {
        c = "" === c ? H.SetDateTimeNTP.format(q, l) : H.SetDateTimeManual.format(q, l, e, m, d, c, a, b);
        g(c, w, n)
    }
    ;
    this.setDateTimeFormat = function(c, a, b, e) {
        c = r.SetDateTimeFormat.format(c, a);
        g(c, b, e)
    }
    ;
    this.setDayNightMode = function(c, a, b, e) {
        c = J.SetImageDayNightMode.format(c, a);
        g(c, b, e)
    }
    ;
    this.setDefaults = function(a, b, e, h) {
        var c = "unknown";
        switch (b) {
        case "advanced1":
            c = J.DefaultAdvancedPt1.format(a);
            break;
        case "advanced2":
            c = r.DefaultAdvancedPt2.format("Profile1");
            break;
        case "defog":
            c = r.DefaultDefog.format("Profile1");
            break;
        case "exposure":
            c = J.DefaultExposure.format(a);
            break;
        case "lens":
            c = r.DefaultLens.format("Profile1")
        }
        g(c, e, h)
    }
    ;
    this.setDefogColor = function(c, a, b, e) {
        c = r.SetDefogColor.format(c, a);
        g(c, b, e)
    }
    ;
    this.setDefogLevel = function(a, b, e, h) {
        a = r.SetDefogLevel.format(a, b);
        g(a, e, h)
    }
    ;
    this.setDefogMode = function(a, b, e, h) {
        a = r.SetDefogMode.format(a, b);
        g(a, e, h)
    }
    ;
    this.setDIO = function(a, b, e, h, m, d, l, q) {
        me(a, b, e, h, m, d, l, q)
    }
    ;
    this.setDIOState = function(a, b, e, h) {
        a = H.SetRelayOutputState.format(a, b);
        g(a, e, h)
    }
    ;
    this.setDSS = function(a, b, e, h, m, d) {
        a = "AUTO" == e && "" != h ? J.SetDSS_WithExposureMode_Priority.format(a, b, e, h) : J.SetDSS_WithExposureMode.format(a, b, e);
        g(a, m, d)
    }
    ;
    this.setEISMode = function(a, b, e, h) {
        a = r.SetEISMode.format(a, b);
        g(a, e, h)
    }
    ;
    this.setFactoryDefault = function(a, b, e) {
        a = H.SetFactoryDefault.format(a);
        g(a, b, e)
    }
    ;
    this.setFocusMode = function(a, b, e, h) {
        a = J.SetFocusMode.format(a, b);
        g(a, e, h)
    }
    ;
    this.setFont = function(a, b, e) {
        a = r.SetFont.format(a);
        g(a, b, e)
    }
    ;
    this.setGain = function(a, b, e, h, m) {
        a = "AUTO" === b ? J.SetGainMode.format(a, b) : J.SetGain.format(a, b, e);
        g(a, h, m)
    }
    ;
    this.setBrightnessContrast = function(a, b, e, h, m) {
        var c = null;
        null != b && null != e ? c = J.SetBrightnessContrast.format(a, b, e) : null != b ? c = J.SetBrightness.format(a, b) : null != e && (c = J.SetContrast.format(a, e));
        g(c, h, m)
    }
    ;
    this.setSharpness = function(a, b, e, h) {
        a = J.SetSharpness.format(a, b);
        g(a, e, h)
    }
    ;
    this.setVentusNoiseReductionLevel = function(a, b, e, h) {
        a = J.SetNoiseReduction.format(a, b);
        g(a, e, h)
    }
    ;
    this.setImageStabilization = function(a, b, e, h, m) {
        a = J.SetStabilization.format(a, b, e);
        g(a, h, m)
    }
    ;
    this.setGeneralSettings = function(a, b, e, h, m, d, l, q) {
        a = r.SetGeneralSettings.format(a, b, e, h, d, m);
        g(a, l, q)
    }
    ;
    this.setHeaterState = function(a, b, e) {
        a = r.SetHeaterState.format(a);
        g(a, b, e)
    }
    ;
    this.setHttpHttpsState = function(a, b, e) {
        ne(a, b, e)
    }
    ;
    this.setIntensityLevel = function(a, b, e, h) {
        a = r.SetIntensityLevel.format(a, b);
        g(a, e, h)
    }
    ;
    this.setIntensityMode = function(a, b, e, h) {
        a = r.SetIntensityMode.format(a, b);
        g(a, e, h)
    }
    ;
    this.setIPAddress = function(a) {
        kb = a
    }
    ;
    this.setIrisMode = function(a, b, e, h, m) {
        a = "" == e ? J.SetIrisMode.format(a, b) : J.SetIrisModeWithPriority.format(a, b, e);
        g(a, h, m)
    }
    ;
    this.setLicenseAgreement = function(a, b, e, h) {
        a = r.SetLicenseAgreement.format(a, b);
        g(a, e, h)
    }
    ;
    this.setLogoTransparency = function(a, b, e) {
        a = r.SetLogoTransparency.format(a);
        g(a, b, e)
    }
    ;
    this.setMaxDigitalZoom = function(a, b, e, h) {
        a = r.setDigitalZoom.format(a, Math.round(b / 12 * 100));
        g(a, e, h)
    }
    ;
    this.setMaxDigitalZoomLimit = function(a, b, e, h) {
        a = r.SetMaxDigitalZoomLimit.format(a, b);
        g(a, e, h)
    }
    ;
    this.setNetworkConfiguration = function(a, b, e, h, m, d, l, q, g, w, n, r, p, t) {
        oe(a, b, e, h, m, d, l, q, g, w, n, r, p, t)
    }
    ;
    this.setNetworkProtocol = function(a, b, e, h) {
        a = r.SetNetworkProtocol.format(a, b);
        g(a, e, h)
    }
    ;
    this.setLegacyNetworkTimeout = function(a, b, e) {
        a = r.SetLegacyNetworkTimeout.format(a);
        g(a, b, e)
    }
    ;
    this.setNorth = function(a, b, e) {
        a = a ? r.SetNorth.format("false") : r.SetNorth.format("true");
        g(a, b, e)
    }
    ;
    this.setNTP = function(a, b, e, h) {
        var c = ""
          , d = "";
        "." === a && (c = H.SetNTP_DNS.format(""));
        "." === b && (d = H.SetNTP_DNS.format(""));
        "." !== a && (c = a.isIpv4() ? H.SetNTP_IPv4.format(a) : H.SetNTP_DNS.format(a),
        "" !== b && (d = b.isIpv4() ? H.SetNTP_IPv4.format(b) : H.SetNTP_DNS.format(b)));
        a = "" === a ? H.SetNTP0 : "" === b ? H.SetNTP1.format(c) : H.SetNTP2.format(c, d);
        g(a, e, h)
    }
    ;
    this.setNoiseReduction = function(a, b, e, h) {
        a = r.SetNoiseReduction.format(a, b);
        g(a, e, h)
    }
    ;
    this.setNoiseReductionLevel = function(a, b, e, h) {
        a = r.SetNoiseReductionLevel.format(a, b);
        g(a, e, h)
    }
    ;
    this.setOnePushAutoFocus = function(a, b, e) {
        a = r.OnePushAutoFocus.format(a);
        g(a, b, e)
    }
    ;
    this.setOSDOrder = function(a, b, e, h, m, d, l) {
        a = r.SetOSDOrder.format(a, b, e, h, m);
        g(a, d, l)
    }
    ;
    this.setPMask = function(a, b, e, h, m, d, l, q) {
        a = r.SetPMask.format(a, b, e, h, m, d);
        g(a, l, q)
    }
    ;
    this.setParkConfiguration = function(a, b, e, h, m, d) {
        a = r.SetParkConfiguration.format(a, b, e, h);
        g(a, m, d)
    }
    ;
    this.setPMaskConfig = function(a, b, e, h, m, d, l, q) {
        pe(a, b, e, h, m, d, l, q)
    }
    ;
    this.setPreset = function(a, b, e, h, m) {
        a = null == e ? O.CreatePreset.format(a, b) : O.SetPreset.format(a, b, e);
        g(a, h, m)
    }
    ;
    this.setRtspDigestStatus = function(a, b, e) {
        a = r.SetRTSPDigestStatus.format(a);
        g(a, b, e)
    }
    ;
    this.setSector = function(a, b, e, h) {
        a = r.SetSector.format(a, b);
        g(a, e, h)
    }
    ;
    this.setSectorLimit = function(a, b, e, h) {
        a = r.SetSectorLimit.format(a, "left" === b ? !0 : !1);
        g(a, e, h)
    }
    ;
    this.setSerialPort = function(a, b, e, h, m, d, l, q, w) {
        a = r.SetSerialPort.format(a, h, e, l, m, d, b);
        g(a, q, w)
    }
    ;
    this.setSharpnessLevel = function(a, b, e, h) {
        a = J.SetSharpnessLevel.format(a, b);
        g(a, e, h)
    }
    ;
    this.setShutterSpeed = function(a, b, e, h, m, d) {
        a = "" != h ? J.SetShutterSpeedPriority.format(a, b, e, h) : J.SetShutterSpeed.format(a, b, e);
        g(a, m, d)
    }
    ;
    this.setSnapshotProperties = function(a, b, e, h, m, d) {
        a = r.SetSnapshotProperties.format(h, a, b, e);
        g(a, m, d)
    }
    ;
    this.setSnmpCommunityName = function(a, b, e) {
        a = r.SetSnmpCommunityName.format(a);
        g(a, b, e)
    }
    ;
    this.setSnmpState = function(a, b, e, h, m) {
        qe(a, b, e, h, m)
    }
    ;
    this.setSnmpTrapSettings = function(a, b, e, h, m) {
        for (var c = "", f = 0; f < b.length; f++)
            c += r.SnmpTrap.format(b[f], e[f]);
        a = r.SetSnmpTrapSettings.format(a, c);
        g(a, h, m)
    }
    ;
    this.setSnmpV3User = function(a, b, e, h, m, d, l) {
        a = r.SetSnmpV3User.format(a, b, e, h, m);
        g(a, d, l)
    }
    ;
    this.setThermalImagingSettings = function(a, b, e, h, m, d, l) {
        a = isVentusModel() ? sa.SetVentusSettings.format(b, e, h) : sa.SetImagingSettings.format(a, b, e, h, m);
        g(a, d, l)
    }
    ;
    this.setThermalInfiniteFocus = function(a, b) {
        g(sa.SetInfiniteFocus, a, b)
    }
    ;
    this.setThermalZoomMode = function(a, b, e) {
        a = sa.SetZoomMode.format(a);
        g(a, b, e)
    }
    ;
    this.setTimeout = function(a) {
        Vb = a
    }
    ;
    this.setTriggerPriorities = function(a, b, e) {
        a = a.split(";");
        for (var c = "", f = 0; f < a.length; f++)
            "" !== a[f] && (c += y.ActionTrigger.format(a[f]));
        c = y.SetTriggerPriorities.format(c);
        g(c, b, e)
    }
    ;
    this.setUser = function(a, b, e, h, m) {
        a = H.SetUser.format(a, b, e);
        g(a, h, m)
    }
    ;
    this.SetVideoChannel5Resolution = function(a, b, e, h) {
        a = r.SetVideoChannel5Resolution.format(b, a);
        g(a, e, h)
    }
    ;
    this.setWDR_Level = function(a, b, e, h) {
        a = J.SetWDR_Level.format(a, "ON", b);
        g(a, e, h)
    }
    ;
    this.setWDR_Mode = function(a, b, e, h) {
        a = J.SetWDR_Mode.format(a, b);
        g(a, e, h)
    }
    ;
    this.setWhiteBalanceMode = function(a, b, e, h) {
        a = J.SetWhiteBalanceMode.format(a, b);
        g(a, e, h)
    }
    ;
    this.setWhiteBalancePreset = function(a, b, e, h) {
        a = r.SetWhiteBalancePreset.format(a, b);
        g(a, e, h)
    }
    ;
    this.setWiper = function(a, b, e, h, m, d) {
        a = r.SetWiper.format(a, e, b, h);
        g(a, m, d)
    }
    ;
    this.startSystemRestore = function(a, b) {
        re(a, b)
    }
    ;
    this.startTour = function(a, b, e, h) {
        a = O.StartTour.format(a, b);
        g(a, e, h)
    }
    ;
    this.stopTour = function(a, b, e, h) {
        a = O.StopTour.format(a, b);
        g(a, e, h)
    }
    ;
    this.uploadCertificate = function(a, b, e, h, m) {
        se(a, b, e, h, m)
    }
    ;
    this.useHttps = function(a) {
        Ba = a ? "https:" : "http:"
    }
    ;
    this.validateServer = function(a, b, e, h, m, d, l, q, g) {
        te(a, b, e, h, m, d, l, q, g)
    }
    ;
    this.zoom = function(a, b, e, h) {
        a = O.Zoom.format(a, b);
        g(a, e, h)
    }
    ;
    this.zoomAbsolute = function(a, b, e, h) {
        a = O.ZoomAbsoluteMove.format(a, b);
        g(a, e, h)
    }
    ;
    this.zoomStop = function(a, b, e) {
        a = O.ZoomStop.format(a);
        g(a, b, e)
    }
}
  , Camera = function(z, M, G) {
    function U(a, b, e, q) {
        for (i = 0; i < P.tours.length; i++)
            if (P.tours[i].name == b) {
                q("", "Error: Duplicate Tour Name", "");
                return
            }
        l.createPresetTour(a, function(g) {
            l.modifyPresetTour(a, g, b, "Idle", "false", null, null, "Forward", null, e, q)
        }, q)
    }
    function Q(a, b) {
        l.getActions(function() {
            va = l.retrieveActions();
            a()
        }, b)
    }
    function xa(a, b) {
        l.getActionTriggers(function() {
            La = l.retrieveTriggers();
            a()
        }, b)
    }
    function jb(a, b) {
        l.getAllCertificates(function() {
            ta = l.retrieveHttpsConfiguration();
            a()
        }, b)
    }
    function g(a, b) {
        l.getAnalogVideo(function() {
            Xa = l.retrieveAnalogVideo();
            a()
        }, b)
    }
    function Pa(a, b) {
        l.getAssignedServerCertificates(function() {
            ta = l.retrieveHttpsConfiguration();
            a()
        }, b)
    }
    function da(a, b) {
        l.getCapapabilities(function() {
            Ya = l.retrieveCameraCapabilities();
            a()
        }, b)
    }
    function Ca(a, b, e) {
        l.getCertificationPath(a, function() {
            ta = l.retrieveHttpsConfiguration();
            b()
        }, e)
    }
    function mb(a, b) {
        l.getDeviceInformation(function() {
            Fa = l.retrieveDeviceInformation();
            a()
        }, b)
    }
    function nb(a, b) {
        l.GetDiagnosticData(function() {
            a()
        }, b)
    }
    function ob(a, b, e) {
        l.getImageSettings(a, function() {
            Ma = l.retrieveThermalImagingSettings();
            b()
        }, e)
    }
    function u(a, b, e) {
        l.getHitachi231Settings(a, function() {
            l.retrieveHitachi231Settings(N);
            b()
        }, e)
    }
    function B(a, b) {
        l.getNetworkProtocolsInfo(function() {
            Ha = l.retrieveNetworkSettings();
            a()
        }, b)
    }
    function n(a, b, e) {
        l.getVideoSettings(a, function() {
            l.retrieveImagingSettings(L);
            b()
        }, e)
    }
    function p(a, b, e, q) {
        var g = function() {
            e()
        }
          , n = function() {
            thisCamera.getPresetTours(b, g, q)
        }
          , p = function() {
            thisCamera.getPresets(b, n, q)
        }
          , u = function() {
            l.retrieveHitachi231Settings(N);
            thisCamera.getPresets(b, n, q)
        }
          , z = function() {
            l.retrieveImagingSettings(L);
            l.getHitachi231Settings(b, u, p)
        };
        l.getVideoSources(function() {
            l.getVideoSettings(a, z, q)
        }, q)
    }
    function pb(a, b, e) {
        l.getMaxDigitalZoomLimit(a, function() {
            ab = l.retrieveMaxDigitalZoom();
            b()
        }, e)
    }
    function qb(a, b, e) {
        l.getMediaSettings(a, function() {
            l.retrieveVideoConfigurations(ua);
            b()
        }, e)
    }
    function rb(a, b) {
        l.getNetworkSettings(function() {
            Ha = l.retrieveNetworkSettings();
            a()
        }, b)
    }
    function sb(a, b) {
        l.getOptionsExtension(function() {
            Za = l.retrieveExtensionOptions();
            a()
        }, b)
    }
    function tb(a, b, e) {
        l.getOptionsImaging(a, function() {
            $a = l.retrieveImagingOptions()
        }, e)
    }
    function ub(a, b) {
        l.getOSDS(function() {
            Ia = l.retrieveOSDS();
            a()
        }, b)
    }
    function vb(a, b) {
        l.GetPMaskAttributes(function() {
            Ka = l.retrievePMask();
            a()
        }, b)
    }
    function wb(a, b) {
        l.getPMaskMode(function() {
            Ka = l.retrievePMask();
            a()
        }, b)
    }
    function Ra(a, b, e) {
        l.getPMasks(a, function() {
            V = l.retrievePMasks();
            b()
        }, e)
    }
    function Sa(a, b) {
        l.getProfileSettings(function() {
            l.retrieveProfileConfigurations(za);
            a()
        }, b)
    }
    function xb(a, b) {
        l.getRtspDigestStatus(function() {
            Ja = l.retrieveRtspDigestStatus(Ja);
            a()
        }, b)
    }
    function Qa(a, b) {
        l.getSectors(function() {
            Aa = l.retrieveSectors();
            a()
        }, b)
    }
    function yb(a, b) {
        l.getServers(function() {
            fb = l.retrieveServers();
            a()
        }, b)
    }
    function zb(a, b, e) {
        l.getSnapshotCapabilities(a, function() {
            db = l.retrieveSnapshotCapabilities();
            b()
        }, e)
    }
    function Ab(a, b) {
        l.getSnapshotProperties(function() {
            Y = l.retrieveSnapshotProperties();
            a()
        }, b)
    }
    function Bb(a, b) {
        l.getSnmpCommunityName(function() {
            S = l.retrieveSnmpSettings();
            a()
        }, b)
    }
    function Cb(a, b) {
        l.getSnmpState(function() {
            S = l.retrieveSnmpSettings();
            a()
        }, b)
    }
    function Db(a, b) {
        l.getSnmpTrapSettings(function() {
            S = l.retrieveSnmpSettings();
            a()
        }, b)
    }
    function la(a, b) {
        l.getSnmpV3UserStatus(function() {
            S = l.retrieveSnmpSettings();
            a()
        }, b)
    }
    function Eb(a, b) {
        l.getThermalCapabilities(function() {
            gb = l.retrieveThermalCapabilities();
            a()
        }, b)
    }
    function Fb(a, b) {
        l.getThermalImagingSettings(function() {
            Ma = l.retrieveThermalImagingSettings();
            a()
        }, b)
    }
    function ma(a, b) {
        l.getThermalZoomMode(function() {
            hb = l.retrieveThermalZoomMode();
            a()
        }, b)
    }
    function na(a, b) {
        l.getUnusedKeyList(function() {
            ta = l.retrieveHttpsConfiguration();
            a()
        }, b)
    }
    function Gb(a, b) {
        l.getUsers(function(b) {
            l.retrieveUserConfiguration(eb);
            a(b)
        }, b)
    }
    function Hb(a, b, e) {
        var q = function() {
            l.retrieveVideoConfigurations(ua);
            a()
        };
        l.getVideoEncoderConfig(function() {
            e ? q() : Ua("AllStreams", q, b)
        }, b)
    }
    function Ua(a, b, e) {
        l.getVideoEncoderSource(a, function() {
            l.retrieveVideoConfigurations(ua);
            b()
        }, e)
    }
    function Ib(a, b, e, q, g) {
        l.setAnalogVideo(a, b, e, function() {
            l.getAnalogVideo(q, g)
        }, g)
    }
    function Jb(a, b, e, q, g) {
        l.setGain(a, b, e, function() {
            l.getImageSettings(a, q, g)
        }, g)
    }
    function ya(a, b, e, q, g) {
        l.setBrightnessContrast(a, b, e, function() {
            l.getImageSettings(a, q, g)
        }, g)
    }
    function Kb(a, b, e, q) {
        l.setMaxDigitalZoomLimit(a, b, function() {
            l.getMaxDigitalZoomLimit(a, e, q)
        }, q)
    }
    function Da(a, b, e) {
        l.setRtspDigestStatus(a, function() {
            l.getRtspDigestStatus(b, e)
        }, e)
    }
    function Va(a, b, e) {
        l.setSnmpCommunityName(a, function() {
            l.getSnmpCommunityName(b, e)
        }, e)
    }
    function Mb(a, b, e, q, g) {
        l.setSnmpState(a, b, e, function() {
            l.getSnmpState(q, g)
        }, g)
    }
    function Nb(a, b, e, q, g) {
        l.setSnmpTrapSettings(a, b, e, function() {
            l.getSnmpTrapSettings(q, g)
        }, g)
    }
    function Pb(a, b, e, q, g, n, p) {
        l.setSnmpV3User(a, b, e, q, g, function() {
            l.getSnmpV3UserStatus(n, p)
        }, p)
    }
    function Qb(a, b, e, q, g, n, p) {
        l.setThermalImagingSettings(a, b, e, q, g, function() {
            l.getThermalImagingSettings(n, p)
        }, p)
    }
    function Rb(a, b, e) {
        l.setThermalZoomMode(a, function() {
            l.getThermalZoomMode(b, e)
        }, e)
    }
    var Ea = M
      , l = new SOAP(z,Ea,G)
      , L = [];
    L.imagingBacklightCompensationMode = ".";
    L.imagingBacklightCompensationLevel = ".";
    L.imagingExposureMode = ".";
    L.imagingExposurePriority = ".";
    L.exposureTime = ".";
    L.imagingExposureMaxExposureTime = ".";
    L.imagingExposureGain = ".";
    L.imagingExposureMaxGain = ".";
    L.imagingFocusAutoFocusMode = ".";
    L.imagingFocusDefaultSpeed = ".";
    L.imagingFocusNearLimit = ".";
    L.imagingFocusFarLimit = ".";
    L.imagingIrCutFilter = ".";
    L.imagingSharpness = ".";
    L.imagingWideDynamicRangeMode = ".";
    L.imagingWideDynamicRangeLevel = ".";
    L.imagingWhiteBalanceMode = ".";
    var N = [];
    N.hitachiDigitalZoom = ".";
    N.hitachiAutoFocusSensitivity = ".";
    N.hitachiInverseImage = ".";
    N.hitachiIRCorrection = ".";
    N.hitachiDefogColor = ".";
    N.hitachiDefogStrength = ".";
    N.hitachiDefogMode = ".";
    N.hitachiIntensityMode = ".";
    N.hitachiFNRLevel = ".";
    N.hitachiFNRState = ".";
    N.hitachiFNRMode = ".";
    N.hitachiIrisAction = ".";
    N.hitachiEISCorrection = ".";
    N.hitachiEISState = ".";
    N.hitachiWhiteBalancePreset = ".";
    var Xa = new AnalogVideo
      , Ya = new CameraCapabilities
      , Fa = new DeviceInfo
      , Za = new ExtensionOptions
      , ta = new HttpsConfiguration
      , $a = new ImagingOptions
      , ab = new MaxDigitalZoom
      , ua = [new VideoStream, new VideoStream, new VideoStream, new VideoStream, new VideoStream, new VideoStream, new VideoStream, new VideoStream]
      , Ha = new NetworkConfiguration
      , Ia = [new Osd, new Osd, new Osd, new Osd, new Osd, new Osd, new Osd, new Osd, new Osd]
      , cb = new OSDBanner
      , P = new Positioner
      , za = [new VideoProfile, new VideoProfile, new VideoProfile, new VideoProfile, new VideoProfile, new VideoProfile, new VideoProfile, new VideoProfile]
      , Ja = new RtspDigest
      , Aa = [new Sector, new Sector, new Sector, new Sector, new Sector, new Sector, new Sector, new Sector, new Sector, new Sector, new Sector, new Sector, new Sector, new Sector, new Sector, new Sector]
      , db = new SnapshotCapabilities
      , Y = new SnapshotProperties
      , S = new SnmpSettings
      , eb = [new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User, new User]
      , Ka = new PMask
      , V = [new PMaskElement, new PMaskElement, new PMaskElement, new PMaskElement, new PMaskElement, new PMaskElement, new PMaskElement, new PMaskElement]
      , La = [new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers, new Triggers]
      , va = [new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions, new Actions]
      , ea = new DIO
      , fb = [new Server, new Server, new Server, new Server, new Server, new Server, new Server, new Server, new Server, new Server, new Server, new Server, new Server, new Server, new Server, new Server]
      , gb = new ThermalServiceCapabilities
      , Ma = new ThermalImageSettings
      , hb = new ThermalZoomMode;
    this.absoluteMove = function(a, b, e, q, g) {
        l.absoluteMove(a, b, e, q, g)
    }
    ;
    this.getCurrentUser = function() {
        return _username
    }
    ;
    this.activateUserCommand = function(a, b, e) {
        l._activateUserCommand(a, b, e)
    }
    ;
    this.addPMask = function(a, b) {
        a = -1;
        for (var e = 1; 9 > e; e++) {
            for (b = 0; 8 > b && parseInt(V[b].token, 10) !== e && ("." == V[b].token || 0 != V[b].inCamera); b++)
                ;
            if (8 === b) {
                a = e;
                break
            }
        }
        if (0 > a)
            return -1;
        for (b = 0; 8 > b && "." !== V[b].token; b++)
            ;
        V[b].token = a;
        return b
    }
    ;
    this.addServerCertificateAssignment = function(a, b, e) {
        l.addServerCertificateAssignment(a, b, e)
    }
    ;
    this.assignActions2Trigger = function(a, b, e, q) {
        l.assignActions2Trigger(a, b, e, q)
    }
    ;
    this.calibratePositioner = function(a, b) {
        l.calibratePositioner(a, b)
    }
    ;
    this.cancelFirmwareUpgrade = function() {
        l.cancelFirmwareUpgrade()
    }
    ;
    this.createCertificationPath = function(a, b, e) {
        l.createCertificationPath(a, b, e)
    }
    ;
    this.createControlTimerAction = function(a, b, e, q, g) {
        l.createControlTimerAction(a, b, e, q, g)
    }
    ;
    this.createEmailAction = function(a, b, e, q, g, n, p, u, z, B) {
        l.createEmailAction(a, b, e, q, g, n, p, u, z, B)
    }
    ;
    this.createEmailServer = function(a, b, e, q, g, n, p, u) {
        l.createEmailServer(a, b, e, q, g, n, p, u)
    }
    ;
    this.createFtpServer = function(a, b, e, q, g, n, p, u, z) {
        l.createFtpServer(a, b, e, q, g, n, p, u, z)
    }
    ;
    this.createPKCS10CSR = function(a, b, e, q, g, n, p, u, z, B) {
        l.createPKCS10CSR(a, b, e, q, g, n, p, u, z, B)
    }
    ;
    this.createRSAKeyPair = function(a, b, e) {
        l.createRSAKeyPair(a, b, e)
    }
    ;
    this.createSelfSignedCertificate = function(a, b, e, q, g, n, p, u, z, B, G) {
        l.createSelfSignedCertificate(a, b, e, q, g, n, p, u, z, B, G)
    }
    ;
    this.createSimpleAction = function(a, b, e, q, g) {
        l.createSimpleAction(a, b, e, q, g)
    }
    ;
    this.createActionTrigger = function(a, b, e, q, g, n, p) {
        l.createActionTrigger(a, b, e, q, g, n, p)
    }
    ;
    this.createEncoder = function(a, b, e) {
        l.createEncoder(a, b, e)
    }
    ;
    this.createEventSubscription = function(a, b, e) {
        l.createEventSubscription(a, b, e)
    }
    ;
    this.createFtpAction = function(a, b, e, q, g, n, p, u, z, B, G) {
        l.createFTPAction(a, b, e, q, g, n, p, u, z, B, G)
    }
    ;
    this.createOSD = function(a, b, e, q, g, n, p, u, z, B, G, L, M, N, P, Q, S, U, V, Y, da, ea) {
        l.createOSD(a, b, e, q, g, n, p, u, z, B, G, L, M, N, P, Q, S, U, V, Y, da, ea)
    }
    ;
    this.createPresetTour = function(a, b, e, l) {
        U(a, b, e, l)
    }
    ;
    this.createProfile = function(a, b, e, g) {
        l.createProfile(a, b, e, g)
    }
    ;
    this.createUser = function(a, b, e, g, n) {
        l.createUser(a, b, e, g, n)
    }
    ;
    this.deleteAction = function(a, b, e) {
        l.deleteAction(a, b, e)
    }
    ;
    this.deleteActionTrigger = function(a, b, e) {
        l.deleteActionTrigger(a, b, e)
    }
    ;
    this.deleteCertificate = function(a, b, e) {
        l.deleteCertificate(a, b, e)
    }
    ;
    this.deleteCertificationPath = function(a, b, e) {
        l.deleteCertificationPath(a, b, e)
    }
    ;
    this.deleteKey = function(a, b, e) {
        l.deleteKey(a, b, e)
    }
    ;
    this.deleteOSD = function(a, b, e) {
        l.deleteOSD(a, b, e)
    }
    ;
    this.deletePMask = function(a, b, e, g) {
        for (var q = -1, n = function() {
            V[q].token = ".";
            e()
        }, p = 0; 8 > p; p++)
            if (V[p].token == b) {
                q = p;
                break
            }
        -1 === q ? g(null, "PMask token was not found") : V[q].inCamera ? l.deletePMask(a, b, n, g) : (V[q].token = ".",
        e())
    }
    ;
    this.deleteProfile = function(a, b, e) {
        l.deleteProfile(a, b, e)
    }
    ;
    this.deleteUser = function(a, b, e) {
        l.deleteUser(a, b, e)
    }
    ;
    this.deleteEncoder = function(a, b, e) {
        l.deleteEncoder(a, b, e)
    }
    ;
    this.deletePreset = function(a, b, e, g) {
        l.deletePreset(a, b, e, g)
    }
    ;
    this.deletePresetTour = function(a, b, e, g) {
        l.deletePresetTour(a, b, e, g)
    }
    ;
    this.deleteSector = function(a, b, e) {
        l.deleteSector(Aa[a].token, b, e)
    }
    ;
    this.deleteServer = function(a, b, e) {
        l.deleteServer(a, b, e)
    }
    ;
    this.doFocusCommand = function(a, b, e, g) {
        l.doFocusCommand(a, b, e, g)
    }
    ;
    this.doFocusRelative = function(a, b, e, g, n) {
        l.doFocusRelative(a, b, e, g, n)
    }
    ;
    this.doIrisCommand = function(a, b, e, g) {
        l.doIrisCommand(a, b, e, g)
    }
    ;
    this.flashPMask = function(a, b, e, g, n) {
        l.flashPMask(a, b, e, g, n)
    }
    ;
    this.getActions = function(a, b) {
        Q(a, b)
    }
    ;
    this.getActionIndexByName = function(a) {
        a: {
            for (var b = 0; 64 > b; b++)
                if (va[b].name === a) {
                    a = b;
                    break a
                }
            a = -1
        }
        return a
    }
    ;
    this.getActionsParameter = function(a, b) {
        var e = "Undefined";
        try {
            e = va[a][b]
        } catch (q) {}
        return e
    }
    ;
    this.getActionTriggerIndexByName = function(a) {
        a: {
            for (var b = 0; 32 > b; b++)
                if (La[b].name === a) {
                    a = b;
                    break a
                }
            a = -1
        }
        return a
    }
    ;
    this.getActionTriggerParameter = function(a, b) {
        var e = "Undefined";
        try {
            e = La[a][b]
        } catch (q) {}
        return e
    }
    ;
    this.getActionTriggers = function(a, b) {
        xa(a, b)
    }
    ;
    this.getAllCertificates = function(a, b) {
        jb(a, b)
    }
    ;
    this.getAllCertificationPaths = function(a, b) {
        l.getAllCertificationPaths(a, b)
    }
    ;
    this.getAnalogVideo = function(a, b) {
        g(a, b)
    }
    ;
    this.getAnalogVideoParameter = function(a) {
        var b = "";
        try {
            b = Xa[a]
        } catch (e) {}
        return b
    }
    ;
    this.getAssignedServerCertificates = function(a, b) {
        Pa(a, b)
    }
    ;
    this.getBanners = function(a, b) {
        l.getBanners(a, b)
    }
    ;
    this.getBitRate = function(a, b, e) {
        l.getBitRate(a, b, e)
    }
    ;
    this.getCameraModel = function(a) {
        var b = "429x"
          , e = Fa.model;
        4 <= e.length && (b = e.substring(0, 3) + "x");
        !0 === a && (b = "OP9x");
        return b
    }
    ;
    this.getCapabilities = function(a, b) {
        da(a, b)
    }
    ;
    this.getCapabilitiesParameter = function(a) {
        var b = "Undefined";
        try {
            b = Ya[a]
        } catch (e) {}
        return b
    }
    ;
    this.getCertificate = function(a, b, e) {
        l.getCertificate(a, b, e)
    }
    ;
    this.getCertificateParameter = function(a, b) {
        var e = "Undefined";
        try {
            e = ta.certificates[a][b]
        } catch (q) {}
        return e
    }
    ;
    this.getCertificationPath = function(a, b, e) {
        Ca(a, b, e)
    }
    ;
    this.getConcurrencyPolicy = function(a, b) {
        l.getConcurrencyPolicy(a, b)
    }
    ;
    this.getDateTime = function(a, b) {
        l.getDateTime(a, b)
    }
    ;
    this.getDateTimeFormat = function(a, b) {
        l.getDateTimeFormat(a, b)
    }
    ;
    this.getDeviceInformation = function(a, b) {
        mb(a, b)
    }
    ;
    this.getAnonymousAccess = function(a, b) {
        l.getAnonymousAccess(a, b)
    }
    ;
    this.setAnonymousAccess = function(a, b, e) {
        l.setAnonymousAccess(a, b, e)
    }
    ;
    this.getDeviceInformationParameter = function(a) {
        var b = "";
        try {
            b = Fa[a]
        } catch (e) {}
        return b
    }
    ;
    this.getDiagnosticData = function(a, b) {
        nb(a, b)
    }
    ;
    this.getDigitalInputs = function(a, b) {
        l.getDigitalInputs(a, b)
    }
    ;
    this.getDigitalOutputState = function(a, b) {
        l.getDigitalOutputState(a, b)
    }
    ;
    this.getDIOParameter = function(a, b) {
        ea = l.retrieveDIO();
        var e = "Undefined";
        try {
            e = ea.io[a][b]
        } catch (q) {}
        return e
    }
    ;
    this.getFonts = function(a, b) {
        l.getFonts(a, b)
    }
    ;
    this.getImageSettings = function(a, b, e) {
        ob(a, b, e)
    }
    ;
    this.getGeneralSettings = function(a, b) {
        l.getGeneralSettings(function() {
            P = l.retrievePositionerSettings();
            a()
        }, b)
    }
    ;
    this.positionerSettings = function() {
        return P
    }
    ;
    this.getHeaterState = function(a, b) {
        l.getHeaterState(a, b)
    }
    ;
    this.getNetworkProtocolsInfo = function(a, b) {
        B(a, b)
    }
    ;
    this.getHitachi231Settings = function(a, b, e) {
        u(a, b, e)
    }
    ;
    this.getHitachi231Parameter = function(a) {
        var b = "Undefined";
        try {
            b = N[a]
        } catch (e) {}
        return b
    }
    ;
    this.getHttpsConfigurationParameter = function(a) {
        var b = "Undefined";
        try {
            b = ta[a]
        } catch (e) {}
        return b
    }
    ;
    this.getImagingParameter = function(a) {
        var b = "Undefined";
        try {
            b = L[a]
        } catch (e) {}
        debugConsoleMessage("{0} is currently set to {1}".format(a, b), 0);
        return b
    }
    ;
    this.getImagingSetup = function(a, b, e, g) {
        p(a, b, e, g)
    }
    ;
    this.getVideoSettings = function(a, b, e) {
        n(a, b, e)
    }
    ;
    this.getVideoSources = function(a, b) {
        l.getVideoSources(a, b)
    }
    ;
    this.getLicenseAgreementStatus = function(a, b) {
        l.getLicenseAgreementStatus(a, b)
    }
    ;
    this.getLogoTransparency = function(a, b) {
        l.getLogoTransparency(a, b)
    }
    ;
    this.getMaxDigitalZoomLimit = function(a, b, e) {
        return pb(a, b, e)
    }
    ;
    this.getMaxDigitalZoomParameter = function(a) {
        var b = "Undefined";
        try {
            b = ab[a]
        } catch (e) {}
        return b
    }
    ;
    this.getMediaParameter = function(a, b) {
        var e = "Undefined";
        a: {
            for (var g = 0; 8 > g; g++)
                if (ua[g].name === a) {
                    a = g;
                    break a
                }
            a = -1
        }
        try {
            if ("h264Utilization" === b || "jpegUtilization" === b) {
                for (a = 0; 8 > a && (e = ua[a][b],
                "." === e); a++)
                    ;
                "." === e && (e = 0)
            } else
                e = ua[a][b]
        } catch (w) {}
        return e
    }
    ;
    this.getMediaSettings = function(a, b, e) {
        qb(a, b, e)
    }
    ;
    this.getNetworkProtocol = function(a, b) {
        l.getNetworkProtocols(a, b)
    }
    ;
    this.getNetworkSettings = function(a, b) {
        rb(a, b)
    }
    ;
    this.getLLDP_State = function(a, b) {
        l.getLLDP_State(a, b)
    }
    ;
    this.setLLDP_State = function(a, b, e) {
        l.setLLDP_State(a, b, e)
    }
    ;
    this.getNetworkParameter = function(a) {
        var b = "";
        try {
            b = Ha[a]
        } catch (e) {}
        return b
    }
    ;
    this.getNTP = function(a, b) {
        l.getNTP(a, b)
    }
    ;
    this.getOptionsExtension = function(a, b) {
        sb(a, b)
    }
    ;
    this.getOptionsExtensionParam = function(a) {
        var b = "Undefined";
        try {
            b = Za[a]
        } catch (e) {}
        return b
    }
    ;
    this.getOptionsImaging = function(a, b, e) {
        tb(a, b, e)
    }
    ;
    this.getOptionsImagingParam = function(a) {
        var b = "Undefined";
        try {
            b = $a[a]
        } catch (e) {}
        return b
    }
    ;
    this.getOSDS = function(a, b) {
        ub(a, b)
    }
    ;
    this.getOSDOrder = function(a, b) {
        l.getOSDOrder(a, b)
    }
    ;
    this.getOSDParameter = function(a, b) {
        var e = "Undefined";
        try {
            e = Ia[b][a]
        } catch (q) {}
        return e
    }
    ;
    this.getOSDBannerParameter = function(a) {
        var b = "Undefined";
        try {
            b = cb[a]
        } catch (e) {}
        return b
    }
    ;
    this.getPMasks = function(a, b, e) {
        Ra(a, b, e)
    }
    ;
    this.getPMaskAttributes = function(a, b) {
        vb(a, b)
    }
    ;
    this.getPMaskMode = function(a, b) {
        wb(a, b)
    }
    ;
    this.getPMaskParameter = function(a) {
        var b = "Undefined";
        try {
            b = Ka[a]
        } catch (e) {}
        return b
    }
    ;
    this.getPMasksParameter = function(a, b) {
        var e = "Undefined";
        try {
            e = V[b][a]
        } catch (q) {}
        return e
    }
    ;
    this.getPositionerParameter = function(a, b, e, g) {
        var l = "Undefined"
          , q = -1;
        try {
            switch (b) {
            case "preset":
                l = P.presets[e][a];
                break;
            case "tour-by-token":
                for (var n = 0; n < P.tours.length; n++)
                    if (P.tours[n].token === e) {
                        l = P.tours[n][a];
                        break
                    }
                break;
            case "tour":
                l = P.tours[e][a];
                break;
            case "tour-presets-other":
                for (n = 0; n < P.tours.length; n++)
                    if (P.tours[n].name === e) {
                        q = n;
                        break
                    }
                -1 !== q && (l = P.tours[q].presets[g][a]);
                break;
            case "tour-presets-preset-value":
                for (n = 0; n < P.tours.length; n++)
                    if (P.tours[n].name === e) {
                        q = n;
                        break
                    }
                -1 !== q && (l = P.tours[q].presets[g].preset[a]);
                break;
            default:
                l = P[a]
            }
        } catch (ib) {
            l = -1
        }
        return l
    }
    ;
    this.getParkConfiguration = function(a, b) {
        l.getParkConfiguration(a, b)
    }
    ;
    this.getPresets = function(a, b, e) {
        l.getPresets(a, function() {
            P = l.retrievePositionerSettings();
            b()
        }, e)
    }
    ;
    this.getPresetTours = function(a, b, e) {
        l.getPresetTours(a, b, e)
    }
    ;
    this.getProfileParameter = function(a, b) {
        var e = "Undefined";
        try {
            e = za[a][b]
        } catch (q) {}
        return e
    }
    ;
    this.getProfileParameterByName = function(a, b) {
        var e = "Undefined";
        a: {
            for (var g = 0; 8 > g; g++)
                if (za[g].profileName === a) {
                    a = g;
                    break a
                }
            a = -1
        }
        try {
            e = za[a][b]
        } catch (w) {}
        return e
    }
    ;
    this.getProfileSettings = function(a, b) {
        Sa(a, b)
    }
    ;
    this.getRelayOutputs = function(a, b) {
        l.getRelayOutputs(a, b)
    }
    ;
    this.getRtspDigestStatus = function(a, b) {
        xb(a, b)
    }
    ;
    this.getRtspDigestStatusParameter = function(a) {
        var b = "Undefined";
        try {
            b = Ja[a]
        } catch (e) {}
        return b
    }
    ;
    this.getSectorToken = function() {
        var a;
        a: {
            for (var b, e = 0; 16 > e; e++) {
                b = !1;
                for (a = 0; 16 > a; a++)
                    parseInt(Aa[a].token, 10) === e && (b = !0);
                if (!b) {
                    a = e;
                    break a
                }
            }
            a = -1
        }
        return a
    }
    ;
    this.getSectors = function(a, b) {
        Qa(a, b)
    }
    ;
    this.getSectorParameter = function(a, b) {
        var e = "Undefined";
        try {
            e = Aa[a][b]
        } catch (q) {}
        return e
    }
    ;
    this.getServerParameter = function(a, b) {
        var e = "Undefined";
        try {
            e = fb[a][b]
        } catch (q) {}
        return e
    }
    ;
    this.getServers = function(a, b) {
        return yb(a, b)
    }
    ;
    this.getSnapshotCapabilities = function(a, b, e) {
        zb(a, b, e)
    }
    ;
    this.getSnapshotCapabilitiesParameter = function(a) {
        var b = "Undefined";
        try {
            b = db[a]
        } catch (e) {}
        return b
    }
    ;
    this.getSnapshotProperties = function(a, b) {
        Ab(a, b)
    }
    ;
    this.getSnapshotPropertiesParameter = function(a) {
        var b = "Undefined";
        try {
            b = Y[a]
        } catch (e) {}
        return b
    }
    ;
    this.getSnapshotUri = function(a, b, e) {
        l.getSnapshotUri(a, b, e)
    }
    ;
    this.getSnmpCommunityName = function(a, b) {
        Bb(a, b)
    }
    ;
    this.getSnmpState = function(a, b) {
        Cb(a, b)
    }
    ;
    this.getSnmpTrapSettings = function(a, b) {
        Db(a, b)
    }
    ;
    this.getSnmpSettingsParameter = function(a) {
        var b = "Undefined";
        try {
            b = S[a]
        } catch (e) {}
        return b
    }
    ;
    this.getSnmpV3UserStatus = function(a, b) {
        la(a, b)
    }
    ;
    this.getSystemBackup = function(a, b) {
        l.getSystemBackup(a, b)
    }
    ;
    this.getSystemInformation = function(a, b, e) {
        l.getSystemInformation(a, b, e)
    }
    ;
    this.getSystemURIs = function(a, b) {
        l.getSystemURIs(a, b)
    }
    ;
    this.getLegacyNetworkTimeout = function(a, b) {
        l.getLegacyNetworkTimeout(a, b)
    }
    ;
    this.getThermalCapabilities = function(a, b) {
        return Eb(a, b)
    }
    ;
    this.getThermalCapabilitiesParam = function(a) {
        var b = "Undefined";
        try {
            b = gb[a]
        } catch (e) {}
        return b
    }
    ;
    this.getThermalFirmwareVersion = function(a, b) {
        l.getThermalFirmwareVersion(a, b)
    }
    ;
    this.getThermalImagingParameter = function(a) {
        var b = "Undefined";
        try {
            b = Ma[a]
        } catch (e) {}
        return b
    }
    ;
    this.getThermalImagingSettings = function(a, b) {
        return Fb(a, b)
    }
    ;
    this.getThermalZoomMode = function(a, b) {
        return ma(a, b)
    }
    ;
    this.getThermalZoomModeParam = function(a) {
        var b = "Undefined";
        try {
            b = hb[a]
        } catch (e) {}
        return b
    }
    ;
    this.getTriggerPriorities = function(a, b) {
        l.getTriggerPriorities(a, b)
    }
    ;
    this.getUnusedKeyList = function(a, b) {
        na(a, b)
    }
    ;
    this.getUserParam = function(a, b) {
        var e = "Undefined";
        try {
            e = eb[a][b]
        } catch (q) {}
        return e
    }
    ;
    this.getUsers = function(a, b) {
        Gb(a, b)
    }
    ;
    this.getVideoChannel5Resolution = function(a, b) {
        l.getVideoChannel5Resolutions(a, b)
    }
    ;
    this.getVideoConstrainMode = function(a, b) {
        l.getVideoConstrainMode(a, b)
    }
    ;
    this.getIFrameBurstSetting = function(a, b) {
        l.getIFrameBurstSetting(a, b)
    }
    ;
    this.getVideoEncoderConfig = function(a, b, e) {
        Hb(a, b, e)
    }
    ;
    this.getVideoEncoderConfigOptions = function(a, b, e) {
        l.getVideoEncoderConfigOptions(a, b, e)
    }
    ;
    this.getVideoEncoderSource = function(a, b, e) {
        Ua(a, b, e)
    }
    ;
    this.getVideoUtilization = function(a, b) {
        l.getVideoUtilization(a, b)
    }
    ;
    this.getWiper = function(a, b) {
        l.getWiper(a, b)
    }
    ;
    this.getZoomMagnification = function(a, b, e) {
        l.getZoomMagnification(a, b, e)
    }
    ;
    this.gotoHome = function(a, b, e) {
        l.gotoHome(a, b, e)
    }
    ;
    this.gotoPreset = function(a, b, e, g) {
        l.gotoPreset(a, b, e, g)
    }
    ;
    this.login = function(a, b, e, g) {
        l.login(a, b, e, g)
    }
    ;
    this.manualNUC = function(a, b) {
        l.manualNUC(a, b)
    }
    ;
    this.maxUsersAllowed = function() {
        return l.maxUsersAllowed()
    }
    ;
    this.modifyPresetTour = function(a, b, e, g, n, p, u, z, B, G, L) {
        l.modifyPresetTour(a, b, e, g, n, p, u, z, B, G, L)
    }
    ;
    this.panTilt = function(a, b, e, g, n, p) {
        g /= 100;
        l.panTilt(a, b * g, e * g, n, p)
    }
    ;
    this.panTiltStop = function(a, b, e) {
        l.panTiltStop(a, b, e)
    }
    ;
    this.removeProfileConfigurations = function(a, b, e) {
        l.removeProfileConfigurations(a, b, e)
    }
    ;
    this.removeServerCertificateAssignment = function(a, b, e) {
        l.removeServerCertificateAssignment(a, b, e)
    }
    ;
    this.replaceServerCertificateAssignment = function(a, b, e, g) {
        l.replaceServerCertificateAssignment(a, b, e, g)
    }
    ;
    this.restartCamera = function(a, b) {
        l.restartCamera(a, b)
    }
    ;
    this.saveProfileSetup = function(a, b, e, g, n) {
        l.saveProfileSetup(a, b, e, g, n)
    }
    ;
    this.saveStreamSetup = function(a, b, e, g, n, p, u, z, B, G, L, M, N, P, Q, S, U, V, Y) {
        l.saveStreamSetup(a, b, e, g, n, p, u, z, B, G, L, M, N, P, Q, S, U, V, Y)
    }
    ;
    this.uploadCertificate = function(a, b, e, g, n) {
        l.uploadCertificate(a, b, e, g, n)
    }
    ;
    this.useHttps = function(a) {
        l.useHttps(a)
    }
    ;
    this.sendFile = function(a, b, e, g, n, p, u) {
        var q = ""
          , w = !1
          , F = "http:" === z ? "80" : "443";
        F = "" === window.location.port ? F : window.location.port;
        "logo" === g && (q = window.location.protocol + "//" + window.location.hostname + ":" + F + "/upload/logo",
        w = !1);
        "firmware" === g && (q = null,
        w = !0);
        "configuration" === g && (q = a,
        w = !1);
        "font" === g && (q = window.location.protocol + "//" + window.location.hostname + ":" + F + "/upload/font",
        w = !1);
        l.sendFile(b, g, q, e, w, n, p, u)
    }
    ;
    this.setAGC_Value = function(a, b, e, g, n, u) {
        l.setAGC_Value(a, b, e, g, function() {
            sleep(500);
            p(a, "Profile1", n, u)
        }, u)
    }
    ;
    this.setAnalogVideo = function(a, b, e, g, l) {
        Ib(a, b, e, g, l)
    }
    ;
    this.setAutoFocusSensitivity = function(a, b, e, g) {
        l.setAutoFocusSensitivity(a, b, function() {
            sleep(500);
            u(a, e, g)
        }, g)
    }
    ;
    this.setAutoFocusType = function(a, b, e, g) {
        l.setAutoFocusType(a, b, function() {
            sleep(500);
            u(a, e, g)
        }, g)
    }
    ;
    this.setBacklightMode = function(a, b, e, g) {
        l.setBacklightMode(a, b ? "ON" : "OFF", function() {
            sleep(500);
            p(a, "Profile1", e, g)
        }, g)
    }
    ;
    this.setBacklightValue = function(a, b, e, g) {
        l.setBacklightValue(a, b, function() {
            sleep(500);
            p(a, "Profile1", e, g)
        }, g)
    }
    ;
    this.setBanners = function(a, b, e, g, n, p) {
        l.setBanners(a, b, n, p)
    }
    ;
    this.setCameraProtocol = function(a, b, e) {
        l.setCameraProtocol(a, b, e)
    }
    ;
    this.setConcurrencyPolicy = function(a, b, e) {
        l.setConcurrencyPolicy(a, b, e)
    }
    ;
    this.setDateTime = function(a, b, e, g, n, p, u, z, B, G) {
        l.setDateTime(a, b, e, g, n, p, u, z, B, G)
    }
    ;
    this.setDateTimeFormat = function(a, b, e, g) {
        l.setDateTimeFormat(a, b, e, g)
    }
    ;
    this.setDayNightMode = function(a, b, e, g) {
        l.setDayNightMode(a, b, function() {
            sleep(500);
            p(a, "Profile1", e, g)
        }, g)
    }
    ;
    this.setDefaults = function(a, b, e, g) {
        var q = function() {
            sleep(500);
            p(a, "Profile1", e, g)
        }
          , n = function() {
            sleep(500);
            u("Profile1", e, g)
        }
          , z = function() {
            sleep(500);
            u("Profile1", q, g)
        }
          , B = function() {
            l.setDefaults(a, "advanced2", z, g)
        };
        switch (b) {
        case "advanced":
            l.setDefaults(a, "advanced1", B, g);
            break;
        case "defog":
            l.setDefaults(a, b, n, g);
            break;
        case "exposure":
            l.setDefaults(a, b, q, g);
            break;
        case "lens":
            l.setDefaults(a, b, n, g)
        }
    }
    ;
    this.setDefogColor = function(a, b, e, g) {
        l.setDefogColor(a, b, function() {
            sleep(500);
            u(a, e, g)
        }, g)
    }
    ;
    this.setDefogLevel = function(a, b, e, g) {
        l.setDefogLevel(a, b, function() {
            sleep(500);
            u(a, e, g)
        }, g)
    }
    ;
    this.setDefogMode = function(a, b, e, g) {
        var q = function() {
            p("Visible Camera", a, e, g)
        };
        l.setDefogMode(a, b, function() {
            sleep(500);
            u(a, q, g)
        }, g)
    }
    ;
    this.setDIO = function(a, b, e) {
        var g = ea.io[a].direction;
        l.setDIO(a, g, "Input" === g ? ea.io[a].state : ea.io[a].idleState, ea.io[a].mode, ea.io[a].delay, ea.io[a].trigger, b, e)
    }
    ;
    this.setDIOParameter = function(a, b, e) {
        try {
            ea.io[a][b] = e
        } catch (q) {}
    }
    ;
    this.setDIOState = function(a, b, e, g) {
        l.setDIOState(a, b, e, g)
    }
    ;
    this.setEISMode = function(a, b, e, g) {
        l.setEISMode(a, b, function() {
            sleep(500);
            u(a, e, g)
        }, g)
    }
    ;
    this.setDSS = function(a, b, e, g, n, u) {
        l.setDSS(a, b, e, g, function() {
            sleep(500);
            p(a, "Profile1", n, u)
        }, u)
    }
    ;
    this.setFactoryDefault = function(a, b, e) {
        l.setFactoryDefault(a, b, e)
    }
    ;
    this.setFocusMode = function(a, b, e, g) {
        l.setFocusMode(a, b, e, g)
    }
    ;
    this.setFont = function(a, b, e) {
        l.setFont(a, b, e)
    }
    ;
    this.setGain = function(a, b, e, g, l) {
        Jb(a, b, e, g, l)
    }
    ;
    this.setBrightnessContrast = function(a, b, e, g, l) {
        ya(a, b, e, g, l)
    }
    ;
    this.setThermalAdvanceSettings = function(a, b, e, g) {
        _setThermalAdvanceSettings(a, b, e, g)
    }
    ;
    this.setSharpness = function(a, b, e, g) {
        l.setSharpness(a, b, e, g)
    }
    ;
    this.setVentusNoiseReductionLevel = function(a, b, e, g) {
        l.setVentusNoiseReductionLevel(a, b, e, g)
    }
    ;
    this.setImageStabilization = function(a, b, e, g, n) {
        l.setImageStabilization(a, b, e, g, n)
    }
    ;
    this.setGeneralSettings = function(a, b, e, g, n, p, u, z) {
        l.setGeneralSettings(a, b, e, g, n, p, u, z)
    }
    ;
    this.setHeaterState = function(a, b, e) {
        l.setHeaterState(a, b, e)
    }
    ;
    this.setHttpHttpsState = function(a, b, e) {
        l.setHttpHttpsState(a, b, e)
    }
    ;
    this.setIntensityLevel = function(a, b, e, g) {
        l.setIntensityLevel(a, b, function() {
            sleep(500);
            u(a, e, g)
        }, g)
    }
    ;
    this.setIntensityMode = function(a, b, e, g) {
        var n = "unkown";
        switch (b) {
        case 0:
            n = "Off";
            break;
        case 1:
            n = "Enhanced";
            break;
        case 2:
            n = "Whiteout Reduction"
        }
        l.setIntensityMode(a, n, function() {
            sleep(500);
            u(a, e, g)
        }, g)
    }
    ;
    this.setIPAddress = function(a) {
        Ea = a;
        l.setIPAddress(Ea)
    }
    ;
    this.setIrisMode = function(a, b, e, g, n) {
        l.setIrisMode(a, b, e, g, n)
    }
    ;
    this.setLicenseAgreement = function(a, b, e, g) {
        l.setLicenseAgreement(a, b, e, g)
    }
    ;
    this.setLogoTransparency = function(a, b, e) {
        l.setLogoTransparency(a, b, e)
    }
    ;
    this.setMaxDigitalZoomLimit = function(a, b, e, g) {
        Kb(a, b, e, g)
    }
    ;
    this.setNetworkConfiguration = function(a, b, e, g, n, p, u, z, B, G, L, M, N, P) {
        l.setNetworkConfiguration(a, b, e, g, n, p, u, z, B, G, L, M, N, P)
    }
    ;
    this.setNetworkProtocol = function(a, b, e, g) {
        l.setNetworkProtocol(a, b, e, g)
    }
    ;
    this.setLegacyNetworkTimeout = function(a, b, e) {
        l.setLegacyNetworkTimeout(a, b, e)
    }
    ;
    this.setNorth = function(a, b, e) {
        l.setNorth(a, b, e)
    }
    ;
    this.setNTP = function(a, b, e, g) {
        l.setNTP(a, b, e, g)
    }
    ;
    this.setNoiseReduction = function(a, b, e, g) {
        l.setNoiseReduction(a, b, function() {
            sleep(500);
            u(a, e, g)
        }, g)
    }
    ;
    this.setNoiseReductionLevel = function(a, b, e, g) {
        l.setNoiseReductionLevel(a, b, function() {
            sleep(500);
            u(a, e, g)
        }, g)
    }
    ;
    this.setOnePushAutoFocus = function(a, b, e) {
        l.setOnePushAutoFocus(a, b, e)
    }
    ;
    this.setOSDParameter = function(a, b, e) {
        a: {
            try {
                Ia[b][a] = e
            } catch (q) {
                a = -1;
                break a
            }
            a = e
        }
        return a
    }
    ;
    this.setOSDBannerParameter = function(a, b) {
        a: {
            try {
                cb[a] = b
            } catch (e) {
                a = -1;
                break a
            }
            a = b
        }
        return a
    }
    ;
    this.setOSDOrder = function(a, b, e, g, n, p, u) {
        l.setOSDOrder(a, b, e, g, n, p, u)
    }
    ;
    this.setParkConfiguration = function(a, b, e, g, n, p) {
        l.setParkConfiguration(a, b, e, g, n, p)
    }
    ;
    this.setPMask = function(a, b, e, g, n, p, u, z) {
        l.setPMask(a, b, e, g, n, p, u, z)
    }
    ;
    this.setPMaskConfig = function(a, b, e, g, n, p, u, z) {
        l.setPMaskConfig(a, b, e, g, n, p, u, z)
    }
    ;
    this.setPreset = function(a, b, e, g, n) {
        l.setPreset(a, b, e, g, n)
    }
    ;
    this.setRtspDigestStatus = function(a, b, e) {
        Da(a, b, e)
    }
    ;
    this.setSector = function(a, b, e, g) {
        l.setSector(a, b, e, g)
    }
    ;
    this.setSectorLimit = function(a, b, e, g) {
        l.setSectorLimit(a, b, e, g)
    }
    ;
    this.setSerialConfiguration = function(a, b, e, g, n, p, u, z, B) {
        l.setSerialConfiguration(a, b, e, g, n, p, u, z, B)
    }
    ;
    this.setSnmpCommunityName = function(a, b, e) {
        Va(a, b, e)
    }
    ;
    this.setSnmpState = function(a, b, e, g, l) {
        Mb(a, b, e, g, l)
    }
    ;
    this.setSnmpTrapSettings = function(a, b, e, g, l) {
        Nb(a, b, e, g, l)
    }
    ;
    this.setSnmpV3User = function(a, b, e, g, l, n, p) {
        Pb(a, b, e, g, l, n, p)
    }
    ;
    this.setThermalImagingSettings = function(a, b, e, g, l, n, p) {
        Qb(a, b, e, g, l, n, p)
    }
    ;
    this.setThermalZoomMode = function(a, b, e) {
        Rb(a, b, e)
    }
    ;
    this.setTriggerPriorities = function(a, b, e) {
        l.setTriggerPriorities(a, b, e)
    }
    ;
    this.setUser = function(a, b, e, g, n) {
        l.setUser(a, b, e, g, n)
    }
    ;
    this.setWDR_Level = function(a, b, e, g) {
        l.setWDR_Level(a, b, function() {
            sleep(500);
            p(a, "Profile1", e, g)
        }, g)
    }
    ;
    this.setWDR_Mode = function(a, b, e, g) {
        l.setWDR_Mode(a, b, function() {
            sleep(500);
            p(a, "Profile1", e, g)
        }, g)
    }
    ;
    this.setMaxDigitalZoom = function(a, b, e, g) {
        l.setMaxDigitalZoom(a, b, function() {
            sleep(500);
            u(a, e, g)
        }, g)
    }
    ;
    this.setSerialPort = function(a, b, e, g, n, p, u, z, B) {
        l.setSerialPort(a, b, e, g, n, p, u, z, B)
    }
    ;
    this.setSharpnessLevel = function(a, b, e, g) {
        l.setSharpnessLevel(a, b, function() {
            sleep(500);
            p(a, "Profile1", e, g)
        }, g)
    }
    ;
    this.setShutterSpeed = function(a, b, e, g, n, u) {
        l.setShutterSpeed(a, b, e, g, function() {
            sleep(500);
            p(a, "Profile1", n, u)
        }, u)
    }
    ;
    this.setSnapshotProperties = function(a, b, e, g, n, p) {
        l.setSnapshotProperties(a, b, e, g, n, p)
    }
    ;
    this.setThermalInfiniteFocus = function(a, b) {
        l.setThermalInfiniteFocus(a, b)
    }
    ;
    this.setTimeout = function(a) {
        l.setTimeout(a)
    }
    ;
    this.setWiper = function(a, b, e, g, n, p) {
        l.setWiper(a, b, e, g, n, p)
    }
    ;
    this.setWhiteBalanceMode = function(a, b, e, g) {
        l.setWhiteBalanceMode(a, b, function() {
            sleep(500);
            p(a, "Profile1", e, g)
        }, g)
    }
    ;
    this.setWhiteBalancePreset = function(a, b, e, g) {
        var n = function() {
            u(a, e, g)
        };
        l.setWhiteBalancePreset(a, b, function() {
            sleep(500);
            p("Visible Camera", a, n, g)
        }, g)
    }
    ;
    this.startSystemRestore = function(a, b) {
        l.startSystemRestore(a, b)
    }
    ;
    this.startTour = function(a, b, e, g) {
        l.startTour(a, b, e, g)
    }
    ;
    this.stopTour = function(a, b, e, g) {
        l.stopTour(a, b, e, g)
    }
    ;
    this.setVideoChannel5Resolution = function(a, b, e, g) {
        l.SetVideoChannel5Resolution(a, b, e, g)
    }
    ;
    this.validateServer = function(a, b, e, g, n, p, u, z, B) {
        l.validateServer(a, b, e, g, n, p, u, z, B)
    }
    ;
    this.zoom = function(a, b, e, g, n) {
        l.zoom(a, b, e, g, n)
    }
    ;
    this.zoomAbsolute = function(a, b, e, g) {
        l.zoomAbsolute(a, b, e, g)
    }
    ;
    this.zoomStop = function(a, b, e) {
        l.zoomStop(a, b, e)
    }
};
function sleep(z) {
    for (var M = (new Date).getTime(), G = 0; 1E7 > G && !((new Date).getTime() - M > z); G++)
        ;
}
;