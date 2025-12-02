import os
import platform
import subprocess
import time
import logging
from typing import List, Optional

import requests

LOG = logging.getLogger(__name__)


def _ps(cmd: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["powershell", "-NoProfile", "-NonInteractive", "-Command", cmd],
        capture_output=True,
        text=True,
        timeout=20,
    )


def _list_vpn_names_via_ps() -> List[str]:
    cp = _ps('Get-VpnConnection | Select-Object -ExpandProperty Name')
    if cp.returncode != 0:
        LOG.warning("Get-VpnConnection failed: %s", cp.stderr.strip())
        return []
    return [line.strip() for line in cp.stdout.splitlines() if line.strip()]


def _rasdial_connected_names() -> List[str]:
    # 'rasdial' (no args) shows current connections if any
    cp = subprocess.run(["rasdial"], capture_output=True, text=True, timeout=15)
    out = cp.stdout or ""
    names: List[str] = []
    for line in out.splitlines():
        # Typical: "No connections" or lists connection names + details
        line = line.strip()
        if not line or "No connections" in line:
            continue
        # Heuristic: connection name is the first non-empty line not starting with spaces
        names.append(line)
    return names


def _set_tunnel_type_ikev2(vpn_name: str) -> None:
    cmd = f'Set-VpnConnection -Name "{vpn_name}" -TunnelType IKEv2 -Force -PassThru | Out-Null'
    _ps(cmd)


def _connect_vpn_rasdial(vpn_name: str) -> bool:
    start = time.time()
    try:
        cp = subprocess.run(["rasdial", vpn_name], capture_output=True, text=True, timeout=60, check=False)
        if cp.returncode == 0:
            return True
        LOG.warning("rasdial returned %s: %s", cp.returncode, cp.stdout.strip() or cp.stderr.strip())
        # Some systems need credentials stored; if needed, extend to rasdial name user pass
        return False
    except Exception as e:
        LOG.exception("rasdial connect failed: %s", e)
        return False
    finally:
        LOG.debug("rasdial connect elapsed: %.2fs", time.time() - start)


def _is_vpn_connected(vpn_name: str) -> bool:
    # Fast path: rasdial output
    connected = _rasdial_connected_names()
    if any(vpn_name.lower() in n.lower() for n in connected):
        return True

    # Slow path: WMI (best-effort)
    try:
        import pythoncom  # type: ignore
        pythoncom.CoInitialize()
        try:
            try:
                import wmi  # type: ignore
                c = wmi.WMI()
            except Exception as e1:
                # Alternate COM path if 'wmi' wrapper fails
                import win32com.client  # type: ignore
                loc = win32com.client.Dispatch("WbemScripting.SWbemLocator")
                svc = loc.ConnectServer(".", "root\\cimv2")
                c = svc  # Provide a similar interface below
                # Query via SWbemServices
                q = 'SELECT Name FROM Win32_NetworkConnection'
                for conn in c.ExecQuery(q):
                    name = getattr(conn, "Name", "") or ""
                    if vpn_name.lower() in name.lower():
                        return True
                return False

            # Using python-wmi object model
            for conn in c.Win32_NetworkConnection():
                name = getattr(conn, "Name", "") or ""
                if vpn_name.lower() in name.lower():
                    return True
            return False
        finally:
            pythoncom.CoUninitialize()
    except Exception as e:
        LOG.warning("WMI check unavailable: %s", e)
        return False


def _connect_vpn_windows(vpn_name: str) -> bool:
    # Ensure IKEv2 (ignore failures)
    try:
        _set_tunnel_type_ikev2(vpn_name)
    except Exception as e:
        LOG.debug("Set-VpnConnection IKEv2 skipped: %s", e)

    # Already connected?
    if _is_vpn_connected(vpn_name):
        return True

    # Try rasdial connect
    if _connect_vpn_rasdial(vpn_name):
        return True

    # Best-effort: retry once after brief pause
    time.sleep(2)
    return _connect_vpn_rasdial(vpn_name)


def _choose_vpn_name(vpn_names: List[str]) -> Optional[str]:
    if not vpn_names:
        return None
    if len(vpn_names) == 1:
        return vpn_names[0]
    # pick best match
    prefs = ("HC", "Hennepin County", "Hennepin", "County")
    for p in prefs:
        for name in vpn_names:
            if p.lower() in name.lower():
                return name
    # fallback: first
    return vpn_names[0]


def _apex_reachable(url: str = "https://hprd.co.hennepin.mn.us", timeout: float = 5.0) -> bool:
    try:
        r = requests.get(url, timeout=timeout)
        return r.status_code == 200
    except Exception:
        return False


def connect_to_vpn() -> bool:
    """
    Entry-point used by the app. Never raises; returns False on failure.
    Keeps imports + COM init lazy so the module is safe to import at Django startup.
    """
    if platform.system() != "Windows":
        return True  # Non-Windows environments don't need VPN; don't block app start.

    # If APEX is already reachable, skip VPN
    if _apex_reachable():
        return True

    vpn_names = _list_vpn_names_via_ps()
    vpn_name = _choose_vpn_name(vpn_names)
    if not vpn_name:
        LOG.warning("No VPN connections configured.")
        return False

    ok = _connect_vpn_windows(vpn_name)
    if not ok:
        LOG.warning("Failed to connect to VPN '%s'", vpn_name)
        return False

    # Verify APEX after connect (best effort)
    if _apex_reachable(timeout=8.0):
        return True

    LOG.warning("VPN connected but target still unreachable.")
    return False
