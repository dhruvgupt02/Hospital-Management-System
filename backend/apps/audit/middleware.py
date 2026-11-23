import threading
import uuid

_thread_locals = threading.local()

def get_current_request():
    return getattr(_thread_locals, 'request', None)

def get_current_user():
    request = get_current_request()
    if request and hasattr(request, 'user') and request.user.is_authenticated:
        return request.user
    return None

def get_current_request_id():
    request = get_current_request()
    if request:
        return getattr(request, 'request_id', None)
    return str(uuid.uuid4())

class AuditRequestMiddleware:
    """
    Middleware that attaches a unique request_id to each incoming request
    and tracks the request in thread-local storage for audit logging.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = request.headers.get('X-Request-ID', str(uuid.uuid4()))
        request.request_id = request_id
        _thread_locals.request = request

        # Extract client IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            request.client_ip = x_forwarded_for.split(',')[0].strip()
        else:
            request.client_ip = request.META.get('REMOTE_ADDR', '127.0.0.1')

        response = self.get_response(request)
        response['X-Request-ID'] = request_id

        # Clean up thread local
        _thread_locals.request = None
        return response
