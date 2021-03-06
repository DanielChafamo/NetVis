var colors = {}
    colors[1] ='black';
    colors[2] ='white';
    colors[-1] = 'cornflowerblue';
    colors[-2] = 'red';

class RenderGraph {
    constructor(graph, graph3, graph6, div_id, height=500) {
        this.graph = graph; 
        this.changing = true;
        this.egodegree = -1;
        this.width = 850;
        this.height = height;
        this.linktime = 1000;
        this.nodetime = 10;
        this.monthtime = 4000;
        this.alphaT = 0.2;
        this.alphaR = 0.4;
        this.alphaR_change = 0.2;

        for (var i = this.graph.nodes.length - 1; i >= 0; i--) {
            if (this.graph.nodes[i]['name'] == "Ego") {
                this.egodegree = this.graph.nodes[i].degree;
                this.graph.nodes[i]['name'] = "Patient";
            }
            this.graph.nodes[i]['changing'] = false;
        }

        this.svg = d3.select(div_id).append("svg")
            .attr("id", 'svgmain')
            .attr("width", this.width)
            .attr("height", this.height); 

        var g = this.svg.append("g")
            // .attr("transform", "translate(" + this.width / 2 + "," + this.height / 2 + ")");

        this.link = g.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .selectAll(".link");

        this.node = g.append("g")
            .attr("stroke", "#000")
            .attr("stroke-width", 1.8)
            .selectAll(".node");

        this.label = g.append("g")
            .attr("stroke", "#000")
            .attr("stroke-width", 0.5)
            .selectAll("text").data(this.graph.nodes)
            .enter().append("text")
            .attr("dx", 15)
            .attr("dy", ".35em")
            .text(function(d) { return d.name }); 

        this.simulation = d3.forceSimulation(this.graph.nodes)
            .force("charge", d3.forceManyBody().strength(-1000))
            .force("link", d3.forceLink(this.graph.links).distance(100))
            .force("x", d3.forceX(this.width/2))
            .force("y", d3.forceY(this.height/2))
            .alphaTarget(this.alphaT)
            .alphaDecay(0.03)
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
                n.x = this.width / 2 + 50*Math.random();
                n.y = this.height / 2 + 50*Math.random();
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
                        return 2 + 1.5*d.degree; }); })
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
        this.simulation.alpha(this.alphaR).restart();
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
            .attr("r", function (d) { return 2 + 1.5*d.degree})
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
        timeouts.push(setTimeout(function() {
            this.graph.links = this[graphmonth].links;
            this.restart(this.alphaR_change, false);
        }.bind(this), this.nodetime));

        timeouts.push(
            setTimeout(function() {
                $("#netsize").html("Network size = " + (this.get_ego_degree(this[graphmonth]) + 1));
                $("#lm"+month).css('-webkit-filter', 'blur(0px)');
                fade_progress('100%');
                timeouts.push(
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
        this.restart(this.alphaR_change, false);
    }

    get_ego_degree(graph) {
        let links = graph.links.map(this.get_id);
        for (let n of graph.nodes) {
            if (n.name == "Ego")
                return links.filter((x)=>x.split('_').includes(n.id.toString())).length;
        }
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
        return d[axis] = Math.max(20, Math.min(bound-20, d[axis]));
    }
  
}