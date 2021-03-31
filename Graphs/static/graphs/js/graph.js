 
// TODO: [*] slow down spasms
//       [*] one edge at a time
//       [*] fix nodes in place (Ego only?)
//       [*] make size track number of edges at timesnap
//       [*] add size filter
//       [*] add actual id
//       [_] check with database for correctness
//       [*] correct the redundancy in edge removal and addition
//       [_] dream = proof of concept (concept preview), demonstrate the 
//                  potential of the data gathering tool(one of the main 
//                  intellectual outputs of the project) in advisory
//       [_] add page to put in information, immediate visualization
//       [_] add bar charts for properties
//       [_] add smoker non smoker identifier
//       [*] general data vis page with links to individual entries, bubble charts, scatter plots, splines
//       [_] new patient input and report page
//       [_] May 10th, April 15
//       [_] check id 33
//       [*] red blue edge
//       [*] node black white
//       [*] dashed weak edges 
//       [*] node by node transition
//       [*] timeline dragable
//       [_] leaver and joiner properties
//       [_] halo on leavers
//       [*] time line + unnamed skeleton network that lights up
//       [*] smoother transition
//       [*] continuous updates
//       [_] week and strong relationship legend
//       [_] thicker edges
//       [_] video bar time progression
//       
//       [_] 27, 72, 142, 171, 66, 41, 94
//       
//       --causality from correlation--
//       hill criterion for causality
//       randomized control
//       instrumental variable
//       
//       

var graph = null;  

var timeouts = [];
 
$(document).ready(function() {   
    if (initial == -1) initial = 5;
    select_pid(initial); 
});

$("#videoplay").click(function(event) {    
    $("#lm0").css('-webkit-filter', 'blur(0px)');
    timeouts.push(
        setTimeout(function() { 
            graph.changenodes("graphRec3", '3');  
        }, 2000)
    ); 
});

function select_pid(pid) {
    $.ajax({
        url: '/jsonet/',
        data: {
            'pid': pid
        },
        dataType: 'json',
        success: function (data) { 
            clearPage();
            var graph0 = JSON.parse(data.g0),
                graph0copy = JSON.parse(data.g0),
                graph3 = JSON.parse(data.g3),
                graph3copy = JSON.parse(data.g3),
                graph6 = JSON.parse(data.g6),
                graph6copy = JSON.parse(data.g6);
            
            graph = new RenderGraph(graph0, graph3, graph6, "#d3-0"); 
            $("#piddisp").html("Patient " + feats['study_id'][pid-1])
            $("#netsize").html("Network size = " + (graph.egodegree + 1)); 

            let lm0 = new StaticGraph(graph0copy, "#lm0"); 
            let lm3 = new StaticGraph(graph3copy, "#lm3"); 
            let lm6 = new StaticGraph(graph6copy, "#lm6"); 

        }
    });
}

function clearPage() {
    for (var i=0; i<timeouts.length; i++)
        clearTimeout(timeouts[i]);
    $("#d3-0").empty(); 
    $("#lm0").empty();
    $("#lm3").empty();
    $("#lm6").empty();
    $("#lm0").css('-webkit-filter', 'blur(1.5px)');
    $("#lm3").css('-webkit-filter', 'blur(1.5px)');
    $("#lm6").css('-webkit-filter', 'blur(1.5px)');
}   


