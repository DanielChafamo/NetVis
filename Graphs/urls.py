
from django.contrib import admin 
from django.urls import include, path
from django.conf.urls import url
from Graphs import views

urlpatterns = [
    url(r'^$', views.Index, name='Index'),
    url(r'^about/$', views.About, name='About'),
    url(r'^graphs/$', views.Graph, name='Graph'),
    url(r'^jsonet/$', views.LoadJsoNet, name='LoadJsoNet'),
] 
