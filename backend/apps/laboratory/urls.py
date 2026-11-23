from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LaboratoryOrderViewSet, LaboratoryReportViewSet

router = DefaultRouter()
router.register(r'orders', LaboratoryOrderViewSet, basename='lab-orders')
router.register(r'reports', LaboratoryReportViewSet, basename='lab-reports')

urlpatterns = [
    path('', include(router.urls)),
]
