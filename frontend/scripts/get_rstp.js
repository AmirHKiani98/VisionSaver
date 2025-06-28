$(document).ready(function() {
    $("#submit-camera").on("click", function(e) {
        e.preventDefault();
        var protocol = $("#input-protocol").val();
        if (!protocol) {
            alert("Please select a protocol (RTSP or HTTP).");
            return;
        }
        var ip = $("#input-ip").val();
        if (!ip){
            alert("Please enter a valid IP address.");
            return;
        }
        var channel = $("#input-channel").val();
        if (!channel){
            alert("Please enter a valid channel.");
            channel = "quad";
        }
        
        // Example: build a backend proxy URL for MJPEG or HLS
        // You must have a backend that serves the stream as HTTP (not RTSP)
        var rtspUrl = `${protocol}://${ip}/${channel}`; // adjust path as needed
        var streamUrl = `http://localhost:8000/rtsp/mjpeg_stream?url=${rtspUrl}`;
        
        // Create a Camera object
        var camera = new Camera(protocol, ip, channel, streamUrl);
        // Add the camera object ot the list

        // Update the camera list in the UI
        updateCameraList(camera);
    });
});


function escapeSelector(selector) {
    return selector.replace(/([ #;?%&,.+*~\':"!^$\=>|\/@])/g, '\\$1');
}


function updateCameraList(cameraObject) {
    var videoContainer = $("#video-container");
    var noCameras = camerasData.length;
    // Hide the alert if there is at least one camera
    if (noCameras == 0) {
        $("#no-camera-alert").addClass("hidden");
    }
    var additionalClass = "";
    if (noCameras % 2 === 0) {
        additionalClass = " col-span-2";
    }
    // clear the last existing video card's col-span-2 class
    if (noCameras > 0) {
        var lastCamera = camerasData[noCameras - 1];
        if (lastCamera && lastCamera.id) {
            $(`#${escapeSelector(lastCamera.id)}`).removeClass("col-span-2");
        }
    }
    
    
   

    `
        <div class="video-card group">
                    <div class="video-img-holder">
                        <img class="video-image"
                            id="video-stream" controls autoplay>
                    </div>
                    <div class="video-overlay">
                        <i class="fa-solid fa-circle-xmark text-3xl"></i>
                    </div>
                </div>
    `
    var videoCard = $("<div>", {
        class: "video-card group" + additionalClass,
        id: cameraObject.id
    });

    // Add the camera ID to the video card for easy reference
    var videoImageHolder = $("<div>", {
        class: "video-img-holder"
    });
    videoCard.append(videoImageHolder);
    
    var videoOverlay = $("<div>", {
        class: "video-overlay"
    });
    videoCard.append(videoOverlay);
    var img = $("<img>", {
        class: "video-image",
        controls: true,
        autoplay: true,
        src: cameraObject.streamUrl
    });
    videoImageHolder.append(img);
    
    videoContainer.append(videoCard);
    camerasData.push(cameraObject);


}