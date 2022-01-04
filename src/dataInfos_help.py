from collections import defaultdict

dataInfos={
    'AQ':{
        #'readFilePath' : '..\\data\\AQ\\day_value_CH.json',# Chinese dataset
        'readFilePath' : '..\\data\\AQ\\day_value_EN.json', # English dataset
        'data' : {}, # all data points
        'enumerateVizs' : [], # all expanded visualizations
        'rootVizs' :[], # visualizations with no filter values
        'colFeatures' : defaultdict(lambda:set()), # attributes and their possible values of dataset 
        'encoding2Type' : defaultdict(lambda:dict()), # one-hot-encoding value of each feature-pair(F5 in the paper)
        'expand2Type' : dict(), # one-hot-encoding value of each expanded type
        'quantitative' :  {'SO2(ppb)','PM2.5(ug/m3)','NO2(ppb)','O3(ppb)'}, # available quantitative attribute names
        'nominal' : {'city','station'}, # available nominal attribute names
        'temporal' : {'year','month','day','weekDay'},  # available temporal attribute names
        'hierarchy': { #define granularity relation
            'city':{'station':'drill_down'},
            'station':{'city':'roll_up'},
            'year':{'month':'drill_down'},
            'month':{'year':'roll_up','day':'drill_down','weekDay':'drill_down'},
            'day':{'month':'roll_up'},
            'weekDay':{'month':'roll_up'},
        },
        'ID_col' : 'number', # the attribute that every data point has unique value, treat as ID 
        'x_default':'year', # the defaut attribute on the interface (add a chart panel)   
        'y_default':'PM2.5(ug/m3)', # the defaut attribute on the interface (add a chart panel)
    },
    'Transaction':{
        #'readFilePath' : '..\\data\\Transaction\\transaction_CH.json', # Chinese
        'readFilePath' : '..\\data\\Transaction\\transaction_EN.json', # English
        'data' : {},
        'enumerateVizs' : [],
        'rootVizs' :[],
        'colFeatures' : defaultdict(lambda:set()),
        'encoding2Type' : defaultdict(lambda:dict()),
        'expand2Type' : dict(),
        'quantitative' :  {'invoice_price','points_gained'},
        'nominal' : {'branch_name','category','user_level','address_code','gender','is_taiwan'},
        'temporal' : {'invoice_month','invoice_day','invoice_weekday'},
        'hierarchy': {
            'branch_name':{'store_id':'drill_down'},
            'store_id':{'branch_name':'roll_up'},
            'invoice_month':{'invoice_year':'roll_up','invoice_day':'drill_down','invoice_weekday':'drill_down'},
            'invoice_day':{'invoice_month':'roll_up'},
            'invoice_weekday':{'invoice_month':'roll_up'},
        },
        'ID_col' : 'transaction_id',
        'x_default':'invoice_month',
        'y_default':'invoice_price',   
    },
    'YT':{
        'readFilePath' : '..\\data\\YT\\USvideos.json',
        'data' : {},
        'enumerateVizs' : [],
        'rootVizs' :[],
        'colFeatures' : defaultdict(lambda:set()),
        'encoding2Type' : defaultdict(lambda:dict()),
        'expand2Type' : dict(),
        'quantitative' :  {'comment_count','dislikes','likes','views'},
        'nominal' : {'category','comments_disabled','title'},
        'temporal' : {'year','month','weekday'},
        'hierarchy': {
            'year':{'month':'drill_down'},
            'month':{'year':'roll_up','day':'drill_down','weekday':'drill_down'},
            'day':{'month':'roll_up'},
            'weekday':{'month':'roll_up'},
        },
        'ID_col' : 'title',
        'x_default':'category',
        'y_default':'likes',   
    },
    'Covid':{
        'readFilePath' : '..\\data\\covid\\covid.json', 
        'data' : {},
        'enumerateVizs' : [],
        'rootVizs' :[],
        'colFeatures' : defaultdict(lambda:set()),
        'encoding2Type' : defaultdict(lambda:dict()),
        'expand2Type' : dict(),
        'quantitative' :  {'Confirmed','Deaths','Recovered'},
        'nominal' : {'Province/State','Country/Region'},
        'temporal' : {'Date','Month','Day','Weekday'},
        'hierarchy': {
            'Country/Region':{'Province/State':'drill_down'},
            'Province/State':{'Country/Region':'roll_up'},
            'month':{'day':'drill_down','weekDay':'drill_down'},
            'day':{'month':'roll_up'},
            'weekDay':{'month':'roll_up'},
        },
        'ID_col' : 'SNo',
        'x_default':'Date', 
        'y_default':'Confirmed',
    } 
}

################## VisGuide 2.0 ######################
mapInfos = {
    'Taiwan':{
        'readFilePath' : '..\\data\\mapdata\\COUNTY_MOI_1090820.json', 
    }
}