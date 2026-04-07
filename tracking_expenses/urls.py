from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('tracker.api_urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# In production, serve the React SPA for all non-API routes
if not settings.DEBUG:
    def serve_react(request):
        frontend_index = settings.FRONTEND_DIR / 'index.html'
        with open(frontend_index) as f:
            return HttpResponse(f.read(), content_type='text/html')

    urlpatterns += [
        re_path(r'^(?!api/|admin/|static/).*$', serve_react),
    ]
else:
    # In development, keep the Django template views
    urlpatterns += [
        path('', include('tracker.urls')),
        path('accounts/', include('django.contrib.auth.urls')),
    ]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
