
var graphrend = null;
var thresh_toggle = 0;
var gs = {};
    gs[0] = null;
    gs[3] = null;
    gs[6] = null;
var slideIndex = 1;
var color = d3.scale.category20();
var colors = {};
    colors[1] = color(0);
    colors[2] = color(1);
    colors[0] = color(2);

var graph0;
var graph3;
var graph6;

for (let i = 1; i <= 139; i++) { 
    let li = document.createElement("li");
    document.getElementById("pIDs").appendChild(li);
    li.value = i;
    li.id = 'sample'+i;
    li.classList.add('pref'); 
    document.getElementById('sample'+i).innerHTML = 'Patient ID: ' + i;
}

$(document).ready(function() {  
    select_pid(5);
    showSlides(slideIndex); 
});

$(".pref").click(function() { 
    select_pid($(this).attr('value') );
});

$("#thersholdSlider").change(function(){
    thresh_toggle = 1 - thresh_toggle;
    graphrend.threshold(thresh_toggle);
});

$( "#target" ).submit(function( event ) {
    select_pid($("#patientID").val() );
    event.preventDefault();
});



$("#videoplay").click(function(event) {
    let timeout = 1000;
    setTimeout(function() { 
        gs[0].changelinks("graphRec0");
    }, 20);
    setTimeout(function() { 
        gs[0].changelinks("graphRec3");
    }, timeout);
    setTimeout(function() { 
        gs[0].changelinks("graphRec6")
    }, 2*timeout); 
    setTimeout(function() { 
        gs[0].changelinks("graphRec0")
    }, 3*timeout); 


});

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


range1.noUiSlider.on('set', function(){ filter() });
range2.noUiSlider.on('set', function(){ filter() });
range3.noUiSlider.on('set', function(){ filter() });
range4.noUiSlider.on('set', function(){ filter() });

function filter() {
    let [density_from, density_to] = range1.noUiSlider.get();
    let [constr_from, constr_to] = range2.noUiSlider.get();
    let [kinp_from, kinp_to] = range3.noUiSlider.get();
    let [tr_from,tr_to] = range4.noUiSlider.get();
    for (let i = 1; i <= 139; i++) { 
        let sample_i = document.getElementById('sample'+i);
        sample_i.style.display = "";
        if (feats['density'][i-1] < density_from || feats['density'][i-1] > density_to) 
            sample_i.style.display = "none";
        if (feats['constraint'][i-1] < constr_from || feats['constraint'][i-1] > constr_to) 
            sample_i.style.display = "none";
        if (feats['kin_prop'][i-1] < kinp_from || feats['kin_prop'][i-1] > kinp_to) 
            sample_i.style.display = "none";
        if (feats['turnover.rate'][i-1] < tr_from || feats['turnover.rate'][i-1] > tr_to) 
            sample_i.style.display = "none";
    }    
}


function plusSlides(n) {
    showSlides(slideIndex += n);
}

function showSlides(n) {
    var i;
    var slides = document.getElementsByClassName("mySlides");
    if (n > slides.length) {slideIndex = 1} 
    if (n < 1) {slideIndex = slides.length}
    for (i = 0; i < slides.length; i++) {
      slides[i].style.display = "none"; 
    }
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
            $(".label").html("Patient " + pid)
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
            .charge(-4000)
            .linkDistance(function(d) { return 200 / d.weight })
            .gravity(.4)
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
            .style("stroke-width", function (d) { return Math.sqrt(d.weight);});
        this.node = this.svg.selectAll(".node")
            .data(this.graph.nodes)
            .enter().append("g")
            .attr("class", "node")
            .call(this.force.drag)
            .on('dblclick', connectedNodes);
        this.node.append("circle")
            .attr("r", function (d) {return 5 + 2*d.degree})
            .style("fill", function (d) { return colors[(d.name != "Ego") + (d.degree == 0)]; })
        this.node.append("text")
              .attr("dx", 15)
              .attr("dy", ".35em")
              .text(function(d) { return d.name });
        this.force.on("tick", function () {
            alias.link.attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; });
            d3.selectAll("circle").attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; });
            d3.selectAll("text").attr("x", function (d) { return d.x; })
                .attr("y", function (d) { return d.y; });
        }); 

        this.toggle = 0; 
        this.linkedByIndex = {};
        
        for (let i = 0; i < this.graph.nodes.length; i++) {
            this.linkedByIndex[i + "," + i] = 1;
        };

        this.graph.links.forEach(function (d) {
            alias.linkedByIndex[d.source.index + "," + d.target.index] = 1;
        });

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
    
    changelinks(graphmonth) { 
        this.graph.links.splice(0, this.graph.links.length); 
        for (var i = 0; i < this[graphmonth].links.length; i++) {
            if (this[graphmonth].links[i].weight > 0) {
                this.graph.links.push(this[graphmonth].links[i]);
            } 
        }
        this.restart();
    };


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
        this.node.enter().insert("circle", ".cursor").attr("class", "node").attr("r", 50).call(this.force.drag);
        this.force.start();
    }
 
    neighboring(a, b) {
        return this.linkedByIndex[a.index + "," + b.index];
    }
}











