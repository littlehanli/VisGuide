////// chart.js 
// define the options of doughnut chart 
// used in creating chart.js object

//options
function pie_options(element,data,canvas_id,chart_id,chart_datas){
    // Handle center text of pie chart
    Chart.pluginService.register({
		beforeDraw: function (chart) {
			if (chart.config.options.elements.center) {
                //Get ctx from string
                var ctx = chart.chart.ctx;
                
                        //Get options from the center object in options
                var centerConfig = chart.config.options.elements.center;
                var fontStyle = centerConfig.fontStyle || 'Arial';
                        var txt = centerConfig.text;
                var color = centerConfig.color || center_color;
                var sidePadding = centerConfig.sidePadding || 20;
                var sidePaddingCalculated = (sidePadding/100) * (chart.innerRadius * 2)
                //Start with a base font of 30px
                ctx.font = "30px " + fontStyle;
                
                //Get the width of the string and also the width of the element minus 10 to give it 5px side padding
                var stringWidth = ctx.measureText(txt).width;
                var elementWidth = (chart.innerRadius * 2) - sidePaddingCalculated;

                // Find out how much the font can grow in width.
                var widthRatio = elementWidth / stringWidth;
                var newFontSize = Math.floor(30 * widthRatio);
                var elementHeight = (chart.innerRadius * 2);

                // Pick a new font size so it will not be larger than the height of label.
                var fontSizeToUse = Math.min(newFontSize, elementHeight);

                        //Set font settings to draw it correctly.
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                var centerX = ((chart.chartArea.left + chart.chartArea.right) / 2);
                var centerY = ((chart.chartArea.top + chart.chartArea.bottom) / 2);
                ctx.font = fontSizeToUse+"px " + fontStyle;
                ctx.fillStyle = color;
                
                //Draw text in center
                ctx.fillText(txt, centerX, centerY);
			}
		}
	});


    var options = { 
        // Container for pan options
        legend:{
            display:false
        },
        elements: {
            center:{
                text: data.x,
            }
        },
        title : {
            display:true,
            text: 'Consumption percentage',
            fontStyle: "bold"
        },
        tooltips:{
            displayColors: false,
            callbacks:{
                title:function(tooltipItem,data){
                    let title = data.labels[tooltipItem[0].index]
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

                 
                    var elementIndex = activeElements[0]._index;
                    
                    var chart_type = this.config.type
                
                    this.data.datasets[0].backgroundColor= this.data.datasets[0].backgroundColor.map(function(color,index){
                        return (index!=elementIndex)? chart_colors[chart_type][0].main[index] : chart_colors[chart_type][0].click
                    })
                    // update overall information
                    if(this.data.datasets.length>1){
                        this.data.datasets[1].backgroundColor= this.data.datasets[1].backgroundColor.map(function(color,index){
                            return (index!=elementIndex)? chart_colors[chart_type][1].main[index] : chart_colors[chart_type][1].click
                        })
                    }
                    
                    
                    this.update();
                }
            }
        },
    }
    
    return options
}

function pie_datasets(data,chart_datas){
    datasets = []
    data.datas.forEach(function(item,index,array){
        var temp = {}
        temp.data = item.data;
        temp.label = item.label

        // set main chart_colors
        var main_chart_colors = chart_colors[chart_type][index].main
        temp.backgroundColor = item.data.map(function(item,index){
            return (index<main_chart_colors.length)? main_chart_colors[index]: main_chart_colors[main_chart_colors.length-1]
        }); 
        
        // find clicked index
        let clicked_index=""
        if(main_insight_key!="" && chart_datas[curr_dataset][main_chart_id]&&chart_datas[curr_dataset][main_chart_id].x == data.x &&data.labels.includes(main_insight_key)){
            clicked_index = data.labels.indexOf(main_insight_key)
        }

        if(index==0){
        // mark clicked item
        if(Number.isInteger(clicked_index)){ 
            temp.backgroundColor[clicked_index] = chart_colors[chart_type][0].click
        }
 
        }else{
            // 同類別同顏色
            var main_chart_colors = chart_colors[chart_type][index].main
            temp.backgroundColor = item.data.map(function(item,index){
                return (index<main_chart_colors.length)? main_chart_colors[index]: main_chart_colors[main_chart_colors.length-1]
            }); 
            if(Number.isInteger(clicked_index)){ 
                temp.backgroundColor[clicked_index] = chart_colors[chart_type][1].click
            }
            
        }
        datasets.push(temp)
    });
    return datasets
}
