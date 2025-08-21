import os
import sys
import logging
import dotenv
from django.conf import settings
from concurrent_log_handler import ConcurrentRotatingFileHandler

# Load environment variables

dotenv.load_dotenv(settings.ENV_PATH)

class Logger:
    """
    Centralized logger class for the entire Django project.
    Provides consistent logging across all apps.
    """
    
    _instance = None
    _initialized = False
    
    def __new__(cls, *args, **kwargs):
        """Singleton pattern to ensure only one logger instance."""
        if cls._instance is None:
            cls._instance = super(Logger, cls).__new__(cls)
        return cls._instance
    
    def __init__(self, base_dir=None):
        """Initialize the logger if not already initialized."""

        self.base_dir = base_dir or os.path.dirname(os.path.abspath(__file__))
        if not self._initialized:
            self._setup_logger()
            # #logger._initialized = True
    
    def _get_log_directory(self):
        # For PyInstaller, create logs relative to the executable location, not the temp extraction path
        try:
            # Try to get the executable's directory (for PyInstaller)
            if hasattr(sys, '_MEIPASS'):
                # Running in PyInstaller bundle - use the directory where the .exe is located
                exe_dir = os.path.dirname(sys.executable)
                log_dir = os.path.join(exe_dir, os.getenv("LOGGER_DIRECTORY", "logs"))
            else:
                # Running in development - use the base_dir approach
                log_dir = os.path.abspath(os.path.join(self.base_dir, "..", os.getenv("LOGGER_DIRECTORY", "logs")))
        except:
            # Fallback: use current working directory
            log_dir = os.path.join(os.getcwd(), os.getenv("LOGGER_DIRECTORY", "logs"))
        
        # Create logs directory safely - only when we actually need to write to it
        try:
            os.makedirs(log_dir, exist_ok=True)
        except (OSError, PermissionError) as e:
            # If we can't create the log directory, fall back to a temp location
            import tempfile
            log_dir = tempfile.gettempdir()
    
        return log_dir

    def _setup_logger(self):
        """Set up the logger with appropriate handlers and formatters."""
        
        
        # Create logger
        self.logger = logging.getLogger('cameravision')
        self.logger.setLevel(logging.DEBUG)
        
        # Remove existing handlers to avoid duplicates
        for handler in self.logger.handlers[:]:
            self.logger.removeHandler(handler)
        
        # Create formatter
        formatter = logging.Formatter(
            '%(asctime)s | %(levelname)-8s | %(name)s | %(funcName)s:%(lineno)d | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        log_dir = self._get_log_directory()
        # File handler for all logs (stored in backend.log)
        try:
            file_handler = ConcurrentRotatingFileHandler(
                os.path.join(log_dir, 'backend.log'),
                maxBytes=10*1024*1024,  # 10MB
                backupCount=5
            )
            file_handler.setLevel(logging.DEBUG)  # Will log DEBUG level and above
            file_handler.setFormatter(formatter)
            self.logger.addHandler(file_handler)
        except (OSError, PermissionError):
            # If file logging fails, fall back to process-specific log file
            import datetime
            pid = os.getpid()
            fallback_log = os.path.join(log_dir, f'backend_{pid}_{datetime.datetime.now().strftime("%Y%m%d_%H%M%S")}.log')
            try:
                fallback_handler = logging.FileHandler(fallback_log)
                fallback_handler.setLevel(logging.DEBUG)
                fallback_handler.setFormatter(formatter)
                self.logger.addHandler(fallback_handler)
            except Exception:
                # If even fallback fails, continue with console only
                pass
    
    def debug(self, message, app_name=None):
        """Log debug level message."""
        self._log(logging.DEBUG, message, app_name)
    
    def info(self, message, app_name=None):
        """Log info level message."""
        self._log(logging.INFO, message, app_name)
    
    def warning(self, message, app_name=None):
        """Log warning level message."""
        self._log(logging.WARNING, message, app_name)
    
    def error(self, message, app_name=None):
        """Log error level message."""
        self._log(logging.ERROR, message, app_name)
    
    def critical(self, message, app_name=None):
        """Log critical level message."""
        self._log(logging.CRITICAL, message, app_name)
    
    def _log(self, level, message, app_name=None):
        """Internal method to handle logging."""
        if app_name:
            message = f"[{app_name.upper()}] {message}"
        log_dir = self._get_log_directory()
        # Ensure log directory exists
        if not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)
        # Get caller information safely
        import inspect
        try:
            frame = inspect.currentframe()
            if frame and frame.f_back and frame.f_back.f_back:
                caller_frame = frame.f_back.f_back
                caller_name = caller_frame.f_code.co_name
                caller_file = os.path.basename(caller_frame.f_code.co_filename)
            else:
                caller_name = "unknown"
                caller_file = "unknown"
        except:
            caller_name = "unknown"
            caller_file = "unknown"
        
        # Create a custom logger name that includes the caller info
        logger_name = f"cameravision.{caller_file}.{caller_name}"
        
        # Get or create logger with the specific name
        caller_logger = logging.getLogger(logger_name)
        caller_logger.setLevel(self.logger.level)
        
        # Add handlers from main logger if they don't exist
        if not caller_logger.handlers:
            for handler in self.logger.handlers:
                caller_logger.addHandler(handler)
        
        caller_logger.log(level, message)

