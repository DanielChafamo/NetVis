var num_patients = feats['study_id'].length
var grid_cols = 6;
var grid_timeouts = {};
var clicker_timeouts = {};
var graphs = {};
var clicked = {};
var full_play_time = 15000;
var all_data = {}
var month_zeros = {}

$(document).ready(function() {
    for (let i = 1; i <= num_patients; i++) {
        fetch_data_draw(i);
        grid_hover(i)
    }
    setTimeout(clicker, full_play_time/2);

});

function clicker() {
    for (let i = 0; i < num_patients/grid_cols; i++) {
        let rand = i * grid_cols + getRandomIntInclusive(1, grid_cols);
        rand = Math.min(num_patients, rand);
        let rand_delay = getRandomIntInclusive(100, 1000);
        setTimeout(function() { play_grid(rand); }, rand_delay);
        setTimeout(function() { play_grid(rand); }, full_play_time + rand_delay);
    }
    setTimeout(clicker, 1000 + full_play_time)
}


function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}

function play_grid(i) {
    let grid = document.getElementById("grid_inner_" + i);
    if ((i in clicked && clicked[i]) || !(i in grid_timeouts)) {
        grid.style.border = "1px solid black";
        clicked[i] = false;
        initial_draw(i);
    }
    else {
        grid.style.border = "2px solid black";
        clicked[i] = true;
        grid_timeouts[i].push(
            setTimeout(function() {
                graphs[i].changenodes("graphRec3", '3');
            }, 200)
        );
    }
}

function grid_hover(i) {
    let grid = document.getElementById("grid_inner_" + i);
    grid.addEventListener("click", function() {
        select_pid(i, true);
        modal.style.display = "block";
    });
}

function fetch_data_draw(pid) {
    $.ajax({
        url: '/jsonet/',
        data: {
            'pid': pid
        },
        dataType: 'json',
        success: function (pid_data) {
            all_data[pid] = pid_data;
            initial_draw(pid);
        }
    });
}

function initial_draw(pid) {
    if (!pid in all_data)
        return;
    let data = all_data[pid];
    let graph0 = JSON.parse(data.g0),
        graph0copy = JSON.parse(data.g0),
        graph3 = JSON.parse(data.g3),
        graph3copy = JSON.parse(data.g3),
        graph6 = JSON.parse(data.g6),
        graph6copy = JSON.parse(data.g6);

    clearGrid(pid);
    let graph = new RenderGraphGrid(graph0, graph3, graph6, pid);
    graphs[pid] = graph;
    document.getElementById("grid_" + pid + "_month").innerHTML =  "Month 0";
}

function clearGrid(pid) {
    let svgs = document.getElementById("grid_" + pid).getElementsByTagName("svg");
    for (let i = 0; i < svgs.length; i++)
        svgs[i].remove();
    if (pid in grid_timeouts) {
        for (let i = 0; i < grid_timeouts[pid].length; i++)
            clearTimeout(grid_timeouts[pid][i]);
    }
    grid_timeouts[pid] = [];
}

//
//
//

var colors = {}
    colors[1] ='black';
    colors[2] ='white';
    colors[-1] = 'blue';
    colors[-2] = 'red';

class RenderGraphGrid {
    constructor(graph, graph3, graph6, pid) {
        this.graph = graph;
        this.div_id = "#grid_" + pid;
        this.pid = pid
        this.changing = true;
        this.egodegree = -1;
        this.width = 160;
        this.height = 160;
        this.rmargin = 10;
        this.lmargin = 0;
        this.linktime = 2500;
        this.nodetime = 10;
        this.monthtime = 4000;
        this.alphaT = 0.1;
        this.alphaR = 0.4;
        this.alphaR_change = 0.2;
        this.distanceForce = -200;
        this.linkDistance = 0;

        for (var i = this.graph.nodes.length - 1; i >= 0; i--) {
            if (this.graph.nodes[i]['name'] == "Ego") {
                this.egodegree = this.graph.nodes[i].degree;
                this.graph.nodes[i]['name'] = "Patient";
            }
            this.graph.nodes[i]['changing'] = false;
        }

        this.svg = d3.select(this.div_id).append("svg")
            .attr("id", 'svgmain')
            .attr("width", this.width)
            .attr("height", this.height);

        var g = this.svg.append("g")
             .attr("transform", "translate(" + 0 + "," + 0 + ")");

        this.link = g.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .selectAll(".link");

        this.node = g.append("g")
            .attr("stroke", "#000")
            .attr("stroke-width", 0.8)
            .selectAll(".node");

        this.label = g.append("g")
            .attr("stroke", "#000")
            .attr("stroke-width", 0.25)
            .selectAll("text").data(this.graph.nodes)
            .enter().append("text")
            .attr("dx", 3)
            .attr("dy", ".05em")
            .text(function(d) { if (d.name != "Patient") return ""; return "" });

        this.simulation = d3.forceSimulation(this.graph.nodes)
            .force("charge", d3.forceManyBody().strength(this.distanceForce))
            .force("link", d3.forceLink(this.graph.links).distance(this.linkDistance))
            .force("x", d3.forceX(this.width/2))
            .force("y", d3.forceY(this.height/2))
            .alphaTarget(this.alphaT)
            .alphaDecay(0.05)
            .on("tick", function () {this.ticked();}.bind(this));


        this.graphRec = JSON.parse(JSON.stringify(this.graph));
        this.graphRec0 = JSON.parse(JSON.stringify(graph));
        this.graphRec3 = JSON.parse(JSON.stringify(graph3));
        this.graphRec6 = JSON.parse(JSON.stringify(graph6));

        this.restart(this.alphaR, true);

    }

    restart(alphaR, initial) {
        if (initial) {
            for (let n of this.graph.nodes) {
                if (this.pid in month_zeros && n.id in month_zeros[this.pid]) {
                    n.x = month_zeros[this.pid][n.id].x;
                    n.y = month_zeros[this.pid][n.id].y;
                } else {
                    n.x = this.width / 2 + 20*Math.random();
                    n.y = this.height / 2 + 20*Math.random();
                }
            }
        }

        // Handle Node changes and attributes
        this.node = this.node
            .data(this.graph.nodes, function(d) {
                return d.id;});

        this.node.exit().transition()
            .attr("r", 0)
        .remove();

        this.node = this.node.enter().append("circle")
            .style("fill", function (d) { return colors[1+(d.name != "Patient")]})
            .call(function(node) {
                node.transition()
                    .attr("r",  function (d) {
                        return 0.4 + 0.3*d.degree; }); })
            .call(d3.drag()
                .on("start", this.dragstarted)
                .on("drag", this.dragged)
                .on("end", this.dragended))
        .merge(this.node);

        // Handle Link changes and attributes
        this.link = this.link
            .data(this.graph.links, function(d) {
                return d.source.id + "-" + d.target.id; });

        this.link.exit().transition().duration(this.linktime)
            .attr("stroke-opacity", 0)
            .attrTween("x1", function(d) { return function() { return d.source.x; }; })
            .attrTween("x2", function(d) { return function() { return d.target.x; }; })
            .attrTween("y1", function(d) { return function() { return d.source.y; }; })
            .attrTween("y2", function(d) { return function() { return d.target.y; }; })
        .remove();

        this.link = this.link.enter().append("line")
            .style("stroke", function (d) { return colors[-d.weight];})
            .style("stroke-dasharray", function (d) { if (d.weight == 1) return ("6, 2")})
            .call(function(link) {
                link.transition()
                    .ease(d3.easeLinear)
                    .duration(this.linktime)
                    .attr("stroke-opacity", 0.8); }.bind(this))
        .merge(this.link);

        // Highlight changing Node
            // .filter(function(d, i) {
            //     if (d.changing) console.log(d); });;

        // Update and restart the simulation.
        this.simulation.nodes(this.graph.nodes);
        this.simulation.force("link").links(this.graph.links);
        this.simulation.alpha(alphaR).restart();
    }

    ticked() {
        this.node.attr("cx", function(d) { return this.getPos(d, 'x'); }.bind(this))
            .attr("cy", function(d) { return this.getPos(d, 'y'); }.bind(this))

        this.svg.selectAll("text")
            .attr("x", function (d) { return this.getPos(d, 'x'); }.bind(this))
            .attr("y", function (d) { return this.getPos(d, 'y'); }.bind(this));

        this.link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        let links = this.graph.links.map(this.get_id);
        for (let n of this.graph.nodes) {
            n.degree = links.filter((x)=>x.split('_').includes(n.id.toString())).length
            if (n.name == "Patient") this.egodegree = n.degree
        }

        this.svg.selectAll("circle")
            .attr("r", function (d) { return 0.4 + 0.3*d.degree})
            // .style("fill", function (d) {
            //     if (d.changing) return 'red';
            //     else return colors[1+(d.name != "Patient")];})
            // .style("stroke", function (d) {
            //     if (d.changing) return 'red';
            //     else return 'black';})
            .style("fill", function (d) { return colors[1+(d.name != "Patient")]; })

        this.link
            .style("stroke", function (d) { return colors[-d.weight];})
            .style("stroke-dasharray", function (d) {
                if (d.weight == 1) return ("6, 2") });
    }

    changenodes(graphmonth, month) {
        var in_links = this.graph.links.map(this.get_id);
        var out_links = this[graphmonth].links.map(this.get_id);
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
            grid_timeouts[this.pid].push(setTimeout(function() {
                for (var i = remove_now.length - 1; i >= 0; i--) {
                    in_links = this.graph.links.map(this.get_id);
                    this.graph.links.splice(in_links.indexOf(remove_now[i]), 1);
                }
                for (var i = add_now.length - 1; i >= 0; i--) {
                    out_links = this[graphmonth].links.map(this.get_id);
                    this.graph.links.push(this[graphmonth].links[out_links.indexOf(add_now[i])]);
                }
                // Label currently changing node
                for (var i = this.graph.nodes.length - 1; i >= 0; i--)
                    this.graph.nodes[i]['changing'] = false;
                this.graph.nodes[parseInt(from)]['changing'] = true;

                this.restart(this.alphaR_change, false);
            }.bind(this), i*this.nodetime));
            i ++;
        }

        if (month == "3") {
            month_zeros[this.pid] = {};
            for (let n of this.graph.nodes)
                month_zeros[this.pid][n.id] = n;
        }

        grid_timeouts[this.pid].push(
            setTimeout(function() {
                document.getElementById(this.div_id.substring(1, this.div_id.length) + "_month").innerHTML = "Month " + month;
                $("#lm"+month).css('-webkit-filter', 'blur(0px)');
                grid_timeouts[this.pid].push(
                    setTimeout(function() {
                        if (this.changing) {
                            this.changing = false;
                            this.changenodes("graphRec6", '6');
                        }
                    }.bind(this), this.monthtime)
                );
            }.bind(this), i*this.nodetime)
        );
    }

    get_id(id_obj) {
        let src = id_obj.source;
        let trg = id_obj.target;
        if (typeof(src) !== 'number') src = src.id
        if (typeof(trg) !== 'number') trg = trg.id
        return src + '_' + trg
    }

    threshold(thresh) {
        this.graph.links.splice(0, this.graph.links.length);
        for (var i = 0; i < this.graphRec.links.length; i++) {
            if (this.graphRec.links[i].weight > thresh)
                this.graph.links.push(this.graphRec.links[i]);
        }
        this.restart(this.alphaR, false);
    }

    dragstarted(d) {
        if (!d3.event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    dragended(d) {
        // if (!d3.event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
    getPos(d, axis) {
        let bound = (axis == "x") ? this.width : this.height
        if (d.name == "Patient") d[axis] = bound / 2;
        return d[axis] = Math.max(this.lmargin, Math.min(bound - this.rmargin, d[axis]));
    }

}


var modal = document.getElementById("myModal");
var span = document.getElementsByClassName("close")[0];

span.onclick = function() {
  modal.style.display = "none";
}

window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}