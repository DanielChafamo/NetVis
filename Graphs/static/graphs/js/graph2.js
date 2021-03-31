
var graph;
function myGraph() {

    // Add and remove elements on the graph object
    this.addNode = function (id, name, degree) {
        nodes.push({"id": id, "name": name, "degree":degree});
        update();
    };

    this.removeNode = function (id) {
        var i = 0;
        var n = findNode(id);
        while (i < links.length) {
            if ((links[i]['source'] == n) || (links[i]['target'] == n)) {
                links.splice(i, 1);
            }
            else i++;
        }
        nodes.splice(findNodeIndex(id), 1);
        update();
    };

    this.removeLink = function (source, target) {
        for (var i = 0; i < links.length; i++) {
            if (links[i].source.id == source && links[i].target.id == target) {
                links.splice(i, 1);
                break;
            }
        }
        update();
    };

    this.removeallLinks = function () {
        links.splice(0, links.length);
        update();
    };

    this.removeAllNodes = function () {
        nodes.splice(0, links.length);
        update();
    };

    this.addLink = function (source, target, value) {
        links.push({"source": findNode(source), "target": findNode(target), "value": value});
        update();
    };

    var findNode = function (id) {
        for (var i in nodes) {
            if (nodes[i]["id"] === id) return nodes[i];
        }
        ;
    };

    var findNodeIndex = function (id) {
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].id == id) {
                return i;
            }
        }
        ;
    };

    // set up the D3 visualisation in the specified element
    var w = 960,
        h = 450;

    var color = d3.scale.category10();

    var vis = d3.select("body")
            .append("svg:svg")
            .attr("width", w)
            .attr("height", h)
            .attr("id", "svg")
            .attr("pointer-events", "all")
            .attr("viewBox", "0 0 " + w + " " + h)
            .attr("perserveAspectRatio", "xMinYMid")
            .append('svg:g');

    var force = d3.layout.force();

    var nodes = force.nodes(),
            links = force.links();

    var update = function () {
        var link = vis.selectAll("line")
                .data(links, function (d) {
                    return d.source.id + "-" + d.target.id;
                });

        link.enter().append("line")
                .attr("id", function (d) {
                    return d.source.id + "-" + d.target.id;
                })
                .attr("stroke", function (d) { 
                    if (d.value == 1) return 'blue';
                    else return 'red';})
                .attr("stroke-dasharray", function (d) { if (d.value == 1) return ("3, 3")})
                .attr("class", "link");
        link.append("title")
                .text(function (d) {
                    return d.value;
                });
        link.exit().remove();

        var node = vis.selectAll("g.node")
                .data(nodes, function (d) {
                    return d.id;
                });

        var nodeEnter = node.enter().append("g")
                .attr("class", "node")
                .call(force.drag);

        nodeEnter.append("svg:circle")
                .attr("r", function (d) {return 2 + 1.5*d.degree})
                .attr("id", function (d) {
                    return "Node;" + d.id;
                })
                .attr("class", "nodeStrokeClass")
                .attr("fill", function(d) { 
                    if (d.name == "Ego") return 'black';
                    else return 'white'; });

        nodeEnter.append("svg:text")
                .attr("class", "textClass")
                .attr("x", 14)
                .attr("y", ".31em")
                .text(function (d) {
                    return d.name;
                });

        node.exit().remove();

        force.on("tick", function () {

            node.attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

            link.attr("x1", function (d) {
                return d.source.x;
            })
                    .attr("y1", function (d) {
                        return d.source.y;
                    })
                    .attr("x2", function (d) {
                        return d.target.x;
                    })
                    .attr("y2", function (d) {
                        return d.target.y;
                    });
        });

        // Restart the force layout.
        force
                .gravity(.01)
                .charge(-80000)
                .friction(0)
                .linkDistance( function(d) { return d.value * 50 } )
                .size([w, h])
                .start();
    };


    // Make it all go
    update();
}

function initGraph(graphdata) {

    graph = new myGraph();
    // console.log(graphdata.links)
    for (var i = graphdata.nodes.length - 1; i >= 0; i--) {
         graph.addNode(graphdata.nodes[i].id, 
                       graphdata.nodes[i].name,
                       graphdata.nodes[i].degree);
    }
    for (var i = graphdata.links.length - 1; i >= 0; i--) {
        graph.addLink(graphdata.links[i].source, 
                      graphdata.links[i].target, 
                      graphdata.links[i].weight)
    }
    keepNodesOnTop();
}


function updateGraph(graphfrom, graphto) {
    // callback for the changes in the network
    console.log('changing')
    var step = -1;
    function nextval()
    {
        step++;
        return 200 + (150*step); // initial time, wait time
    }

    var in_links = graphfrom.links.map(get_id);
    var out_links = graphto.links.map(get_id);
    var remove = in_links.filter((x)=>out_links.indexOf(x)===-1);
    var add = out_links.filter((x)=>in_links.indexOf(x)===-1);
    remove.sort(); add.sort(); 

    let i = 1;
    while (remove.length !== 0 || add.length !== 0) {
        let current, from, remove_now, add_now;
        remove_now = [];
        add_now = [];
        if (i % 2 == 0) {
            if (remove.length !== 0)  {
                current = remove.splice(0,1)[0];
                remove_now = [current]
            }
            else {
                current = add.splice(0,1)[0];
                add_now = [current]
            }
        } else {
            if (add.length !== 0)  {
                current = add.splice(0,1)[0];
                add_now = [current]
            }
            else {
                current = remove.splice(0,1)[0];
                remove_now = [current]
            }
        }
        from = current.split('_')[0];
        
        while (remove.length !== 0) {
            if (remove[0].split('_')[0] == from) remove_now.push(remove.splice(0,1)[0]);
            else break;
        }
        while (add.length !== 0) {
            if (add[0].split('_')[0] == from) add_now.push(add.splice(0,1)[0]);
            else break;
        } 
        for (let j = remove_now.length - 1; j >= 0; j--) {
            in_links = graphfrom.links.map(get_id);
            var linkr = graphfrom.links.splice(in_links.indexOf(remove_now[j]), 1)[0]; 
            console.log(linkr)
            setTimeout(function() {
                graph.removeLink(linkr.source, linkr.target);
                keepNodesOnTop();
            }, nextval());
        }
        for (let k = add_now.length - 1; k >= 0; k--) {
            out_links = graphto.links.map(get_id);
            var linka = graphto.links[out_links.indexOf(add_now[k])];
            graphfrom.links.push(linka); 
            setTimeout(function() { 
                console.log('CHANGING')
                graph.addLink(linka.source, linka.target, linka.weight);
                keepNodesOnTop();
            }, nextval());
        } 
        i ++; 
    }

}
function get_id(id_obj) {
    let src = id_obj.source;
    let trg = id_obj.target;
    if (typeof(src) !== 'number') src = src.id
    if (typeof(trg) !== 'number') trg = trg.id
    return src + '_' + trg
}

// because of the way the network is created, nodes are created first, and links second,
// so the lines were on top of the nodes, this just reorders the DOM to put the svg:g on top
function keepNodesOnTop() {
    $(".nodeStrokeClass").each(function( index ) {
        var gnode = this.parentNode;
        gnode.parentNode.appendChild(gnode);
    });
}
// function addNodes() {
//     d3.select("svg")
//             .remove();
//      drawGraph();
// }








$(document).ready(function() {   
    if (initial == -1) initial = 5;
    select_pid(initial); 
});

$(".pref").click(function() { 
    select_pid($(this).attr('value') );
});

$("#videoplay").click(function(event) {    
    updateGraph(graph0, graph3);  
});

// Selecting IDS
function select_pid(pid) {
    $.ajax({
        url: '/jsonet/',
        data: {
            'pid': pid
        },
        dataType: 'json',
        success: function (data) {  
            graph0 = JSON.parse(data.g0);  
            graph3 = JSON.parse(data.g3);  
            graph6 = JSON.parse(data.g6);  
             
            $(".label").html("Patient " + feats['study_id'][pid-1])
            initGraph(graph0);
            
        }
    });
}


