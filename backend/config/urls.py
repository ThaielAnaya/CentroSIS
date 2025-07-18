from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token

router = DefaultRouter()
router.register("students", StudentViewSet)
router.register("classes", ClassViewSet)
router.register("class-options", ClassOptionViewSet)
router.register("price-plans", PricePlanViewSet)
router.register("enrollments", EnrollmentViewSet)
router.register("payments", PaymentViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/', obtain_auth_token),
]
