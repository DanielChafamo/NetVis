var num_patients = feats['study_id'].length;
var grid_cols = 6;
//row_per_page = 4;
var row_per_page = Math.ceil(num_patients/4);
var grid_timeouts = {};
var clicker_timeouts = {'main':[]};
var graphs = {};
var all_graphs = {};
var all_data = {};
var clicked = {};
var time_three_and_six = 9500;
var time_month_zero = 2700;
var full_play_time = time_month_zero + time_three_and_six
var grid_play_delay = 1000;
var grid_play_full = 2 * full_play_time;
var month_zeros = {}
var page_container = $('#pagination');
var wide_view = 0;


$(document).ready(function() {
    for (let i = 1; i <= num_patients; i++)
        fetch_data(i);
    select_view();
    setTimeout(register_pagination, 1000);
    setTimeout("page_container.pagination(1)", 5000);
    setTimeout("location.reload(true);", 5*60*1000);
});


$(window).on('resize', function(event){
    if (select_view()) {
        setTimeout("page_container.pagination(1)", 100);
    }
});

function select_view() {
    let windowWidth = $(window).width();
    if (wide_view <= 0 && windowWidth > 2000){
        grid_cols = 12;
        wide_view = 1;
        console.log("Going to landscape view");
        return true;
    }
    if (wide_view > 0 && windowWidth < 2000){
        grid_cols = 6;
        $(".grid").addClass('importantRule');
        wide_view = -1;
        console.log("Exit landscape view");
        return true;
    }
    return false;
}

function render_grids(p_ids) {
    p_ids.forEach(function(pid) {
        initial_draw(pid);
        grid_hover(pid);
    })
}

function register_pagination() {
    page_container.pagination({
        dataSource: [...Array(num_patients).keys()].map(i => i + 1),
        pageSize: grid_cols*row_per_page,
        callback: function(p_ids, pagination) {
            clearAll();
            var html = template(p_ids);
            $('#grid_body').html(html);
            render_grids(p_ids);
            clicker();
        }
    });
}

function template(data) {
    var html = '<div class="row grid_row">'
    let wide_rule = (wide_view == 1) ? " twelve_col" : "";
    data.forEach(function(pid, index) {
        if (index % grid_cols === 0)
            html += '</div><div class="row grid_row">';
        html += '<div class="two columns grid' + wide_rule + '" id="grid_inner_' + pid + '"><div class="grid_label"><p class="grid_label"></p></div><div id="grid_' + pid +'"></div><div class="grid_month"><p class="grid_month" id="grid_' + pid + '_month"> Month 0</p></div></div>';
    });
    return html;
}

function clearAll() {
    for (let i = 1; i <= num_patients; i++) {
        if (i in graphs) {
            graphs[i].simulation.stop();
            delete(graphs[i]);
        }
        clearGrid(i);
    }
    clicked = [];
    for(let key in clicker_timeouts) {
        for (let i = 0; i < clicker_timeouts[key].length; i++)
            clearTimeout(clicker_timeouts[key][i]);
    }
    for (let i = 1; i <= num_patients; i++) {
        clicker_timeouts[i] = [];
        $("#grid_inner_" + i).css('border-width', '1px 1px');
    }
}

function clicker() {
    for (let i = 0; i < num_patients/grid_cols; i++) {
        let rand = i * grid_cols + getRandomIntInclusive(1, grid_cols);
        rand = Math.min(num_patients, rand);
        let rand_delay = getRandomIntInclusive(500, grid_play_delay);
        clicker_timeouts[rand].push(setTimeout(function() { play_grid(rand); }, rand_delay));
        clicker_timeouts[rand].push(setTimeout(function() { play_grid(rand); }, grid_play_full + rand_delay));
    }
    clicker_timeouts['main'].push(setTimeout(clicker, grid_play_delay + grid_play_full));
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}

function play_grid(i) {
    if (!(i in graphs))
        return;
    let grid = $("#grid_inner_" + i);
    if ((i in clicked && clicked[i]) || !(i in grid_timeouts)) {
        grid.css('border-width', '1px 1px');
        clicked[i] = false;
        initial_draw(i);
    }
    else {
        grid.css('border-width', '2px 2px');
        clicked[i] = true;
        play_from_zero(i);
        play_from_six(i, full_play_time);
    }
}

function play_from_zero(i) {
    if (!(i in graphs))
        return;
    grid_timeouts[i].push(
        setTimeout(function() {
            graphs[i].changenodes("graphRec3", '3');
        }, time_month_zero)
    );
}

function play_from_six(i, delay) {
    if (!(i in graphs))
        return;
    grid_timeouts[i].push(
        setTimeout(function() {
            initial_draw(i);
            play_from_zero(i);
        }, delay)
    );
}

function grid_hover(i) {
    let grid = $("#grid_inner_" + i);
    grid.click(function() {
        select_pid(i, true, 330);
        modal.style.display = "block";
    });
}

function fetch_data(pid, draw=false) {
    $.ajax({
        url: '/jsonet/',
        data: {
            'pid': pid
        },
        dataType: 'json',
        success: function (pid_data) {
            all_data[pid] = pid_data;
            if (draw) initial_draw(pid)
        }
    });
}

function initial_draw(pid) {
    if (!(pid in all_data))
        return fetch_data(pid, true);
    let data = all_data[pid];
    let graph0 = JSON.parse(data.g0),
        graph0copy = JSON.parse(data.g0),
        graph3 = JSON.parse(data.g3),
        graph3copy = JSON.parse(data.g3),
        graph6 = JSON.parse(data.g6),
        graph6copy = JSON.parse(data.g6);

    clearGrid(pid);
    graphs[pid] = 0;
    if (!(pid in all_graphs)) {
        all_graphs[pid] = new RenderGraphGrid(graph0, graph3, graph6, pid);
    } else {
        all_graphs[pid].build(graph0, graph3, graph6, pid);
    }
    graphs[pid] = all_graphs[pid];
    $("#grid_" + pid + "_month").html("Month 0");
}



function clearGrid(pid) {
    let svgs = $("#grid_" + pid).find("svg");
    for (let i = 0; i < svgs.length; i++)
        svgs[i].remove();
    clearGridTimeout(pid);
}

function clearGridTimeout(pid) {
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
        this.build(graph, graph3, graph6, pid);
    }

    build(graph, graph3, graph6, pid) {
        this.graph = graph;
        this.div_id = "#grid_" + pid;
        this.div_element = $(this.div_id);
        this.month_element = $(this.div_id + "_month")
        this.pid = pid
        this.changing = true;
        this.egodegree = -1;
        this.width = this.div_element.width();
        this.height = 150;
        this.width_percent = "100%";
        this.height_percent = 150;
        this.rmargin = 10;
        this.lmargin = 0;
        this.linktime = 2000;
        this.nodetime = 10;
        this.monthtime = 4000;
        this.alphaT = 0.1;
        this.alphaR = 0.3;
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
            .attr("width", this.width_percent)
            .attr("height", this.height_percent);

        let g = this.svg.append("g")
             .attr("transform", "translate(" + 0 + "," + 0 + ")");

        this.link = g.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .selectAll(".link");

        this.node = g.append("g")
            .attr("stroke", "#000")
            .attr("stroke-width", 0.8)
            .selectAll(".node");

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
        if (!(this.pid in graphs)) return;

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
        // Update and restart the simulation.
        this.simulation.nodes(this.graph.nodes);
        this.simulation.force("link").links(this.graph.links);
        this.simulation.alpha(alphaR).restart();
    }

    ticked() {
        if (!(this.pid in graphs)) return;

        this.width = this.div_element.width();

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
            .style("fill", function (d) { return colors[1+(d.name != "Patient")]; })

        this.link
            .style("stroke", function (d) { return colors[-d.weight];})
            .style("stroke-dasharray", function (d) {
                if (d.weight == 1) return ("6, 2") });
    }

    changenodes(graphmonth, month) {
        if (!(this.pid in graphs)) return;

        grid_timeouts[this.pid].push(setTimeout(function() {
            this.graph.links = this[graphmonth].links;
            this.restart(this.alphaR_change, false);
        }.bind(this), this.nodetime));


        if (month == "3") {
            month_zeros[this.pid] = {};
            for (let n of this.graph.nodes)
                month_zeros[this.pid][n.id] = n;
        }

        grid_timeouts[this.pid].push(
            setTimeout(function() {
                this.month_element.html("Month " + month);
                grid_timeouts[this.pid].push(
                    setTimeout(function() {
                        if (this.changing) {
                            this.changing = false;
                            this.changenodes("graphRec6", '6');
                        }
                    }.bind(this), this.monthtime)
                );
            }.bind(this), this.nodetime)
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

var elem = document.getElementById("grid_body");
function openFullscreen() {
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }
//    for (let i = 1; i <= num_patients; i++)
//        $("#grid_inner_" + i).css('border-color', 'white');

}

document.addEventListener('fullscreenchange', (event) => {
  if (document.fullscreenElement) {
    console.log(`Element: ${document.fullscreenElement.id} entered full-screen mode.`);
  } else {
      for (let i = 1; i <= num_patients; i++)
        $("#grid_inner_" + i).css('border-color', 'black');
    console.log('Leaving full-screen mode.');
  }
});

