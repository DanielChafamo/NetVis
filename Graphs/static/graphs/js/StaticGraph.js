
class StaticGraph {
    constructor(graph, div_id) {
        var alias = this;
        this.graph = graph;
        this.width = $(div_id).width();
        this.height = $(div_id).height();
        
        var colors = {}
            colors[1] ='black';
            colors[2] ='white';
            colors[-1] ='#1f77b4';
            colors[-2] ='#d62728'; 

        this.force = d3.layout.force()
            .charge(function(n) { return -(n.degree+1)*100 })
            .linkDistance(10) 
            .gravity(.7)
            .size([this.width, this.height]);

        this.svg = d3.select(div_id).append("svg")
            .attr("id", 'svg'+div_id)
            .attr("width", this.width)
            .attr("height", this.height); 

        this.force.nodes(this.graph.nodes).links(this.graph.links).start();

        this.link = this.svg.selectAll(".link")
            .data(this.graph.links)
            .enter().append("line")
            .attr("class", "link")
            .style("stroke", function (d) { return colors[-d.weight];}.bind(this))
            .style("stroke-dasharray", function (d) { if (d.weight == 1) return ("3, 3")});

        this.node = this.svg.selectAll(".node")
            .data(this.graph.nodes)
            .enter().append("g")
            .attr("class", "node")
            .call(this.force.drag);

        this.circles = this.node.append("circle")
            .attr("r", function (d) {return 2 + 1.5*d.degree})
            .style("fill", function (d) { return colors[1+(d.name != "Ego")]})

        
        this.force.on("tick", function () {
            this.svg.selectAll("circle")
                .attr("cx", function (d) { return Xpos(d);} )
                .attr("cy", function (d) { return Ypos(d);} )
            this.svg.selectAll("text")
                .attr("x", function (d) { return Xpos(d);} )
                .attr("y", function (d) { return Ypos(d);} );
            this.link
                .attr("x1", function (d) { return Xpos(d.source); })
                .attr("y1", function (d) { return Ypos(d.source); })
                .attr("x2", function (d) { return Xpos(d.target); })
                .attr("y2", function (d) { return Ypos(d.target); });

            let links = this.graph.links.map(this.get_id);
            for (let node of this.graph.nodes) { 
                node.degree = links.filter((x)=>x.split('_').includes(node.id.toString())).length
            } 
            this.svg.selectAll("circle")
                .attr("r", function (d) {  
                    if (d.name == "Ego") return 2
                    else return 0.2 + 0.05**d.degree
                })  
            this.link
                .style("stroke", function (d) { return colors[-d.weight];})
                .style("stroke-dasharray", function (d) { if (d.weight == 1) return ("3, 3")});
        }.bind(this)); 

        function Xpos(d) { 
            let radius = 0.2 + 0.05*d.degree; 
            return d.x = Math.max(2*radius, Math.min(alias.width - 2*radius, d.x)); 
        }
        function Ypos(d) { 
            let radius = 0.2 + 0.05**d.degree; 
            return d.y = Math.max(2*radius, Math.min(alias.height - 2*radius, d.y)); 
        }
    }

    get_id(id_obj) {
        let src = id_obj.source;
        let trg = id_obj.target;
        if (typeof(src) !== 'number') src = src.id
        if (typeof(trg) !== 'number') trg = trg.id
        return src + '_' + trg
    }
}