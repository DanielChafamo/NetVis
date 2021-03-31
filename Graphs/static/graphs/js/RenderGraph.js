class RenderGraph {
    constructor(graph, graph3, graph6, div_id) {
        var alias = this;
        this.graph = graph; 
        this.width = 850;
        this.height = 500;

        var colors = {}
            colors[1] ='black';
            colors[2] ='white';
            colors[-1] ='#1f77b4';
            colors[-2] ='#d62728'; 

        this.force = d3.layout.force() 
            .charge(function(n) { return -(n.degree+1)*200 })
            .linkDistance(100) 
            .gravity(.07)
            .size([this.width, this.height]);

        this.svg = d3.select(div_id).append("svg")
            .attr("id", 'svgmain')
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

        this.circles = this.node.append("circle")
            .attr("r", function (d) {return 2 + 1.5*d.degree})
            .style("fill", function (d) { return colors[1+(d.name != "Ego")]})

        for (var i = this.graph.nodes.length - 1; i >= 0; i--)
            this.graph.nodes[i]['changing'] = false;
    
        this.node.append("text")
            .attr("dx", 15)
            .attr("dy", ".35em")
            .text(function(d) { return d.name })
            // .style('stroke', function(d) { 
            //     if (d.changing) connectedNodes(d);
            //     return 'black';
            // });
        
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
            for (let node of this.graph.nodes) 
                node.degree = links.filter((x)=>x.split('_').includes(node.id.toString())).length
            
            this.svg.selectAll("circle")
                .attr("r", function (d) { return 2 + 1.5*d.degree})
                .style("fill", function (d) { return colors[1+(d.name != "Ego")]; })
            this.link
                .style("stroke", function (d) { return colors[-d.weight];})
                .style("stroke-dasharray", function (d) { if (d.weight == 1) return ("3, 3")});
            // this.svg.selectAll('text')
            //     .style('stroke', function(d) { 
            //         if (d.changing) connectedNodes(d);
            //         return 'black';
            //     });
        }.bind(this)); 

        function Xpos(d) { 
            let radius = 2 + 1.5*d.degree; 
            return d.x = Math.max(radius, Math.min(alias.width - radius, d.x));
        }
        function Ypos(d) { 
            let radius = 2 + 1.5*d.degree; 
            return d.y = Math.max(radius, Math.min(alias.height - radius, d.y));
        }

        this.toggle = 0; 
        this.linkedByIndex = {};
        
        for (let i = 0; i < this.graph.nodes.length; i++)
            this.linkedByIndex[i + "," + i] = 1;

        this.graph.links.forEach(function (d) {
            this.linkedByIndex[d.source.index + "," + d.target.index] = 1;
        }.bind(this));

        function connectedNodes(d) {
            alias.node.style("opacity", 1);
            alias.link.style("opacity", 1);
            alias.node.style("opacity", function (o) {
                return alias.neighboring(d, o) | alias.neighboring(o, d) ? 0.1 : 1;
            });
            alias.link.style("opacity", function (o) {
                return d.index==o.source.index | d.index==o.target.index ? 0.1 : 1;
            }); 
        }
    }

    get_id(id_obj) {
        let src = id_obj.source;
        let trg = id_obj.target;
        if (typeof(src) !== 'number') src = src.id
        if (typeof(trg) !== 'number') trg = trg.id
        return src + '_' + trg
    }

    changenodes(graphmonth, month) {  
        var timeout = 1000; 
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
            timeouts.push(setTimeout(function() {
                for (var i = remove_now.length - 1; i >= 0; i--) {
                    in_links = this.graph.links.map(this.get_id);
                    this.graph.links.splice(in_links.indexOf(remove_now[i]), 1); 
                }
                for (var i = add_now.length - 1; i >= 0; i--) {
                    out_links = this[graphmonth].links.map(this.get_id);
                    this.graph.links.push(this[graphmonth].links[out_links.indexOf(add_now[i])]); 
                } 
                for (var i = this.graph.nodes.length - 1; i >= 0; i--)
                    this.graph.nodes[i]['changing'] = false;
                this.graph.nodes[parseInt(from)]['changing'] = true; 
                this.restart();
            }.bind(this), i*timeout));
            i ++; 
        }
        timeouts.push(
                    setTimeout(function() { 
                        this.changenodes("graphRec6", '6');
                        $("#lm"+month).css('-webkit-filter', 'blur(0px)')
                        document.getElementById(month+"mon").click();
                        console.log(month+"mon")
                    }.bind(this), (i+0.5)*timeout)
                ); 
    }

    threshold(thresh) { 
        this.graph.links.splice(0, this.graph.links.length);
        for (var i = 0; i < this.graphRec.links.length; i++) { 
            if (this.graphRec.links[i].weight > thresh) 
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