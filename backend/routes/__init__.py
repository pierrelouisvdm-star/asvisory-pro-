from routes.auth import router as auth_router
from routes.clients import router as clients_router
from routes.calculations import router as calculations_router

__all__ = ["auth_router", "clients_router", "calculations_router"]
