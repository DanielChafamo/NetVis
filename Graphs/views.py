from django.shortcuts import render
from django.http import JsonResponse
from django.conf import settings
import json
import os


# BASE_DIR = os.path.dirname(os.path.dirname(__file__))
# REPOSITORY_ROOT = os.path.dirname(BASE_DIR)
# STATIC_ROOT = os.path.join(REPOSITORY_ROOT, 'NetVis/Graphs/static/')


# Create your views here.
def Graph(request): 
  fsource = os.path.join(settings.STATIC_ROOT,'graphs/js/filter_feats.json')
  context = {'feats': json.dumps(json.load(open(fsource)) ),
             'initial': request.GET.get('initial', -1)} 
  return render(request, 'graphs/graph.html', context=context)


def Index(request): 
  fsource = os.path.join(settings.STATIC_ROOT,'graphs/js/filter_feats.json')
  context={'feats':json.dumps(json.load(open(fsource)) )}
  return render(request, 'graphs/index.html', context=context)


def LoadJsoNet(request):
  pid = request.GET.get('pid', None)
  source = os.path.join(settings.STATIC_ROOT,'graphs/js/jsoNets/{}_'.format(pid))
  context = {'g{}'.format(i): json.dumps(json.load(open(source+'{}m_graph.json'.format(i)))) for i in [0,3,6]}
  return JsonResponse(context)