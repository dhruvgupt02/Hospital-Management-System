from django.urls import path
from .views import AuditLogListView, DashboardAnalyticsView

urlpatterns = [
    path('logs/', AuditLogListView.as_view(), name='audit-logs'),
    path('analytics/', DashboardAnalyticsView.as_view(), name='dashboard-analytics'),
]
