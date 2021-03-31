class StaticGraph {
    constructor(graph, div_id) { 
        this.graph = graph; 
        this.width = $(div_id).width();
        this.height = $(div_id).height();

        this.svg = d3.select(div_id).append("svg")
            .attr("id", 'svg'+div_id)
            .attr("width", this.width)
            .attr("height", this.height); 

        var g = this.svg.append("g")
            .attr("transform", "translate(" + this.width / 2 + "," + this.height / 2 + ")");

        this.link = g.append("g")
            .attr("stroke", "#000")
            .attr("stroke-width", 0.5)
            .selectAll(".link")
            .data(this.graph.links, function(d) { return d.source.id + "-" + d.target.id; })
            .enter().append("line")
            .style("stroke", function (d) { 
                if (d.weight == 1) return '#1f77b4'
                else return '#d62728' })
            .style("stroke-dasharray", function (d) { if (d.weight == 1) return ("3, 3")});

        this.node = g.append("g")
            .attr("stroke", "#000")
            .attr("stroke-width", 0.5)
            .selectAll(".node")
            .data(this.graph.nodes.filter(n=>n.degree > 0), function(d) {return d.id;})
            .enter().append("circle")
            .style("fill", function (d) { 
                if (d.name == "Patient") return 'black'
                else return 'whitesmoke' })
            .style("r", function (d) { return (d.degree == 0)+(d.name=="Ego")});

        this.simulation = d3.forceSimulation(this.graph.nodes)
            .force("charge", d3.forceManyBody().strength(-35))
            .force("link", d3.forceLink(this.graph.links).distance(20))
            .force("x", d3.forceX())
            .force("y", d3.forceY())
            .alphaTarget(0.4)
            .alphaDecay(0.05)
            .on("tick", function () {this.ticked();}.bind(this));
    } 

    ticked() {
        this.node.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

        this.link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        let links = this.graph.links.map(this.get_id);
        for (let node of this.graph.nodes) 
            node.degree = links.filter((x)=>x.split('_').includes(node.id.toString())).length
        
        this.svg.selectAll("circle")
            .attr("r", function (d) { return 2 + 1.5*d.degree})
            .style("fill", function (d) { 
                if (d.name == "Patient") return 'black'
                else return 'whitesmoke' })

        this.link
            .style("stroke", function (d) { 
                if (d.weight == 1) return '#1f77b4'
                else return '#d62728' })
            .style("stroke-dasharray", function (d) { if (d.weight == 1) return ("3, 3")});
    }

    get_id(id_obj) {
        let src = id_obj.source;
        let trg = id_obj.target;
        if (typeof(src) !== 'number') src = src.id
        if (typeof(trg) !== 'number') trg = trg.id
        return src + '_' + trg
    }

}