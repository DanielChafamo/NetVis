from django.shortcuts import render
from django.http import JsonResponse
from django.conf import settings
from django.views.decorators.clickjacking import xframe_options_exempt
import json
import os


@xframe_options_exempt
def Graph(request):
    fsource = os.path.join(settings.STATIC_ROOT, 'graphs/js/filter_feats.json')
    context = {'feats': json.dumps(json.load(open(fsource))),
               'initial': request.GET.get('initial', -1)}
    return render(request, 'graphs/graph.html', context=context)


@xframe_options_exempt
def Explore(request):
    fsource = os.path.join(settings.STATIC_ROOT, 'graphs/js/filter_feats.json')
    context = {'feats': json.dumps(json.load(open(fsource)))}
    return render(request, 'graphs/explore.html', context=context)


@xframe_options_exempt
def Grid(request):
    fsource = os.path.join(settings.STATIC_ROOT, 'graphs/js/filter_feats.json')
    feats = json.load(open(fsource))

    context = {
        'feats': json.dumps(feats),
        'study_id': [int(s_id) for s_id in feats["study_id"]]
    }
    return render(request, 'graphs/grid.html', context=context)


@xframe_options_exempt
def About(request):
    return render(request, 'graphs/about.html')


@xframe_options_exempt
def LoadJsoNet(request):
    pid = request.GET.get('pid', None)
    source = os.path.join(settings.STATIC_ROOT, 'graphs/js/jsoNets/{}_'.format(pid))
    context = {'g{}'.format(i): json.dumps(json.load(open(source + '{}m_graph.json'.format(i)))) for i in [0, 3, 6]}
    return JsonResponse(context)
