import Utility
import ToolFunc as tool
import InsightFinding
import time
import numpy as np
import random
from collections import defaultdict

def getNonduplicateVis(rec_cand):
    deleteVis = []

    for i in range(len(rec_cand)):  #TODO 變成tuple減少for迴圈
        for j in range(i+1,len(rec_cand)):
            if rec_cand[i] not in deleteVis and rec_cand[j] not in deleteVis and rec_cand[i].x == rec_cand[j].x and rec_cand[i].y == rec_cand[j].y:
                if Utility.contentImportance(rec_cand[i],rec_cand[j]) <= 0.1:  
                    if rec_cand[i].edgeValue >= rec_cand[j].edgeValue:
                        #del rec_cand[j]
                        deleteVis.append(rec_cand[j])
                    else:
                        #del rec_cand[i]
                        deleteVis.append(rec_cand[i])
                    #getNonduplicateVis(rec_cand)
                    break
    nonDupCand = [vis for vis in rec_cand if vis not in deleteVis]
    return nonDupCand

def getExpandVizs(par_vizs,userSelectedInsight,enumerateVizs,tree_vizs):

    type1_candVizs = [] #放要推薦的候選人，才不會多加到enumerateVizs
    type2_candVizs = []
    expendVizs = [] #新的先放這裡原本的enumerateVizs才不會一直變多
    par_vis = par_vizs[-1]
    if userSelectedInsight == '':
        userSelectedInsight = Utility.default_selected_insight(par_vis)


    for i,vis in enumerate(enumerateVizs):
        if vis not in par_vizs: #如果目前的filter是一樣的才要額外加新的filter
            #if (par_vis.x == par_vis.y and (vis.x!=par_vis.x and vis.y!=par_vis.y)) or (vis.x!=par_vis.x and vis.y==par_vis.y): # 1.pie 2.x,y不同
            if (par_vis.x == par_vis.y and (vis.x!=par_vis.x and vis.y=="invoice_price")) or (vis.x!=par_vis.x and vis.y==par_vis.y): # 1.pie 2.x,y不同
                    # type 1 expand
                    temp = tool.getCopyVis(vis,False)
                    temp.filter = defaultdict(list)
                    for key,value in par_vis.filter.items(): 
                        temp.filter[key] = value
                    temp.filter[par_vis.x].append(userSelectedInsight['key'])    
                    

                    if temp not in type1_candVizs: # 不能跟已有的推薦一樣
                        same_vis,_ = tool.hasSameVis(temp,enumerateVizs)
                        
                        if same_vis==None:
                            temp.par_vis = par_vis
                            temp.pre_vis = Utility.getPrevis(temp,enumerateVizs)
                            temp.insightType = userSelectedInsight['insightType']
                            temp.expandType = '1'

                            temp.setVisInfo()
                            temp.insights = InsightFinding.findExtreme(temp)
                            if temp.insights == None:
                                continue
                            temp.insights.extend(InsightFinding.findDifDistribution(temp,temp.pre_vis))

                            expendVizs.append(temp)
                            type1_candVizs.append(temp)
                        else:
                            same_vis.expandType = "1"
                            same_vis.par_vis = par_vis
                            same_vis.insightType = userSelectedInsight['insightType']
                            type1_candVizs.append(same_vis)
   
            elif vis.x==par_vis.x and vis.y!=par_vis.y: #expand type = 2
                temp = tool.getCopyVis(vis,False)
                temp.filter = par_vis.filter        
                
                if temp not in type2_candVizs + par_vizs + tree_vizs: # 不能跟已有的推薦一樣
                    same_vis,_ = tool.hasSameVis(temp,enumerateVizs)
                    if same_vis==None:
                        temp.par_vis = par_vis
                        temp.pre_vis = Utility.getPrevis(temp,enumerateVizs)
                        temp.insightType = userSelectedInsight['insightType']
                        temp.expandType = '2'

                        temp.setVisInfo()
                        temp.insights = InsightFinding.findExtreme(temp)
                        if temp.insights == None:
                            continue
                        temp.insights.extend(InsightFinding.findDifDistribution(temp,temp.pre_vis))
                            
                            
                        expendVizs.append(temp)
                        type2_candVizs.append(temp)
                    else:
                        same_vis.expandType = '2'
                        #pre_vis = Utility.getPrevis(same_vis,enumerateVizs)
                        if(not same_vis.pre_vis):
                            #same_vis.pre_vis = pre_vis if pre_vis!= None else par_vis
                            same_vis.pre_vis = par_vis
                        same_vis.par_vis = par_vis
                                
                        type2_candVizs.append(same_vis)      

    enumerateVizs.extend(expendVizs)  

    return type1_candVizs,type2_candVizs

 
def getVisRec(par_vizs,userSelectedInsight,enumerateVizs,regressionModel=None,tree_vizs=[]): #return top 10 recommendation []
   
    start=time.time()
    
    type1_rec_cand,type2_rec_cand =  getExpandVizs(par_vizs,userSelectedInsight,enumerateVizs,tree_vizs) 

    #get type1 edge Values
    if len(type1_rec_cand)!=0:
        edgeValues = Utility.edgeValue(type1_rec_cand,regressionModel)
        for i,vis in enumerate(type1_rec_cand):
            vis.edgeValue = edgeValues[i]
        
    #get type2 edge Values
    if len(type2_rec_cand)!=0:
        edgeValues = Utility.edgeValue(type2_rec_cand,regressionModel)
        for i,vis in enumerate(type2_rec_cand):
            vis.edgeValue = edgeValues[i]

    type1_rec_cand.sort(key = lambda curr_vis:curr_vis.edgeValue,reverse=True)
    type2_rec_cand.sort(key = lambda curr_vis:curr_vis.edgeValue,reverse=True)
        

    par_vizs[-1].children['type1'] = type1_rec_cand
    par_vizs[-1].children['type2'] = type2_rec_cand

    end = time.time()
    print('getVisRec : ' + str(end-start))
    return type1_rec_cand,type2_rec_cand

    
       