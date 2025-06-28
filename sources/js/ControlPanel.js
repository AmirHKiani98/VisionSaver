var protocol = location.protocol
  , ip = location.hostname
  , port = location.port
  , userLevel = "Anonymous";
0 <= ip.indexOf("localhost") && (ip = "192.168.2.199");
var thisCamera = new Camera(protocol,ip,port)
  , continuousPanTilt = !1
  , handleOnZoomSliderChange = !0
  , jpegStreamVisible = -1
  , jpegStreamThermal = -1
  , setupThermalCallbackSet = !1
  , visibleZoomLabel = []
  , thermalZoomLabel = []
  , selectedVisibleProfile = "No Profile"
  , selectedThermalProfile = "No Profile"
  , setOpgalColors = !1
  , focusPending = !1
  , updateIrisTimer = null;
function deferredReady() {
    var a = thisCamera.getCameraModel(setOpgalColors);
    $("#focusInfinite").css("display", "none");
    $("#NUC, #thermalFocusFieldSet").css("display", "none");
    var b = function() {};
    switch (a) {
    case "422x":
    case "426x":
        $("#setupVisibleText").html("Image");
        break;
    case "429x":
    case "OP9x":
        $("#setupThermalImage").css("display", ""),
        isVentusModel() && $("#setupThermalAdvancedSettings").css("display", ""),
        $("#videoSourceSelectorRow").css("display", ""),
        thisCamera.getOptionsImaging("Thermal Camera", b, handleCameraError)
    }
    showVideoPanel(!0, "visible", a);
    $("#Setup_Video_ControlPanel_ROW").css("visibility", "visible");
    $("#logoCohu").on("click", function(a) {
        a.shiftKey && a.altKey && (systemLicenseReady(),
        showVideo(!1),
        $("#onvifKnightsDialog").dialog("open"))
    });
    setActiveTab("#Position-Tab", "#Position");
    updateZoomFactor();
    b = anonymousMode ? "Guest" : window.username;
    $("#visibleCurrentUser").html("user: " + b.charAt(0).toUpperCase() + b.slice(1).toLowerCase());
    $("#thermalCurrentUser").html("user: " + b.charAt(0).toUpperCase() + b.slice(1).toLowerCase());
    $("#visibleSplitCurrentUser").html("user: " + b.charAt(0).toUpperCase() + b.slice(1).toLowerCase());
    $("#thermalSplitCurrentUser").html("user: " + b.charAt(0).toUpperCase() + b.slice(1).toLowerCase());
    $("#visibleVideoControlSplit").addClass("activeVideo");
    $(".control_buttons").on("mousedown", function() {
        $(this).addClass("control_button_click")
    });
    $(".control_buttons").on("mouseup", function() {
        $(this).removeClass("control_button_click")
    });
    $("#PlayButton").click(function(a) {
        "InternetExplorer" !== whichBrowser() && setJPEGManualStop(!1, getActiveVideoSource());
        handlePlay(getActiveVideoSource(), a)
    });
    $("#PauseButton").click(function(a) {
        handlePauseButton(a)
    });
    $("#StopButton").click(function(a) {
        handleStopButton(a);
        "InternetExplorer" !== whichBrowser() && setJPEGManualStop(!0, getActiveVideoSource())
    });
    $("#RecordButton").click(function(a) {
        handleRecordButton(a)
    });
    $("#irisOpen").on("mousedown", function() {
        null != updateIrisTimer && clearTimeout(updateIrisTimer);
        handleIris("open")
    });
    $("#irisOpen").on("mouseup", function() {
        handleIris("stop")
    });
    $("#irisClose").on("mousedown", function() {
        null != updateIrisTimer && clearTimeout(updateIrisTimer);
        handleIris("close")
    });
    $("#irisClose").on("mouseup", function() {
        handleIris("stop")
    });
    $("#focusFar").on("mousedown", function(a) {
        debugConsoleMessage("FocusFar mouse DOWN", 0);
        null != updateFocusTimer && clearTimeout(updateFocusTimer);
        getActiveVideoSource();
        handleFocus("far")
    });
    $("#focusFar").on("mouseup", function() {
        handleFocus("stop")
    });
    $("#focusFar").on("dragend", function() {
        handleFocus("stop")
    });
    $("#focusNear").on("mousedown", function() {
        debugConsoleMessage("FocusNear mouse DOWN", 0);
        null != updateFocusTimer && clearTimeout(updateFocusTimer);
        getActiveVideoSource();
        handleFocus("near")
    });
    $("#focusNear").on("mouseup", function() {
        handleFocus("stop")
    });
    $("#focusNear").on("dragend", function() {
        handleFocus("stop")
    });
    $("#focusOnePush").on("mousedown", function() {
        debugConsoleMessage("Focus One Push", 0);
        handleFocus("onePush")
    });
    $("#focusInfinite").on("mousedown", function() {
        debugConsoleMessage("Focus Infinite", 0);
        handleFocus("infinite")
    });
    $("#NUC").on("mousedown", function() {
        debugConsoleMessage("NUC", 0);
        handleNUC()
    });
    $("#ptzProfileNameSelect").on("change", function(a) {
        setSelectedProfile($("#ptzProfileNameSelect").val(), getActiveVideoSource())
    });
    initializeZoomSlider();
    $("#zoom_slider").slider({
        min: 0,
        max: getZoomLabel("visible").length - 1,
        step: 1
    }).slider("pips", {
        rest: "",
        step: thisCamera.getOptionsExtensionParam("visibleMaxOpticalZoom"),
        labels: {
            first: "1x",
            last: "Digital"
        }
    }).slider("float", {
        labels: getZoomLabel("visible")
    }).on("slidechange", function(a, b) {
        handleOnZoomSliderChange && (debugConsoleMessage("zoom slider:" + b.value, 0),
        handleZoomAbsolute(b.value))
    });
    $("#pan_tilt_speed_slider").slider({
        min: 0,
        max: 100,
        step: 5
    }).slider("pips", {
        rest: "label",
        step: 10,
        labels: {
            first: "0%",
            last: "100%"
        }
    }).on("slidechange", function(a, b) {});
    $("#pan_tilt_speed_slider").slider({
        value: 66
    });
    $("#lens_speed_slider").slider({
        min: 0,
        max: 2,
        step: 1
    }).slider("pips", {
        rest: "label",
        labels: ["Slow", "Medium", "Fast"]
    }).on("slidechange", function(a, b) {
        debugConsoleMessage("Lens speed slider:" + b.value, 0)
    });
    $("#thermalFocus_speed_slider").slider({
        min: .1,
        max: 1,
        step: .1,
        change: function(a, b) {}
    }).slider("pips", {
        labels: {
            first: "Slow",
            last: "Fast"
        }
    }).slider("float", {
        value: 0
    });
    $("#autoIris").click(function() {
        handleAutoIris("flip", !0)
    });
    $("#autoFocus").click(function() {
        handleAutoFocus("flip", !0)
    });
    $(".ellipsis").unbind().click(function() {
        $(".ptzCtrl").toggleClass("active");
        $("#ptzCtrl").hasClass("active") ? $("#ptzDiv").css("z-index", "10") : $("#ptzDiv").css("z-index", "0")
    });
    $(".btn").on("mousedown", function(a) {
        debugConsoleMessage("ptz: mouse down", 0);
        handlePanTilt(this.id)
    });
    $(".btn").on("mouseup", function() {
        debugConsoleMessage("btn: mouse up", 0);
        handlePanTiltMouseUp()
    });
    $(".btn").on("dragend", function() {
        debugConsoleMessage("btn: drag end", 0);
        handlePanTiltMouseUp()
    });
    var d = "";
    $("#ZoomIn").on("mousedown", function() {
        pausePolling = !0;
        d = setInterval(updateZoomFactor, 1E3);
        handleZoomIn(getActiveVideoSource())
    });
    $("#ZoomOut").on("mousedown", function() {
        pausePolling = !0;
        d = setInterval(updateZoomFactor, 1E3);
        handleZoomOut(getActiveVideoSource())
    });
    $("#ZoomIn").on("mouseup", function() {
        pausePolling = !1;
        clearInterval(d);
        debugConsoleMessage("zoom in: mouse up", 0);
        delayedZoomStop()
    });
    $("#ZoomOut").on("mouseup", function() {
        pausePolling = !1;
        clearInterval(d);
        debugConsoleMessage("zoom out: mouse up", 0);
        delayedZoomStop()
    });
    $("#zoom_slider").on("dragend", function() {
        pausePolling = !1
    }).on("mouseup", function() {
        pausePolling = !1
    }).on("mousedown", function() {
        pausePolling = !0
    });
    $("#focusFar, #focusNear, #irisOpen, #irisClose").on("mousedown", function() {
        pausePolling = !0
    });
    $("#ZoomIn").on("dragend", function() {
        pausePolling = !1;
        clearInterval(d);
        debugConsoleMessage("zoom in: drag end", 0);
        delayedZoomStop()
    });
    $("#ZoomOut").on("dragend", function() {
        pausePolling = !1;
        clearInterval(d);
        debugConsoleMessage("zoom out: drag end", 0);
        delayedZoomStop()
    });
    $("#CP_Slider_Button").click(function() {
        0 === $("#ControlPanelDiv").width() ? ($("#ControlPanelDiv").show(),
        $("#ControlPanelDiv").animate({
            width: "250px"
        }, {
            duration: 500,
            step: function() {
                resizeVideo()
            }
        }),
        "Anonymous" !== getUserLevel() && $("#ptzDiv").show()) : ($("#ControlPanelDiv").animate({
            width: "0px"
        }, {
            duration: 500,
            step: function() {
                resizeVideo()
            },
            complete: function() {
                $("#ControlPanelDiv").hide()
            }
        }),
        "Anonymous" !== getUserLevel() && $("#ptzDiv").hide())
    });
    $("#Setup_Slider_Button").click(function() {
        0 === $("#SetupPanelDiv").width() ? ($("#SetupPanelDiv").show(),
        $("#SetupPanelDiv").animate({
            width: "250px"
        }, {
            duration: 500,
            step: function() {
                resizeVideo()
            }
        }),
        $("#SetupWidgetTableRow").show()) : ($("#SetupPanelDiv").animate({
            width: "0px"
        }, {
            duration: 500,
            step: function() {
                resizeVideo()
            },
            complete: function() {
                $("#SetupPanelDiv").hide()
            }
        }),
        $("#SetupWidgetTableRow").hide())
    });
    $("#Position-Tab").click(function() {
        setActiveTab("#Position-Tab", "#Position")
    });
    $("#Tours-Tab").click(function() {
        setActiveTab("#Tours-Tab", "#Tours")
    });
    $("#Other-Tab").click(function() {
        setActiveTab("#Other-Tab", "#Other")
    });
    $(".focus-button-bottom").hover(function() {
        $(this).css("background", getSkinColor(6))
    }, function() {
        $(this).css("background", getSkinColor(2))
    });
    $(".focus-button-top").hover(function() {
        $(this).css("background", getSkinColor(6))
    }, function() {
        $(this).css("background", getSkinColor(2))
    });
    $("#ZoomIn").mouseenter(function() {
        changeImage("#focus_top_image", "images/zoom-in-hover.png")
    });
    $("#ZoomIn").mouseleave(function() {
        changeImage("#focus_top_image", "images/zoom-in.png")
    });
    $("#ZoomOut").mouseenter(function() {
        changeImage("#focus_bottom_image", "images/zoom-out-hover.png")
    });
    $("#ZoomOut").mouseleave(function() {
        changeImage("#focus_bottom_image", "images/zoom-out.png")
    });
    $("#focusNear").mouseenter(function() {
        changeImage("#focusNearImg", "images/focusNear-hover.png")
    });
    $("#focusNear").mouseleave(function() {
        changeImage("#focusNearImg", "images/focusNear.png")
    });
    $("#focusFar").mouseenter(function() {
        changeImage("#focusFarImg", "images/focusFar-hover.png")
    });
    $("#focusFar").mouseleave(function() {
        changeImage("#focusFarImg", "images/focusFar.png")
    });
    $("#focusOnePush").mouseenter(function() {
        changeImage("#focusOnePushImg", "images/onePushFocus-hover.png")
    });
    $("#focusOnePush").mouseleave(function() {
        changeImage("#focusOnePushImg", "images/onePushFocus.png")
    });
    $("#focusInfinite").mouseenter(function() {
        changeImage("#focusInfiniteImg", "images/infiniteFocus-hover.png")
    });
    $("#focusInfinite").mouseleave(function() {
        changeImage("#focusInfiniteImg", "images/infiniteFocus.png")
    });
    $("#NUC").mouseenter(function() {
        changeImage("#nucImg", "images/nuc-hover.png")
    });
    $("#NUC").mouseleave(function() {
        changeImage("#nucImg", "images/nuc.png")
    });
    $("#irisClose").mouseenter(function() {
        changeImage("#irisCloseImg", "images/irisClose-hover.png")
    });
    $("#irisClose").mouseleave(function() {
        changeImage("#irisCloseImg", "images/irisClose.png")
    });
    $("#irisOpen").mouseenter(function() {
        changeImage("#irisOpenImg", "images/irisOpen-hover.png")
    });
    $("#irisOpen").mouseleave(function() {
        changeImage("#irisOpenImg", "images/irisOpen.png")
    });
    thisCamera.getProfileSettings(function() {
        setSelectedProfile(null, null, !0);
        isThermalDualHead() && "No Profile" === getSelectedProfile("Visible Camera") && "No Profile" === getSelectedProfile("Thermal Camera") && setupThermalTabCallbacks();
        "false" !== getURLParameter("AutoPlay") ? (setTimeout(function() {
            debugConsoleMessage("Beginning to play video streams.", 0);
            console.log("Camera Model is {0} hiiiii".format(a));
            handlePlay("both", null);
            debugConsoleMessage("Finished playing video streams.", 0);
            resizeVideo();
            debugConsoleMessage("Video players are resized.", 0)
        }, 1E3),
        setupInterfaceSkin(a)) : ($("#visibleVideoProfileName").html(getSelectedProfile("Visible Camera")),
        isThermalDualHead() && ($("#thermalVideoProfileName").html(getSelectedProfile("Thermal Camera")),
        $("#visibleSplitVideoProfileName").html(getSelectedProfile("Visible Camera")),
        $("#thermalSplitVideoProfileName").html(getSelectedProfile("Thermal Camera")),
        setupThermalTabCallbacks()),
        updateProfileList());
        updatePTZValuesFromCamera()
    }, function(a, b, c) {
        $("#visibleVideoProfileName").html("Unable to load profile");
        isThermalDualHead() && ($("#thermalVideoProfileName").html("Unable to load profile"),
        $("#visibleSplitVideoProfileName").html("Unable to load profile"),
        $("#thermalSplitVideoProfileName").html("Unable to load profile"),
        setupThermalTabCallbacks());
        updateProfileList();
        handleCameraError(a, b, c)
    });
    $(window).on("resize", function() {
        $("#trForSplitProfile").hasClass("activeVideo") ? (resizeVideo(void 0, void 0, "left"),
        resizeVideo(void 0, void 0, "right")) : resizeVideo()
    });
    $(window).onerror = function(a, b, c) {
        debugConsoleMessage("Error: " + a + "\nLine Number: " + c, 0);
        return !0
    }
    ;
    b = thisCamera.getDeviceInformationParameter("firmwareVersion");
    $("#LegalRight").html(b);
    $("#ptzPresetList").selectable({});
    $("#ptzPresetList").on("selectableselected", function(a, b) {
        enablePtzPresetGo(!0)
    });
    enablePtzPresetGo(!1);
    $("#ptzTourList").selectable();
    $("#ptzTourList").on("selectableselected", function(a, b) {
        enablePtzPresetTourGo(!0)
    });
    enablePtzPresetTourGo(!1);
    b = function() {
        updateSnapshotResolutionsAvailable();
        var a = isThermalDualHead()
          , b = !1;
        userLevel = getUserLevel();
        var c = function(b, c, d) {
            jpegVisibleWasManuallyStopped = !0;
            "Invalid username or password provided." === c ? ($("#visibleVideoProfileName").css("color", "red"),
            $("#visibleVideoProfileName").html("No JPEG Streams"),
            a && ($("#visibleSplitVideoProfileName").css("color", "red"),
            $("#visibleSplitVideoProfileName").html("No JPEG Streams"),
            k())) : ($("#visibleVideoProfileName").css("color", "red"),
            $("#visibleVideoProfileName").html("Error: {0}".format(c)),
            a && ($("#visibleSplitVideoProfileName").css("color", "red"),
            $("#visibleSplitVideoProfileName").html("Error: {0}".format(c)),
            k()))
        }
          , d = function(a, b, c) {
            jpegThermalWasManuallyStopped = !0;
            "Invalid username or password provided." === b ? ($("#thermalVideoProfileName").css("color", "red"),
            $("#thermalVideoProfileName").html("No JPEG Streams"),
            $("#thermalSplitVideoProfileName").css("color", "red"),
            $("#thermalSplitVideoProfileName").html("No JPEG Streams")) : ($("#thermalVideoProfileName").css("color", "red"),
            $("#thermalVideoProfileName").html("Error: {0}".format(b)),
            $("#thermalSplitVideoProfileName").css("color", "red"),
            $("#thermalSplitVideoProfileName").html("Error: {0}".format(b)))
        }
          , n = function(a) {
            setTimeout(function() {
                if (b) {
                    var c = thisCamera.getSnapshotCapabilitiesParameter("thermalSnapshotResolutions")[0].split("x");
                    thisCamera.saveStreamSetup(a, 1, "JPEG", 25, 0, c[0], c[1], 40, "PT60S", 0, "Main", "0.0.0.0", 0, 0, "Fixed", "false", "2", l, m)
                } else
                    c = thisCamera.getSnapshotCapabilitiesParameter("visibleSnapshotResolutions")[0].split("x"),
                    thisCamera.saveStreamSetup(a, 1, "JPEG", 25, 0, c[0], c[1], 40, "PT60S", 0, "Main", "0.0.0.0", 0, 0, "Fixed", "false", "2", l, m)
            }, 2E3)
        }
          , l = function() {
            setTimeout(function() {
                b ? thisCamera.getVideoEncoderConfig(q, handleCameraError) : thisCamera.getVideoEncoderConfig(r, handleCameraError)
            }, 1E3)
        }
          , r = function() {
            for (var b = 0; 8 > b; b++)
                if ("JPEG" === thisCamera.getMediaParameter("Stream{0}".format(b), "encoding") && "Visible Camera" === thisCamera.getMediaParameter("Stream{0}".format(b), "videoSource")) {
                    jpegStreamVisible = b;
                    break
                }
            -1 !== jpegStreamVisible ? ($("#visibleVideoProfileName").html("Stream{0}".format(jpegStreamVisible)),
            a && $("#visibleSplitVideoProfileName").html("Stream{0}".format(jpegStreamVisible)),
            "false" !== getURLParameter("AutoPlay") && setTimeout(function() {
                getNewJPEGFrame(jpegStreamVisible, "Visible Camera")
            }, 1E3)) : ($("#visibleVideoProfileName").html("No Available Stream"),
            a && $("#visibleSplitVideoProfileName").html("No Available Stream"));
            a && k()
        }
          , q = function() {
            b = !1;
            for (var a = 0; 8 > a; a++)
                if ("JPEG" === thisCamera.getMediaParameter("Stream{0}".format(a), "encoding") && "Thermal Camera" === thisCamera.getMediaParameter("Stream{0}".format(a), "videoSource")) {
                    jpegStreamThermal = a;
                    break
                }
            -1 !== jpegStreamThermal ? ($("#thermalVideoProfileName").html("Stream{0}".format(jpegStreamThermal)),
            $("#thermalSplitVideoProfileName").html("Stream{0}".format(jpegStreamThermal)),
            "false" !== getURLParameter("AutoPlay") && setTimeout(function() {
                getNewJPEGFrame(jpegStreamThermal, "Thermal Camera")
            }, 1E3)) : ($("#thermalVideoProfileName").html("No Available Stream"),
            $("#thermalSplitVideoProfileName").html("No Available Stream"))
        }
          , k = function() {
            for (var a = 0; 8 > a; a++)
                if ("JPEG" === thisCamera.getMediaParameter("Stream{0}".format(a), "encoding") && "Thermal Camera" === thisCamera.getMediaParameter("Stream{0}".format(a), "videoSource")) {
                    jpegStreamThermal = a;
                    break
                }
            -1 === jpegStreamThermal && (b = !0,
            createEncoder(n, d, !0));
            -1 !== jpegStreamThermal && ($("#thermalVideoProfileName").html("Stream{0}".format(jpegStreamThermal)),
            $("#thermalSplitVideoProfileName").html("Stream{0}".format(jpegStreamThermal)),
            "false" !== getURLParameter("AutoPlay") && setTimeout(function() {
                getNewJPEGFrame(jpegStreamThermal, "Thermal Camera")
            }, 1E3))
        }
          , m = function(a, b, c) {
            handleCameraError(a, b, c)
        };
        $("#jpegSnapshotVisibleFull").on("load", function() {
            var a = $("#jpegSnapshotVisibleFull").prop("naturalWidth") / $("#jpegSnapshotVisibleFull").prop("naturalHeight");
            $("#trVideoForVisibleProfile").height() !== $("#jpegSnapshotVisibleFull").prop("naturalHeight") && ($("#jpegSnapshotVisibleFull").width(Math.round($("#trVideoForVisibleProfile").height() * a)),
            $("#jpegSnapshotVisibleFull").height($("#trVideoForVisibleProfile").height()));
            firmwarePending || rebootPending || stopVisibleFullVideoFlag || setTimeout(function() {
                getNewJPEGFrame(jpegStreamVisible, "Visible Camera")
            }, 0)
        });
        $("#jpegSnapshotVisibleFull").on("error", function() {
            firmwarePending || rebootPending || stopVisibleFullVideoFlag || setTimeout(function() {
                getNewJPEGFrame(jpegStreamVisible, "Visible Camera")
            }, 100)
        });
        a && ($("#jpegSnapshotThermalFull").on("load", function() {
            var a = $("#jpegSnapshotThermalFull").prop("naturalWidth") / $("#jpegSnapshotThermalFull").prop("naturalHeight");
            $("#trVideoForThermalProfile").height() !== $("#jpegSnapshotThermalFull").prop("naturalHeight") && ($("#jpegSnapshotThermalFull").width(Math.round($("#trVideoForThermalProfile").height() * a)),
            $("#jpegSnapshotThermalFull").height($("#trVideoForThermalProfile").height()));
            firmwarePending || rebootPending || stopThermalFullVideoFlag || setTimeout(function() {
                getNewJPEGFrame(jpegStreamThermal, "Thermal Camera")
            }, 0)
        }),
        $("#jpegSnapshotThermalFull").on("error", function() {
            firmwarePending || rebootPending || stopThermalFullVideoFlag || setTimeout(function() {
                getNewJPEGFrame(jpegStreamThermal, "Thermal Camera")
            }, 100)
        }),
        $("#jpegSnapshotVisibleSplit").on("load", function() {
            var a = $("#jpegSnapshotVisibleSplit").prop("naturalWidth") / $("#jpegSnapshotVisibleSplit").prop("naturalHeight");
            $("#tdVideoForVisibleProfileLeft").height() !== $("#jpegSnapshotVisibleSplit").prop("naturalHeight") && ($("#jpegSnapshotVisibleSplit").width(Math.round($("#tdVideoForVisibleProfileLeft").height() * a)),
            $("#jpegSnapshotVisibleSplit").height($("#tdVideoForVisibleProfileLeft").height()));
            firmwarePending || rebootPending || stopVisibleSplitVideoFlag || setTimeout(function() {
                getNewJPEGFrame(jpegStreamVisible, "Visible Camera")
            }, 0)
        }),
        $("#jpegSnapshotVisibleSplit").on("error", function() {
            firmwarePending || rebootPending || stopVisibleSplitVideoFlag || setTimeout(function() {
                getNewJPEGFrame(jpegStreamVisible, "Visible Camera")
            }, 100)
        }),
        $("#visibleSplitVideoDiv").on("click", function() {
            setSplitActiveVideo("visibleVideoControlSplit")
        }),
        $("#jpegSnapshotThermalSplit").on("load", function() {
            var a = $("#jpegSnapshotThermalSplit").prop("naturalWidth") / $("#jpegSnapshotThermalSplit").prop("naturalHeight");
            $("#tdVideoForVisibleProfileRight").height() !== $("#jpegSnapshotThermalSplit").prop("naturalHeight") && ($("#jpegSnapshotThermalSplit").width(Math.round($("#tdVideoForVisibleProfileRight").height() * a)),
            $("#jpegSnapshotThermalSplit").height($("#tdVideoForVisibleProfileRight").height()));
            firmwarePending || rebootPending || stopThermalSplitVideoFlag || setTimeout(function() {
                getNewJPEGFrame(jpegStreamThermal, "Thermal Camera")
            }, 0)
        }),
        $("#jpegSnapshotThermalSplit").on("error", function() {
            firmwarePending || rebootPending || stopThermalSplitVideoFlag || setTimeout(function() {
                getNewJPEGFrame(jpegStreamThermal, "Thermal Camera")
            }, 100)
        }),
        $("#thermalSplitVideoDiv").on("click", function() {
            setSplitActiveVideo("thermalVideoControlSplit")
        }));
        "false" === getURLParameter("AutoPlay") && (jpegVisibleWasManuallyStopped = !0,
        isThermalDualHead() && (jpegThermalWasManuallyStopped = !0));
        for (var h = 0; 8 > h; h++)
            if ("JPEG" === thisCamera.getMediaParameter("Stream{0}".format(h), "encoding") && "Visible Camera" === thisCamera.getMediaParameter("Stream{0}".format(h), "videoSource")) {
                jpegStreamVisible = h;
                break
            }
        -1 === jpegStreamVisible && createEncoder(n, c);
        -1 !== jpegStreamVisible && ($("#visibleVideoProfileName").html("Stream{0}".format(jpegStreamVisible)),
        a && $("#visibleSplitVideoProfileName").html("Stream{0}".format(jpegStreamVisible)),
        "false" !== getURLParameter("AutoPlay") && setTimeout(function() {
            getNewJPEGFrame(jpegStreamVisible, "Visible Camera")
        }, 1E3),
        a && k())
    }
    ;
    "InternetExplorer" !== whichBrowser() && (thisCamera.getVideoEncoderConfig(b, handleCameraError),
    $("#ptzProfileNameSelect").attr("disabled", "disabled"),
    $("#transportSelector").css("display", "none"),
    isThermalDualHead() && (resizeVideo(void 0, "thermalVideoControlFull"),
    setupThermalTabCallbacks()));
    resizeVideo();
    var c = ["Off", "Low", "Medium", "High", "Auto"];
    $("#ptzDefogMode").knob({
        min: 0,
        max: c.length,
        fgColor: getSkinColor(2),
        bgColor: "#FFFFFF",
        change: function(a) {},
        release: function(a) {
            setDefogMode(a)
        },
        cancel: function() {},
        format: function(a) {
            a = Math.floor(a);
            a > c.length - 1 && (a = 0);
            return c[a]
        },
        draw: function() {
            $(this.i).css("font-size", "9pt").css("color", "black")
        }
    });
    $("#ptzDayNightMode").slider({
        min: 0,
        max: 2,
        step: 1
    }).slider("pips", {
        rest: "label",
        step: 1,
        labels: ["Auto", "Color", "B&amp;W"]
    }).on("slidechange", function(a, b) {
        a.originalEvent && setDayNightMode(b.value)
    });
    $("#ptzEIS_Mode").on("change", function(a) {
        setEISMode("Visible Camera", "Profile1", a.target.checked)
    });
    $("#ptzSharpness_Level").slider({
        min: 0,
        max: 3,
        step: 1
    }).slider("pips", {
        rest: "label",
        step: 1,
        labels: ["Soft", "Normal", "Sharp", "Sharpest"]
    }).on("slidechange", function(a, b) {
        a.originalEvent && setSharpnessLevel(b.value)
    });
    $("input[type='radio'][name='transportSelector']").change(function() {
        stopVideo("Visible");
        isThermalDualHead() && stopVideo("Thermal");
        setTimeout(function() {
            handlePlay("both", $("input[type='radio'][name='transportSelector']:checked").val())
        }, 500)
    });
    updatePTZValuesFromCamera(!1, !0)
}
$(document).ready(function() {
    setCopyrightYear();
    var a = function() {
        var a = thisCamera.getCameraModel(setOpgalColors);
        setupInterfaceSkin(a);
        thisCamera.getLicenseAgreementStatus(function(b) {
            "true" === b ? (setupVideoControls(a),
            loginPanel()) : ($("#licenseAgreementDialog").dialog({
                autoOpen: !1,
                modal: !0,
                draggable: !1,
                resizable: !1,
                closeOnEscape: !1,
                position: {
                    my: "center",
                    at: "center",
                    of: $("body"),
                    within: $("body")
                },
                show: "blind",
                hide: "blind",
                width: 700,
                dialogClass: "no-close",
                open: function(a, b) {},
                close: function(a, b) {},
                beforeClose: function(a, b) {},
                buttons: [{
                    id: "agreeDialogButton",
                    text: "I Agree",
                    "class": "dialogButtonClass",
                    click: function() {
                        handleLicenseAgreement(a);
                        $(this).dialog("close")
                    }
                }, {
                    id: "declineDialogButton",
                    text: "Decline",
                    "class": "dialogButtonClass",
                    click: function() {
                        $("#LicenseAgreementRow").show();
                        $(this).dialog("close")
                    }
                }]
            }),
            "OP9x" === a && $("#licenseAgreementContainer").attr("src", "Setup/LicenseAgreementOpgal.html"),
            $("#licenseAgreementDialog").dialog("open"))
        }, function(b, c, e) {
            var d = "0P9x" === a ? "www.opgal.com" : "www.costarhd.com";
            $("#LicenseAgreementRow").show();
            $("#LicenseAgreementError").text("We were unable to retrieve the License Agreement information from the camera. Please contact us at {0} for support.".format(d));
            handleCameraError(b, c, e)
        })
    };
    thisCamera.getDeviceInformation(function() {
        thisCamera.getAnonymousAccess(function(b) {
            anonymousMode = b;
            "true" === getURLParameter("OP9") && (setOpgalColors = !0);
            a()
        }, handleCameraError)
    }, handleCameraError)
});
function activeXerror(a) {
    switch (a) {
    case 0:
        debugConsoleMessage("Video player reports no errors.  {0}".format("Success"), 0);
        break;
    case -2147467259:
        var b = "There was a severe error playing the streaming video (0x7FFFBFFB).";
        debugConsoleMessage(b, 3);
        $("#activeXerror2").html(b);
        break;
    case -2147220961:
        b = "There was a severe error loading the video player (0x7FFBFDE1).";
        debugConsoleMessage(b, 3);
        $("#activeXerror2").html(b);
        break;
    case -2147467262:
        b = "There was a severe error working with the video player (0x7FFBFDE2).";
        debugConsoleMessage(b, 3);
        $("#activeXerror2").html(b);
        break;
    default:
        b = "Severe error with the video player ({0})".format(a),
        debugConsoleMessage(b, 3),
        $("#activeXerror2").html(b)
    }
    return a
}
function checkPtzPresetGo() {
    enablePtzPresetGo(0 !== $("#ptzPresetList .ui-selected").length)
}
function delayedZoomStop() {
    setTimeout(function() {
        zoomStop()
    }, 200)
}
function isVentusModel() {
    var a = thisCamera.getDeviceInformationParameter("model");
    return "429" == a.substring(0, 3) && "D" == a.substring(6, 7)
}
function enablePtzPresetGo(a) {
    a ? ($("#ptzGoIcon").css("opacity", "1.0"),
    $("#ptzPresetGo").on("mouseleave", function() {
        changeImage("#ptzGoIcon", "images/go.png")
    }),
    $("#ptzPresetGo").on("mouseenter", function() {
        changeImage("#ptzGoIcon", "images/go-hover.png")
    }),
    $("#ptzPresetGo").unbind("click"),
    $("#ptzPresetGo").on("click", function() {
        gotoPreset($("#ptzPresetList .ui-selected").attr("token"))
    })) : ($("#ptzGoIcon").css("opacity", "0.3"),
    $("#ptzPresetGo").on("mouseleave", function() {
        changeImage("#ptzGoIcon", "images/go.png")
    }),
    $("#ptzPresetGo").on("mouseenter", function() {
        changeImage("#ptzGoIcon", "images/go.png")
    }),
    $("#ptzPresetGo").unbind("click"))
}
function checkPtzPresetTourGo() {
    enablePtzPresetTourGo(0 !== $("#ptzTourList .ui-selected").length)
}
function checkPtzPresetTourStop(a) {
    enablePtzPresetTourStop(a)
}
function enablePtzPresetTourGo(a) {
    a ? ($("#ptzGoTourIcon").css("opacity", "1.0"),
    $("#ptzTourGo").on("mouseleave", function() {
        changeImage("#ptzGoTourIcon", "images/go.png")
    }),
    $("#ptzTourGo").on("mouseenter", function() {
        changeImage("#ptzGoTourIcon", "images/go-hover.png")
    }),
    $("#ptzTourGo").unbind("click"),
    $("#ptzTourGo").on("click", function() {
        startTour($("#ptzTourList .ui-selected").attr("id"))
    })) : ($("#ptzGoTourIcon").css("opacity", "0.3"),
    $("#ptzTourGo").on("mouseleave", function() {
        changeImage("#ptzGoTourIcon", "images/go.png")
    }),
    $("#ptzTourGo").on("mouseenter", function() {
        changeImage("#ptzGoTourIcon", "images/go.png")
    }),
    $("#ptzTourGo").unbind("click"))
}
function enablePtzPresetTourStop(a) {
    a ? ($("#ptzTourStop").css("opacity", "1.0"),
    $("#ptzTourStop").on("mouseleave", function() {
        changeImage("#ptzStopTourIcon", "images/stop.png")
    }),
    $("#ptzTourStop").on("mouseenter", function() {
        changeImage("#ptzStopTourIcon", "images/stop-hover.png")
    }),
    $("#ptzTourStop").unbind("click"),
    $("#ptzTourStop").on("click", function() {
        stopTour($("#ptzTourList .ui-selected").attr("id"))
    })) : ($("#ptzTourStop").css("opacity", "0.3"),
    $("#ptzTourStop").on("mouseleave", function() {
        changeImage("#ptzStopTourIcon", "images/stop.png")
    }),
    $("#ptzTourStop").on("mouseenter", function() {
        changeImage("#ptzStopTourIcon", "images/stop.png")
    }),
    $("#ptzTourStop").unbind("click"),
    $("#visibleTourName").html(""),
    $("#ptzTourName").html("No Tour is Running"),
    isThermalDualHead() && ($("#thermalTourName").html(""),
    $("#visibleSplitTourName").html("")))
}
function getJPEGStream(a) {
    switch (a) {
    case "Visible Camera":
        return jpegStreamVisible;
    case "Thermal Camera":
        return jpegStreamThermal
    }
}
function getSelectedProfile(a) {
    switch (a) {
    case "Visible Camera":
        return selectedVisibleProfile;
    case "Thermal Camera":
        return selectedThermalProfile
    }
}
function getUserLevel() {
    return _userLevel
}
function getZoomFactor() {
    return $("#zoom_slider").slider("option", "value")
}
function getZoomProfile(a) {
    var b = getActiveVideoProfile();
    "InternetExplorer" !== whichBrowser() && (b = getProfileWithVideoSource(a));
    return b
}
function getZoomSyncProfile(a) {
    var b = "No Profile";
    switch (thisCamera.getThermalZoomModeParam("syncMode")) {
    case "VisibleLeads":
        b = getSelectedProfile("Visible Camera");
        break;
    case "Independent":
        b = a;
        break;
    case "ThermalLeads":
        b = getSelectedProfile("Thermal Camera")
    }
    return b
}
function getZoomSyncSource(a) {
    var b = "";
    switch (thisCamera.getThermalZoomModeParam("syncMode")) {
    case "VisibleLeads":
        b = "Visible Camera";
        break;
    case "Independent":
        b = a;
        break;
    case "ThermalLeads":
        b = "Thermal Camera"
    }
    return b
}
function handleCameraError(a, b, d) {
    console.log("CameraError: {0}".format(b));
    a = new ErrorLogItem;
    a.dateTime = new Date;
    a.level = 3;
    a.message = b;
    switch (b) {
    case "Invalid username or password provided.":
        debugConsoleMessage("Camera refused to perform a task because there were invalid credentials to perform the task.", 3);
        break;
    default:
        rebootPending || handleErrorLogAdd(a)
    }
}
function handleLicenseAgreement(a) {
    var b = (new Date).toISOString();
    thisCamera.setLicenseAgreement("", b, function() {
        loginPanel();
        setupVideoControls(a)
    }, function(a, b, e) {
        handleCameraError(a, b, e)
    })
}
function handleNUC() {
    thisCamera.manualNUC(function() {}, function(a, b, d) {
        handleCameraError(a, b, d)
    })
}
function handlePlayButton(a, b, d) {
    var c = "No Profile";
    void 0 === b && (b = !1);
    void 0 === d && (d = !1);
    var e = function() {
        c = getSelectedProfile("Visible Camera");
        "No Profile" !== c ? (console.log("Playing video for {0} in visibleVideoControlSplit".format(c)),
        $("#visibleSplitVideoProfileName").html(c),
        playVideo($("input[type='radio'][name='transportSelector']:checked").val(), thisCamera.getProfileParameterByName(c, "streamName"), "visibleVideoControlSplit")) : ($("#visibleSplitVideoProfileName").html(c),
        debugConsoleMessage("There is no profile setup to play from a visible stream", 1))
    }
      , f = function() {
        c = getSelectedProfile("Thermal Camera");
        "No Profile" !== c ? (console.log("Playing video for {0} in thermalVideoControlSplit".format(c)),
        $("#thermalSplitVideoProfileName").html(c),
        playVideo($("input[type='radio'][name='transportSelector']:checked").val(), thisCamera.getProfileParameterByName(c, "streamName"), "thermalVideoControlSplit")) : ($("#thermalSplitVideoProfileName").html(c),
        debugConsoleMessage("There is no profile setup to play from a thermal stream", 1))
    };
    if ("InternetExplorer" === whichBrowser())
        if (d) {
            switch (a) {
            case "visibleVideoControlFull":
            case "visibleVideoControlSplit":
                c = getSelectedProfile("Visible Camera");
                break;
            case "thermalVideoControlFull":
            case "thermalVideoControlSplit":
                c = getSelectedProfile("Thermal Camera")
            }
            "No Profile" !== c ? (console.log("Playing video for {0} in {1}".format(c, a)),
            $("#" + a).html(c),
            playVideo($("input[type='radio'][name='transportSelector']:checked").val(), thisCamera.getProfileParameterByName(c, "streamName"), a)) : ($("#" + a).html(c),
            debugConsoleMessage("There is no profile setup to play", 1))
        } else {
            if (b || $("#trHeaderForVisibleProfile").hasClass("activeVideo"))
                c = getSelectedProfile("Visible Camera"),
                "No Profile" !== c ? (console.log("Playing video for {0} in visibleVideoControlFull".format(c)),
                $("#visibleVideoProfileName").html(c),
                playVideo($("input[type='radio'][name='transportSelector']:checked").val(), thisCamera.getProfileParameterByName(c, "streamName"), "visibleVideoControlFull")) : ($("#visibleVideoProfileName").html(c),
                debugConsoleMessage("There is no profile setup to play from a visible stream", 1));
            if (isThermalDualHead()) {
                if (b || $("#trHeaderForThermalProfile").hasClass("activeVideo"))
                    c = getSelectedProfile("Thermal Camera"),
                    "No Profile" !== c ? (console.log("Playing video for {0} in thermalVideoControlFull".format(c)),
                    $("#thermalVideoProfileName").html(c),
                    playVideo($("input[type='radio'][name='transportSelector']:checked").val(), thisCamera.getProfileParameterByName(c, "streamName"), "thermalVideoControlFull")) : ($("#thermalVideoProfileName").html(c),
                    debugConsoleMessage("There is no profile setup to play from a thermal stream", 1));
                if (b || $("#trForSplitProfile").hasClass("activeVideo"))
                    $("#visibleVideoControlSplit").hasClass("activeVideo") ? (e(),
                    b && f()) : $("#thermalVideoControlSplit").hasClass("activeVideo") ? (f(),
                    b && e()) : (e(),
                    f())
            }
        }
    else
        switch (getActiveVideoControl()) {
        case "visibleVideoControlFull":
            jpegWasManuallyStopped("Visible Camera") || (stopVisibleFullVideoFlag = !1,
            setTimeout(function() {
                getNewJPEGFrame(jpegStreamVisible, "Visible Camera")
            }, 0));
            break;
        case "thermalVideoControlFull":
            jpegWasManuallyStopped("Thermal Camera") || (stopThermalFullVideoFlag = !1,
            setTimeout(function() {
                getNewJPEGFrame(jpegStreamThermal, "Thermal Camera")
            }, 0));
            break;
        case "visibleVideoControlSplit":
            jpegWasManuallyStopped("Visible Camera") || (stopVisibleSplitVideoFlag = !1,
            setTimeout(function() {
                getNewJPEGFrame(jpegStreamVisible, "Visible Camera")
            }, 0));
            jpegWasManuallyStopped("Thermal Camera") || null !== a && void 0 !== a || (stopThermalSplitVideoFlag = !1,
            setTimeout(function() {
                getNewJPEGFrame(jpegStreamThermal, "Thermal Camera")
            }, 0));
            break;
        case "thermalVideoControlSplit":
            jpegWasManuallyStopped("Thermal Camera") || (stopThermalSplitVideoFlag = !1,
            setTimeout(function() {
                getNewJPEGFrame(jpegStreamThermal, "Thermal Camera")
            }, 0)),
            jpegWasManuallyStopped("Visible Camera") || null !== a && void 0 !== a || (stopVisibleSplitVideoFlag = !1,
            setTimeout(function() {
                getNewJPEGFrame(jpegStreamVisible, "Visible Camera")
            }, 0))
        }
    updateProfileList()
}
function handlePauseButton(a) {
    $("#PauseButton").toggleClass("control_button_active")
}
function handlePanTiltMouseUp() {
    setTimeout(function() {
        panTiltStop()
    }, 200)
}
var lastDirection = ""
  , lastSpeed = "";
function handlePanTilt(a, b, d) {
    var c = 0
      , e = 0
      , f = void 0 === b ? $("#pan_tilt_speed_slider").slider("value") + 1 : b;
    f = 99 > f ? f : 99;
    if (!1 !== d) {
        debugConsoleMessage("pan tilt speed: {0}  direction:{1}".format(f, a), 1);
        if ("" !== lastDirection || "" !== lastSpeed)
            if (d = b - lastSpeed,
            lastDirection === a && d < .1 * b)
                return;
        lastDirection = a;
        lastSpeed = b;
        switch (a) {
        case "ptz_north":
            c = 0;
            e = 1;
            break;
        case "ptz_north_east":
            e = c = 1;
            break;
        case "ptz_east":
            c = 1;
            e = 0;
            break;
        case "ptz_south_east":
            c = 1;
            e = -1;
            break;
        case "ptz_south":
            c = 0;
            e = -1;
            break;
        case "ptz_south_west":
            e = c = -1;
            break;
        case "ptz_west":
            c = -1;
            e = 0;
            break;
        case "ptz_north_west":
            c = -1,
            e = 1
        }
        a = "No Profile";
        "InternetExplorer" === whichBrowser() ? (a = getSelectedProfile("Visible Camera"),
        isThermalDualHead() && "Thermal Camera" === getActiveVideoSource() && (a = getSelectedProfile("Thermal Camera"))) : (a = getProfileWithVideoSource("Visible Camera"),
        isThermalDualHead() && "Thermal Camera" === getActiveVideoSource() && (a = getProfileWithVideoSource("Thermal Camera")));
        thisCamera.panTilt(a, c, e, Math.abs(f), function() {}, handleCameraError);
        continuousPanTilt = !0
    }
}
function handleSetDIO(a) {
    var b = "active"
      , d = function(a, b, c) {
        handleCameraError(a, b, c)
    }
      , c = function() {};
    "Bistable" === thisCamera.getDIOParameter(a, "mode") && (b = "active" === thisCamera.getDIOParameter(a, "logicalState") ? "inactive" : "active");
    thisCamera.setDIOState(a, b, function() {
        thisCamera.getDigitalOutputState(c, d)
    }, d)
}
function handleStopButton(a) {
    "Thermal Camera" === getActiveVideoSource() ? stopVideo("Thermal") : stopVideo("Visible")
}
function handleRecordButton(a) {
    $("#RecordButton").addClass("control_button_active")
}
function handleWiperOn() {
    var a = function() {}
      , b = function(a, b, e) {
        handleCameraError(a, b, e)
    };
    thisCamera.getWiper(function(d) {
        d = d.split(";");
        thisCamera.setWiper("true", d[1], d[2], d[3], a, b)
    }, function(a, b, e) {
        handleCameraError(a, b, e)
    })
}
function handleUserRights(a) {
    setUserLevel(a);
    $("#presetMenuBtn, #settingsCtrlAction, #jsVideoControlsZoomSlider, #canv, #setupCameraDiagnostics, #presetMenuBtn, #setupCentralizedAuthentication,.tourControls").css("display", "");
    $("#Setup, #Setup_Slider_Button, #Tours-Tab, #Other-Tab, #ptzDiv, #ptzSpeed, #ZoomFieldset, #LensSpeedFieldset, #focusFieldSet, #setupAnalyticView, #irisFieldSet, #Tours-Tab").css("display", "");
    $("#presetTourControlPanelHeader").text("Presets & Tours").css("top", "5px");
    $("#Tours-Tab").css("padding-top", "0px");
    $("#anonymousModeSigInBtnTd").css("display", "none");
    switch (a) {
    case "Administrator":
        break;
    case "Operator":
        $("#setupNetwork").css("display", "none");
        $("#setupUsers").css("display", "none");
        $("#setupActionEngine").css("display", "none");
        $("#setupDateTime").css("display", "none");
        $("#setupSystemUpgrade").css("display", "none");
        $("#setupSystemService").css("display", "none");
        $("#setupSystemSupport").css("display", "none");
        break;
    case "User":
        $("#Setup").css("display", "none");
        $("#Setup_Slider_Button").css("display", "none");
        $("#Other-Tab").css("display", "none");
        break;
    case "AnonymousMode":
        $("#presetMenuBtn,#settingsCtrlAction, #jsVideoControlsZoomSlider, #canv, #anonymousModeSigInBtnTd, #ptzSpeed, #ptzDiv, #LensSpeedFieldset, #ZoomFieldset").css("display", "");
        $("#Setup, #Setup_Slider_Button,#Other-Tab, #focusFieldSet, #setupAnalyticView, #irisFieldSet, #setupCentralizedAuthentication, #setupCameraDiagnostics, .tourControls").css("display", "none");
        $("#presetTourControlPanelHeader").text("Presets").css("top", "0px");
        $("#Tours-Tab").css("padding-top", "12px");
        break;
    default:
        $("#Setup").css("display", "none"),
        $("#Setup_Slider_Button").css("display", "none"),
        $("#Tours-Tab").css("display", "none"),
        $("#Other-Tab").css("display", "none"),
        $("#ptzDiv").css("display", "none"),
        $("#ptzSpeed").css("display", "none"),
        $("#ZoomFieldset").css("display", "none"),
        $("#LensSpeedFieldset").css("display", "none"),
        $("#focusFieldSet, #thermalFocusFieldSet").css("display", "none"),
        $("#irisFieldSet").css("display", "none")
    }
}
function handleZoomAbsolute(a) {
    var b = function() {
        pausePolling = !1
    }
      , d = function(a, b, c) {
        handleCameraError(b)
    }
      , c = getActiveVideoSource()
      , e = getZoomProfile(c)
      , f = 30
      , g = 12;
    f = 0;
    "Thermal Camera" === c ? (f = thisCamera.getOptionsExtensionParam("thermalMaxOpticalZoom"),
    g = thisCamera.getMaxDigitalZoomParameter("maxThermalDigitalZoomLimit")) : (f = thisCamera.getOptionsExtensionParam("visibleMaxOpticalZoom"),
    g = thisCamera.getMaxDigitalZoomParameter("maxVisibleDigitalZoomLimit"));
    f = convertMagnification(a, f, g);
    "No Profile" !== e ? thisCamera.zoomAbsolute(e, f, b, d) : debugConsoleMessage("", 0)
}
function handleZoomMagnificationMessage(a) {
    handleOnZoomSliderChange = !1;
    var b = 0
      , d = !1;
    if ("Thermal Camera" === getActiveVideoSource()) {
        var c = thisCamera.getOptionsExtensionParam("thermalMaxOpticalZoom");
        var e = thisCamera.getMaxDigitalZoomParameter("maxThermalDigitalZoomLimit")
    } else
        c = thisCamera.getOptionsExtensionParam("visibleMaxOpticalZoom"),
        e = thisCamera.getMaxDigitalZoomParameter("maxVisibleDigitalZoomLimit");
    "3" === c && (d = !0);
    a = Number(a) + .02;
    a = Math.floor(a);
    if (a <= c)
        b = a - 1;
    else if (a > c && a < (1 * c + 2 * c) / 2)
        b = c - 1;
    else if (a < (2 * c + 3 * c) / 2)
        b = c;
    else if (a > c * e)
        b = e + (c - 2) + 1;
    else
        for (var f = 2; f <= e; f++)
            if (a >= (c * f + c * (f + 1)) / 2 && a < (c * (f + 1) + c * (f + 2)) / 2) {
                b = f + (c - 2) + 1;
                break
            }
    d && 1 !== a && b--;
    try {
        $("#zoom_slider").slider({
            value: b
        })
    } catch (g) {
        console.log("Magnification Slider in handleZoomMagnificationMessage(): " + g.message)
    }
    handleOnZoomSliderChange = !0
}
function enablePresetGo(a) {
    a ? ($("#ptzGoIcon").css("opacity", "1.0"),
    $("#ptzPresetGo").on("mouseleave", function() {
        changeImage("#ptzGoIcon", "images/go.png")
    }),
    $("#ptzPresetGo").on("mouseenter", function() {
        changeImage("#ptzGoIcon", "images/go-hover.png")
    }),
    $("#ptzPresetGo").unbind("click"),
    $("#ptzPresetGo").on("click", function() {
        gotoPreset($("#ptzPresetList .ui-selected").attr("token"))
    })) : ($("#ptzGoIcon").css("opacity", "0.3"),
    $("#ptzPresetGo").on("mouseleave", function() {
        changeImage("#ptzGoIcon", "images/go.png")
    }),
    $("#ptzPresetGo").on("mouseenter", function() {
        changeImage("#ptzGoIcon", "images/go.png")
    }),
    $("#ptzPresetGo").unbind("click"))
}
function initializeZoomSlider() {
    isThermalDualHead() ? updateZoomValues(!0, function(a, b, d, c) {
        for (var e = [], f = 0; f < a; f++)
            e[f] = f + 1 + "x";
        f = [];
        for (var g = 0; g < b - 1; g++)
            f[g] = a + "x+D" + (g + 2);
        setZoomLabel("visible", e, f);
        a = [];
        if ("3" === d)
            a = ["1x", "3x"];
        else
            for (b = 0; b < d; b++)
                a[b] = b + 1 + "x";
        b = [];
        for (e = 0; e < c - 1; e++)
            b[e] = d + "x+D" + (e + 2);
        setZoomLabel("thermal", a, b);
        "Thermal Camera" === getActiveVideoSource() ? updateZoomSlider(!0, getOpticalToDigitalZoomPercent("thermal")) : updateZoomSlider(!1, getOpticalToDigitalZoomPercent("visible"))
    }) : updateZoomValues(!1, function(a, b) {
        for (var d = [], c = 0, e = 0; e < a; e++)
            d[e] = e + 1 + "x",
            c = e;
        e = [];
        for (var f = 0; f < b - 1; f++)
            e[f] = a + "x+D" + (f + 2);
        setZoomLabel("visible", d, e, d[c]);
        updateZoomSlider(!1, getOpticalToDigitalZoomPercent("visible"))
    })
}
function updateZoomSlider(a, b) {
    if (a) {
        a = getZoomLabel("thermal");
        var d = thisCamera.getOptionsExtensionParam("thermalMaxOpticalZoom") - 1;
        isThermalFixedLens() && (d = 1);
        $("#zoom_slider").slider({
            min: 0,
            max: a.length - 1,
            step: 1
        }).slider("pips", {
            rest: "",
            step: d,
            labels: {
                first: "1x",
                last: "Digital"
            }
        }).slider("float", {
            labels: a
        });
        "VisibleLeads" == thisCamera.getThermalZoomModeParam("syncMode") ? $("#zoom_slider").slider("disable") : $("#zoom_slider").slider("enable")
    } else
        a = getZoomLabel("visible"),
        $("#zoom_slider").slider({
            min: 0,
            max: a.length - 1,
            step: 1
        }).slider("pips", {
            rest: "",
            step: thisCamera.getOptionsExtensionParam("visibleMaxOpticalZoom") - 1,
            labels: {
                first: "1x",
                last: "Digital"
            }
        }).slider("float", {
            labels: a
        }),
        $("#zoom_slider").slider("enable");
    $("#zoom_slider").removeClass("zoom_slider_5");
    $("#zoom_slider").removeClass("zoom_slider_10");
    $("#zoom_slider").removeClass("zoom_slider_20");
    $("#zoom_slider").removeClass("zoom_slider_30");
    $("#zoom_slider").removeClass("zoom_slider_40");
    $("#zoom_slider").removeClass("zoom_slider_50");
    $("#zoom_slider").removeClass("zoom_slider_60");
    $("#zoom_slider").removeClass("zoom_slider_70");
    $("#zoom_slider").removeClass("zoom_slider_80");
    $("#zoom_slider").removeClass("zoom_slider_90");
    switch (!0) {
    case 10 > b:
        $("#zoom_slider").addClass("zoom_slider_5");
        break;
    case 10 <= b && 15 > b:
        $("#zoom_slider").addClass("zoom_slider_10");
        break;
    case 15 <= b && 25 > b:
        $("#zoom_slider").addClass("zoom_slider_20");
        break;
    case 25 <= b && 35 > b:
        $("#zoom_slider").addClass("zoom_slider_30");
        break;
    case 35 <= b && 45 > b:
        $("#zoom_slider").addClass("zoom_slider_40");
        break;
    case 45 <= b && 55 > b:
        $("#zoom_slider").addClass("zoom_slider_50");
        break;
    case 55 <= b && 65 > b:
        $("#zoom_slider").addClass("zoom_slider_60");
        break;
    case 65 <= b && 75 > b:
        $("#zoom_slider").addClass("zoom_slider_70");
        break;
    case 75 <= b && 85 > b:
        $("#zoom_slider").addClass("zoom_slider_80");
        break;
    case 85 <= b:
        $("#zoom_slider").addClass("zoom_slider_90")
    }
}
function updateZoomFactor() {
    thisCamera.getZoomMagnification(getActiveVideoSource(), handleZoomMagnificationMessage, function(a, b, d) {
        handleCameraError(a, b, d)
    })
}
function updateZoomValues(a, b) {
    var d = 0
      , c = 0
      , e = 0
      , f = 0
      , g = function() {
        a && (f = thisCamera.getMaxDigitalZoomParameter("maxThermalDigitalZoomLimit"));
        b(d, c, e, f)
    }
      , p = function() {
        c = thisCamera.getMaxDigitalZoomParameter("maxVisibleDigitalZoomLimit");
        a ? thisCamera.getMaxDigitalZoomLimit("Thermal Camera", g, handleCameraError) : g()
    };
    thisCamera.getOptionsExtension(function() {
        a && (e = thisCamera.getOptionsExtensionParam("thermalMaxOpticalZoom"));
        d = thisCamera.getOptionsExtensionParam("visibleMaxOpticalZoom");
        thisCamera.getMaxDigitalZoomLimit("Visible Camera", p, handleCameraError)
    }, handleCameraError)
}
function getZoomLabel(a) {
    switch (a) {
    case "visible":
        return visibleZoomLabel;
    case "thermal":
        return thermalZoomLabel
    }
}
function getOpticalToDigitalZoomPercent(a) {
    var b = ""
      , d = "";
    switch (a) {
    case "visible":
        b = thisCamera.getOptionsExtensionParam("visibleMaxOpticalZoom");
        d = thisCamera.getMaxDigitalZoomParameter("maxVisibleDigitalZoomLimit");
        break;
    case "thermal":
        b = thisCamera.getOptionsExtensionParam("thermalMaxOpticalZoom"),
        d = thisCamera.getMaxDigitalZoomParameter("maxThermalDigitalZoomLimit")
    }
    return b / (parseInt(b) + parseInt(d)) * 100
}
function setZoomLabel(a, b, d) {
    b = b.concat(d);
    switch (a) {
    case "visible":
        visibleZoomLabel = b;
        break;
    case "thermal":
        thermalZoomLabel = b
    }
}
function convertMagnification(a, b, d) {
    var c = !1
      , e = !1;
    "3" === b && (e = !0);
    if (a >= b || e && a >= b - 1)
        c = !0;
    c ? (d = (d - 1) / .2,
    a -= b - 1,
    a = e ? (a + 1) / d + .8 : a / d + .8) : a = e ? 0 === a ? 0 : .8 : a / ((b - 1) / .8);
    isNaN(a) && (a = 0);
    return a
}
function handleZoomIn(a) {
    if (getDrawingMode())
        humanReadMsg("privacyAddDeleteHumanReadMessage", "Zoom functions are disabled during privacy mask drawing mode.", -1),
        humanReadMsg("mediaWizardHumanReadMessage", "Zoom functions are disabled during privacy mask drawing mode.", -1);
    else {
        a = getZoomProfile(a);
        var b = .3
          , d = function(a, b, c) {
            handleCameraError(b)
        }
          , c = function() {};
        switch ($("#lens_speed_slider").slider("value")) {
        case 0:
            b = .3;
            break;
        case 1:
            b = .6;
            break;
        case 2:
            b = 1
        }
        "No Profile" !== a ? thisCamera.zoom(a, b, c, d) : debugConsoleMessage("", 0)
    }
}
function handleZoomOut(a) {
    if (getDrawingMode())
        humanReadMsg("privacyAddDeleteHumanReadMessage", "Zoom functions are disabled during privacy mask drawing mode.", -1),
        humanReadMsg("mediaWizardHumanReadMessage", "Zoom functions are disabled during privacy mask drawing mode.", -1);
    else {
        a = getZoomProfile(a);
        var b = .3
          , d = function(a, b, c) {
            handleCameraError(b)
        }
          , c = function() {};
        switch ($("#lens_speed_slider").slider("value")) {
        case 0:
            b = .3;
            break;
        case 1:
            b = .6;
            break;
        case 2:
            b = 1
        }
        "No Profile" !== a ? thisCamera.zoom(a, -1 * b, c, d) : debugConsoleMessage("", 0)
    }
}
var resumePolling = function() {
    pausePolling = !1
};
function handleAutoIris(a, b) {
    "flip" === a && (a = $("#autoIris").hasClass("OptionOn") ? "off" : "on");
    var d = function() {
        updateImageInfo();
        debugConsoleMessage("Iris mode changed to {0}".format(a), 0)
    }
      , c = thisCamera.getImagingParameter("imagingExposureMode")
      , e = thisCamera.getImagingParameter("imagingExposurePriority")
      , f = e
      , g = c;
    "off" === a ? (b && ("AUTO" == c && ("" == e ? f = "LowNoise" : "FrameRate" == e && (g = "MANUAL",
    f = "")),
    thisCamera.setIrisMode("Visible Camera", g, f, d, handleCameraError)),
    $("#autoIris").addClass("OptionOff"),
    $("#autoIris").removeClass("OptionOn"),
    $("#autoIris").html("Auto Iris Off")) : (b && ("AUTO" == c ? "LowNoise" == e && (f = "") : (g = "AUTO",
    f = "FrameRate"),
    thisCamera.setIrisMode("Visible Camera", g, f, d, handleCameraError)),
    $("#autoIris").removeClass("OptionOff"),
    $("#autoIris").addClass("OptionOn"),
    $("#autoIris").html("Auto Iris On"))
}
function handleAutoFocus(a, b) {
    var d = getActiveVideoSource()
      , c = function() {
        updateImageInfo();
        debugConsoleMessage("Auto focus for {0} changed to {1}.".format(d, a), 0)
    };
    "flip" === a && (a = $("#autoFocus").hasClass("OptionOn") ? "off" : "on");
    "off" === a ? (b && thisCamera.setFocusMode(d, "MANUAL", c, handleCameraError),
    $("#autoFocus").addClass("OptionOff"),
    $("#autoFocus").removeClass("OptionOn"),
    $("#autoFocus").html("Auto Focus Off")) : (b && thisCamera.setFocusMode(d, "AUTO", c, handleCameraError),
    $("#autoFocus").removeClass("OptionOff"),
    $("#autoFocus").addClass("OptionOn"),
    $("#autoFocus").html("Auto Focus On"))
}
function handleIris(a) {
    "stop" !== a && handleAutoIris("off");
    var b = function() {
        resumePolling();
        updateImageInfo()
    };
    switch (a) {
    case "open":
        thisCamera.doIrisCommand("Profile1", "Open", function() {}, handleCameraError);
        break;
    case "close":
        thisCamera.doIrisCommand("Profile1", "Close", function() {}, handleCameraError);
        break;
    case "stop":
        thisCamera.doIrisCommand("Profile1", "Stop", b, handleCameraError)
    }
}
var updateFocusTimer = null;
function handleFocus(a) {
    var b = getActiveVideoSource()
      , d = null
      , c = function(a, b, c) {
        focusPending = !1;
        null != updateFocusTimer && clearTimeout(updateFocusTimer);
        updateFocusTimer = setTimeout(function() {
            thisCamera.getVideoSettings(getActiveVideoSource(), function() {
                updatePTZValuesFromCameraSuccessA(void 0, !0);
                resumePolling()
            }, handleCameraError)
        }, 2E3)
    };
    d = function() {
        focusPending = !1;
        null != updateFocusTimer && clearTimeout(updateFocusTimer);
        updateFocusTimer = setTimeout(function() {
            thisCamera.getVideoSettings(getActiveVideoSource(), function() {
                updatePTZValuesFromCameraSuccessA(void 0, !0);
                resumePolling()
            }, c)
        }, 2E3);
        debugConsoleMessage("Focus completed: {0}.".format(a), 0)
    }
    ;
    switch (a) {
    case "near":
        d = isVentusModel() ? $("#thermalFocus_speed_slider").slider("value") : "-1.0";
        thisCamera.doFocusCommand(b, d, function() {}, function() {});
        handleAutoFocus("off");
        break;
    case "far":
        d = isVentusModel() ? $("#thermalFocus_speed_slider").slider("value") : "1.0";
        thisCamera.doFocusCommand(b, d, function() {}, function() {});
        handleAutoFocus("off");
        break;
    case "stop":
        isThermalFixedLens() ? thisCamera.doFocusCommand("Visible Camera", "0.0", d, c) : thisCamera.doFocusCommand(b, "0.0", d, c);
        break;
    case "onePush":
        thisCamera.setOnePushAutoFocus(b, d, c);
        break;
    case "infinite":
        thisCamera.setThermalInfiniteFocus(d, c),
        handleAutoFocus("off")
    }
}
function isSupportedBrowser() {
    var a = !0;
    switch (whichBrowser()) {
    case "Microsoft Edge":
    case "Opera":
    case "Safari":
    case "Unknown":
        a = !1
    }
    return a
}
function updateFocusIrisButtons(a) {
    "visible" !== a || anonymousMode || "Anonymous" === getUserLevel() ? ($("#irisFieldSet").css("display", "none"),
    $("#NUC").css("display", ""),
    isVentusModel() && $("#thermalFocusFieldSet").css("display", ""),
    isThermalFixedLens() ? ($("#autoFocus").css("visibility", "hidden"),
    $("#focusNear").css("display", "none"),
    $("#focusFar").css("display", "none"),
    $("#focusOnePush").css("display", "none"),
    $("#focusInfinite").css("display", "none")) : $("#focusInfinite").css("display", "")) : ($("#autoFocus").css("visibility", ""),
    $("#focusNear").css("display", ""),
    $("#focusFar").css("display", ""),
    $("#focusOnePush").css("display", ""),
    $("#focusInfinite").css("display", "none"),
    $("#NUC, #thermalFocusFieldSet").css("display", "none"),
    $("#irisFieldSet").css("display", ""))
}
function isDefined(a) {
    var b = !0;
    switch (a) {
    case ".":
    case null:
    case void 0:
    case "Undefined":
        b = !1
    }
    return b
}
function isThermalDualHead() {
    var a = !1;
    switch (thisCamera.getCameraModel(setOpgalColors)) {
    case "429x":
    case "OP9x":
        a = !0
    }
    return a
}
function isThermalFixedLens() {
    var a = !1
      , b = thisCamera.getOptionsImagingParam("maxNearLimit")
      , d = thisCamera.getOptionsImagingParam("maxFarLimit");
    b === d && (a = !0);
    return a
}
function panTiltStop() {
    var a = "No Profile";
    "InternetExplorer" === whichBrowser() ? (a = getSelectedProfile("Visible Camera"),
    isThermalDualHead() && "Thermal Camera" === getActiveVideoSource() && (a = getSelectedProfile("Thermal Camera"))) : (a = getProfileWithVideoSource("Visible Camera"),
    isThermalDualHead() && "Thermal Camera" === getActiveVideoSource() && (a = getProfileWithVideoSource("Thermal Camera")));
    thisCamera.panTiltStop(a, function() {
        lastSpeed = lastDirection = ""
    }, handleCameraError)
}
function setActiveTab(a, b) {
    $(".cp_tabs_header_hover_on").css("background-color", getSkinColor(2) + " !important");
    $(".cp_tabs_header_hover_on").css("border", "1px solid " + getSkinColor(2) + " !important");
    $(".cp_tabs_header_hover_on").css("color", "#ffffff !important");
    $(".cp_tabs_header_hover_off").css("background-color", getSkinColor(6));
    $(".cp_tabs_header_hover_off").css("border", "1px solid " + getSkinColor(6));
    $(".cp_tabs_header_hover_off").css("color", "#F7F1E3");
    $(".cp_tabs_header_default").css("background-color", getSkinColor(6));
    $(".cp_tabs_header_default").css("border", "1px solid " + getSkinColor(6));
    $(".cp_tabs_header_default").css("color", "#F7F1E3");
    $("#cp_tabs_content").children("div").each(function(a) {
        $(this).css("display", "none")
    });
    $("#cp_tabs_header").children("div").each(function(a) {
        $(this).unbind("mouseenter mouseleave");
        $(this).hover(function() {
            $(this).css("background-color", getSkinColor(2) + " !important");
            $(this).css("border", "1px solid " + getSkinColor(2) + " !important");
            $(this).css("color", "#ffffff !important")
        }, function() {
            $(this).css("background-color", getSkinColor(6));
            $(this).css("border", "1px solid " + getSkinColor(6));
            $(this).css("color", "#F7F1E3")
        });
        $(this).removeClass("cp_tabs_header_active");
        $(this).addClass("cp_tabs_header_default")
    });
    $(b).css("display", "block");
    $(a).addClass("cp_tabs_header_active");
    $(".cp_tabs_header_active").css("background-color", getSkinColor(3));
    $(".cp_tabs_header_active").css("border", "1px solid " + getSkinColor(3));
    $(".cp_tabs_header_active").css("color", getSkinColor(5));
    $(".cp_tabs_header_active").unbind("mouseenter mouseleave")
}
function setJPEGStream(a, b) {
    switch (a) {
    case "Visible Camera":
        jpegStreamVisible = b;
        break;
    case "Thermal Camera":
        jpegStreamThermal = b
    }
}
function setSelectedProfile(a, b, d) {
    if ("InternetExplorer" === whichBrowser())
        if (d)
            "InternetExplorer" === whichBrowser() && (selectedVisibleProfile = getProfileWithVideoSource("Visible Camera"),
            selectedThermalProfile = getProfileWithVideoSource("Thermal Camera"));
        else
            switch (b) {
            case "Visible Camera":
                selectedVisibleProfile = a;
                break;
            case "Thermal Camera":
                selectedThermalProfile = a
            }
}
function setupThermalTabCallbacks() {
    if (!setupThermalCallbackSet) {
        "InternetExplorer" !== whichBrowser() && ($("#trHeaderSplit").css("display", "inline-flex"),
        $("#trVideoSplit").css("display", "inline-flex"));
        var a = thisCamera.getCameraModel(setOpgalColors);
        $("#Visible_View_Button").click(function() {
            "InternetExplorer" !== whichBrowser() && (setActiveVideoControl("visible"),
            handlePlay(),
            stopVideo("ExceptVisibleFull"));
            showVideoPanel(!0, "visible", a);
            updateZoomSlider(!1, getOpticalToDigitalZoomPercent("visible"));
            updateFocusIrisButtons("visible");
            updatePTZValuesFromCameraSuccessA(!0)
        });
        $("#Thermal_View_Button").click(function() {
            "InternetExplorer" !== whichBrowser() && (setActiveVideoControl("thermal"),
            handlePlay(),
            stopVideo("ExceptThermalFull"));
            showVideoPanel(!0, "thermal", a);
            updateZoomSlider(!0, getOpticalToDigitalZoomPercent("thermal"));
            updateFocusIrisButtons("thermal");
            updatePTZValuesFromCameraSuccessA(!0)
        });
        $("#Split_View_Button").click(function() {
            "InternetExplorer" !== whichBrowser() && (setActiveVideoControl("split"),
            handlePlay(),
            stopVideo("ExceptSplit"));
            showVideoPanel(!0, "split", a);
            $("#visibleVideoControlSplit").hasClass("activeVideo") ? ($("#tdHeaderForVisibleProfileLeft").css("background-color", getSkinColor(2)),
            $("#tdHeaderForVisibleProfileRight").css("background-color", "#5F6062")) : ($("#tdHeaderForVisibleProfileLeft").css("background-color", "#5F6062"),
            $("#tdHeaderForVisibleProfileRight").css("background-color", getSkinColor(2)));
            "Visible Camera" === getActiveVideoSource() ? (updateZoomSlider(!1, getOpticalToDigitalZoomPercent("visible")),
            updateFocusIrisButtons("visible")) : (updateZoomSlider(!0, getOpticalToDigitalZoomPercent("thermal")),
            updateFocusIrisButtons("thermal"));
            updateProfileList();
            updatePTZValuesFromCameraSuccessA(!0)
        });
        setupThermalCallbackSet = !0
    }
}
function setUserLevel(a) {
    _userLevel = a
}
function updateProfileList() {
    getActiveVideoProfile();
    var a = getActiveVideoSource()
      , b = !1;
    if ("." !== a)
        for (var d = 0; 8 > d; d++) {
            var c = thisCamera.getProfileParameter(d, "profileName");
            "." !== c && "Undefined" !== c && (0 === $("#ptzProfileNameSelect:has(option[value='{0}'])".format(c)).length ? ("." === thisCamera.getProfileParameterByName(c, "streamName") || a !== thisCamera.getMediaParameter(thisCamera.getProfileParameterByName(c, "streamName"), "videoSource") ? $("#ptzProfileNameSelect").append("<option value='{0}' disabled='disabled'>{1}</option".format(c, 10 > c.length ? c : c.slice(0, 10) + "...")) : $("#ptzProfileNameSelect").append("<option value='{0}'>{1}</option".format(c, 10 > c.length ? c : c.slice(0, 10) + "...")),
            b = !0) : "." === thisCamera.getProfileParameterByName(c, "streamName") || a !== thisCamera.getMediaParameter(thisCamera.getProfileParameterByName(c, "streamName"), "videoSource") ? $("#ptzProfileNameSelect option[value='{0}'".format(c)).attr("disabled", "disabled") : $("#ptzProfileNameSelect option[value='{0}'".format(c)).removeAttr("disabled"))
        }
    sortSelectList("#ptzProfileNameSelect", "text", "asc");
    $("#ptzProfileNameSelect").val(getActiveVideoProfile());
    return b
}
function updatePTZValuesFromCameraSuccessC() {
    for (var a = 0; 4 > a; a++) {
        var b = thisCamera.getDIOParameter(a, "direction");
        switch (a) {
        case 0:
            "Output" === b ? ($("#controlPanelDIO1").removeClass("disableButton"),
            $("#controlPanelDIO1").unbind("click"),
            $("#controlPanelDIO1").click(function() {
                handleSetDIO(0)
            })) : $("#controlPanelDIO1").addClass("disableButton");
            break;
        case 1:
            "Output" === b ? ($("#controlPanelDIO2").removeClass("disableButton"),
            $("#controlPanelDIO2").unbind("click"),
            $("#controlPanelDIO2").click(function() {
                handleSetDIO(1)
            })) : $("#controlPanelDIO2").addClass("disableButton");
            break;
        case 2:
            "Output" === b ? ($("#controlPanelDIO3").removeClass("disableButton"),
            $("#controlPanelDIO3").unbind("click"),
            $("#controlPanelDIO3").click(function() {
                handleSetDIO(2)
            })) : $("#controlPanelDIO3").addClass("disableButton");
            break;
        case 3:
            "Output" === b ? ($("#controlPanelDIO4").removeClass("disableButton"),
            $("#controlPanelDIO4").unbind("click"),
            $("#controlPanelDIO4").click(function() {
                handleSetDIO(3)
            })) : $("#controlPanelDIO4").addClass("disableButton")
        }
    }
    "true" === thisCamera.getCapabilitiesParameter("wiperConfig") ? ($("#controlPanelWiper").removeClass("disableButton"),
    $("#controlPanelWiper").unbind("click"),
    $("#controlPanelWiper").click(function() {
        handleWiperOn()
    })) : $("#controlPanelWiper").addClass("disableButton")
}
function updatePTZValuesFromCameraSuccessB() {
    thisCamera.getDigitalInputs(updatePTZValuesFromCameraSuccessC, handleCameraError)
}
function updatePTZValuesFromCameraSuccessA(a, b) {
    if (!rebootPending && !firmwarePending) {
        if (isThermalDualHead())
            switch (getActiveVideoSource()) {
            case "Visible Camera":
                "AUTO" === thisCamera.getImagingParameter("imagingFocusAutoFocusMode") ? handleAutoFocus("on", !1) : handleAutoFocus("off", !1);
                break;
            case "Thermal Camera":
                "AUTO" === thisCamera.getImagingParameter("imagingFocusAutoFocusModeThermal") ? handleAutoFocus("on", !1) : handleAutoFocus("off", !1)
            }
        else
            "AUTO" === thisCamera.getImagingParameter("imagingFocusAutoFocusMode") ? handleAutoFocus("on", !1) : handleAutoFocus("off", !1);
        adjustControlsWithAEParameters();
        1 != b && updateZoomFactor();
        populatePresetsPresets($("#ptzPresetList .ui-selected").attr("id"), "ptzPresetList");
        populateTourTours($("#ptzTourList .ui-selected").attr("id"), "ptzTourList");
        $("#ptzSharpness_Level").slider({
            value: thisCamera.getImagingParameter("imagingSharpness")
        });
        $("#ptzDefogMode").val(convertDefogModeToKnob(thisCamera.getHitachi231Parameter("hitachiDefogMode"))).trigger("update");
        $("#ptzDayNightMode").slider({
            value: convertDayNightModeToSlider(thisCamera.getImagingParameter("imagingIrCutFilter"))
        });
        $("#ptzEIS_Mode").prop("checked", "true" === thisCamera.getHitachi231Parameter("hitachiEISState"));
        $("#ptzProfileNameSelect").val()
    }
}
function updateImageInfo() {
    var a = function() {
        updatePTZValuesFromCameraSuccessA(void 0, !0);
        updateImageControlValues()
    }
      , b = function() {};
    thisCamera.getVideoSources(a, b);
    thisCamera.getVideoSettings(getActiveVideoSource(), a, b);
    thisCamera.getHitachi231Settings("Profile1", a, b)
}
function updatePTZValuesFromCamera(a, b) {
    var d = !1;
    !0 === a && (d = !0);
    a = function() {}
    ;
    var c = function(a, b, c) {
        handleCameraError(a, b, c);
        rebootPending || firmwarePending || anonymousMode || d || pausePolling && setTimeout(function() {
            updatePTZValuesFromCamera(!1, !0)
        }, 12E3)
    };
    if (rebootPending || firmwarePending || d || !pausePolling) {
        var e = function() {};
        b ? (updateImageInfo(),
        setTimeout(function() {
            thisCamera.getDigitalInputs(updatePTZValuesFromCameraSuccessC, handleCameraError);
            setTimeout(function() {
                thisCamera.getDigitalOutputState(updatePTZValuesFromCameraSuccessC, e);
                thisCamera.getRelayOutputs(updatePTZValuesFromCameraSuccessC, e);
                thisCamera.getVideoEncoderConfig(function() {}, e, !0);
                setTimeout(function() {
                    thisCamera.getPresets("Profile1", function() {}, e);
                    thisCamera.getPresetTours("Profile1", function() {}, e);
                    updateZoomFactor();
                    "false" !== getURLParameter("PtzPoll") && setTimeout(function() {
                        updatePTZValuesFromCamera(!1, !0)
                    }, 3E3)
                }, 3E3)
            }, 3E3)
        }, 3E3)) : (thisCamera.getImagingSetup(getActiveVideoSource(), "Profile1", updatePTZValuesFromCameraSuccessA, updatePTZValuesFromCameraSuccessA),
        thisCamera.getCapabilities(a, c),
        thisCamera.getVideoEncoderConfig(a, c),
        isThermalDualHead() && thisCamera.getThermalZoomMode(a, c),
        thisCamera.getDigitalOutputState(a, c),
        thisCamera.getRelayOutputs(updatePTZValuesFromCameraSuccessB, c))
    } else
        setTimeout(function() {
            updatePTZValuesFromCamera(!1, !0)
        }, 12E3)
}
function zoomStop() {
    var a = getActiveVideoSource()
      , b = getZoomProfile(a)
      , d = function(a, b, d) {
        handleCameraError(a, b, d)
    };
    "No Profile" !== b ? thisCamera.zoomStop(b, function() {
        isThermalDualHead() && (a = getZoomSyncSource(a));
        thisCamera.getZoomMagnification(a, handleZoomMagnificationMessage, d)
    }, d) : debugConsoleMessage("", 0)
}
function setCopyrightYear() {
    $.ajax({
        url: "date.txt",
        cache: !1,
        type: "GET",
        dataType: "text",
        success: function(a) {
            $("#LegalLeft").text("\u00a9 Copyright 2016-{0} by CostarHD - ALL RIGHTS RESERVED".format(a))
        }
    })
}
;