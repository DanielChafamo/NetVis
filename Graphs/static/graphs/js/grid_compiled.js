var $jscomp = $jscomp || {};
$jscomp.scope = {};
$jscomp.arrayIteratorImpl = function(a) {
    var b = 0;
    return function() {
        return b < a.length ? {
            done: !1,
            value: a[b++]
        } : {
            done: !0
        }
    }
}
;
$jscomp.arrayIterator = function(a) {
    return {
        next: $jscomp.arrayIteratorImpl(a)
    }
}
;
$jscomp.makeIterator = function(a) {
    var b = "undefined" != typeof Symbol && Symbol.iterator && a[Symbol.iterator];
    return b ? b.call(a) : $jscomp.arrayIterator(a)
}
;
$jscomp.arrayFromIterator = function(a) {
    for (var b, e = []; !(b = a.next()).done; )
        e.push(b.value);
    return e
}
;
$jscomp.arrayFromIterable = function(a) {
    return a instanceof Array ? a : $jscomp.arrayFromIterator($jscomp.makeIterator(a))
}
;
var num_patients = feats.study_id.length
  , grid_cols = 6;
row_per_page = 4;
var grid_timeouts = {}
  , clicker_timeouts = {
    main: []
}
  , graphs = {}
  , all_graphs = {}
  , clicked = {}
  , time_three_and_six = 12300
  , time_month_zero = 3500
  , full_play_time = time_month_zero + time_three_and_six
  , grid_play_delay = 1E3
  , grid_play_full = 2 * full_play_time
  , all_data = {}
  , month_zeros = {};
$(document).ready(function() {
    for (var a = 1; a <= num_patients; a++)
        fetch_data(a)
});
function render_grids(a) {
    a.forEach(function(b) {
        initial_draw(b);
        grid_hover(b)
    })
}
$("#pagination").pagination({
    dataSource: [].concat($jscomp.arrayFromIterable(Array(num_patients).keys())).map(function(a) {
        return a + 1
    }),
    pageSize: grid_cols * row_per_page,
    callback: function(a, b) {
        clearAll();
        var e = template(a);
        $("#grid_body").html(e);
        render_grids(a);
        clicker()
    }
});
function template(a) {
    var b = '<div class="row grid_row">';
    a.forEach(function(e, d) {
        0 === d % grid_cols && (b += '</div><div class="row grid_row">');
        b += '<div class="two columns grid" id="grid_inner_' + e + '"><div class="grid_label"><p class="grid_label"></p></div><div id="grid_' + e + '"></div><div class="grid_month"><p class="grid_month" id="grid_' + e + '_month"> Month 0</p></div></div>'
    });
    return b
}
function clearAll() {
    for (var a = 1; a <= num_patients; a++)
        a in graphs && (graphs[a].simulation.stop(),
        delete graphs[a]),
        clearGrid(a);
    clicked = [];
    for (var b in clicker_timeouts)
        for (a = 0; a < clicker_timeouts[b].length; a++)
            clearTimeout(clicker_timeouts[b][a]);
    for (b = 1; b <= num_patients; b++)
        clicker_timeouts[b] = [],
        $("#grid_inner_" + b).css("border", "1px solid black")
}
function clicker() {
    for (var a = {}, b = 0; b < num_patients / grid_cols; a = {
        $jscomp$loop$prop$rand$7: a.$jscomp$loop$prop$rand$7
    },
    b++) {
        a.$jscomp$loop$prop$rand$7 = b * grid_cols + getRandomIntInclusive(1, grid_cols);
        a.$jscomp$loop$prop$rand$7 = Math.min(num_patients, a.$jscomp$loop$prop$rand$7);
        var e = getRandomIntInclusive(500, grid_play_delay);
        clicker_timeouts[a.$jscomp$loop$prop$rand$7].push(setTimeout(function(d) {
            return function() {
                play_grid(d.$jscomp$loop$prop$rand$7)
            }
        }(a), e));
        clicker_timeouts[a.$jscomp$loop$prop$rand$7].push(setTimeout(function(d) {
            return function() {
                play_grid(d.$jscomp$loop$prop$rand$7)
            }
        }(a), grid_play_full + e))
    }
    clicker_timeouts.main.push(setTimeout(clicker, grid_play_delay + grid_play_full))
}
function getRandomIntInclusive(a, b) {
    a = Math.ceil(a);
    b = Math.floor(b);
    return Math.floor(Math.random() * (b - a + 1) + a)
}
function play_grid(a) {
    if (a in graphs) {
        var b = $("#grid_inner_" + a);
        a in clicked && clicked[a] || !(a in grid_timeouts) ? (b.css("border", "1px solid black"),
        clicked[a] = !1,
        initial_draw(a)) : (b.css("border", "2px solid black"),
        clicked[a] = !0,
        play_from_zero(a),
        play_from_six(a, full_play_time))
    }
}
function play_from_zero(a) {
    a in graphs && grid_timeouts[a].push(setTimeout(function() {
        graphs[a].changenodes("graphRec3", "3")
    }, time_month_zero))
}
function play_from_six(a, b) {
    a in graphs && grid_timeouts[a].push(setTimeout(function() {
        initial_draw(a);
        play_from_zero(a)
    }, b))
}
function grid_hover(a) {
    $("#grid_inner_" + a).click(function() {
        select_pid(a, !0, 300);
        modal.style.display = "block"
    })
}
function fetch_data(a) {
    $.ajax({
        url: "/jsonet/",
        data: {
            pid: a
        },
        dataType: "json",
        success: function(b) {
            all_data[a] = b
        }
    })
}
function initial_draw(a) {
    if (a in all_data) {
        var b = all_data[a]
          , e = JSON.parse(b.g0);
        JSON.parse(b.g0);
        var d = JSON.parse(b.g3);
        JSON.parse(b.g3);
        var c = JSON.parse(b.g6);
        JSON.parse(b.g6);
        clearGrid(a);
        graphs[a] = 0;
        a in all_graphs ? all_graphs[a].build(e, d, c, a) : all_graphs[a] = new RenderGraphGrid(e,d,c,a);
        graphs[a] = all_graphs[a];
        $("#grid_" + a + "_month").html("Month 0")
    }
}
function clearGrid(a) {
    for (var b = $("#grid_" + a).find("svg"), e = 0; e < b.length; e++)
        b[e].remove();
    clearGridTimeout(a)
}
function clearGridTimeout(a) {
    if (a in grid_timeouts)
        for (var b = 0; b < grid_timeouts[a].length; b++)
            clearTimeout(grid_timeouts[a][b]);
    grid_timeouts[a] = []
}
var colors = {
    1: "black",
    2: "white",
    "-1": "blue",
    "-2": "red"
}
  , RenderGraphGrid = function(a, b, e, d) {
    this.build(a, b, e, d)
};
RenderGraphGrid.prototype.build = function(a, b, e, d) {
    this.graph = a;
    this.div_id = "#grid_" + d;
    this.div_element = $(this.div_id);
    this.month_element = $(this.div_id + "_month");
    this.pid = d;
    this.changing = !0;
    this.egodegree = -1;
    this.width = this.div_element.width();
    this.height = 160;
    this.width_percent = "100%";
    this.height_percent = 160;
    this.rmargin = 10;
    this.lmargin = 0;
    this.linktime = 1200;
    this.nodetime = 10;
    this.monthtime = 4E3;
    this.alphaT = .1;
    this.alphaR = .4;
    this.alphaR_change = .2;
    this.distanceForce = -200;
    this.linkDistance = 0;
    for (d = this.graph.nodes.length - 1; 0 <= d; d--)
        "Ego" == this.graph.nodes[d].name && (this.egodegree = this.graph.nodes[d].degree,
        this.graph.nodes[d].name = "Patient"),
        this.graph.nodes[d].changing = !1;
    this.svg = d3.select(this.div_id).append("svg").attr("id", "svgmain").attr("width", this.width_percent).attr("height", this.height_percent);
    d = this.svg.append("g").attr("transform", "translate(0,0)");
    this.link = d.append("g").attr("stroke", "#fff").attr("stroke-width", 1).selectAll(".link");
    this.node = d.append("g").attr("stroke", "#000").attr("stroke-width", .8).selectAll(".node");
    this.label = d.append("g").attr("stroke", "#000").attr("stroke-width", .25).selectAll("text").data(this.graph.nodes).enter().append("text").attr("dx", 3).attr("dy", ".05em").text(function(c) {
        return ""
    });
    this.simulation = d3.forceSimulation(this.graph.nodes).force("charge", d3.forceManyBody().strength(this.distanceForce)).force("link", d3.forceLink(this.graph.links).distance(this.linkDistance)).force("x", d3.forceX(this.width / 2)).force("y", d3.forceY(this.height / 2)).alphaTarget(this.alphaT).alphaDecay(.05).on("tick", function() {
        this.ticked()
    }
    .bind(this));
    this.graphRec = JSON.parse(JSON.stringify(this.graph));
    this.graphRec0 = JSON.parse(JSON.stringify(a));
    this.graphRec3 = JSON.parse(JSON.stringify(b));
    this.graphRec6 = JSON.parse(JSON.stringify(e));
    this.restart(this.alphaR, !0)
}
;
RenderGraphGrid.prototype.restart = function(a, b) {
    if (this.pid in graphs) {
        if (b)
            for (var e = $jscomp.makeIterator(this.graph.nodes), d = e.next(); !d.done; d = e.next())
                d = d.value,
                this.pid in month_zeros && d.id in month_zeros[this.pid] ? (d.x = month_zeros[this.pid][d.id].x,
                d.y = month_zeros[this.pid][d.id].y) : (d.x = this.width / 2 + 20 * Math.random(),
                d.y = this.height / 2 + 20 * Math.random());
        this.node = this.node.data(this.graph.nodes, function(c) {
            return c.id
        });
        this.node.exit().transition().attr("r", 0).remove();
        this.node = this.node.enter().append("circle").style("fill", function(c) {
            return colors[1 + ("Patient" != c.name)]
        }).call(function(c) {
            c.transition().attr("r", function(f) {
                return .4 + .3 * f.degree
            })
        }).call(d3.drag().on("start", this.dragstarted).on("drag", this.dragged).on("end", this.dragended)).merge(this.node);
        this.link = this.link.data(this.graph.links, function(c) {
            return c.source.id + "-" + c.target.id
        });
        this.link.exit().transition().duration(this.linktime).attr("stroke-opacity", 0).attrTween("x1", function(c) {
            return function() {
                return c.source.x
            }
        }).attrTween("x2", function(c) {
            return function() {
                return c.target.x
            }
        }).attrTween("y1", function(c) {
            return function() {
                return c.source.y
            }
        }).attrTween("y2", function(c) {
            return function() {
                return c.target.y
            }
        }).remove();
        this.link = this.link.enter().append("line").style("stroke", function(c) {
            return colors[-c.weight]
        }).style("stroke-dasharray", function(c) {
            if (1 == c.weight)
                return "6, 2"
        }).call(function(c) {
            c.transition().ease(d3.easeLinear).duration(this.linktime).attr("stroke-opacity", .8)
        }
        .bind(this)).merge(this.link);
        this.simulation.nodes(this.graph.nodes);
        this.simulation.force("link").links(this.graph.links);
        this.simulation.alpha(a).restart()
    }
}
;
RenderGraphGrid.prototype.ticked = function() {
    if (this.pid in graphs) {
        this.width = this.div_element.width();
        this.node.attr("cx", function(c) {
            return this.getPos(c, "x")
        }
        .bind(this)).attr("cy", function(c) {
            return this.getPos(c, "y")
        }
        .bind(this));
        this.svg.selectAll("text").attr("x", function(c) {
            return this.getPos(c, "x")
        }
        .bind(this)).attr("y", function(c) {
            return this.getPos(c, "y")
        }
        .bind(this));
        this.link.attr("x1", function(c) {
            return c.source.x
        }).attr("y1", function(c) {
            return c.source.y
        }).attr("x2", function(c) {
            return c.target.x
        }).attr("y2", function(c) {
            return c.target.y
        });
        for (var a = this.graph.links.map(this.get_id), b = {}, e = $jscomp.makeIterator(this.graph.nodes), d = e.next(); !d.done; b = {
            $jscomp$loop$prop$n$9: b.$jscomp$loop$prop$n$9
        },
        d = e.next())
            b.$jscomp$loop$prop$n$9 = d.value,
            b.$jscomp$loop$prop$n$9.degree = a.filter(function(c) {
                return function(f) {
                    return f.split("_").includes(c.$jscomp$loop$prop$n$9.id.toString())
                }
            }(b)).length,
            "Patient" == b.$jscomp$loop$prop$n$9.name && (this.egodegree = b.$jscomp$loop$prop$n$9.degree);
        this.svg.selectAll("circle").attr("r", function(c) {
            return .4 + .3 * c.degree
        }).style("fill", function(c) {
            return colors[1 + ("Patient" != c.name)]
        });
        this.link.style("stroke", function(c) {
            return colors[-c.weight]
        }).style("stroke-dasharray", function(c) {
            if (1 == c.weight)
                return "6, 2"
        })
    }
}
;
RenderGraphGrid.prototype.changenodes = function(a, b) {
    if (this.pid in graphs) {
        var e = this.graph.links.map(this.get_id)
          , d = this[a].links.map(this.get_id)
          , c = e.filter(function(k) {
            return -1 === d.indexOf(k)
        })
          , f = d.filter(function(k) {
            return -1 === e.indexOf(k)
        });
        c.sort();
        f.sort();
        for (var m = 1, g = {}; 0 !== c.length || 0 !== f.length; ) {
            var l = void 0;
            g.$jscomp$loop$prop$from$13 = void 0;
            g.$jscomp$loop$prop$remove_now$11 = void 0;
            g.$jscomp$loop$prop$add_now$12 = void 0;
            g.$jscomp$loop$prop$remove_now$11 = [];
            g.$jscomp$loop$prop$add_now$12 = [];
            0 == m % 2 ? 0 !== c.length ? (l = c.splice(0, 1)[0],
            g.$jscomp$loop$prop$remove_now$11 = [l]) : (l = f.splice(0, 1)[0],
            g.$jscomp$loop$prop$add_now$12 = [l]) : 0 !== f.length ? (l = f.splice(0, 1)[0],
            g.$jscomp$loop$prop$add_now$12 = [l]) : (l = c.splice(0, 1)[0],
            g.$jscomp$loop$prop$remove_now$11 = [l]);
            for (g.$jscomp$loop$prop$from$13 = l.split("_")[0]; 0 !== c.length; )
                if (c[0].split("_")[0] == g.$jscomp$loop$prop$from$13)
                    g.$jscomp$loop$prop$remove_now$11.push(c.splice(0, 1)[0]);
                else
                    break;
            for (; 0 !== f.length; )
                if (f[0].split("_")[0] == g.$jscomp$loop$prop$from$13)
                    g.$jscomp$loop$prop$add_now$12.push(f.splice(0, 1)[0]);
                else
                    break;
            grid_timeouts[this.pid].push(setTimeout(function(k) {
                return function() {
                    for (var h = k.$jscomp$loop$prop$remove_now$11.length - 1; 0 <= h; h--)
                        e = this.graph.links.map(this.get_id),
                        this.graph.links.splice(e.indexOf(k.$jscomp$loop$prop$remove_now$11[h]), 1);
                    for (h = k.$jscomp$loop$prop$add_now$12.length - 1; 0 <= h; h--)
                        d = this[a].links.map(this.get_id),
                        this.graph.links.push(this[a].links[d.indexOf(k.$jscomp$loop$prop$add_now$12[h])]);
                    for (h = this.graph.nodes.length - 1; 0 <= h; h--)
                        this.graph.nodes[h].changing = !1;
                    this.graph.nodes[parseInt(k.$jscomp$loop$prop$from$13)].changing = !0;
                    this.restart(this.alphaR_change, !1)
                }
            }(g).bind(this), m * this.nodetime));
            m++;
            g = {
                $jscomp$loop$prop$remove_now$11: g.$jscomp$loop$prop$remove_now$11,
                $jscomp$loop$prop$add_now$12: g.$jscomp$loop$prop$add_now$12,
                $jscomp$loop$prop$from$13: g.$jscomp$loop$prop$from$13
            }
        }
        if ("3" == b)
            for (month_zeros[this.pid] = {},
            c = $jscomp.makeIterator(this.graph.nodes),
            f = c.next(); !f.done; f = c.next())
                f = f.value,
                month_zeros[this.pid][f.id] = f;
        grid_timeouts[this.pid].push(setTimeout(function() {
            this.month_element.html("Month " + b);
            grid_timeouts[this.pid].push(setTimeout(function() {
                this.changing && (this.changing = !1,
                this.changenodes("graphRec6", "6"))
            }
            .bind(this), this.monthtime))
        }
        .bind(this), m * this.nodetime))
    }
}
;
RenderGraphGrid.prototype.get_id = function(a) {
    var b = a.source;
    a = a.target;
    "number" !== typeof b && (b = b.id);
    "number" !== typeof a && (a = a.id);
    return b + "_" + a
}
;
RenderGraphGrid.prototype.threshold = function(a) {
    this.graph.links.splice(0, this.graph.links.length);
    for (var b = 0; b < this.graphRec.links.length; b++)
        this.graphRec.links[b].weight > a && this.graph.links.push(this.graphRec.links[b]);
    this.restart(this.alphaR, !1)
}
;
RenderGraphGrid.prototype.dragstarted = function(a) {
    d3.event.active || this.simulation.alphaTarget(.3).restart();
    a.fx = a.x;
    a.fy = a.y
}
;
RenderGraphGrid.prototype.dragged = function(a) {
    a.fx = d3.event.x;
    a.fy = d3.event.y
}
;
RenderGraphGrid.prototype.dragended = function(a) {
    a.fx = null;
    a.fy = null
}
;
RenderGraphGrid.prototype.getPos = function(a, b) {
    var e = "x" == b ? this.width : this.height;
    "Patient" == a.name && (a[b] = e / 2);
    return a[b] = Math.max(this.lmargin, Math.min(e - this.rmargin, a[b]))
}
;
var modal = document.getElementById("myModal")
  , span = document.getElementsByClassName("close")[0];
span.onclick = function() {
    modal.style.display = "none"
}
;
window.onclick = function(a) {
    a.target == modal && (modal.style.display = "none")
}
;
