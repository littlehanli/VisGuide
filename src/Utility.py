import InsightFinding
from ToolFunc import columnEncoding,save_data,read_data
import ToolFunc as tool

import pickle
from itertools import chain
import math
import operator
import numpy as np
import random

from scipy.stats import pearsonr
from scipy.spatial.distance import jensenshannon
from scipy.spatial.distance import euclidean

from sklearn import linear_model
from sklearn.preprocessing import OneHotEncoder


def getPrevis(curr_vis,enumerateVizs):
    if curr_vis.expandType == '2':
        pass
    else: 
        if len(curr_vis.filter)!=0:
            for vis in enumerateVizs:
                if len(vis.filter) == 0 and vis.x == curr_vis.x and vis.y == curr_vis.y and vis.z == curr_vis.z:
                    return vis
    return None

def edgeValue(rec_cand,regressionModel=None):
    for curr_vis in rec_cand:
        setVisFeature(curr_vis) 
    features = list(map(lambda vis:list(chain(*list(vis.features.values()))),rec_cand)) 

    if regressionModel == None:
        # same fixed weight to features
        edgeValues = [sum(feature) for feature in features]
        return edgeValues
    else:
        if len(list(regressionModel.coef_)) != len(features[0]): 
            weights = list(regressionModel.coef_)[:6]
            weights.extend([0.1 for i in range(len(features[0])-6)])
            edgeValues = [sum(map(operator.mul,weights,feature)) for feature in features]
        else:
            edgeValues = regressionModel.predict(features)
        return edgeValues
    
def default_selected_insight(curr_vis):
    for insight in curr_vis.insights:
            if insight['insightType']=='max':
                return insight
                

def setVisFeature(curr_vis,isRoot=False):
    if isRoot:
        curr_vis.features['IS'] = [insightSig(curr_vis)]    
        curr_vis.features['IG'] = [0]
        curr_vis.features['expandType'] = [0,0,0]
        curr_vis.features['expandConsis'] = [0]
        curr_vis.features['X_encodingType'] = encodingType(curr_vis,curr_vis.par_vis,'x')
        curr_vis.features['Y_encodingType'] = encodingType(curr_vis,curr_vis.par_vis,'y')
    else:
        curr_vis.features['IS'] = [insightSig(curr_vis)]    
        curr_vis.features['IG'] = [infoGain(curr_vis,curr_vis.pre_vis)]
        curr_vis.features['expandType'] = expandType(curr_vis,curr_vis.par_vis)
        curr_vis.features['expandConsis'] = [expandConsis(curr_vis)]
        curr_vis.features['X_encodingType'] = encodingType(curr_vis,curr_vis.par_vis,'x')
        curr_vis.features['Y_encodingType'] = encodingType(curr_vis,curr_vis.par_vis,'y')
        curr_vis.euclidean = Euclidean(curr_vis,curr_vis.pre_vis)


########## chart feature #############
def insightSig(curr_vis):
    sigs = [insight['sig'] for insight in curr_vis.insights]
    return 1-min(sigs)

def infoGain(curr_vis,pre_vis):
    ### KL divergence , 越大越好
    try:
        curr_subgroup = curr_vis.subgroup
        pre_subgroup = pre_vis.subgroup

        curr_values = list(curr_subgroup.values())
        pre_values = [pre_subgroup[key] for key in curr_subgroup.keys()]

        dist = jensenshannon(curr_values, pre_values ,2) # do normalize to the distribution # bound (0,1)
    except:
        return 0.0
    return dist

def expandType(curr_vis,par_vis):

    dataInfos = tool.dataInfos
    curr_data = tool.curr_data 
    hierarchy = dataInfos[curr_data]['hierarchy']
    # hierarchy = {'city': {'station': 'drill_down'}, 'station': {'city': 'roll_up'}, 'year': {'month': 'drill_down'}, 'month': {'year': 'roll_up', 'day': 'drill_down', 'weekDay': 'drill_down'}, 'day': {'month': 'roll_up'}, 'weekDay': {'month': 'roll_up'}}
    expand2Type = dataInfos[curr_data]['expand2Type']
    # expand2Type = {'': [0, 0, 0], 'drill_down': [1, 0, 0], 'roll_up': [0, 1, 0], 'comparison': [0, 0, 1]}

    if curr_vis.expandType=='1':  # drill down 
        try:
            curr_expand_type = hierarchy[curr_vis.x][par_vis.x]
        except:
            curr_expand_type = ''
        
        return expand2Type[curr_expand_type]
    elif curr_vis.expandType=='2':  #comparison

        return expand2Type['comparison']
    else:
        return expand2Type['']
 

def expandConsis(curr_vis):
    curr_expand_type = curr_vis.features['expandType']
    has_par = True
    totalEdges = 0
    match = 0
    
    while(has_par):
        if curr_vis.par_vis != None:
            #print("consis par.y: ",curr_vis.par_vis.y)
            if curr_vis.par_vis.features['expandType'] == curr_expand_type:
                match+=1       
            totalEdges += 1 
            curr_vis = curr_vis.par_vis
        else:
            has_par = False
    return match / totalEdges if totalEdges !=0 else 1

def encodingType(curr_vis,par_vis,channel):
    dataInfos = tool.dataInfos
    curr_data = tool.curr_data

    encoding2Type = dataInfos[curr_data]['encoding2Type']
    # dict_keys(['', 'NO2(ppb)', 'O3(ppb)', 'PM2.5(ug/m3)', 'SO2(ppb)', 'city', 'day', 'month', 'station', 'weekDay', 'year'])

    if par_vis == None:
        return encoding2Type['']
    else:
        if channel=='x':
            #print("encoding2Type_X",par_vis.x,curr_vis.x)
            return encoding2Type[par_vis.x][curr_vis.x]  
        else:
            #print("encoding2Type_Y",par_vis.y,curr_vis.y)
            return encoding2Type[par_vis.y][curr_vis.y]  

def Euclidean(curr_vis,pre_vis):
    ### euclidean
    try:
        curr_subgroup = curr_vis.subgroup
        pre_subgroup = pre_vis.subgroup

        curr_values = list(curr_subgroup.values())
        pre_values = [pre_subgroup[key] for key in curr_subgroup.keys()]

        dist = euclidean(np.array(curr_values),np.array(pre_values))
       
    except:
        return 0.0
    return dist
    
def contentImportance(curr_vis,pre_vis): #correlation #改成3col 也可以算的
    #算兩個Vis的分布相似程度
    
    curr_subgroup = curr_vis.subgroup
    pre_subgroup = pre_vis.subgroup

    curr_values = list(curr_subgroup.values())
    pre_values = [pre_subgroup[key] for key in curr_subgroup.keys() if key in pre_subgroup]
    
    
    if len(curr_values) == len(pre_values):
        G = sum(curr_values)
        curr_pd = list(map(lambda x : x/G if G!=0 else 0,curr_values)) #normalize to 0-1
        
        G = sum(pre_values)
        pre_pd = list(map(lambda x : x/G if G!=0 else 0,pre_values))

        corr, p_value = pearsonr(curr_pd, pre_pd)
        dist = 1-abs(corr)
        
    else:
        dist = 1.0
    
    return dist 

def one_hot_encoding(train_X): #train_X : list 
    X =  np.reshape(train_X, (len(train_X), len(train_X[0])))
    
    onehotencoder = OneHotEncoder(categorical_features = [3,4])
    ohe_X = onehotencoder.fit_transform(X).toarray()
    return ohe_X

def trainRegression(train_X,train_y,model,init_model_option):
    X =  np.reshape(train_X, (len(train_X), len(train_X[0])))
    y = np.array(train_y)
    print(init_model_option)
    
    if init_model_option == "scratch":
        print("From scratch init model , len (y) = " , len(y))
        regressionModel = linear_model.SGDRegressor(max_iter=1000, tol=1e-3,warm_start=True).fit(X, y) 
        init_model_option = ""

    elif init_model_option == "transfer":
        regressionModel = linear_model.SGDRegressor(max_iter=1000, tol=1e-3,warm_start=True).fit(X, y)
        init_model_option = ""

        # transfer first 5 features        
        pre_weight_len = 4
        coef_old = list(model.coef_)
        coef_new = list(regressionModel.coef_)
        coef = coef_old [:pre_weight_len]
        coef.extend([0]*(len(coef_new)-pre_weight_len))
        regressionModel.coef_ = np.array(coef)
        
        print('new_coef:',len(regressionModel.coef_))
        print('old_coef:',len(model.coef_))
        print('Init Transfer model, len (y) = ', len(y))

    else:
        print('Train regression, len (y) = ', len(y))
        regressionModel = model.fit(X, y) 
        
    return regressionModel,init_model_option


def getDecayingLabel(train_y):
    #train_y = [[],[],[]...]
    #只留前5個
    duration = 5 
    decay_rate = 0.9
    threshold = len(train_y) - duration
    result = []

    for i,labels in enumerate(train_y):
        diff = i-threshold
        if diff<0:
            result.extend(list(map(lambda label:label * math.pow(decay_rate,abs(diff)),labels)))
        else:
            result.extend(labels)
    return result

def getUserSelectedInsight(vis,insight_key): 
    for insight in vis.insights:
        if str(insight['key']) == str(insight_key):
            return insight
    return None
    
def getAllParVis(curr_vis):
    result = [curr_vis]
    has_par = True

    while(has_par):
        if curr_vis.par_vis and curr_vis.par_vis!=None:
            result.insert(0,curr_vis.par_vis)       
            curr_vis = curr_vis.par_vis
        else:
            has_par = False

    return result


