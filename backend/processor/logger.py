import os
import logging
import logging.handlers
from django.conf import settings
import dotenv
dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), '../.hc_to_app_env'))

class Logger:
    """
    Centralized logger class for the entire Django project.
    Provides consistent logging across all apps.
    """
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        """Singleton pattern to ensure only one logger instance."""
        if cls._instance is None:
            cls._instance = super(Logger, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize the logger if not already initialized."""
        if not self._initialized:
            self._setup_logger()
            Logger._initialized = True
    
    def _setup_logger(self):
        """Set up the logger with appropriate handlers and formatters."""
        # Create logs directory
        log_dir = os.path.join(settings.BASE_DIR, os.getenv("LOGGER_DIRECTORY", "logs"))
        os.makedirs(log_dir, exist_ok=True)
        
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
        
        # File handler for all logs (stored in backend.log)
        file_handler = logging.handlers.RotatingFileHandler(
            os.path.join(log_dir, 'backend.log'),
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        file_handler.setLevel(logging.DEBUG)  # Will log DEBUG level and above
        file_handler.setFormatter(formatter)
        self.logger.addHandler(file_handler)
    
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

