import requests

def get_stream_type(ip):
    """
    Determine the type of stream based on the URL.
    If costar is in the html of the URL, return 'costar'.
    """
    # Open the URL and read the HTML content
    try:
        url = f"http://{ip}/"  # Assuming the URL is an HTTP endpoint
        response = requests.get(url, timeout=10)        
        html_content = response.text
        # Check if 'costar' is in the HTML content
        if 'costar' in html_content.lower():
            return 'costar'
        else:
            return 'supervisor'
    except requests.RequestException as e:
        # Handle any exceptions that occur during the request
        print(f"Error fetching URL {url}: {e}")
        return 'unknown'
    
def get_ip_from_url(url):
    """
    Extract the IP address from a given URL.
    This function assumes the URL is in the format 'rtsp://<ip>:<port>/...'.
    """
    
    
    # Split the URL to extract the IP address
    parts = url.split('/')
    ip_port = parts[2]  # This should be in the format '<ip>:<port>'
    
    # Further split to get just the IP address
    ip = ip_port.split(':')[0]
    
    return ip