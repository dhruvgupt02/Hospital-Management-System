from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InsurancePolicyViewSet, InsuranceClaimViewSet

router = DefaultRouter()
router.register(r'policies', InsurancePolicyViewSet, basename='insurance-policies')
router.register(r'claims', InsuranceClaimViewSet, basename='insurance-claims')

urlpatterns = [
    path('', include(router.urls)),
]
