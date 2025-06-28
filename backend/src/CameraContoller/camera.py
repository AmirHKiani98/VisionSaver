"""
This is a library for capturing camera video from ip
"""
import base64
import hashlib
import math
import os
from datetime import datetime
import uuid
import requests

class CameraCostar:
    """
    CameraCostar class for COSTAR HD cameras.
    """
    SERVICE_MAP = {
        "imaging": "imaging",
        "device": "device",
        "media": "media",
        "ptz": "ptz",
        "dio": "deviceio",
        "events": "events",
        "actions": "action",
        "extension": "extension",
        "thermal": "risethermal",
        "advsecurity": "advancedsecurity"
    }

    COMMANDS_MAP = {
        "move": (
            "<ptz:ContinuousMove>"
            "<ptz:ProfileToken>Profile1</ptz:ProfileToken>"
            "<ptz:Velocity>"
            "<schema:PanTilt x='{0}' y='{1}' />"
            "</ptz:Velocity>"
            "</ptz:ContinuousMove>"
        ),
        "stop": (
            "<ptz:Stop>"
            "<ptz:ProfileToken>Profile1</ptz:ProfileToken>"
            "<ptz:PanTilt>true</ptz:PanTilt>"
            "</ptz:Stop>"
        )
    }

    def __init__(self, ip: str, username: str, password: str):
        self.ip = ip
        self.username = username
        self.password = password

    def generate_uuid_v4(self) -> str:
        """Generates a random UUID v4
        :return: str"""
        return str(uuid.uuid4())

    def post_request(self, url, data, headers=None, timeout=30):
        """
        Sends a POST request to the specified URL with the given data and headers.
        :param url: The URL to send the request to.
        :param data: The data to send in the request body.
        :param headers: Optional headers to include in the request.
        :param timeout: The timeout for the request in seconds.
        :return: The response object from the request.
        """
        if not url:
            raise ValueError("URL cannot be empty")
        if headers is None:
            headers = {"Content-Type": "application/soap+xml; charset=utf-8"}
        response = requests.post(url, data=data, headers=headers, timeout=timeout)
        return response

    def generate_wsse_header(self, username, password):
        """
        Generates a WSSE header for ONVIF authentication.
        """
        # Generate a random 19-character nonce (UUID v4 style, base64-encoded)
        nonce_bytes = os.urandom(14)  # 14 bytes ≈ 19 base64 chars
        nonce_b64 = base64.b64encode(nonce_bytes).decode()[:19]

        nonce_bytes_decoded = base64.b64decode(nonce_b64 + '==')  # pad if needed
        nonce_latin1 = nonce_bytes_decoded.decode('latin1', errors='ignore')
        # Created timestamp in ISO format
        created = datetime.utcnow().isoformat(timespec='milliseconds') + 'Z'
        # PasswordDigest = Base64(SHA1(nonce_latin1 + created + password))
        digest_input = (nonce_latin1 + created + password).encode('latin1', errors='ignore')
        sha1 = hashlib.sha1()
        sha1.update(digest_input)
        password_digest = base64.b64encode(sha1.digest()).decode()
        # Build WSSE header XML
        wsse_header = (
            "<s:Header xmlns:s='http://www.w3.org/2003/05/soap-envelope'>"
            "<wsse:Security "
            "xmlns:wsse="
            "'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd' "
            "xmlns:wsu="
            "'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd'>"
            "<wsse:UsernameToken>"
            f"<wsse:Username>{username}</wsse:Username>"
            "<wsse:Password "
            "Type='http://docs.oasis-open.org/wss/2004/01/"
            "oasis-200401-wss-username-token-profile-1.0#PasswordDigest'>"
            f"{password_digest}</wsse:Password>"
            f"<wsse:Nonce>{nonce_b64}</wsse:Nonce>"
            f"<wsu:Created>{created}</wsu:Created>"
            "</wsse:UsernameToken>"
            "</wsse:Security>"
            "</s:Header>"
        )
        return wsse_header


    def onvif_send_camera(self, xml_body:str, username, password, ip, protocol="http", port=None):
        """
        Sends a SOAP request to the camera using ONVIF protocol.
        :param xml_body: The XML body of the SOAP request.
        :param username: The username for authentication.
        :param password: The password for authentication.
        :param ip: The IP address of the camera.
        :param protocol: The protocol to use (default is "http").
        :param port: The port to use (default is 80 for http, 443 for https).
        :return: None
        """


        first = xml_body.split(":")[0].strip("<>")
        print(first)  
        service = "all"
        for key, value in CameraCostar.SERVICE_MAP.items():
            if first.lower().startswith(key):
                service = value
                break

        # Build the SOAP envelope
        wsse_header = self.generate_wsse_header(username, password)
        envelope = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            "<soap:Envelope xmlns:soap='http://www.w3.org/2003/05/soap-envelope' "
            "xmlns:schema='http://www.onvif.org/ver10/schema' "
            "xmlns:device='http://www.onvif.org/ver10/device/wsdl' "
            "xmlns:imaging='http://www.onvif.org/ver20/imaging/wsdl' "
            "xmlns:media='http://www.onvif.org/ver10/media/wsdl' "
            "xmlns:ptz='http://www.onvif.org/ver20/ptz/wsdl' "
            "xmlns:dio='http://www.onvif.org/ver10/deviceIO/wsdl' "
            "xmlns:events='http://www.onvif.org/ver10/events/wsdl' "
            "xmlns:actions='http://updates.costarhd.com/ver1/riseactionengine/wsdl' "
            "xmlns:thermal='http://updates.costarhd.com/ver1/risethermal/wsdl' "
            "xmlns:advsecurity='http://www.onvif.org/ver10/advancedsecurity/wsdl' "
            "xmlns:extension='http://updates.costarhd.com/ver1/extension/wsdl'>"
            f"{wsse_header}<soap:Body>{xml_body}</soap:Body></soap:Envelope>"
        )

        # Determine port and protocol
        if protocol == "http":
            default_port = "80"
        else:
            default_port = "443"
        port = port or default_port

        # Build endpoint URL
        base_url = f"{protocol}://{ip}:{port}"
        endpoint = f"{base_url}/onvif/{service}"

        # Send the SOAP request
        self.post_request(endpoint, envelope)


    def pan_camera(self, x, y):
        """
        Moves the camera to the specified pan and tilt coordinates.
        :param x: The pan direction on x axis.
        :param y.
        """
        unit = math.sqrt(x**2 + y**2)
        new_x = x / unit
        new_y = y / unit
        command = CameraCostar.COMMANDS_MAP["move"].format(new_x, new_y)
        self.onvif_send_camera(command, self.username, self.password, self.ip)

    def stop_camera(self):
        """
        Stops the camera movement.
        """
        command = CameraCostar.COMMANDS_MAP["stop"]
        self.onvif_send_camera(command, self.username, self.password, self.ip)
