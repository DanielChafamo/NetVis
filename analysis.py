import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import networkx as nx
import json

df = pd.read_csv('data/FOR_ANALYSIS.csv')
idx = np.zeros(201)
ids = df[df['complete_study']=='Yes']['study_id']
idx[ids] = 1
df_comp = df[[bool(idx[sid]) for sid in df['study_id']]]

df_comp_1m = df_comp[df_comp['Assmnt'] == 'Enrollment']
df_comp_2m = df_comp[df_comp['Assmnt'] == 'Three month survey']
df_comp_3m = df_comp[df_comp['Assmnt'] == 'Six month survey']

df_comp = np.vstack([df_comp_1m, df_comp_2m, df_comp_3m] ).reshape(3, 139, 127)
names = np.hstack((df_comp[0].T[33:43].T, df_comp[1].T[53:63].T,df_comp[2].T[53:63].T)).reshape(139,3,10)
connections = np.load('data/036matrix.npy')
compconns = connections[np.vectorize(bool)(idx[1:])]
names = np.array([lst[~pd.isnull(lst)] for lst in names.reshape(-1,10)]).reshape(-1,3)
net = np.array([al.T for al in np.hstack((names, compconns)).reshape(139, 2, 3)])
for i in range(len(net)):
    for j in range(3):
        net[i][j][0] = np.insert(net[i][j][0], 0, 'Ego')

G = nx.from_numpy_matrix(net[-5][2][1]) 
nx.draw(G, with_labels=True, node_size=1500, node_color="skyblue", pos=nx.fruchterman_reingold_layout(G))

def extract_master_matrix(entry):
    all_names = list(reduce(lambda a,b: a|set(b), entry[:,0], set()))
    name_indices = {all_names[i] : i for i in range(len(all_names))}
    master = np.zeros((3, len(all_names), len(all_names)))
    for i in range(3):
        for j in range(len(entry[i][1])):
            for k in range(len(entry[i][1])):
                master[i][name_indices[entry[i][0][j]], name_indices[entry[i][0][k]]] = entry[i][1][j,k]
    return (master, all_names)


names = np.empty([net.shape[0]], dtype=np.dtype('O'))
master_net = np.empty([net.shape[0]], dtype=np.dtype('O'))
for ix in range(len(net)):
    netix, name = extract_master_matrix(net[ix])
    master_net[ix] = netix
    names[ix] = name
    

def drawNet(pid, month, axis=None, layout=nx.fruchterman_reingold_layout):
    # Collecting data
    if not axis:
        fig = plt.figure(figsize=(6,4))
        axis = fig.add_subplot(111)
    netmatrix, labels = master_net[pid][month], names[pid]
    G = nx.from_numpy_matrix(netmatrix)

    # MAIN PLOT
    nx.draw(G, with_labels=True, 
            labels={i:labels[i] for i in range(len(labels))},
            node_size=1000, node_color="skyblue", 
            pos=layout(G),
            ax=axis)

def jsoNet(pid, month):
    netmatrix, labels = master_net[pid][month], names[pid]
    G = nx.from_numpy_matrix(netmatrix)

    # Generating Features
    for ix,deg in G.degree():
        G.node[ix]['degree'] = deg

    for nid in G.nodes():
        G.node[nid]['name'] = labels[nid]

    # Writing to json file
    base_dir = 'NetVis/Graphs/static/graphs/js/jsoNets/'
    with open(base_dir + '{}_{}m_graph.json'.format(pid + 1, month*3), 'w') as f:
        json.dump(nx.readwrite.json_graph.node_link_data(G), f, indent=4) 
    
# for i in range(master_net.shape[0]):
#     for j in range(3):
#         jsoNet(i, j)


# processing features
feats = ['study_id', 
         'density', 
         'constraint', 
         'kin_prop', 
         'turnover.rate', 
         'network.size',
         'PhyFunc_TScore',
         'SocialSat_TScore',
         'stroke_prop',
         'smoking_prop',
         'no_exercise_prop']


filtering_data = {}
for feat in feats:
    im = (feat in ['turnover.rate', 'PhyFunc_TScore', 'SocialSat_TScore'])
    filtering_data[feat] = list(df_comp[im:,:,list(df.columns).index(feat)].T.mean(axis=1))

with open('filter_feats.json', 'w') as fp:
     json.dump(filtering_data, fp, indent=4)

































