//// Title Bar ////
const change_user_button_color = "#5F8995"

//// Sequence View ////
const white = "#FFFFFF"
const black = "#000000"
const word_color = "#ECECEC"

/// Tree view - Connectors
const drill_connector_color = "#72B36E" 
const comparison_connector_color ="#B3856E" 

/// chart / card
const hover_background_color = "#DCDBDB"
const card_content_color = "#ECECEC"
const center_color = "#818181"

// chart colors
const chart_colors = {
    "bar":[
        {
            main:"#3e95cd",
            insight_border:"#243E57", //#ff9ea5
            click:"#E95380",
            click_border:"#E95380",
        },
        {
            main:"#c9dfee",
            insight:"#ffe6e8"
        }
    ],
    "line":[
        {
            main:"#3e95cd",
            insight_border:"#243E57", //#ff9ea5
            click:"#FFFFFF",
            click_border:"#E95380",//"#70abaf",
            hover:"#FFFFFF"

        },
        {
            main:"#c9dfee",
            insight:"#ffe6e8"
        }
    ],
    "doughnut":[
        {
            main:["#015C92","#1A6C9E","#337DAA","#4C8EB6","#659FC2","#71B0CE","#97C1DA","#B0D2E6","#C9E3F2","#E2F4FF","#ECECEC"],
            click:"#E95380",
            hightlight_border:"#70abaf",
        },
        {
            main:["#015C92","#1A6C9E","#337DAA","#4C8EB6","#659FC2","#71B0CE","#97C1DA","#B0D2E6","#C9E3F2","#E2F4FF","#ECECEC"],
            click:"#EB628B",
        }
    ]
}

// other colors
const chart_border_color = "#99BBFF"

// chart card size
const chart_block_width = 375 //375 //270
const chart_block_height = 375 //375 //270
const chart_card_width = 350 //350 //250
const chart_card_height = 350 //350 //250
const chart_canvas_width = 300 //300 //200
const chart_canvas_height = 300 //300 //200

// chart_block 
const hide_block = "0px"
const hightlight_block = "3px " + chart_border_color + " solid"
const drill_block = "3px " + drill_connector_color + " solid"
const comparison_block = "3px " + comparison_connector_color + " solid"
const block_radius = "5px"

const max_filter_word_num = 35

//// Recommendation View ////
const list_item_padding = "10px"


//// Exploration View ////
const exploration_view_width = "100%"
const exploration_view_height = "100%"
const exploration_view_border = "3px solid #DDD"
const exploration_view_border_radius = "3px"

const node_size = "10px"
const node_hover_size = "12px" 

const node_selected_color = "#AAAAAA"
const edge_color = "#ccc"

//// Menu ////
const menu_item_margin_left = "10px"
const menu_item_padding = "6px"

//// Title Cleaning ////
const month_abbrev = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
const TR_userlevel = {"A":"LevelA","B":"LevelB","C":"LevelC"}
const TR_labels = {
    'invoice_price':"Revenue",
    'points_gained':"PointsGained",
    'branch_name':"Branch",
    'category':"Category",
    'user_level':"UserLevel",
    'address_code':"AddressCode",
    'gender':"Gender",
    'is_taiwan':"IsTaiwanese",
    'percentage of count':"Percentage",
    'invoice_month':"month",
    'invoice_day':"day",
    'invoice_weekday':"weekday"
}
const TR_branch = {
    'Breeze Center':"Center",
    'Breeze Xinyi':"Xinyi",
    'Breeze Songgao':"Songgao",
    'Breeze Nanjing':"Nanjing",
    'Breeze Taipei Station':"Taipei Station",
    'Breeze Super':"Super",
    'Breeze NTU Hospital':"NTU Hospital",
    'Breeze TSG Hospital':"TSG Hospital"
}