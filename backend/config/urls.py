from django.contrib import admin
from django.urls import include, path
from core.views import StudentViewSet, ClassViewSet, ClassOptionViewSet, EnrollmentViewSet, PaymentViewSet, PaymentListViewSet
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token

router = DefaultRouter()
router.register(r"students", StudentViewSet, basename="students")
router.register(r"classes", ClassViewSet, basename="classes")
router.register(r"class-options", ClassOptionViewSet, basename="class-options")
router.register(r"enrollments", EnrollmentViewSet, basename="enrollments")
router.register(r"payments", PaymentViewSet, basename="payments")
router.register(r"payments-simple", PaymentListViewSet, basename="payments-simple",)

urlpatterns = [
    path('nested_admin/', include("nested_admin.urls")),
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/', obtain_auth_token),
]
