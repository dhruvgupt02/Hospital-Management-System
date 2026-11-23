from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DoctorViewSet, DoctorAvailabilityViewSet

router = DefaultRouter()
router.register(r'schedules', DoctorAvailabilityViewSet, basename='doctor-schedules')
router.register(r'', DoctorViewSet, basename='doctors')

urlpatterns = [
    path('', include(router.urls)),
]
