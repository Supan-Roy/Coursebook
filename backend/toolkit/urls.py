from django.urls import path
from . import views

urlpatterns = [
    path('document-to-pdf/', views.DocumentToPDFView.as_view(), name='document-to-pdf'),
    path('images-to-pdf/', views.ImagesToPDFView.as_view(), name='images-to-pdf'),
    path('add-page-numbers/', views.AddPageNumbersView.as_view(), name='add-page-numbers'),
    path('merge-pdfs/', views.MergePDFsView.as_view(), name='merge-pdfs'),
    path('split-pdfs/', views.SplitPDFView.as_view(), name='split-pdfs'),
    path('lock-pdf/', views.LockPDFView.as_view(), name='lock-pdf'),
    path('unlock-pdf/', views.UnlockPDFView.as_view(), name='unlock-pdf'),
    path('compress-pdf/', views.CompressPDFView.as_view(), name='compress-pdf'),
    path('watermark-pdf/', views.WatermarkPDFView.as_view(), name='watermark-pdf'),
    path('edit-pdf/', views.EditPDFView.as_view(), name='edit-pdf'),
    path('supported-formats/', views.SupportedFormatsView.as_view(), name='supported-formats'),
]
