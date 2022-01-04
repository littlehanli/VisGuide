import ToolFunc as tool
import Utility
from collections import defaultdict
import json


def wirteFile(fileName,data):
    filePath = 'result/tree_'+fileName+'.json'
    with open(filePath,'a',encoding='utf-8') as f:
        json.dump(data,f,ensure_ascii=False,sort_keys = True, indent = 4)

tool.init()
dataInfos = tool.dataInfos

chart_num = 0
pool = []
temp_tree = defaultdict(lambda:defaultdict(list))

for key,value in dataInfos.items():
    keys = list(value['nominal']) + list(value['temporal'])
    colFeatures = value['colFeatures']

    for curr_vis in value["enumerateVizs"]:
        stack = [curr_vis]
        while len(stack)!=0:
            vis = stack[-1]
            if len(list(vis.filter.keys()))<5:
                for cand_key in keys:
                    if cand_key!=vis.x and cand_key not in vis.filter.keys():
                        for values in colFeatures[cand_key]:
                            temp = tool.getCopyVis(vis,False)
                            temp.filter = defaultdict(list)
                            for par_key,value in vis.filter.items(): 
                                temp.filter[par_key] = value

                            temp.filter[cand_key].append(values)    
                            same_vis,_ = tool.hasSameVis(temp,pool)

                            if not same_vis: #沒出現過，就加進parent 的children 裡
                                temp.pre_vis = vis
                                temp.setVisInfo()
                                temp.euclidean = Utility.Euclidean(vis,temp)
                                pool.append(temp)
                                
                                if len(vis.pilot_children)<5:
                                    temp_tree[vis.index]['children'].append({'index':temp.index,'dist':temp.euclidean})
                                    temp_tree[temp.index]['parent'].append({'index':vis.index,'dist':temp.euclidean})
                                    #vis.pilot_children.append(temp)
                                    #temp.pilot_parents.append(vis)
                                    if not len(list(temp.filter.keys()))==len(keys)-1:
                                        stack.append(temp)
                                else:#選大的child
                                    temp_tree[vis.index]['children'].sort(key = lambda vis:vis["dist"],reverse=True)
                                    if temp.euclidean>temp_tree[vis.index]['children'][-1].euclidean:
                                        temp_tree[vis.index]['children'].pop()
                                        temp_tree[vis.index]['children'].append({'index':temp.index,'dist':temp.euclidean})
                                        temp_tree[temp.index]['parent'].append({'index':vis.index,'dist':vis.euclidean})
                                        if not len(list(temp.filter.keys()))==len(keys)-1:
                                            stack.append(temp)
                                    '''
                                    vis.pilot_children.sort(key = lambda curr_vis:curr_vis.euclidean,reverse=True)
                                    if temp.euclidean>vis.pilot_children[-1].euclidean:
                                        vis.pilot_children.pop()
                                        vis.pilot_children.append(temp)
                                        temp.pilot_parents.append(vis)
                                        stack.append(temp)
                                    '''

                            else: #出現過的話要看是不是合法的parent
                                temp_tree[same_vis.index]['parent'].append({'index':vis.index,'dist':vis.euclidean})
                                temp_tree[same_vis.index]['parent'].sort(key = lambda vis:vis["dist"],reverse=True)
                                most_informative_par_dis = temp_tree[same_vis.index]['parent'][-1]["dist"]
                                temp_tree[same_vis.index]['parent'] = [vis for vis in temp_tree[same_vis.index]['parent'] if vis["dist"] < most_informative_par_dis*1.9]

                                #加children
                                for par in temp_tree[same_vis.index]['parent']:
                                    if vis.index == par["index"]:
                                     temp_tree[vis.index]['children'].append({'index':same_vis.index,'dist':same_vis.euclidean})
                                
                                '''
                                #加parent
                                same_vis.pilot_parents.append(vis)
                                parents = same_vis.pilot_parents
                                parents.sort(key = lambda vis:vis.euclidean,reverse=True)
                                most_informative_par_dis = parents[-1].euclidean
                                parents = [vis for vis in parents if vis.euclidean < most_informative_par_dis*1.9]

                                #加children
                                if vis in parents:
                                    vis.pilot_children.append(temp)
                
                                '''
                stack.pop()
               

print('hihih')

def getInfo(vis):
    return {
        'x':vis.x,
        'y':vis.y,
        'filter':vis.filter,
        'subgroup':vis.subgroup
    }


for key,value in dataInfos.items():
    tree = defaultdict(list)
    charts = defaultdict(dict)
    for curr_vis in value["enumerateVizs"]:
        charts[chart_num] = getInfo(curr_vis)
        tree[chart_num] = []

        S = [curr_vis]
        while(len(S)<7):
            F = [vis.pilot_children for vis in S]
            F.sort(key = lambda vis:vis.euclidean,reverse=True)
            

            S.append(F[0])
            #tree[chart_num].append(chart_num+1)
            #chart_num+=1
            #charts[chart_num] = getInfo(F[0])
            
            for par in F[0].pilot_parents:
                par.remove(F[0])

        
