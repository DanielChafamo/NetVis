from django.shortcuts import render
from django.http import JsonResponse
from django.conf import settings
import json
import os


num_patients = 139
all_data = {}
for pid in range(1, num_patients + 1):
    source = os.path.join(settings.STATIC_ROOT, 'graphs/js/jsoNets/{}_'.format(pid))
    all_data[pid] = {'g{}'.format(i): json.dumps(json.load(open(source + '{}m_graph.json'.format(i)))) for i in [0, 3, 6]}

# Create your views here.
def Graph(request):
    fsource = os.path.join(settings.STATIC_ROOT, 'graphs/js/filter_feats.json')
    context = {'feats': json.dumps(json.load(open(fsource))),
               'initial': request.GET.get('initial', -1)}
    return render(request, 'graphs/graph.html', context=context)


def Explore(request):
    fsource = os.path.join(settings.STATIC_ROOT, 'graphs/js/filter_feats.json')
    context = {'feats': json.dumps(json.load(open(fsource)))}
    return render(request, 'graphs/explore.html', context=context)


def Grid(request):
    fsource = os.path.join(settings.STATIC_ROOT, 'graphs/js/filter_feats.json')
    feats = json.load(open(fsource))

    context = {
        'feats': json.dumps(feats),
        'study_id': [int(s_id) for s_id in feats["study_id"]],
        'all_data': json.dumps(all_data)
    }
    return render(request, 'graphs/grid.html', context=context)


def About(request):
    return render(request, 'graphs/about.html')


def LoadJsoNet(request):
    pid = request.GET.get('pid', None)
    source = os.path.join(settings.STATIC_ROOT, 'graphs/js/jsoNets/{}_'.format(pid))
    context = {'g{}'.format(i): json.dumps(json.load(open(source + '{}m_graph.json'.format(i)))) for i in [0, 3, 6]}
    return JsonResponse(context)
