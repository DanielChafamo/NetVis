 
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
//       [_] node by node transition
//       [_] timeline dragable
//       [_] leaver and joiner properties
//       
//       
var graphrend = null;
var thresh_toggle = 0;
var gs = {};
    gs[0] = null;
    gs[3] = null;
    gs[6] = null;
var slideIndex = 1; 
var colors = {}; 
    colors[1] = 'black';
    colors[2] = 'white';
    colors[-2] = 'red';
    colors[-1] = 'blue';

var graph0;
var graph3;
var graph6;

var modal = document.getElementById('myModal');
modal.style.display = "none";

for (var i = 0; i < feats['study_id'].length; i++) {
    let id = feats['study_id'][i];
    let li = document.createElement("li");
    document.getElementById("pIDs").appendChild(li);
    li.value = i+1;
    li.id = 'sample'+ id;
    li.classList.add('pref'); 
    document.getElementById('sample'+id).innerHTML = 'Patient ID: ' + id;
} 

$(document).ready(function() {   
    if (initial == -1) initial = 5;
    select_pid(initial);
    showSlides(slideIndex); 
});

$(".pref").click(function() { 
    select_pid($(this).attr('value') );
});

$("#thersholdSlider").change(function(){
    thresh_toggle = 1 - thresh_toggle;
    graphrend.threshold(thresh_toggle);
});


$("#videoplay").click(function(event) {    
    gs[0].changelinks("graphRec3");  
});

var range0 = document.getElementById('range0');
noUiSlider.create(range0, {start: [4,15], connect: true, 
    range: { 'min': 0, 'max': 22 } });

var range1 = document.getElementById('range1');
noUiSlider.create(range1, {start: [0.4,0.9], connect: true, 
    range: { 'min': 0, 'max': 1 } });

var range2 = document.getElementById('range2');
noUiSlider.create(range2, {start: [28,72], margin: 1, connect: true,  
    range: { 'min': 18, 'max': 112 } });

var range3 = document.getElementById('range3');
noUiSlider.create(range3, {start: [0.4,0.8], connect: true,  
    range: { 'min': 0, 'max': 1 }});

var range4 = document.getElementById('range4');
noUiSlider.create(range4, {start: [20,70], margin: 1, connect: true,  
    range: { 'min': 0, 'max': 100 }});


range0.noUiSlider.on('set', function(){ filter() });
range1.noUiSlider.on('set', function(){ filter() });
range2.noUiSlider.on('set', function(){ filter() });
range3.noUiSlider.on('set', function(){ filter() });
range4.noUiSlider.on('set', function(){ filter() });

function filter() {
    let [size_from, size_to] = range0.noUiSlider.get();
    let [density_from, density_to] = range1.noUiSlider.get();
    let [constr_from, constr_to] = range2.noUiSlider.get();
    let [kinp_from, kinp_to] = range3.noUiSlider.get();
    let [tr_from,tr_to] = range4.noUiSlider.get();
    for (var idx = 0; idx < feats['study_id'].length; idx++) {  
        let sample_i = document.getElementById('sample' + feats['study_id'][idx]);
        sample_i.style.display = "";
        if (feats['network.size'][idx] < size_from || feats['network.size'][idx] > size_to) 
            sample_i.style.display = "none";
        if (feats['density'][idx] < density_from || feats['density'][idx] > density_to) 
            sample_i.style.display = "none";
        if (feats['constraint'][idx] < constr_from || feats['constraint'][idx] > constr_to) 
            sample_i.style.display = "none";
        if (feats['kin_prop'][idx] < kinp_from || feats['kin_prop'][idx] > kinp_to) 
            sample_i.style.display = "none";
        if (feats['turnover.rate'][idx] < tr_from || feats['turnover.rate'][idx] > tr_to) 
            sample_i.style.display = "none";
    }    
}


function plusSlides(n) {
    showSlides(slideIndex += n);
}

function showSlides(n) {
    var i;
    var slides = document.getElementsByClassName("mySlides");
    if (n > slides.length) slideIndex = 1;
    if (n < 1) slideIndex = slides.length;
    for (i = 0; i < slides.length; i++)
        slides[i].style.display = "none"; 
    slides[slideIndex-1].style.display = "block";
    graphrend = gs[3*(slideIndex-1)] ;
}

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
            $("#d3-0").empty();
            $("#d3-3").empty();
            $("#d3-6").empty();
            gs[0] = new RenderGraph(graph0, graph3, graph6, "#d3-0"); 
            gs[3] = new RenderGraph(graph3, graph6, graph0,"#d3-3"); 
            gs[6] = new RenderGraph(graph6, graph0, graph3,"#d3-6"); 
            $(".label").html("Patient " + feats['study_id'][pid-1])
            showSlides(1);
        }
    });
}


class RenderGraph {
    constructor(graph, graph3, graph6, div_id) {
        var alias = this;
        this.graph = graph;
        this.width = 850;
        this.height = 700; 
        this.force = d3.layout.force()
            .charge(function(n) { return -(n.degree+1)*100 })
            .linkDistance(function(d) { return 200 / d.weight })
            .gravity(.07)
            .size([this.width, this.height]);

        this.svg = d3.select(div_id).append("svg")
            .attr("width", this.width)
            .attr("height", this.height);

        this.graphRec = JSON.parse(JSON.stringify(this.graph));
        this.graphRec0 = JSON.parse(JSON.stringify(graph));  
        this.graphRec3 = JSON.parse(JSON.stringify(graph3)); 
        this.graphRec6 = JSON.parse(JSON.stringify(graph6)); 

        this.force.nodes(this.graph.nodes).links(this.graph.links).start();

        this.link = this.svg.selectAll(".link")
            .data(this.graph.links)
            .enter().append("line")
            .attr("class", "link")
            .style("stroke", function (d) { return colors[-d.weight];})
            .style("stroke-dasharray", function (d) { if (d.weight == 1) return ("3, 3")});

        this.node = this.svg.selectAll(".node")
            .data(this.graph.nodes)
            .enter().append("g")
            .attr("class", "node")
            .call(this.force.drag)
            .on('dblclick', connectedNodes);

        this.circles = this.node.append("circle")
            .attr("r", function (d) {return 3 + 2*d.degree})
            .style("fill", function (d) { return colors[1+(d.name != "Ego")]})

        this.node.append("text")
              .attr("dx", 15)
              .attr("dy", ".35em")
              .text(function(d) { return d.name });

        this.animationStep = 400;
        this.force.on("tick", function () { 
            d3.selectAll("circle")
                // .transition().ease('linear').duration(this.animationStep)
                .attr("cx", function (d) { return Xpos(d);} )
                .attr("cy", function (d) { return Ypos(d);} )
            d3.selectAll("text")
                // .transition().ease('linear').duration(this.animationStep)
                .attr("x", function (d) { return Xpos(d);} )
                .attr("y", function (d) { return Ypos(d);} );
            this.node.transition()
                // .ease('linear').duration(this.animationStep)
                .attr("x", function (d) { return Xpos(d);} )
                .attr("y", function (d) { return Ypos(d);} );
            this.link
                // .transition().ease('linear').duration(this.animationStep)
                .attr("x1", function (d) { return Xpos(d.source); })
                .attr("y1", function (d) { return Ypos(d.source); })
                .attr("x2", function (d) { return Xpos(d.target); })
                .attr("y2", function (d) { return Ypos(d.target); });

            let links = this.graph.links.map(this.get_id);
            for (let node of this.graph.nodes) { 
                node.degree = links.filter((x)=>x.split('_').includes(node.id.toString())).length
            } 
            d3.selectAll("circle")
                .attr("r", function (d) { return 3 + 2*d.degree})
                .style("fill", function (d) { return colors[1+(d.name != "Ego")]; })
            this.link
                .style("stroke", function (d) { return colors[-d.weight];})
                .style("stroke-dasharray", function (d) { if (d.weight == 1) return ("3, 3")});

    
        }.bind(this)); 

        function Xpos(d) { 
            let radius = 3 + 2*d.degree; 
            return d.x = Math.max(radius, Math.min(alias.width - radius, d.x));
            // if (d.name == "Ego") return alias.width/2;
            // else return d.x; 
        }
        function Ypos(d) { 
            let radius = 3 + 2*d.degree; 
            return d.y = Math.max(radius, Math.min(alias.height - radius, d.y));
            // if (d.name == "Ego") return alias.width/2;
            // else return d.y; 
        }
        this.toggle = 0; 
        this.linkedByIndex = {};
        
        for (let i = 0; i < this.graph.nodes.length; i++) {
            this.linkedByIndex[i + "," + i] = 1;
        };

        this.graph.links.forEach(function (d) {
            this.linkedByIndex[d.source.index + "," + d.target.index] = 1;
        }.bind(this));

        function connectedNodes() {
            if (alias.toggle == 0) {
                var d = d3.select(this).node().__data__;
                alias.node.style("opacity", function (o) {
                    return alias.neighboring(d, o) | alias.neighboring(o, d) ? 1 : 0.1;
                });
                alias.link.style("opacity", function (o) {
                    return d.index==o.source.index | d.index==o.target.index ? 1 : 0.1;
                });
                alias.toggle = 1;
            } else {
                alias.node.style("opacity", 1);
                alias.link.style("opacity", 1);
                alias.toggle = 0;
            }
        }
    }
    
    changelinks_temp(graphmonth) {  
        console.log('links: ', this[graphmonth].links) 
        let timeout = 1000;
        let alias = this;
        let len = this.graph.links.length
        for (let i = 0; i < len; i++) {
            setTimeout(function() { 
                alias.graph.links.splice(0, 1);
                alias.restart();
            }, i*timeout);
        }
        len = this[graphmonth].links.length 
        for (let i = 0; i < len; i++) {
            setTimeout(function() { 
                alias.graph.links.push(alias[graphmonth].links[i]);
                alias.restart();
            }, i*timeout);
        }
        
    }

    changelinks(graphmonth) {  
        var timeout = 500; 
        var in_links = this.graph.links.map(this.get_id);
        var out_links = this[graphmonth].links.map(this.get_id);
        var remove = in_links.filter((x)=>out_links.indexOf(x)===-1);
        for (let i = 0; i < remove.length; i++) {
            setTimeout(function() { 
                in_links = this.graph.links.map(this.get_id)
                this.graph.links.splice(in_links.indexOf(remove[i]), 1); 
                this.restart();
            }.bind(this), i*timeout);
        }
        var add = out_links.filter((x)=>in_links.indexOf(x)===-1)
        for (let i = 0; i < add.length; i++) {
            setTimeout(function() { 
                out_links = this[graphmonth].links.map(this.get_id);
                this.graph.links.push(this[graphmonth].links[out_links.indexOf(add[i])]); 
                this.restart();
                if (i == add.length-1) { 
                    setTimeout(function() { 
                        modal.style.display = "block";
                        setTimeout(function() {  
                            modal.style.display = "none";
                            gs[0].changelinks("graphRec6");
                        }, 2*timeout) 
                    }, 2*timeout)
                }
            }.bind(this), i*timeout);
        }
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
        for (var i = 0; i < this.graphRec.links.length; i++) 
            if (this.graphRec.links[i].weight > thresh) {
                this.graph.links.push(this.graphRec.links[i]);
            } 
        this.restart();
    }
 
    restart() {
        this.link = this.link.data(this.graph.links);
        this.link.exit().remove();
        this.link.enter().insert("line", ".node").attr("class", "link");
        this.node = this.node.data(this.graph.nodes);
        this.node.enter().insert("circle", ".cursor").attr("class", "node").call(this.force.drag);
        this.force.start();
    }
 
    neighboring(a, b) {
        return this.linkedByIndex[a.index + "," + b.index];
    }
}











