from flask import Flask,request,flash,jsonify,make_response
import json
import random
from itertools import chain
import ToolFunc as tool
import VisRecommendation
import Utility

tool.init() # read data,calculate data informations
dataInfos = tool.dataInfos

train_X = []
train_y = []
model = None
init_model_option = "" # scratch, pretrain, transfer, heuristic
init = True  #是否為新user

#set init vis feature
for dataName,dataInfo in dataInfos.items():
    #print(len(dataInfo['enumerateVizs']))
    for vis in dataInfo['enumerateVizs']:
        #print(vis.x,vis.y)
        tool.curr_data = dataName
        Utility.setVisFeature(vis,True)


def getInitChart(rootVizs,x,y):
    print("---server/getInitChart")
    vis = None

    for vis in rootVizs:
        if vis.x==x and vis.y==y:
            vis.par_vis = None
            return vis                    
    return None

def getChartData(vis,index=None,rank = 0):
    print("---server/getChartData")
    global enumerateVizs
    
    if not index:
        _,chart_index = tool.hasSameVis(vis,enumerateVizs)
    else:
        chart_index = index

    if vis.x in tool.dataInfos[tool.curr_data]['nominal']:
        sorted_group = dict(sorted(vis.subgroup.items(),key=lambda x : x[1],reverse=True))
        # {'Chiayi City': 32.45753424657534, 'Kinmen': 32.24033149171271, ......}
    else:
        sorted_group = vis.subgroup
        # {'Mon': 24.73288900281979, 'Tue': 26.68756397134084, ......}
    values = list(map(lambda value:round(value,2),list(sorted_group.values())))
    keys = list(sorted_group.keys())
    label = 'Overall' if len(vis.filter) == 0 else ', '.join([key+':'+','.join(list(map(lambda value:str(value) if value!="" else "none",value))) for key,value in vis.filter.items()])

    data = {
        'x':vis.x,
        'y':vis.y + '(' + vis.y_aggre+')' if vis.y!=vis.x else "percentage of count",
        'y_glo_aggre':vis.globalAggre,
        'type':vis.mark,
        'labels':keys,
        'datas':[
            {
                'data':values,
                'label':label,      
            },
        ],
        'chart_index': chart_index,
        'label':0,
        'rank':rank,
        'otherInfo':{},
        'rec':{},
        'is_selected':False,
        'insights': {insight["key"]:insight["insightType"] for insight in vis.insights},
        'filters':vis.filter,           
        'expandType': vis.expandType,
        'aggre':vis.y_aggre,
        'sort':'desc',
        'multiple_yAxes':False

    }
    
    if vis.pre_vis and vis.x == vis.pre_vis.x and vis.y == vis.pre_vis.y:
        data["multiple_yAxes"] = True
        data['datas'].append({
            'data': list(map(lambda value: round(value,2),[vis.pre_vis.subgroup[key] for key in keys])),
            'label' : 'Overall'            
        })
    #print(data)
    return data

def changeData(dataset_name,get_data=None):
    print("---server/changeData")
    global model,dataInfos,train_X,train_y,enumerateVizs,rootVizs
    # store current model

    #store information
    if get_data!=None and len(list(get_data.keys()))>3:
        print('save info')
        save_data = {key:value for key,value in get_data.items() if key!='dataset_name'}
        
        tool.wirteFile(save_data["store_dataset"],save_data)

        print('save curr model:',tool.curr_data)
        tool.save_data(model,save_data["store_dataset"])

        print('save training data:')
        tool.save_training_data(train_X,'train_X')
        tool.save_training_data(train_y,'train_y')

    #reset information
    tool.curr_data = dataset_name
    enumerateVizs = dataInfos[tool.curr_data]['enumerateVizs'] # get all column combination of the VisrootVizs = [vis for vis in enumerateVizs if len(vis.filter)==0]    
    rootVizs = dataInfos[tool.curr_data]['rootVizs']
    train_X = []
    train_y = []
    #cross_init = True


app = Flask(__name__)

@app.route('/get_datasets',methods=['GET','POST'])
def get_datasets():
    print("---server/get_datasets")
    if request.method == 'POST':
        datasets= [{"name":key} for key in list(dataInfos.keys())]
        # [{'name': 'AQ'}, {'name': 'Transaction'}, {'name': 'YT'}, {'name': 'Covid'}]
        
    rst = jsonify(datasets)   
    rst.headers.add('Access-Control-Allow-Origin', '*')

    return rst,200

@app.route('/get_options',methods=['GET','POST'])
def get_options():
    print("---server/get_options")
    global enumerateVizs,dataInfos,rootVizs,model,train_X,train_y,init,init_model_option
    if request.method == 'POST':
        get_data = json.loads(request.get_data())
        dataset_name = get_data['dataset_name']
        
        
        if init : 
            # Init model if a new user come
            tool.curr_data = dataset_name
            init_model_option = get_data['init_model_option']

            if init_model_option == "scratch":
                print('Model from scratch: ',tool.curr_data)
                model = None

            elif init_model_option == "pretrain":
                print("Model from pretrain: " ,tool.curr_data)
                model = tool.read_data('AQ_pretrain') if tool.curr_data=="AQ"\
                    else tool.read_data('Transaction_pretrain') if tool.curr_data== "Transaction"\
                    else None
                
            elif init_model_option == "heuristic":
                print("Model from heuristic(no model): " ,tool.curr_data)
                model = None
            
            else:
                print("Unknown model status")
                model = None
 
            enumerateVizs = dataInfos[tool.curr_data]['enumerateVizs'] # get all column combination of the VisrootVizs = [vis for vis in enumerateVizs if len(vis.filter)==0]    
            rootVizs = dataInfos[tool.curr_data]['rootVizs']

            init = False
        
        else:
            # change dataset with the same user
            if dataset_name!=tool.curr_data or init_model_option == "transfer":
                print("Model from transfer: " ,tool.curr_data)

                # set model option 
                init_model_option = "transfer"
                changeData(dataset_name,get_data)
        

        #set column options
        data_info = tool.dataInfos[dataset_name]
        data = {}
        data['x_axis'] = [{'name':column}for column in list(data_info['nominal'])]
        data['x_axis'].extend([{'name':column}for column in list(data_info['temporal'])])
        data['y_axis'] = [{'name':column}for column in list(data_info['quantitative'])]
        data['x_default'] = data_info['x_default']
        data['y_default'] = data_info['y_default']
    
    rst = jsonify(data)   
    rst.headers.add('Access-Control-Allow-Origin', '*')

    return rst,200


@app.route('/get_init_chart',methods=['GET','POST'])
def get_init_chart():
    print("---server/get_init_chart")
    global rootVizs
    if request.method == 'POST':
        get_data = json.loads(request.get_data())
        vis = getInitChart(rootVizs,get_data['x'],get_data['y'])
        data = getChartData(vis)
    
    rst = jsonify(data)   
    rst.headers.add('Access-Control-Allow-Origin', '*')
    

    return rst,200

@app.route('/update_tr_data',methods=['GET','POST'])
def update_tr_data():
    print("---server/update_tr_data")
    data = {"update":False}

    if request.method == 'POST':
        get_data = json.loads(request.get_data())
        
        visLabeled = [enumerateVizs[int(key)] for key in get_data['label_data'].keys()]
        train_X.extend(list(map(lambda vis : list(chain(*list(vis.features.values()))),visLabeled)))
        train_y.append(list(map(lambda y:float(y),list(get_data['label_data'].values()))))
        print("update training data, len(x) = " + str(len(train_X)))
        data["update"] = True

    rst = jsonify(data)   
    rst.headers.add('Access-Control-Allow-Origin', '*')
    
    return rst,200

@app.route('/get_vis_rec',methods=['GET','POST'])
def get_vis_rec():
    print("---server/get_vis_rec")
    global enumerateVizs,model,train_X,train_y,init_model_option
    data = {}
    
    if request.method == 'POST':
        get_data = json.loads(request.get_data())
        tree_vizs =[enumerateVizs[int(index)] for index in get_data["chart_indices"]]  # vis index of chart in the tree view
        userSelectedVis = enumerateVizs[int(get_data['chart_index'])]
        par_vizs = Utility.getAllParVis(userSelectedVis)
        userSelectedInsight = Utility.getUserSelectedInsight(userSelectedVis,get_data['click_item'])

        if not userSelectedInsight:
                userSelectedInsight={}
                userSelectedInsight['insightType'] = 'none',
                userSelectedInsight['key'] = get_data['click_item']
        
        if init_model_option != "heuristic":
            # no need to train model if the model option == heuristic 
            # train model based on the label_data

            if init_model_option == "transfer":
                train_X.extend([list(chain(*list(userSelectedVis.features.values())))])
                train_y = [[0.0]]
                decay_labels = [0.0]
                print('cross init feature length:',len(list(chain(*list(userSelectedVis.features.values())))))

                model,init_model_option = Utility.trainRegression(train_X,decay_labels,model,init_model_option)
            elif (len(get_data['label_data'])>1):
                #get training data
                visLabeled = [enumerateVizs[int(key)] for key in get_data['label_data'].keys()]        
                train_X.extend(list(map(lambda vis : list(chain(*list(vis.features.values()))),visLabeled)))
                train_y.append(list(map(lambda y:float(y),list(get_data['label_data'].values()))))
                decay_labels = Utility.getDecayingLabel(train_y)

                #train model
                model,init_model_option = Utility.trainRegression(train_X,decay_labels,model,init_model_option)
            
        #get rec based on the regression model
        type1_visRec,type2_visRec = VisRecommendation.getVisRec(par_vizs,userSelectedInsight,enumerateVizs,model,tree_vizs)
        
        # Store vis rec for result analysis
        #tool.save_dill(type1_visRec,'candVis\\type1_visRec')
        #tool.save_dill(type2_visRec,'candVis\\type2_visRec')


        data['type1'] = [getChartData(vis,rank=i+1) for i,vis in enumerate(type1_visRec)]
        data['type2'] = [getChartData(vis,rank=i+1) for i,vis in enumerate(type2_visRec)]

    rst = jsonify(data)   
    rst.headers.add('Access-Control-Allow-Origin', '*')
    
    return rst,200

@app.route('/get_chart_by_index',methods=['GET','POST'])
def get_chart_by_index():
    print("---server/get_chart_by_index")
    global enumerateVizs
    if request.method == 'POST':
        get_data = json.loads(request.get_data())
        chart_index = int(get_data['chart_index'])
        data = getChartData(enumerateVizs[chart_index],chart_index)
    
    rst = jsonify(data)   
    rst.headers.add('Access-Control-Allow-Origin', '*')

    return rst,200

@app.route('/get_new_data',methods=['GET','POST'])
def get_new_data():
    print("---server/get_new_data")
    global enumerateVizs,dataInfos
    data = {}
    if request.method == 'POST':
        get_data = json.loads(request.get_data())
        chart_index = int(get_data['chart_index'])
        aggre = get_data['aggre']
        sort = get_data['sort']
        vis = enumerateVizs[chart_index]

        # new aggre
        data["y"] = vis.y + '(' + aggre+')' if vis.y!=vis.x else "percentage of count",

        # new sorted_group
        data["datas"] = []
        
        ### subset
        subgroup = vis.getSubgroup(aggre) if (vis.x != vis.y) else vis.subgroup
        
        # sorted based on the sort option
        sorted_group = subgroup
        if vis.x in tool.dataInfos[tool.curr_data]['nominal']:
            if sort == "desc":
                sorted_group = dict(sorted(subgroup.items(),key=lambda x : x[1],reverse=True))
            elif sort == "asc":
                sorted_group = dict(sorted(subgroup.items(),key=lambda x : x[1]))
      

        data["datas"].append(list(map(lambda value:round(value,2),list(sorted_group.values()))))
        
        # sorted labels
        labels = list(sorted_group.keys())
        data["labels"] = labels

        ### overall
        if vis.pre_vis and vis.x == vis.pre_vis.x and vis.y == vis.pre_vis.y:
            pre_subgroup = vis.pre_vis.getSubgroup(aggre) if (vis.x != vis.y) else vis.pre_vis.subgroup
            data["datas"].append(list(map(lambda value: round(value,2),[pre_subgroup[key] for key in labels])))
            
        # new insight
    
    rst = jsonify(data)   
    rst.headers.add('Access-Control-Allow-Origin', '*')

    return rst,200


@app.route('/update_dataset',methods=['GET','POST'])
def update_dataset():
    print("---server/update_dataset")
    if request.method == 'POST':
        get_data = json.loads(request.get_data())
        dataset_name = get_data['dataset_name']
        changeData(dataset_name)
    
    data ={}
    rst = jsonify(data)   
    rst.headers.add('Access-Control-Allow-Origin', '*')
    return rst,200

@app.route('/get_seq_data',methods=['GET','POST'])
def get_seq_data():
    print("---server/get_seq_data")
    if request.method == 'POST':
        get_data = json.loads(request.get_data())
        data = get_data['data']
        
        if len(data)>0:
            node = {
                #############Tammy Update####################
                #'innerHTML': list(data.keys())[0],
                'innerHTML':"root",
                'pseudo': True,
            }
            stacks = [node]

            while(stacks):
                curr = stacks[-1]
                stacks.pop()
                
                if len(data[curr['innerHTML']])>0:
                    curr['connectors'] = {
                        "style":{
                            "stroke-width": 0.0
                        }
                    }
                    curr['children'] = [{'innerHTML':child} for child in data[curr['innerHTML']]]
                    stacks.extend(curr['children'])
        else:
            node = {}
    rst = jsonify(node)   
    rst.headers.add('Access-Control-Allow-Origin', '*')
    return rst,200

@app.route('/change_user',methods=['GET','POST'])
def change_user():
    print("---server/change_user")
    global enumerateVizs,rootVizs,model,train_X,train_y,init
    if request.method == 'POST':
        get_data = json.loads(request.get_data())
        dataset = get_data['dataset']
        
        #save data
        print('save infos: ',tool.curr_data)
        save_data = {key:value for key,value in get_data.items() if key!='dataset'}
        tool.wirteFile(save_data["store_dataset"],save_data)
        tool.save_data(model,save_data["store_dataset"])

        # Reset variables
        tool.curr_data = dataset
        enumerateVizs = dataInfos[tool.curr_data]['enumerateVizs'] # get all column combination of the VisrootVizs = [vis for vis in enumerateVizs if len(vis.filter)==0]    
        rootVizs = dataInfos[tool.curr_data]['rootVizs']
        
        for vis in enumerateVizs:
            vis.par_vis = None
            vis.children = {}

        train_X = []
        train_y = []
        init = True
        model = None
    
    data ={}
    rst = jsonify(data)   
    rst.headers.add('Access-Control-Allow-Origin', '*')
    return rst,200

@app.route('/save_dataInfo',methods=['GET','POST'])
def save_dataInfo():
    print("---server/save_dataInfo")
    if request.method == 'POST':
        print("save dataInfo")
        tool.save_dill(tool.dataInfos,tool.dataInfos_path)
        tool.save_dill(tool.Vis.index,tool.Vis_index_path)

    data ={}
    rst = jsonify(data)   
    rst.headers.add('Access-Control-Allow-Origin', '*')
    return rst,200


@app.route('/enumerate',methods=['GET','POST'])
def enumerate_charts():
    print("---server/enumerate_charts")
    if request.method == 'POST':
        global dataInfos
        for dataset,dataInfo in dataInfos.items():
            stack = [vis for vis in dataInfo['enumerateVizs']]
            tool.curr_data = dataset

            while len(stack)!=0:
                # 3 filter depth
                print("stack length: "+str(len(stack)))
                userSelectedVis = stack.pop()
                par_vizs = Utility.getAllParVis(userSelectedVis)
                
                for click_item in list(userSelectedVis.subgroup.keys()):
                    userSelectedInsight = Utility.getUserSelectedInsight(userSelectedVis,click_item)
                    if not userSelectedInsight:
                        userSelectedInsight={}
                        userSelectedInsight['insightType'] = 'none',
                        userSelectedInsight['key'] = click_item
                        
                    type1_visRec,type2_visRec = VisRecommendation.getVisRec(par_vizs,userSelectedInsight,dataInfo['enumerateVizs'])
                    
                    if len(type1_visRec)!=0 and len(list(type1_visRec[0].filter.keys()))<=1:
                        stack.extend(type1_visRec)
                    if len(type2_visRec)!=0 and len(list(type2_visRec[0].filter.keys()))<=1:
                        stack.extend(type2_visRec)
    data ={}
    rst = jsonify(data)   
    rst.headers.add('Access-Control-Allow-Origin', '*')
    return rst,200

############### VisGuide 2.0 ################
@app.route('/get_taiwan_map',methods=['GET','POST'])
def get_taiwan_map():
    print("---server/get_taiwan_map")
    if request.method == 'POST':
        taiwan_map= tool.getTaiwanMap()
        
    rst = jsonify(taiwan_map)   
    rst.headers.add('Access-Control-Allow-Origin', '*')

    return rst,200

if __name__ == "__main__":
    app.run()
    #app.run(debug=True,port=5000)
    #app.run(host="192.168.0.1",port=5010) #設定特定的IP