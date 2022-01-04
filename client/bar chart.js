////// chart.js 
// define the options of bar chart 
// used in creating chart.js object

//options
function bar_options(element,data,canvas_id,chart_id,chart_datas){
    y_subset_max = 0
    y_overall_max = 0
    data.datas.forEach(function(item,i){
        if(i==0){
            y_subset_max = Math.max(...item.data) 
        }else{
            y_overall_max = Math.max(...item.data) 
        }
    })
    y_max = 0
    if(Math.abs(y_overall_max-y_subset_max)>(10000000)){
        y_max = y_subset_max
    }else{
        y_max = (y_overall_max>y_subset_max)?y_overall_max:y_subset_max
    }

    ////////////////// revised 2020.01 //////////////////
    dual_yAxes = 0
    if(y_overall_max/y_subset_max < 2 && y_overall_max >= y_subset_max){
        dual_yAxes = 2
    }else if(y_subset_max/y_overall_max < 2 && y_subset_max >= y_overall_max){
        dual_yAxes = 1
    }else if(y_overall_max > y_subset_max){
        dual_yAxes = -2
    }else if(y_subset_max > y_overall_max){
        dual_yAxes = -1
    }

    var options = { 
        // Container for pan options
        plugins: {
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'x',
                    rangeMin: {
                        y: 0
                    },
                    rangeMax: {
                        y: y_max
                    },
                },

                // Container for zoom options
                zoom: {
                    enabled: true,
                    sensitivity: 0.001,
                    speed: 10,
                    mode: 'x',
                    rangeMin: {
                        y: 0
                    },
                    rangeMax: {
                        y: 500
                    },
                    
                }
            }
        },
        legend:{
            display:false
        },
        elements: {
            line: {
                tension: 0
            }
        },
        tooltips:{
            displayColors: false,
            callbacks:{
                title:function(tooltipItem){
                    let title = tooltipItem[0].xLabel
                    if(title.length>20){
                        start = 0
                        valid = true
                        result = []
                        while(valid){
                            if((start + 20)<title.length){
                                result.push(title.substring(start,start+20))
                                start +=20  
                            }else{
                                valid = false
                            }
                        }
                        return result
                    }else{
                        return title
                    } 
                },
                label:function(tooltipItem,data){
                    var chart_id ='a_chart_'+element.getAttribute('id').substring(10)
                    chart_data = chart_datas[curr_dataset][chart_id]
                    
                    if (chart_data){
                        var modify_labels = Object.keys(chart_data.otherInfo).map(function(item){
                            item = item.toString()
                            if(item.length>10){
                                return item.substring(0,10) + '...'
                            }else{
                                return item
                            } 
                        })

                        if(modify_labels.includes(tooltipItem.xLabel)){
                            var multistringText = [tooltipItem.yLabel] 
                            //產生tooltip
                            var label_index = modify_labels.indexOf(tooltipItem.xLabel)
                            var one2oneList = Object.values(chart_data.otherInfo)[label_index]
                            Object.keys(one2oneList).forEach(function(key){
                                let text = key + '=' + one2oneList[key]
                                text = (text.length>20)? text.substring(0,20):text
                                multistringText.push(text)
                            })

                            return multistringText
                            
                        }else{
                            if (tooltipItem.yLabel == ""){
                                value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]
                                return Math.floor(value*100) + "%"
                            }
                            return tooltipItem.yLabel
                        } 
                    }else{
                        if (tooltipItem.yLabel == ""){
                            value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]
                            return Math.floor(value*100) + "%"
                        }
                        return tooltipItem.yLabel
                    }
                    
                }
            }
        },
        responsive: true,
        maintainAspectRatio: false,
        
        onClick: function(evt, activeElements) {
            if(activeElements.length !=0 ){
                //only click the chart int the seq container can get the recommendation
                if(isInSeqContainer(canvas_id)){
                    blocks = $('.seq_chart_container').each(function(){
                        id = $(this).attr('id').split("-")[0]
                        chart_data = chart_datas[curr_dataset][id]
                        $(this).css("border",(chart_data.expandType=="1")? drill_block: comparison_block) 
                        $(this).css("border-radius",block_radius)
                    })

                    
                    //hight light this block
                    var block = document.getElementById(chart_id+'-clone')
                    block.style.border = hightlight_block
                    block.style.borderRadius = block_radius

                    //get vis rec
                    var click_item = this.data.labels[activeElements[0]._index]
                    var chart_index = element.getAttribute('data-chartIndex')
                    
                    getVisRec(chart_index,click_item,chart_id) // -> 會換main canvas id

                   
                    
                    //move the explore view
                    var explore_view = document.getElementById("explore_view_"+curr_sheet_num)
                    explore_view.style.top = block.style.top

                    //highlight click item
                    let insight_indice = Object.keys(data.insights).map(function(key){
                        let labels = data.labels.map(function(label){
                            return label.toString()
                        })
                        return labels.indexOf(key)
                    })
                 
                    var elementIndex = activeElements[0]._index;
                    
                    var chart_type = this.config.type
                    this.data.datasets[0].backgroundColor= this.data.datasets[0].backgroundColor.map(function(color,index){
                        return (index!=elementIndex)? chart_colors[chart_type][0].main : chart_colors[chart_type][0].click
                    })
                    this.data.datasets[0].borderColor= this.data.datasets[0].backgroundColor.map(function(color,index){
                        return (index!=elementIndex)? chart_colors[chart_type][0].main : chart_colors[chart_type][0].click_border
                    })
                    
                    this.update();
                }
            }
        },
        scales: {
            xAxes: [{
                
                scaleLabel: {
                    display: true,
                    labelString: data.x,
                    fontStyle: "bold"
                },
                ticks: {
                    autoSkip: true,
                    maxTicksLimit: 15
                },
                afterTickToLabelConversion : function(q){
                    for(var tick in q.ticks){
                        if(q.ticks[tick].length>10){
                            q.ticks[tick] = q.ticks[tick].substring(0,8) + '...'
                        }
                    }
                }
            }],
            yAxes: [{
                id: 'filter',
                scaleLabel: {
                    display: true,
                    labelString: data.y,
                    fontStyle: "bold"
                },
                position:"left",
                display: true,
                ticks: {
                    min: 0,
                    //fontColor: chart_colors["bar"][0].main
                },
                afterTickToLabelConversion : function (q){
                    for(var tick in q.ticks){
                        if(data.y_glo_aggre == "per"){
                            var value = parseFloat(q.ticks[tick])
                            q.ticks[tick] = Math.round((value*100)).toString() + "%" ;
                        }else{
                            var value = parseInt(q.ticks[tick]) 
                            if(value>=1000 && value<1000000){
                                q.ticks[tick] = parseInt(value / 1000).toString() + "K" ;
                            }else if(value>=1000000){
                                q.ticks[tick] = parseInt(value / 1000000).toString() + "M" ;
                            }
                        }
                        
                    }
                }
            },{
                id: 'overall',
                scaleLabel: {
                    display: true,
                    labelString: data.y,
                    fontStyle: "bold"
                    },
                position:"left",
                display: false,
                ticks: {
                    min: 0,
                    //fontColor: chart_colors["bar"][1].main
                },
                afterTickToLabelConversion : function (q){
                    for(var tick in q.ticks){
                        if(data.y_glo_aggre == "per"){
                            var value = parseFloat(q.ticks[tick])
                            q.ticks[tick] = Math.round((value*100)).toString() + "%" ;
                        }else{
                            var value = parseInt(q.ticks[tick]) 
                            if(value>=1000 && value<1000000){
                                q.ticks[tick] = parseInt(value / 1000).toString() + "K" ;
                            }else if(value>=1000000){
                                q.ticks[tick] = parseInt(value / 1000000).toString() + "M" ;
                            }
                        }
                        
                    }
                }
            }
            ],
        },
        multiYAxes:dual_yAxes
    }
   
    ////////////////// revised 2020.01 //////////////////
    //show second y-axes if there are two dataset
    var temp = Object.assign({},options.scales.yAxes);
    if(data.datas.length>1){
        options.scales.yAxes[1].display = true;
        if(dual_yAxes <= 0){
            options.scales.yAxes[0].ticks.fontColor = chart_colors["line"][0].main;
            options.scales.yAxes[1].ticks.fontColor = chart_colors["line"][1].main;
            options.scales.yAxes[1].position = "right";
            options.scales.yAxes[1].scaleLabel.display = false;  

            options.scales.close_yAxes = [temp[1/*Math.abs(dual_yAxes)-1*/]]; // close dual yAxes
            options.scales.temp_yAxes = Object.assign([],options.scales.yAxes); // original yAxes
        }else if(dual_yAxes == 1){
            options.scales.yAxes = [options.scales.yAxes[1]];
        }else if(dual_yAxes == 2){
            options.scales.yAxes = [options.scales.yAxes[1]];
        }
    }
    return options
}

function bar_datasets(data,chart_datas){
    // for the data of chart.js
    var datasets = [];
    data.datas.forEach(function(item,index){
        var temp = {}
        temp.data = item.data;
        temp.label = item.label
        temp.backgroundColor = item.data.map(x => chart_colors[chart_type][index].main);
        temp.fill = false
        
        if(index==0){

            // find the insight indice
            let insight_indice = Object.keys(data.insights).map(function(key){
                let labels = data.labels.map(function(label){
                    return label.toString()
                })
                return labels.indexOf(key)
            })
            
            // find the clicked indice
            let clicked_index=""
            if(main_insight_key!="" && chart_datas[curr_dataset][main_chart_id]&&chart_datas[curr_dataset][main_chart_id].x == data.x &&data.labels.includes(main_insight_key)){
                clicked_index = data.labels.indexOf(main_insight_key)
            }
            
            // init color
            var borderWidth = item.data.map(x => 1);
            var borderColor = item.data.map(x => chart_colors[chart_type][index].main);
            
            // mark insight
            insight_indice.forEach(function(insight_index){
                borderWidth[insight_index] = 3
                borderColor[insight_index] = chart_colors[chart_type][index].insight_border
            })
            temp.borderWidth = borderWidth;
            temp.borderColor = borderColor
            
            // mark clicked item
            if(Number.isInteger(clicked_index)){
                temp.backgroundColor[clicked_index] = chart_colors[chart_type][0].click
                temp.borderColor[clicked_index] = chart_colors[chart_type][0].click_border
            }
            temp.hidden = false
            //datasets.push(temp)
        }else{
            // add id (for the right yAxes)
            temp.yAxisID = "overall"

            temp.hidden = false
            
            temp.backgroundColor = chart_colors[chart_type][index].main
        }
        datasets.push(temp)
    });

    return datasets
}