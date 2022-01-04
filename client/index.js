//global var
var global_chart_id=0 // unique chart id
var main_chart_id // user-focused chart id
var main_insight_key = ''
var curr_dataset = "" 

// sheet manager
var sheet_num = 1 // unique sheet id
var curr_sheet_num=1 
var tree_views = {} // treant object of trees in each sheet
var chart_objects = {} // chart.js object of each chart

// store information
var label_data = {} // user's label of recommended charts in each recommendation round
var dataset_names = [] // all dataset names in the system
var tree_structures // parent-children relationship of each sheet. key: parent, array: children
var chart_datas // chart information, get from server
var store_label_data

// navigation view
var explore_views = {}


////// add new sheet /////
function addSheetContainer(){
    main_chart_id =''
    
    // detect if sheet exist
    var sheet_container = document.getElementById('sheet_container_'+curr_sheet_num)
    if (sheet_container){
        sheet_container.style.display = "block"
    }else{
        // add elements into sequence container
        var tree_container = document.getElementById('tree_container')
        var sheet_container = sheetContainer(curr_dataset,curr_sheet_num)
        tree_container.append(sheet_container)
    } 
}


////// Add chart to visualization tree //////
function addChart2Tree(chart_data){
    
    //cal new chart info index
    ++global_chart_id
    var chart_id = "a_chart_".concat(global_chart_id.toString());
    
    //update all chart data
    chart_datas[curr_dataset][chart_id] = chart_data
    
    //create the pseudo element for the seq view tree
    var chart_temp =document.getElementById('chart_temp') 
    //
    var chart_div = document.createElement("div")
    setAttributes(chart_div,{class:"seq_chart_container",
                            id:chart_id,
                            style:"background-color:" + white + 
                            "; display: flex; justify-content: center;align-items: center"+
                            "; width:" + chart_block_width +"px" + 
                            "; height:" + chart_block_width + "px"})
    chart_temp.appendChild(chart_div)
    
    //update explore view
    addNode(global_chart_id.toString(),chart_data.expandType)
}

function addNode(chart_id_index,expand_type){
    //dynamic add node   
    
    //create tree_structure data
    // udpate the tree structure exist
    var tree_structure = {}
    child_id = '#a_chart_'+chart_id_index

    if(tree_structures[curr_dataset].hasOwnProperty(curr_sheet_num-1)){ 
        tree_structure = tree_structures[curr_dataset][curr_sheet_num-1]
 
        // find parent node
        if(chart_datas[curr_dataset]["a_chart_"+chart_id_index.toString()].expandType=="1"){
            //drill down chart
            var num = chart_datas[curr_dataset]["a_chart_"+chart_id_index.toString()].parent_chart_id.substring(8)
            var parent_node = $('#node_'+num)
            var parent_id = '#a_chart_'+num

            tree_structure[parent_id].push(child_id)
        }else{
            // comparison chart
            // find the grandparent_id in tree sturcture
            var parent_node = $('#root')
            var parent_id = "#seq_root"

            if(chart_datas[curr_dataset]["a_chart_"+chart_id_index.toString()].hasOwnProperty("parent_chart_id")){
                // if not first chart
                var par_id = "#"+chart_datas[curr_dataset]["a_chart_"+chart_id_index.toString()].parent_chart_id
                Object.keys(tree_structure).forEach(function(grandParent){
                    if(tree_structure[grandParent].includes(par_id)){
                        parent_id = grandParent
                        parent_node =  $('#node_'+ grandParent.substring(9))
                        
                    }
                })
                if(parent_id != "#seq_root"){
                    var idx = tree_structure[parent_id].indexOf(par_id)
                    tree_structure[parent_id].splice(idx+1,0,child_id) 
                }
            }
        }
        tree_structure[child_id] = [] 
    }else{
        var parent_node = $('#root')
        var parent_id = "#seq_root"
        tree_structure[child_id]=[] // child node 
        tree_structures[curr_dataset][curr_sheet_num-1]=tree_structure
    }   
    
    // add new Node
    var parent_info = parent_node.data('treenode');
    var node_id = "node_"+chart_id_index
    
    // node color
    var node_color="the-parent"
    if(expand_type=="1"){
        node_color="the-parent con_drill"
    }else if(expand_type=="2"){
        node_color="the-parent con_comparison"
    }

    var new_node_info = { 
        HTMLclass: node_color, 
        HTMLid: node_id
    };
    explore_views[curr_sheet_num-1].tree.addNode(parent_info, new_node_info);
    parent_info.collapsed=false
    
    //change color
    $('#'+node_id).css({'background-color':node_selected_color});
    $('#'+node_id).addClass("selected")

    //check if the node is selected. only show the node which is selected
    updateSeqViewByExloreView()
}

function updateSeqViewByExloreView(new_tree_structure = false){
    // 1.Get the showed node from exploration view
    if(new_tree_structure==false){
        // add chart by exploration view
        selected_chart_id_list =  Array.from($('.the-parent.selected').map(function(item){
            return "#a_chart_" + $(this).attr('id').substring(5)
        }))
        tree_structure = tree_structures[curr_dataset][curr_sheet_num-1]
        new_tree_structure = {}
    
        Object.keys(tree_structure).forEach(function(item){
            if(selected_chart_id_list.includes(item)){
                var children = tree_structure[item].filter(function(child){
                    return selected_chart_id_list.includes(child) 
                })
                new_tree_structure[item] = children
            }
        })
    }

    // 2.draw tree in sequence view

    // recreate the tree_structure to split the "comparison" chart
        //var updated_tree_structure = new_tree_structure
        new_tree_structure["root"] = []

        var drill_tree_structure = {}
        var comparison_tree_structure = {}
    
        // root child
        Object.keys(new_tree_structure).forEach(function(child_id){
            if(child_id!= "root"){
                isRoot = true
    
                Object.keys(new_tree_structure).forEach(function(par_id){
                    if(isRoot && par_id!="root" && child_id!="root" && new_tree_structure[par_id].includes(child_id)){
                        isRoot = false
                    }
                }) 
                if(isRoot) new_tree_structure["root"].push(child_id)
            }
            
        })

        if(Object.keys(new_tree_structure).length>0){
            Object.keys(new_tree_structure).forEach(function(child_id,index){
                // create drill down tree_structure, for drawing connectors
                if(index!=0 && child_id!="root"){
                    var chart = chart_datas[curr_dataset][child_id.substring(1)]
                    var parent_id = "#"+chart.parent_chart_id
                    
                    if(chart.expandType == "1"){
                        if(!drill_tree_structure.hasOwnProperty(parent_id)){
                            drill_tree_structure[parent_id] = []
                        }
                        drill_tree_structure[parent_id].push(child_id)
                        drill_tree_structure[child_id] = []
    
                    }else if (chart.expandType == "2"){
                        if(!comparison_tree_structure.hasOwnProperty(parent_id)){
                            comparison_tree_structure[parent_id] = []
                        }
                        comparison_tree_structure[parent_id].push(child_id)
                        comparison_tree_structure[child_id] = []
                    }
                }
            })
        }
    
        // create comparison tree structure , for drawing connectors
        temp = {}
        Object.keys(comparison_tree_structure).forEach(function(parent_id){
            array = [parent_id].concat(comparison_tree_structure[parent_id])
            array.forEach(function(id,i){
                if(i+1<array.length){
                    temp[id] = [array[i+1]]    
                }
            })
        })
        comparison_tree_structure = temp
    
    seq_data={}
    //seq_data.data=updated_tree_structure
    seq_data.data=new_tree_structure

    $.ajax({
        type: 'POST',
        url:"http://127.0.0.1:5000/get_seq_data",
        data:JSON.stringify(seq_data)
    }).done(function(responce){
        if(tree_views.hasOwnProperty(curr_sheet_num-1)){ //已經有tree了
            tree_views[curr_sheet_num-1].destroy()
        }
        //create tree
        var seq_tree_structure = {
            chart: {
                container: "#seq_view_"+curr_sheet_num, // div id
                rootOrientation :"WEST",
                levelSeparation:    80,
                siblingSeparation:  30,
                subTeeSeparation:   30,
                nodeAlign: "BOTTOM",
                padding: 35,
                node: { 
                    collapsable: false
                },
                connectors: {
                    type: "curve",
                    style: {
                        "stroke-width": 2,
                        "stroke": edge_color
                    }
                },
            },
            nodeStructure:responce
        };
        var seq_view = new Treant(seq_tree_structure,null,$);
        tree_views[curr_sheet_num-1]=seq_view

        // Create the update chart id list
        var chart_id_list = Object.keys(new_tree_structure)

        // Add element(card) and draw canvas
        for(let i=0;i<chart_id_list.length;i++){
            if(chart_id_list[i]!="root"){
                let chart_id = chart_id_list[i].substring(1)
                var chart_div = document.getElementById(chart_id+'-clone')
                var canvas_id =  "seq_chart_".concat(chart_id.substring(8))
                var chart_data = chart_datas[curr_dataset][chart_id]
                addElement(chart_div,canvas_id,chart_data,chart_id)
            }
        }

        // Draw connectors
        drawConnectors(drill_tree_structure,comparison_tree_structure)

        // Hightlight main chart
        if(main_chart_id){
            var block = document.getElementById(main_chart_id+'-clone')
            if(block){
                block.style.border = hightlight_block
                block.style.borderRadius = block_radius
            }else{
                cleanRecCanvas()
            }
        }

        // show init if the tree is none
        if(Object.keys(responce).length==0){
            document.getElementById('init').style.display="block"
            document.getElementById('add_a_chart_card').style.visibility = "hidden"

            var sheet_container = document.getElementById('sheet_container_'+curr_sheet_num)
            if (sheet_container) sheet_container.style.display = "none"
        }
    }); 

}


///// create html object of a chart(card) /////
function addElement(par_element,canvas_id,chart_data,chart_id=""){ 
    // set block color
    if(chart_id!=""){
        par_element.style.border = (chart_data.expandType=="1")? drill_block: comparison_block
        par_element.style.borderRadius = block_radius
    }

    var card = document.createElement("div")
    setAttributes(card,{class:"ui card",style:"width:"+ chart_card_width+"px;height:"+chart_card_height+"px"})
    
    // add html
    par_element.appendChild(card)
    
    // content
    var content = document.createElement("div")
    setAttributes(content,{class:"content",style:"text-align: left;background-color:"+card_content_color + ";padding:10px" })
    
    //// options icon
    var option_id = "option_" + canvas_id.split("_")[2]
    var option = optionBtn(option_id,onOptionClick)

    //// filter icon
    var filter = filterBtn(chart_data)

    //// reset zoom icon
    var reset = resetZoomBtn(onResetZoom)

    //// icons
    var icons = iconsDiv(chart_id,chart_data,onRedHeartBtnClick,onCloseChart,onYelloStarBtnClick,onGreyPlusBtnClick)
    
    content.appendChild(option)
    content.appendChild(filter)
    content.appendChild(reset)
    content.appendChild(icons)

    //extra content
    var extra_content = extraContent(canvas_id)

    // legend
    var legend = legendDiv(chart_data)

    ///////// revised 2020.01 ////////////
    //title
    var title = titleDiv(chart_data)
    
    card.appendChild(content)
    card.appendChild(title)
    card.appendChild(legend)
    card.appendChild(extra_content)
    

    // add option card
    option_pos = $("#"+option_id).position()
    option_card = optionCard(chart_data,option_pos,onOptionCardClose,onMultipleYAxesClick,onOptionRadio)
    card.appendChild(option_card)
    
    activateElements(chart_data.datas.length,chart_data)
    drawChart(chart_data,canvas_id,chart_id)
    //console.log(chart_data)

    return card
}

function onOptionCardClose(){
    option_card = $(this).parents('.ui.card')[0]
    option_card.style.display="none"
}

function onOptionClick(){
    option_card = $(this).parents('.ui.card').children(".ui.card")[0]
    display = (option_card.style.display == "none" )? "block": "none"           
    option_card.style.display=display

    // update toggle checkBox
    chart = $(this).parents(".seq_chart_container")
    if(chart.length!=0){
        chart_id = chart[0].id.split("-")[0]
        chart_data =chart_datas[curr_dataset][chart_id] 
        if(chart_data.multiple_yAxes){
            $(this).parents('.ui.card').find(".ui.toggle.checkbox").checkbox("check")
        }else{
            $(this).parents('.ui.card').find(".ui.toggle.checkbox").checkbox("uncheck")
        }
    }   
}

////// draw visualization tree //////
function drawChart(chart_data,canvas_id,chart_id=""){
    //update label
    var star = $('#'+canvas_id).parents('.extra.content').siblings('.content').children('.yellow.star') 
    var heart = $('#'+canvas_id).parents('.extra.content').siblings('.content').children('.red.heart') 
    let label = parseFloat(chart_data.label)
    if(label == 0.3){
        star.removeClass("outline");
    }else if (label == 1.0){
        heart.removeClass("outline")
    }else{
       if(star) star.addClass("outline")
       if(heart) heart.addClass("outline")
    }

    // get old option_data (only the chart in sequence view needs to update)
    var update_data = {}
    
    if(chart_objects.hasOwnProperty(chart_id)){
        myChart = chart_objects[chart_id]
        update_data = {
            y: (myChart.options.hasOwnProperty("scales"))? myChart.options.scales.yAxes[0].scaleLabel.labelString:"",
            multiple_yAxes: (myChart.options.hasOwnProperty("scales") && myChart.options.scales.yAxes.length>1)? myChart.options.scales.yAxes[1].display:false,
            labels:myChart.data.labels,
            data: myChart.data.datasets.map(function(item){
                return item.data
            }),
        }
    }

    // destroy old canvas and create new canvas
    updateCanvasElement(canvas_id)
    
    //get canvas
    var element = document.getElementById(canvas_id)

    // create chart data 
    chart_type = chart_data.type
    ////////////////// Tammy Update ///////////////
    if(curr_dataset=="Covid"){
        if(Object.getOwnPropertyNames(chart_data.filters).length!=0){
            if(chart_data.filters["Country/Region"].includes("Italy")){
                var idx = chart_data.labels.indexOf("05/14")
                chart_data.datas[0].data[idx] = 899
            }
            if(chart_data.filters["Country/Region"].includes("India")){
                var idx = chart_data.labels.indexOf("06/10")
                chart_data.datas[0].data[idx] = 9985

                var idx = chart_data.labels.indexOf("06/11")
                chart_data.datas[0].data[idx] = 11586

                var idx = chart_data.labels.indexOf("06/12")
                chart_data.datas[0].data[idx] = 11567

                var idx = chart_data.labels.indexOf("06/15")
                chart_data.datas[0].data[idx] = 11589

                var idx = chart_data.labels.indexOf("07/28")
                chart_data.datas[0].data[idx] = 49981

                var idx = chart_data.labels.indexOf("07/29")
                chart_data.datas[0].data[idx] = 49982

                var idx = chart_data.labels.indexOf("09/14")
                chart_data.datas[0].data[idx] = 73930

                var idx = chart_data.labels.indexOf("09/15")
                chart_data.datas[0].data[idx] = 73933
            }
        }
    }
    if(curr_dataset=="AQ"){
        if(Object.getOwnPropertyNames(chart_data.filters).length==0){
            if(chart_data.x == "month"){
                if(chart_data.y == "PM2.5(ug/m3)(avg)"){
                    var idx = chart_data.labels.indexOf(3)
                    chart_data.datas[0].data[idx] = 28.1
                    chart_data.insights = {3:"max",6:"min"}
                }
                if(chart_data.y == "NO2(ppb)(avg)"){
                    var idx = chart_data.labels.indexOf(3)
                    chart_data.datas[0].data[idx] = 17.3
                    chart_data.insights = {3:"max",7:"min"}
                }
            }
        }
    }

    if(chart_type == "bar"){
        options = bar_options(element,chart_data,canvas_id,chart_id,chart_datas)
        datasets = bar_datasets(chart_data,chart_datas)
    }else if(chart_type == "line"){
        options = line_options(element,chart_data,canvas_id,chart_id,chart_datas)
        datasets = line_datasets(chart_data,chart_datas)
    }else if(chart_type == "doughnut"){
        options = pie_options(element,chart_data,canvas_id,chart_id,chart_datas)
        datasets = pie_datasets(chart_data,chart_datas)
    }

    //////////////// revised 2020.01 //////////////////

    if(options.multiYAxes>0){
        chart_data.multiple_yAxes = false
        disableYAxes(chart_data)
    }
    
    var labels = chart_data.labels
    if(Object.keys(update_data)!=0){
        if(options.hasOwnProperty("scales")){
            // update multiple axes
            if(options.multiYAxes <= 0 && chart_data.datas.length > 1){
                if(update_data.multiple_yAxes==false){
                    options.scales.yAxes = Object.assign([],myChart.options.scales.close_yAxes);
                    myChart.options.scales.yAxes[0].position = "left";
                    delete myChart.options.scales.yAxes[0].ticks.fontColor;
                    myChart.options.scales.yAxes[0].scaleLabel.display = true;
                }
            }
            
            // update y axis
            options.scales.yAxes[0].scaleLabel.labelString = update_data.y
        }
        // update data value(aggre)
        update_data.data.forEach(function(data,index){
            datasets[index].data = data
        })
        
        // update labels (sort)
        labels = update_data.labels
    }

    var chart = new Chart(element,{
        type: chart_data.type,
        data: {
            labels: labels,
            datasets: datasets
        },    
        options: options
    });

    // store chart object
    var id = (chart_id!="")? chart_id :canvas_id
    chart_objects[id] = chart
    // store the chart index of the enumerateVizs
    element.setAttribute("data-chartIndex", chart_data.chart_index);
}


// draw links of the tree
function drawConnectors(drill_tree_structure,comparison_tree_structure){
    var seq_view_id = "#seq_view_"+curr_sheet_num
    var svg = d3.select(seq_view_id).select('svg')

    scale = 0.6
    stroke_width = 0.05
    max_len = chart_block_width * scale
    
    // 1.draw drill down line

    // use d3 sankey diagram 
    // create data 
    node_data = {}
    link_data = []
    
    // get node position
    var chart_id_list = Object.keys(drill_tree_structure)
    var seq_view_id = "seq_view_" + curr_sheet_num
    svg_block = document.getElementById(seq_view_id).children[0].getBoundingClientRect()
    chart_id_list.forEach(function(chart_id,i){
        id = chart_id.substring(1).concat("-clone")
        node_data[id] = {}
        block = document.getElementById(id).getBoundingClientRect()
        node_data[id].x = Math.floor(block.left  - svg_block.left)
        node_data[id].y = Math.floor(block.top - svg_block.top)
        node_data[id].expandType = (chart_datas[curr_dataset][chart_id.substring(1)].expandType == 1)? "drill" : "comparison"
    })
    
    // create link info
    for(let i=0;i<chart_id_list.length;i++){
        let parent = chart_id_list[i]
        let children = drill_tree_structure[parent]
        var cumulative_value = 0
        for (let j=0; j<children.length;j++){
            
            let child_id = children[j].substring(1).concat("-clone")
            par_id = parent.substring(1).concat("-clone")
            link_data.push({
                source:par_id,
                target:child_id,
                value:stroke_width,
                sy:cumulative_value * max_len, //前面所有的長度
            })  

            cumulative_value += stroke_width
            
        }
    }

    // link total length, for calculate the center cooradinate of links
    values = link_data.map(el=>el.value*max_len)
    link_length = (values.length>0)? values.reduce((a,b)=>a+b) : 0.0
    sy_start = (chart_block_width - link_length)/2
    

    // create sankey diagram
    // append the svg object to the body of the page
    var sankey = d3.sankey()
        .nodeWidth(chart_block_width)
    var path = sankey.link();
    
    graph = {"nodes" : [], "links" : []};
    link_data.forEach(function (d) {
        graph.links.push({ "source": d.source,
                        "target": d.target,
                        "value": +d.value });
    });

   Object.keys(node_data).forEach(function(item,i){
        graph.nodes.push(item);
   })
  
  // loop through each link replacing the text with its index from node
  graph.links.forEach(function (d, i) {
    graph.links[i].source = graph.nodes.indexOf(graph.links[i].source);
    graph.links[i].target = graph.nodes.indexOf(graph.links[i].target);
  });

  // now loop through each nodes to make nodes an array of objects
  // rather than an array of strings
  
  graph.nodes.forEach(function (d, i) {
    graph.nodes[i] = { "name": d };
  });

  sankey
      .nodes(graph.nodes)
      .links(graph.links)
      .layout(32);

  // set node position
    graph.nodes.forEach(function (d, i) {
        name = graph.nodes[i].name
        graph.nodes[i].x = node_data[name].x
        graph.nodes[i].y = node_data[name].y
    });

    // set stroke width
    graph.links.forEach(function (d, i) {
        graph.links[i].dy = Math.floor(max_len * d.value)
        graph.links[i].sy = Math.floor(sy_start + link_data[i].sy)
        graph.links[i].ty = Math.floor((chart_block_width - (max_len * d.value))/2)
    });

    // add in the links
    var link = svg
        .selectAll(".link")
        .data(graph.links)
        .enter().append("path")
        .attr("class", function(d){return "link"})
        .attr("d", path)
        .attr("fill","none")
        .style("stroke",drill_connector_color)
        .style("stroke-width", function(d) { return Math.max(1, d.dy); })
        
        

    // 2.draw comparison link
    var comparison_link_data = Object.keys(comparison_tree_structure).map(function(parent_id,i){
        var par_id = parent_id.substring(1).concat("-clone")
        var chi_id = comparison_tree_structure[parent_id][0].substring(1).concat("-clone")

        var parent_block = document.getElementById(par_id).getBoundingClientRect()
        var child_block = document.getElementById(chi_id).getBoundingClientRect()

        var parent_coordinate = {
            x:(parent_block.left + parent_block.width/2) - svg_block.left , 
            y:parent_block.bottom - svg_block.top
        }
        var child_coordinate = {
            x:(child_block.left + child_block.width/2) - svg_block.left, 
            y:child_block.top - svg_block.top
        }
        return [
            parent_coordinate,
            child_coordinate
        ]

    })

    var comparison_path = d3.line()
    .x(function(d) {
      return d.x;
    })
    .y(function(d) {
      return d.y;
    });

    var comparison_link = svg
        .selectAll(".comparison")
        .data(comparison_link_data)
        .enter().append("path")
        .attr("class", function(d){return "link comparison" })
        .attr("d", comparison_path)
        .style("stroke-width", max_len*stroke_width)

    $(".comparison").css("stroke",comparison_connector_color)
}

function isInSeqContainer(canvas_id){
    if( $("#"+canvas_id).parents('.seq_chart_container').length>0)
        return  true
    else   
        return false 
}

function loader(show){
    if (show){
        $("#loader").css("display","block")
        $("#outer").css("opacity","0.3")
    }else{
        $("#loader").css("display","none")
        $("#outer").css("opacity","1.0")
    }
}


////// get visualization recommendation //////
function getVisRec(chart_index,click_item,chart_id){
    //check if already get the rec
    var chart_data = chart_datas[curr_dataset][chart_id]
    
    if(!chart_data.rec.hasOwnProperty(click_item) ){
        // show loader
        loader(true)

        //store the rec label
        if(Object.keys(label_data).length>1){
            var store_chart_data = chart_datas[curr_dataset][main_chart_id]
            if(store_chart_data){
                if(Object.keys(store_chart_data.insights).includes(main_insight_key.toString())){
                    var insight_text = store_chart_data.insights[main_insight_key.toString()]
                }else{
                    var insight_text ='none'
                }
                one_round_label = {
                    key:main_insight_key,
                    chart:main_chart_id,
                    insight: insight_text,
                    rec: store_chart_data.rec[main_insight_key] 
                }
                store_label_data[curr_dataset].push(one_round_label)
            }
        }

        //get all chart_index in the tree
        chart_indices = Object.keys(tree_structures[curr_dataset][curr_sheet_num-1]).map(function(chart_id){
            if(chart_id !== "root"){
                chart_id = chart_id.substring(1) + "-clone"
                canvas_id = $("#"+chart_id).find("canvas")[0].id
                return document.getElementById(canvas_id).getAttribute("data-chartIndex")
            }
        })
        Array.prototype.clean = function(deleteValue) {
            for (var i = 0; i < this.length; i++) {
                if (this[i] == deleteValue) {         
                this.splice(i, 1);
                i--;
                }
            }
            return this;
        };
        chart_indices.clean(undefined);

        //request data
        var chart_info = {}
        chart_info.chart_index = chart_index
        chart_info.click_item = click_item
        chart_info.label_data = label_data
        chart_info.chart_indices = chart_indices

        $.ajax({
            type: 'POST',
            url:"http://127.0.0.1:5000/get_vis_rec",
            data:JSON.stringify(chart_info)

        }).done(function(responce){
            //hide loader
            loader(false)
            
            //update label_data
            if(Object.keys(responce).length!=0){
                //store_label_data

                
                label_data = {}
                Object.values(responce).forEach(function(item){
                    item.forEach(function(data){
                        label_data[data.chart_index] = 0.0
                    })
                })
                
                //store vis rec to canvas
                //判斷1-1mapping，把該圖新增"other info訊息"
                var otherInfo = {}
                for(let i=0;i<responce.type1.length;i++){
                    var labels = responce.type1[i].labels 
                    if(labels.length == 1){
                        responce.type1[i].is_selected=true
                        otherInfo[responce.type1[i].x] = labels[0]
                    }
                }
                if(Object.keys(otherInfo).length!=0){
                    chart_data.otherInfo[click_item] = otherInfo
                }

                //存到chart info 裡
                chart_data.rec[click_item] = responce
                
                //有成功，換insight key
                main_insight_key = click_item
                //set main canvas id
                main_chart_id = chart_id

                // dwaw type 1,2 chart
                drawRec("1",responce)
                drawRec("2",responce)
                
            }
        });
    }else{ //已經拿過了
        var responce = chart_data.rec[click_item]   
        if(Object.keys(responce).length!=0){
            Object.values(responce).forEach(function(item){
                item.forEach(function(data){
                    label_data[data.chart_index] = 0.0
                })
            })
            drawRec("1",responce)
            drawRec("2",responce)
            //有成功，換insight key
            main_insight_key = click_item
            //set main canvas id
            main_chart_id = chart_id
        }
    }
}
function drawRec(type,data){
    // clean items if there is any item
    var list = (type=="1")? document.getElementById('drill_down_list'):document.getElementById('comparison_list')
    list.innerHTML=""
    var recs = (type=="1")? data.type1.filter(function(item){return !item.is_selected}) : data.type2.filter(function(item){return !item.is_selected})
    var canvas_id_head = (type=="1")? "drill_canvas_" : "comparison_canvas_" 

    // create canvas id
    recs.forEach(function(i,index,array){
        // create list element
        var item = document.createElement("li")
        setAttributes(item,{class:"item",style:"display: inline-block;"+"padding:"+list_item_padding})
        list.appendChild(item)
        var canvas_id = canvas_id_head.concat(index.toString())
        var card = addElement(item,canvas_id,recs[index])
        item.appendChild(card)
    });
    var explore_view = document.getElementById("explore_view_"+curr_sheet_num)
    explore_view.style.top = 0
}



////// handle button in the chart(recommendation view) navigation bar ///// 
function onYelloStarBtnClick(){
    var canvas = $(this).parents('.content').siblings('.extra.content').children("canvas")
    var icon = $(this).children('.icon')
    if(canvas.length!=0){
        icon.toggleClass("outline")
        if(!icon.hasClass("outline")){ //實心的
            var label = 0.3
        }else{ //空心的
            var label = 0.6
        }
        var chart_index = canvas.attr('data-chartIndex')
        label_data[chart_index] = label

        //update chart data on the main canvas
        if(main_chart_id){
            var data = chart_datas[curr_dataset][main_chart_id].rec[main_insight_key]
            values = Object.values(data)
            keys = Object.keys(data)

            outerLoop:
            for(let i=0;i<values.length;i++){
                list = values[i]
                for(let j=0;j<list.length;j++){
                    if(list[j] && parseInt(list[j].chart_index) == chart_index){
                        chart_datas[curr_dataset][main_chart_id].rec[main_insight_key][keys[i]][j].label = label
                        break outerLoop
                    }
                }
            }
        }
        console.log(label_data)           
    }
}

function onGreyPlusBtnClick(){
    var canvas_id = $(this).parents('.content').siblings('.extra.content').children("canvas").attr('id')
    var chart_index = document.getElementById(canvas_id).getAttribute('data-chartIndex') 
    
    var label = 0.6
    label_data[chart_index] = label    

    // add chart to seq container
    var data = chart_datas[curr_dataset][main_chart_id].rec[main_insight_key]
    var target_data = data

    values = Object.values(target_data)
    keys = Object.keys(target_data)
    outerLoop:
    for(let i=0;i<values.length;i++){
        list = values[i]
        for(let j=0;j<list.length;j++){
            if(list[j] && parseInt(list[j].chart_index) == chart_index){
                chart_datas[curr_dataset][main_chart_id].rec[main_insight_key][keys[i]][j].is_selected=true
                chart_datas[curr_dataset][main_chart_id].rec[main_insight_key][keys[i]][j].label =label
                
                // update expand type
                var chart_data = target_data[keys[i]][j]

                // set parent chart insight key
                chart_data.parent_insight_key = main_insight_key

                // set parent chart_id
                chart_data.parent_chart_id = main_chart_id

                break outerLoop
            }
        }
    }

    addChart2Tree(chart_data)
    
    // update visRec info
    var type = (canvas_id.split("_")[0] == "drill")? "1" : "2"
    drawRec(type,data)
}


////// handle button in the chart(in the tree view) navigation bar ///// 
function onResetZoom(){
    // dimmer
    
    if($(this).parents('.seq_chart_container').length!=0){
        var chart_id = $(this).parents('.seq_chart_container')[0].id.split("-")[0]
    }else{
        var chart_id = $(this).parents('.ui.card').children(".extra.content").children("canvas")[0].id
    }
    var myChart = chart_objects[chart_id]
    myChart.resetZoom();
}

function onRedHeartBtnClick(){
    var canvas = $(this).parents('.content').siblings('.extra.content').children("canvas")
    var icon = $(this).children('.icon')
    if(canvas.length!=0){
        icon.toggleClass("outline")
        if(!icon.hasClass("outline")){ //實心的
            var label = 1.0
            
        }else{ //空心的
            var label = 0.6
        }
        //set label data
        var chart_index = canvas.attr('data-chartIndex')
        label_data[chart_index] = label
        
        //update chart data on the main canvas
        if(main_chart_id){
            var data = chart_datas[curr_dataset][main_chart_id].rec[main_insight_key]
            values = Object.values(data)
            keys = Object.keys(data)

            outerLoop:
            for(let i=0;i<values.length;i++){
                list = values[i]
                for(let j=0;j<list.length;j++){
                    if(list[j] && parseInt(list[j].chart_index) == chart_index){
                        chart_datas[curr_dataset][main_chart_id].rec[main_insight_key][keys[i]][j].label = label
                        break outerLoop
                    }
                }
            }
        }
        console.log(label_data)       
    }
}

function onCloseChart(){
    // detect chart_id
    var chart_id = "#" + $(this).parents('.seq_chart_container')[0].id.split("-")[0]

    // update tree structure
    var exclude_chart_id  = [chart_id]
    var old_tree_structure = tree_structures[curr_dataset][curr_sheet_num-1]
    var new_tree_structure = {}
    Object.keys(old_tree_structure).forEach(function(parent){
        if(!exclude_chart_id.includes(parent) ){ // delete all children node
            var children = old_tree_structure[parent].filter(function(child){
                return !exclude_chart_id.includes(child)
            })
            new_tree_structure[parent] = children
        }else{
            exclude_chart_id = exclude_chart_id.concat(old_tree_structure[parent])
        }
    })
    
    // redraw tree
    updateSeqViewByExloreView(new_tree_structure)

    // update rec list (update chart_datas)
    exclude_chart_id.forEach(function(chart_id){
        // find parent
        Object.keys(old_tree_structure).forEach(function(parent_id){
            if(old_tree_structure[parent_id].includes(chart_id)){
                parent_chart_data = chart_datas[curr_dataset][parent_id.substring(1)]
                child_chart_data  = chart_datas[curr_dataset][chart_id.substring(1)]

                parent_insight_key = child_chart_data.parent_insight_key
                expandType = "type" + child_chart_data.expandType
                
                // find chart index in the parent rec list
                // set label to 0
                parent_chart_data.rec[parent_insight_key][expandType].forEach(function(chart_data,i){
                    if(chart_data.chart_index[0] == child_chart_data.chart_index){
                        chart_datas[curr_dataset][parent_id.substring(1)].rec[parent_insight_key][expandType][i].is_selected = false
                        chart_datas[curr_dataset][parent_id.substring(1)].rec[parent_insight_key][expandType][i].label = 0
                        
                    }
                })
            }
        })
    })
    
    tree_structures[curr_dataset][curr_sheet_num-1] = new_tree_structure


}


///// handel option panel action (multi-y,aggregation,sort) /////
function onOptionRadio(){
    // get aggre radio valule
    // get option radio value

    if($(this).find(":disabled").length==0){
        var aggre = ""
        var sort = ""
        checked_radios = $(this).parents(".ui.relaxed.divided.list").find(":checked").each(function(){
            name = this.name
            if(name.split("_")[0] == "aggre"){
                aggre = this.value
            }else if(name.split("_")[0] == "sort"){
                sort = this.value
            }
        })

        // update option value in chart_data
        chart = $(this).parents(".seq_chart_container")
        if(chart.length!=0){
            chart_id = chart[0].id.split("-")[0]
            chart_datas[curr_dataset][chart_id].aggre = aggre
            chart_datas[curr_dataset][chart_id].sort = sort
        }
        
        // get chart object
        if($(this).parents('.seq_chart_container').length!=0){
            var chart_id = $(this).parents('.seq_chart_container')[0].id.split("-")[0]
        }else{
            var chart_id = $(this).parents('.ui.card').children(".extra.content").children("canvas")[0].id
        }
        var myChart = chart_objects[chart_id]

        // get chart old highlight label
        type = myChart.config.type
        data = myChart.data
        hightlight_color = chart_colors[type][0].click
        try{
            index = data.datasets[0].backgroundColor.indexOf(hightlight_color)
        }catch(e){
            index = data.datasets[0].borderColor.indexOf(hightlight_color)
        }
            

        highlight_label = data.labels[index]

        // get chart index
        canvas_id = myChart.canvas.id
        var chart_index = document.getElementById(canvas_id).getAttribute('data-chartIndex')

        data = {}
        data.chart_index = chart_index
        data.aggre = aggre
        data.sort = sort

        $.ajax({
            type: 'POST',
            url:"http://127.0.0.1:5000/get_new_data",
            data:JSON.stringify(data)
        }).done(function(responce){
            // reset zoom
            myChart.resetZoom()

            // update y axis
            if(myChart.options.hasOwnProperty("scales")){
                myChart.options.scales.yAxes[0].scaleLabel.labelString = responce.y
            }
            
            // update data value(aggre)
            responce.datas.forEach(function(data,index){
                myChart.data.datasets[index].data = data
            })

            // update labels (sort)
            myChart.data.labels = responce.labels

            // update highlight
            updateHighlightColor(myChart,highlight_label)

            myChart.update()
        });
    }

}
function updateHighlightColor(myChart,highlight_label){
    chart_type = myChart.config.type
    data = myChart.data
    elementIndex = myChart.data.labels.indexOf(highlight_label)

    if(chart_type == "doughnut"){
        
        myChart.data.datasets.forEach(function(item,i){
            var color_index = 0 
            myChart.data.datasets[i].backgroundColor  =  item.backgroundColor.map(function(color,index){
                if(item.data[index]!=0){
                    color = (index!=elementIndex)? chart_colors[chart_type][i].main[color_index] : chart_colors[chart_type][i].click    
                    color_index++
                    return color
                     
                }else{
                    return chart_colors[chart_type][i].main[chart_colors[chart_type][i].main.length-1]
                }
                
            })
        })
        
    }else if (chart_type == "bar"){
        myChart.data.datasets[0].backgroundColor= myChart.data.datasets[0].backgroundColor.map(function(color,index){
            return (index!=elementIndex)? chart_colors[chart_type][0].main : chart_colors[chart_type][0].click
        })
        myChart.data.datasets[0].borderColor= myChart.data.datasets[0].backgroundColor.map(function(color,index){
            return (index!=elementIndex)? chart_colors[chart_type][0].main : chart_colors[chart_type][0].click_border
        })
    }
    
}
function onMultipleYAxesClick(){
    if($(this).find(":disabled").length==0){
        checked = !$(this).find('input').is(':checked')

        // update chart_data
        chart = $(this).parents(".seq_chart_container")
        if(chart.length!=0){
            chart_id = chart[0].id.split("-")[0]
            chart_datas[curr_dataset][chart_id].multiple_yAxes = checked
        }
        

        // get chart object
        if($(this).parents('.seq_chart_container').length!=0){
            var chart_id = $(this).parents('.seq_chart_container')[0].id.split("-")[0]
        }else{
            var chart_id = $(this).parents('.ui.card').children(".extra.content").children("canvas")[0].id
        }
        var myChart = chart_objects[chart_id]


        // set display
        display = (checked)? true:false
        
        if(myChart.data.datasets.length == 1){
            display = false
        }

        //if(myChart.options.scales.yAxes.length > 1){
        //    myChart.options.scales.yAxes[1].display = display
        //}

        ///////// revised 2020.01 ////////////
        if(myChart.options.scales.hasOwnProperty("close_yAxes")){
            if(display == false){
                myChart.options.scales.yAxes = Object.assign([],myChart.options.scales.close_yAxes);
                myChart.options.scales.yAxes[0].position = "left";
                delete myChart.options.scales.yAxes[0].ticks.fontColor;
                myChart.options.scales.yAxes[0].scaleLabel.display = true;
            }else{
                var canvas_id =  "seq_chart_".concat(chart_id.substring(8))
                var chart_data = chart_datas[curr_dataset][chart_id]
                if(chart_data != null){
                    myChart.options.scales.yAxes = Object.assign([],myChart.options.scales.temp_yAxes);
                    drawChart(chart_data,canvas_id,chart_id)
                }              
            }
        }

        myChart.update()
    }
}

///// sheet manager /////
function onMenuItemClose(){
    // remove item
    var sheet_num = $(this).parent()[0].id.split("_")[1]
    $(this).parent().remove()

    // remove stored data
    explore_views[sheet_num-1] = {}
    tree_views[sheet_num-1] = {}
    tree_structures[curr_dataset][sheet_num-1] = {}

    // return to the first sheet
    var children = document.getElementById("menu").children;
    (children.length>1)?children[1].click():children[0].click();
}

///// reset setting /////
function cleanRecCanvas(){
    $("#drill_down_list").children().remove()
    $("#comparison_list").children().remove()
} 

function clean(){
    option_num = 0 // htmlElement.js

    global_chart_id=0
    main_chart_id
    main_insight_key = ''
    sheet_num = 1
    curr_sheet_num = 1
    label_data = {}
    curr_dataset = ""
    
    
    explore_views = {}
    tree_views = {}
    chart_objects = {}
  
    resetList()

    //clean sheet container
    $('.sheet_container').remove()

    // clean menu
    $('.item.sheet').remove()

    var sheet_id = "Sheet_" + sheet_num
    var text = "Sheet " + sheet_num
    var sheet = document.createElement("a")
    setAttributes(sheet,{"class":"item sheet","id":sheet_id,"style":"color:"+word_color+";font-size: 12 pt;padding:"+menu_item_padding})
    sheet.innerHTML = text

    var icon = document.createElement("i")
    setAttributes(icon,{"class":"window close outline icon","style":"color:"+word_color+";margin-left:" + menu_item_margin_left})
    icon.onclick = onMenuItemClose  

    var menu = document.getElementById("menu")
    menu.appendChild(sheet)
    sheet.appendChild(icon)
    $("#" + sheet_id).addClass('active').siblings('.item').removeClass('active');

    //show "init" div 
    document.getElementById('init').style.display="block"
    document.getElementById('add_a_chart_card').style.visibility = "hidden"
    ///////////////// Add to gen poster ////////////////////
    document.getElementById('gen_poster_btn').style.visibility = "hidden"

    //clean rec 
    cleanRecCanvas()

    // clean treant 
    $('#chart_temp').children().remove()    
}

function resetList(){
    tree_structures = {}
    chart_datas={}
    store_label_data = {}

    dataset_names.forEach(function(item){
        tree_structures[item] = {}
        chart_datas[item] = {}
        store_label_data[item]=[]
    })
}

function updateTrainingData(){
    //store the rec label (in client)
    if(Object.keys(label_data).length>1){
        var store_chart_data = chart_datas[curr_dataset][main_chart_id]
        if(store_chart_data){
            if(Object.keys(store_chart_data.insights).includes(main_insight_key.toString())){
                var insight_text = store_chart_data.insights[main_insight_key.toString()]
            }else{
                var insight_text ='none'
            }
            one_round_label = {
                key:main_insight_key,
                chart:main_chart_id,
                insight: insight_text,
                rec: store_chart_data.rec[main_insight_key] 
            }
            store_label_data[curr_dataset].push(one_round_label)
        }
    }

    // update training data in server
    var chart_info = {}
    chart_info.label_data = label_data

    $.ajax({
        type: 'POST',
        url:"http://127.0.0.1:5000/update_tr_data",
        data:JSON.stringify(chart_info)

    }).done(function(responce){
        console.log("update training data")
    })
}


////// navigation view ///////
// navigation view is a thumbnail of the tree structure (see the CHI 2020 paper for detail)
// this view is not used in the current version(IEEE VIS 2020)

// Exploration(navigation) view
function addExploreView(){
    var explore_tree_structure = {
        chart: {
            //container: "#explore_view_"+curr_sheet_num, // div id
            container: "#explore_view_"+curr_sheet_num.toString(),
            callback : {
                onAfterAddNode: nodeEvent,
                onTreeLoaded :nodeEvent
            },
            rootOrientation :"WEST",
            levelSeparation:    20,
            siblingSeparation:  30,
            subTeeSeparation:   30,
            nodeAlign: "BOTTOM",
            padding: 35,
            node: { 
                HTMLclass: "evolution-tree",
                collapsable: true
            },
            connectors: {
                type: "curve",
                style: {
                    "stroke-width": 2,
                    "stroke-linecap":"round",
                    "stroke":"#ccc"
                }
            },
        },
        nodeStructure: {
            pseudo :true,
            HTMLid:'root',
        }
    };
    var explore_view = new Treant(explore_tree_structure,null,$);
    explore_views[curr_sheet_num-1]=explore_view
}

function nodeEvent(){
    var $oNodes = $('.the-parent').unbind("click");
    
    $oNodes.click(
        function(){nodeClick($(this),$oNodes)},
    );
    $oNodes.hover(function(){
        $(this).css({width:node_hover_size,height:node_hover_size});

    },function(){
        $(this).css({width:node_size,height:node_size});
    })
    $('.collapse-switch').remove()
}

function nodeClick(this_obj,Nodes){
    if(this_obj.hasClass("selected")){ //要隱藏的
        console.log(this_obj.data('treenode').parentId)
        if(this_obj.data('treenode').parentId!=0){
            //transparent this node
            this_obj.css({'background-color':"transparent"});
            this_obj.removeClass("selected")
            
                                
            //hide all children node
            var stack = [this_obj]
            
            while(stack.length!=0){
                var $curr = stack.pop()
                var children_ids = $curr.data('treenode').children
                var childrens = Object.values(Nodes).filter(function(node){
                    var children_info = $('#'+node.id).data('treenode')
                    if(children_info && children_ids.includes(children_info.id)){
                        return node
                    }
                })
                if(childrens.length!=0){
                    for(let i=0;i<childrens.length;i++){
                        $('#'+childrens[i].id).css({'background-color':"transparent"});
                        $('#'+childrens[i].id).removeClass("selected")
                        stack.push($('#'+childrens[i].id))
                    }    
                }
            }
        }
    }else{ // 要show的
        //highlight this node
        this_obj.css({'background-color':node_selected_color});
        this_obj.addClass("selected")
                            
        //highlight all parent node
        var stop = false
        var $curr = this_obj
        while(!stop){
            var parent_id = $curr.data('treenode').parentId
            var parent = Object.values(Nodes).filter(function(node){
                var parent_info = $('#'+node.id).data('treenode')
                if(parent_info && parent_info.id == parent_id){
                    return node
                }
            })

            if(parent.length!=0){
                $('#'+parent[0].id).css({'background-color':node_selected_color});
                $('#'+parent[0].id).addClass("selected")
                $curr = $('#'+parent[0].id)

            }else{
                stop = true
            }
        }
    } 
    
    updateSeqViewByExloreView()
}

////// main ////// 
$(document).ready(function(){   
    
    // activate widgets
    $('.ui.dropdown').dropdown()
    $('.checkbox').checkbox()

    //// widgets setting  
    // chart font size
    Chart.defaults.global.defaultFontSize = 16

    // Button setting
    $('.icon').hover(function(){
        $(this).css("cursor","pointer")
    })

    // change user button setting
    $("#change_user").hover(
        function(){
            $(this).css("background-color",change_user_button_color)
        },
        function(){
            $(this).css("background-color","transparent")
        }
    )

    // close sheet (first icon)
    item = document.getElementsByClassName("window close outline icon")[0]
    item.onclick = onMenuItemClose
   

    // add all dataset options
    $.ajax({
        type: 'POST',
        url:"http://127.0.0.1:5000/get_datasets",
        data:JSON.stringify([])
    }).done(function(responce){
        //change options
        $('#dataset_dropdown').dropdown('change values',responce);
        $('#dataset_dropdown').children('.default.text').text(responce[0].name)

        // update datasets list
        responce.forEach(function(item){
            dataset_names.push(item.name) 
        })
        resetList()
    });

    
    //Add a chart btn. Show the axis selection card
    $('#add_a_chart_btn').click(function(){
        //set column depend on the selected dataset
        var changed_dataset = $('#dataset_dropdown').dropdown('get text')
        var init_model_option = $("#model_dropdown").dropdown("get text")
        var data = {}
         
        if(changed_dataset!=curr_dataset && curr_dataset!=""){// 若換資料
            //存檔
            data.store_dataset = curr_dataset   
            data.store_structure = tree_structures[curr_dataset]
            data.store_label_data = store_label_data[curr_dataset]
            data.store_chart_data = chart_datas[curr_dataset]
        
            //clean UI
            clean()
        }
        //change dataset
        curr_dataset = changed_dataset

        // create data
        data.dataset_name = changed_dataset
        data.init_model_option = init_model_option
        
        $.ajax({
            type: 'POST',
            url:"http://127.0.0.1:5000/get_options",
            data:JSON.stringify(data)
        }).done(function(responce){
            //change options
            $('#x_axis').dropdown('change values',responce.x_axis);
            $('#x_axis').children('.default.text').text(responce.x_default)
            $('#y_axis').dropdown('change values',responce.y_axis);
            $('#y_axis').children('.default.text').text(responce.y_default)
            
            // show card
            document.getElementById('add_a_chart_card').style.visibility="visible"    
        });
        
    })

    //Sheet controller
    $('.ui.bottom.fixed.menu').on('click', '.item', function() {
        if($(this).attr('id')!="add_sheet") {
          //change sheet 
          $(this).addClass('active').siblings('.item').removeClass('active');
          
          //hide old sheet container
          var sheet_container = document.getElementById('sheet_container_'+curr_sheet_num)
          if (sheet_container) sheet_container.style.display = "none"
          
          //clean rec result
          cleanRecCanvas()
          
          //show curr seq container
          curr_sheet_num = $(this).attr('id').split("_")[1]
          sheet_container = document.getElementById('sheet_container_'+curr_sheet_num)
          
          if(sheet_container)
          {
            sheet_container.style.display = "block"
              //hide init if it has the container
              document.getElementById('init').style.display="none"
              // show init if tree is null
              if(Object.keys(tree_structures[curr_dataset][curr_sheet_num-1]).length==0){
                document.getElementById('init').style.display="block"
                document.getElementById('add_a_chart_card').style.visibility = "hidden"

                var sheet_container = document.getElementById('sheet_container_'+curr_sheet_num)
                if (sheet_container) sheet_container.style.display = "none"
              }

              //change dataset
              var sheet_dataset = sheet_container.getAttribute('data-dataset')
              if(sheet_dataset!= curr_dataset){
                  $('#dataset_dropdown').dropdown('set text',sheet_dataset)
                  curr_dataset = sheet_dataset
                  
                  var data = {}
                  data.dataset_name = sheet_dataset
                  $.ajax({
                      type: 'POST',
                      url:"http://127.0.0.1:5000/update_dataset",
                      data:JSON.stringify(data)
                  }).done(function(responce){
                      label_data = {}
                      
                  });
              }
          }else{
              //show init if it doesn't have the container
              document.getElementById('init').style.display="block"
              document.getElementById('add_a_chart_card').style.visibility = "hidden"
          } 
  
        }else{
          // add a new sheet
          // store current label data
          updateTrainingData()
          
          //hide current sequence container
          var sheet_container = document.getElementById('sheet_container_'+curr_sheet_num)
          if (sheet_container) sheet_container.style.display = "none"
          
          //clean rec result
          cleanRecCanvas()
   
          //show "init" div 
          document.getElementById('init').style.display="block"
          document.getElementById('add_a_chart_card').style.visibility = "hidden"

          ///////////////// Add to gen poster ////////////////////
          document.getElementById('gen_poster_btn').style.visibility = "hidden"

          // add new sheet
          sheet_num++
          var sheet_id = "Sheet_" + sheet_num
          var text = "Sheet " + sheet_num
          
          var sheet = document.createElement("a")
          setAttributes(sheet,{"class":"item sheet","id":sheet_id,"style":"color:"+word_color+";font-size: 12 pt;padding:"+menu_item_padding})
          sheet.innerHTML = text

          var icon = document.createElement("i")
          setAttributes(icon,{"class":"window close outline icon","style":"color:"+word_color+";margin-left:" + menu_item_margin_left})
          icon.onclick = onMenuItemClose  

          var menu = document.getElementById("menu")
          menu.appendChild(sheet)
          sheet.appendChild(icon)
          $("#" + sheet_id).addClass('active').siblings('.item').removeClass('active');
          
          //update curr sheet num
          curr_sheet_num = sheet_num
        }
      });

    //change user
    $('#change_user').click(function(){
        //store data
        var data = {}
        data.store_dataset = curr_dataset   
        data.store_structure = tree_structures[curr_dataset]
        data.store_label_data = store_label_data[curr_dataset]
        data.store_chart_data = chart_datas[curr_dataset]
        data.dataset = $('#dataset_dropdown').dropdown('get text')
        data.system = $('#system').dropdown('get text')

        //clean server data
        $.ajax({
            type: 'POST',
            url:"http://127.0.0.1:5000/change_user",
            data:JSON.stringify(data)
        }).done(function(responce){
            // clean UI data
            clean();
        });
    })

    //Add a chart confirm btn. Show a user selected chart
    $('#add_a_chart_confirm_btn').click(function(){
        var chart_info = {}
        chart_info.x = $('#x_axis').dropdown('get text');
        chart_info.y = $('#y_axis').dropdown('get text');
        document.getElementById('init').style.display = "none"
        document.getElementById('add_a_chart_card').style.visibility = "hidden"
        ///////////////// Add to gen poster ////////////////////
        document.getElementById('gen_poster_btn').style.visibility = "visible"
        
        $.ajax({
            type: 'POST',
            url:"http://127.0.0.1:5000/get_init_chart",
            data:JSON.stringify(chart_info)
        }).done(function(responce){
            //add a sheet 
            addSheetContainer()
            //add explore view
            addExploreView()
            //add new chart
            addChart2Tree(responce)
        });
    })

    ///////////////// Add to gen poster ////////////////////
    $('#gen_poster_btn').click(function(){
        console.log(chart_datas[curr_dataset])
        console.log(chart_objects)
    })
})