///// define html elements of interface widgets //////

option_num = 0 // for the index of radio system

function setAttributes(el, options) {
    Object.keys(options).forEach(function(attr) {
      el.setAttribute(attr, options[attr]);
    })
 }

function sheetContainer(curr_dataset,curr_sheet_num){
    // set sheet container
    var sheet_container_id = "sheet_container_" + curr_sheet_num
    var sheet_container = document.createElement("div")
    setAttributes(sheet_container,{"data-dataset":curr_dataset,"id":sheet_container_id,"class":"sheet_container","style":"width:100%;height:95%;overflow:auto"})

    // set explore view
    var exp_container = document.createElement("div")
    setAttributes(exp_container,{"id":"exp_container","style":"float:left;overflow:auto;margin-top:-51.5%;zoom: 1; vertical-align: down; width:12%; height:20%;"})

    var explore_view_id = 'explore_view_'+curr_sheet_num
    var explore_view = document.createElement("div")
    setAttributes(explore_view,{"id":explore_view_id,
                                "style":"overflow:auto;clear:left;height:"+exploration_view_height+
                                        "; width:" + exploration_view_width +
                                        "; border:" + exploration_view_border +
                                        "; border-radius:" + exploration_view_border_radius + 
                                        "; display:none;"})
    
    // set sequence view
    var seq_view_id = 'seq_view_'+curr_sheet_num
    var seq_view = document.createElement("div")
    setAttributes(seq_view,{"style":"width:100%;height:100%;clear: left;overflow:auto;"})
    setAttributes(seq_view,{"id":seq_view_id})

    sheet_container.appendChild(seq_view)
    exp_container.appendChild(explore_view)
    sheet_container.appendChild(exp_container)

    ///////////// set annotation view /////////////
    //var annotation_view_id = 'annotation_view_'+curr_sheet_num
    //var annotation_view = document.createElement("div")
    //setAttributes(annotation_view,{"style":"width:100%;height:20%;clear: left;overflow:auto; background-color: #F0F8FF; padding: 10px 15px;"})
    //setAttributes(annotation_view,{"id":annotation_view_id})

    //sheet_container.appendChild(annotation_view)

    return sheet_container
}


function filterBtn(chart_data){
    var filter = document.createElement("div")
    setAttributes(filter,{class:"circular ui left pointing dropdown icon button",style:"background: transparent;padding:5px","data-content":"Filters"})
    var filter_icon = document.createElement("i")
    setAttributes(filter_icon,{class:"filter icon"})
    var menu = document.createElement("div")
    setAttributes(menu,{class:"menu"})
    var header = document.createElement("div")
    setAttributes(header,{class:"header"})
    header.innerHTML = "Filter"
    menu.appendChild(header)
    filter.appendChild(filter_icon)
    filter.appendChild(menu)

    Object.keys(chart_data.filters).forEach(function(key){
        chart_data.filters[key].forEach(function(value){
            var item = document.createElement("div")
            setAttributes(item,{class:"item"})
            item.innerHTML = key+" : " + value
            menu.appendChild(item)
        })
    })

    return filter
}

function resetZoomBtn(onResetZoom){
    var reset = document.createElement("div")
    setAttributes(reset,{class:"circular ui icon button",style:"background: transparent;padding:5px","data-content":"Reset Zoom"})
    var reset_icon = document.createElement("i")
    setAttributes(reset_icon,{class:"undo icon"})
    reset.appendChild(reset_icon)
    reset.onclick = onResetZoom
    
    return reset
}

function optionBtn(option_id,onOptionClick){
    
    var option = document.createElement("div")
    setAttributes(option,{id:option_id,class:"circular ui icon button",style:"background: transparent;padding:5px","data-content":"Options"})
    var option_icon = document.createElement("i")
    setAttributes(option_icon,{class:"ellipsis horizontal icon"})
    option.appendChild(option_icon)
    option.onclick = onOptionClick

    return option
}

function optionCard(chart_data,option_pos,onOptionCardClose,onMultipleYAxesClick){
    // update option_num
    option_num ++
    
    var option_card = document.createElement("div")
    setAttributes(option_card,{class:"ui card",style:"width:300px;text-align: left;position:absolute;left:" + (option_pos.left+30) +"px;top:"+(option_pos.top-10)+"px;display:none"})

    // close icon
    var content = document.createElement("div")
    setAttributes(content,{class:"content",style:"text-align: left;padding:0px"})

    var right_meta = document.createElement("div")
    setAttributes(right_meta,{class:"right floated meta"})

    var close = document.createElement("div")
    setAttributes(close,{class:"circular ui icon button",style:"background: transparent;padding:5px","data-content":"Close"})
    var close_icon = document.createElement("i")
    setAttributes(close_icon,{class:"close icon"})
    close.appendChild(close_icon)
    close.onclick = onOptionCardClose

    content.appendChild(right_meta)
    right_meta.appendChild(close)

    // List
    var list = document.createElement("div")
    setAttributes(list,{class:"ui relaxed divided list",style:"padding: 12px;padding-top: 0px;margin-top: 0px;"})

    // item 1 , multiple yAxes
    var multiple_yAxes = document.createElement("div")
    setAttributes(multiple_yAxes,{class:"item"})

    var multiple_yAxes_label = document.createElement("label")
    setAttributes(multiple_yAxes_label,{style:"font-weight:bold"})
    multiple_yAxes_label.innerHTML = "Multiple yAxes"

    var label = document.createElement("label")
    label.innerHTML = ""

    toggle_class = "toggle_"+option_num
    var multiple_yAxes_toggle_checkbox = document.createElement("div")
    setAttributes(multiple_yAxes_toggle_checkbox,{class:"ui toggle checkbox "+ toggle_class,style:"padding-left: 10px;"})
    multiple_yAxes_toggle_checkbox.onclick = onMultipleYAxesClick

    var multiple_yAxes_checkbox = document.createElement("input")
    setAttributes(multiple_yAxes_checkbox,{type:"checkbox",name:"multiple"})

    multiple_yAxes.appendChild(multiple_yAxes_label)
    multiple_yAxes.appendChild(multiple_yAxes_toggle_checkbox)
    multiple_yAxes_toggle_checkbox.appendChild(label)
    multiple_yAxes_toggle_checkbox.appendChild(multiple_yAxes_checkbox)

    // item 2 , Aggregation
    var aggregation = document.createElement("div")
    setAttributes(aggregation,{class:"item"})

    var aggre_form = document.createElement("div")
    setAttributes(aggre_form,{class:"ui form"})

    var aggre_label = document.createElement("label")
    setAttributes(aggre_label,{style:"font-weight:bold;"})
    aggre_label.innerHTML = "Aggregation"

    var aggre_inline_field = document.createElement("div")
    setAttributes(aggre_inline_field,{class:"inline fields",style:"margin-top: 10px;margin-bottom: 0px;"})
    aggre_inline_field.onclick = onOptionRadio

    aggregation.appendChild(aggre_form)
    aggre_form.appendChild(aggre_label)
    aggre_form.appendChild(aggre_inline_field)

    //// sum radio
    aggre_class = "aggre_" + option_num
    var sum_field = document.createElement("div")
    setAttributes(sum_field,{class:"field",style:"padding-right: 10px;"})

    var sum_radio_checkbox = document.createElement("div")
    setAttributes(sum_radio_checkbox,{class:"ui radio checkbox " + aggre_class})

    var sum_radio = document.createElement("input")
    setAttributes(sum_radio,{type:"radio",name:"aggre_" + option_num,value:"sum"})

    var sum_label = document.createElement("label")
    sum_label.innerHTML = "Sum"

    sum_field.appendChild(sum_radio_checkbox)
    sum_radio_checkbox.appendChild(sum_radio)
    sum_radio_checkbox.appendChild(sum_label)

    //// avg radio
    var avg_field = document.createElement("div")
    setAttributes(avg_field,{class:"field",style:"padding-right: 10px;"})

    var avg_radio_checkbox = document.createElement("div")
    setAttributes(avg_radio_checkbox,{class:"ui radio checkbox "+aggre_class})

    var avg_radio = document.createElement("input")
    setAttributes(avg_radio,{type:"radio",name:"aggre_" + option_num,value:"avg"})

    var avg_label = document.createElement("label")
    avg_label.innerHTML = "Avg"

    /// set radio checked based on the previous result
    var checked_aggre_radio = (chart_data.aggre == "sum")? sum_radio:avg_radio
    setAttributes(checked_aggre_radio,{checked:"checked"})

    avg_field.appendChild(avg_radio_checkbox)
    avg_radio_checkbox.appendChild(avg_radio)
    avg_radio_checkbox.appendChild(avg_label)

    //// ctn radio
    aggre_inline_field.appendChild(sum_field)
    aggre_inline_field.appendChild(avg_field)
    

    // item 3 ,  Sorted
    var sort = document.createElement("div")
    setAttributes(sort,{class:"item"})

    var sort_form = document.createElement("div")
    setAttributes(sort_form,{class:"ui form"})

    var sort_label = document.createElement("label")
    setAttributes(sort_label,{style:"font-weight:bold;"})
    sort_label.innerHTML = "Sorted"

    var sort_inline_field = document.createElement("div")
    setAttributes(sort_inline_field,{class:"inline fields",style:"margin-top: 10px;margin-bottom: 0px;"})
    sort_inline_field.onclick = onOptionRadio

    sort.appendChild(sort_form)
    sort_form.appendChild(sort_label)
    sort_form.appendChild(sort_inline_field)

    //// Descending radio
    sort_class = "sort_" + option_num

    var desc_field = document.createElement("div")
    setAttributes(desc_field,{class:"field",style:"padding-right: 10px;"})

    var desc_radio_checkbox = document.createElement("div")
    setAttributes(desc_radio_checkbox,{class:"ui radio checkbox " + sort_class})

    var desc_radio = document.createElement("input")
    setAttributes(desc_radio,{type:"radio",name:"sort_" + option_num,value:"desc"})

    var desc_label = document.createElement("label")
    desc_label.innerHTML = "Descending"

    desc_field.appendChild(desc_radio_checkbox)
    desc_radio_checkbox.appendChild(desc_radio)
    desc_radio_checkbox.appendChild(desc_label)

    //// Ascending radio
    var asc_field = document.createElement("div")
    setAttributes(asc_field,{class:"field",style:"padding-right: 10px;"})

    var asc_radio_checkbox = document.createElement("div")
    setAttributes(asc_radio_checkbox,{class:"ui radio checkbox "+ sort_class})

    var asc_radio = document.createElement("input")
    setAttributes(asc_radio,{type:"radio",name:"sort_"+  option_num,value:"asc"})

    var asc_label = document.createElement("label")
    asc_label.innerHTML = "Ascending"

    asc_field.appendChild(asc_radio_checkbox)
    asc_radio_checkbox.appendChild(asc_radio)
    asc_radio_checkbox.appendChild(asc_label)

    //// Fixed radio
    var fix_field = document.createElement("div")
    setAttributes(fix_field,{class:"field",style:"padding-right: 10px;"})

    var fix_radio_checkbox = document.createElement("div")
    setAttributes(fix_radio_checkbox,{class:"ui radio checkbox " + sort_class})

    var fix_radio = document.createElement("input")
    setAttributes(fix_radio,{type:"radio",name:"sort_" + option_num,value:"fix"})

    var fix_label = document.createElement("label")
    //fix_label.innerHTML = "Fixed"
    fix_label.innerHTML = "Original"


    /// set sort radio based on the previous setting
    var checked_sort_radio
    switch(chart_data.sort){
        case "desc":
            checked_sort_radio = desc_radio
            break
        case "asc":
            checked_sort_radio = asc_radio
            break
        case "fix":
            checked_sort_radio = fix_radio
            break
    }
    setAttributes(checked_sort_radio,{checked:"checked"})

    fix_field.appendChild(fix_radio_checkbox)
    fix_radio_checkbox.appendChild(fix_radio)
    fix_radio_checkbox.appendChild(fix_label)

    sort_inline_field.appendChild(desc_field)
    sort_inline_field.appendChild(asc_field)
    sort_inline_field.appendChild(fix_field)

    // list 
    list.appendChild(multiple_yAxes)
    list.appendChild(aggregation)
    list.appendChild(sort)

    //option card
    option_card.appendChild(content)
    option_card.appendChild(list)

    // activate checkBox
    $('.checkbox').checkbox()


    return option_card

}

function iconsDiv(chart_id,chart_data,onRedHeartBtnClick,onCloseChart,onYelloStarBtnClick,onGreyPlusBtnClick){
    var icons = document.createElement("div")
    setAttributes(icons,{class:"right floated meta"})

    if(chart_id!=""){
        // this chart is in the sequence view
        var heart_button = document.createElement("button")
        setAttributes(heart_button,{class:"circular ui icon button",style:"background:transparent;padding:5px","data-content":"Like"})
        var heart_icon = document.createElement("i")
        setAttributes(heart_icon,{class:"red heart outline icon"})
        heart_button.onclick = onRedHeartBtnClick
        heart_button.appendChild(heart_icon)
        
       
        if(chart_data.label == 1.0){
            heart_icon.setAttribute('class','red heart icon')
        }

        var close_button = document.createElement("button")
        setAttributes(close_button,{class:"circular ui icon button",style:"background:transparent;padding:5px","data-content":"Close"})
        var close_icon = document.createElement("i")
        setAttributes(close_icon,{class:"close icon",style:"background: transparent"})
        close_button.onclick = onCloseChart
        close_button.appendChild(close_icon)

        // add html
        icons.appendChild(heart_button)
        icons.appendChild(close_button)

    }else{
        // this chart is in the recommendation view
        var star_button = document.createElement("button")
        setAttributes(star_button,{class:"circular ui icon button",style:"background:transparent;padding:5px","data-content":"See Later"})
        var star_icon = document.createElement("i")
        setAttributes(star_icon,{class:"yellow star outline icon",style:"background: transparent"})
        star_button.onclick = onYelloStarBtnClick
        star_button.appendChild(star_icon)

        if(chart_data.label == 0.3){
            star_icon.setAttribute('class','yellow star icon')
        }

        var plus_button = document.createElement("button")
        setAttributes(plus_button,{class:"circular ui icon button",style:"background:transparent;padding:5px","data-content":"Add to Sequence view"})
        var plus_icon = document.createElement("i")
        setAttributes(plus_icon,{class:"plus icon",style:"background: transparent"})
        plus_button.onclick = onGreyPlusBtnClick
        plus_button.appendChild(plus_icon)

        // add html
        icons.appendChild(star_button)
        icons.appendChild(plus_button)
    }

    return icons
}

function extraContent(canvas_id){
    var extra_content = document.createElement("div")
    setAttributes(extra_content,{class:"extra content",style:"padding:8px 8px 5px 8px;"})
    var canvas = document.createElement("canvas")
    setAttributes(canvas,{id:canvas_id,"max-width": chart_canvas_width+"px","max-height": chart_canvas_height+"px"})
    extra_content.appendChild(canvas)

    return extra_content
}

function legendDiv(chart_data){
    var legend = document.createElement("div")
    setAttributes(legend,{class:"legend",style:"text-align: left;padding-left:8px;border-top: 1px solid #ECECEC;"})
    var labels = chart_data.datas[0].label.split(/:|, /)
    // set Legends
    chart_data.datas.forEach(function(item,i){
        var container = document.createElement("div")
        setAttributes(container,{style:"padding:5px 10px; width:50%; float:left; overflow:hidden;"})
        if(chart_data.type!="doughnut"){
            var circle = document.createElement("div")
            var backgroundColor = chart_colors[chart_data.type][i].main
            setAttributes(circle,{class:"dot",style:"height:8px;width:8px;border-radius: 50%;display: inline-block;background-color:" + backgroundColor})
            var text = document.createElement("div")
            setAttributes(text,{style:"display:inline-block;margin-left:3px;color:#707070;font-size:9pt"})
            //text.innerHTML = (item.label.length<max_filter_word_num)? item.label: item.label.substring(0,max_filter_word_num)+"..." 
            if(i==chart_data.datas.length-1){
                if(curr_dataset == "Transaction"){
                    text.innerHTML = (labels.length == 1)? item.label : item.label + " " + TR_labels[labels[labels.length-2]]
                }else{
                    text.innerHTML = (labels.length == 1)? item.label : item.label + " " + labels[labels.length-2]
                }
            }else{
                if(curr_dataset == "Transaction"){
                    text.innerHTML = TR_labels[labels[labels.length-2]] + ": " + labels[labels.length-1]
                }else{
                    text.innerHTML = labels[labels.length-2] + ": " + labels[labels.length-1]
                }
            }
            text.innerHTML = (text.innerHTML.length>23)? text.innerHTML.substring(0,23)+"..." : text.innerHTML
            
            legend.appendChild(container)
            container.appendChild(circle)
            container.appendChild(text)
        }else{
            if(chart_data.datas.length>1){
                var text = document.createElement("div")
                setAttributes(text,{style:"display:inline-block;margin-left:3px;color:#707070;font-size:9pt"})
                text.innerHTML = (i == 0)? "Outer: " + labels[labels.length-1] : "Inner: Overall"
                text.innerHTML = (text.innerHTML.length>23)? text.innerHTML.substring(0,23)+"..." : text.innerHTML

                legend.appendChild(container)
                container.appendChild(text)
            }
        }
    })
    return legend
}
///////// revised 2020.01 ////////////
function titleDiv(chart_data){
    var title = document.createElement("div")
    setAttributes(title,{class:"title",style:"text-align: center;padding: 8px 5px 8px 5px;"})
    var text = document.createElement("div")
    setAttributes(text,{style:"display:inline-block;color:#2874A6 ;font-size:12pt;font-weight:bold"})
    var x_ = chart_data.x
    var y_ = chart_data.y.split("(")[0]
    if(curr_dataset == "Transaction"){
        x_ = TR_labels[x_]
        y_ = TR_labels[y_]
    }
    var title_name = ""
    if(Object.keys(chart_data.filters).length===0){
        title_name = y_+" in overall "+x_
    }
    else{
        title_name = y_+" in "
        var labels = chart_data.datas[0].label.split(/:|, /)
        for(i=1;i<labels.length;i+=2){
            if(labels[i-1] == "month" || labels[i-1] == "invoice_month"){
                title_name += month_abbrev[parseInt(labels[i])]
            }
            else if(labels[i-1] == "user_level"){
                title_name += TR_userlevel[labels[i]]
            }
            else title_name += labels[i]
            
            if(i<labels.length-1)   title_name += ", "
        }
        title_name += " (" + x_ + ")"
    }
    text.innerHTML = title_name
    text.innerHTML = (text.innerHTML.length>40)? text.innerHTML.substring(0,40)+"..." : text.innerHTML
    title.appendChild(text)
    return title
}

/////////////////// revised 2020.01 //////////////////
function disableYAxes(chart_data){
    if(chart_data.multiple_yAxes == false){
        $(".toggle_" + option_num).checkbox("uncheck");
        $(".toggle_" + option_num).checkbox("set disabled");
    }
}

function activateElements(dataset_num,chart_data){
    $('.checkbox').checkbox()

    // init multiple yAxes
    if(dataset_num>1){
        $(".toggle_" + option_num).checkbox("check");
    }else{
        $(".toggle_" + option_num).checkbox("set disabled");
    }

    // disable radio button
    if(chart_data.type == "line"){
        // disable aggregation
        $(".sort_" + option_num).checkbox("set disabled")
    }else if(chart_data.type == "doughnut") {
        // disable multiple yAxes
        $(".toggle_" + option_num).checkbox("set disabled");
        // disable aggregation
        $(".aggre_"+option_num).checkbox("set disabled")
    }


    // filter dropdown
    $('.ui.dropdown').dropdown()

    // icon button
    $('.ui.icon.button').popup()    
     
    $(".ui.icon.button").hover(
        function(){
            $(this).css("background-color",hover_background_color)
        },
        function(){
            if($(this).attr('id')!="add_a_chart_btn"){
                $(this).css("background-color","transparent")
            } 
        }   
    )
}

// draaw chart
function updateCanvasElement(canvas_id){
    //destroy old canvas
    var old_canvas = document.getElementById(canvas_id)
    var parent = old_canvas.parentElement
    document.getElementById(canvas_id).remove()
    //add new canvas
    var new_canvas = document.createElement("canvas")
    setAttributes(new_canvas,{id:canvas_id,width: chart_canvas_width+"px",height: chart_canvas_height+"px"})
    parent.appendChild(new_canvas)
}

///////////////////// get key & value //////////////////
var month = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

function getKeyByValue(object, value, unit) {
    var key = Object.keys(object).find(key => object[key] === value);
    if(unit=="month") return month[key];
    else return key;
}

function getAllFilters(object){
    var text = ""
    var filter = []
    Object.keys(object).forEach(function(element){
        //console.log(element +":"+ object[element])
        if(element=="month") filter.push(month[object[element]])
        else filter.push(object[element])
    })
    if(filter.length!=0){ text+="At "; }
    for(i=filter.length-1;i>=0;i--){
        text += filter[i]
        text += ", "
    }
   return text;
}
