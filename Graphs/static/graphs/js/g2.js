
var graphrend = null;
let color = d3.scale.category20();
var colors = {};
    colors[1] = color(0);
    colors[2] = color(1);
    colors[0] = color(2);

$(document).ready(function() {  
    select_pid(123);
    var thresh_toggle = 0;
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


// Selecting IDS
function select_pid(pid) {
    $.ajax({
        url: '/jsonet/',
        data: {
            'pid': pid
        },
        dataType: 'json',
        success: function (data) { 
            var graph = JSON.parse(data.graph); 
            $("#d3-container").empty();
            graphrend = new RenderGraph(graph, "#d3-container"); 
        }
    });
}


class RenderGraph {
    constructor(graph, div_id) {
        var alias = this;
        this.graph = graph
        //Constants for the SVG
        this.width = 710;
        this.height = 719; 

        //Set up the force layout
        this.force = d3.layout.force()
            .charge(-700)
            .linkDistance(200)
            .size([this.width, this.height]);

        //Append a SVG to the body of the html page. Assign this SVG as an object to svg
        this.svg = d3.select(div_id).append("svg")
            .attr("width", this.width)
            .attr("height", this.height);

        //Read the data from the mis element 
        this.graphRec = JSON.parse(JSON.stringify(this.graph)); //Add this line

        //Creates the graph data structure out of the json data
        this.force.nodes(this.graph.nodes)
            .links(this.graph.links)
            .start();

        //Create all the line svgs but without locations yet
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
            .attr("r", function (d) {return 10 + d.degree})
            .style("fill", function (d) { return colors[(d.name != "Ego") + (d.degree == 0)]; })

        this.node.append("text")
              .attr("dx", 15)
              .attr("dy", ".35em")
              .text(function(d) { return d.name });


        //Now we are giving the SVGs co-ordinates - the force layout is generating the co-ordinates which this code is using to update the attributes of the SVG elements
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
        // 
        //  HIGHLIGHTING vars
        //  
        this.toggle = 0;
        //Create an array logging what is connected to what
        this.linkedByIndex = {};
        
        for (let i = 0; i < this.graph.nodes.length; i++) {
            this.linkedByIndex[i + "," + i] = 1;
        };

        this.graph.links.forEach(function (d) {
            alias.linkedByIndex[d.source.index + "," + d.target.index] = 1;
        });

        function connectedNodes() {
            if (alias.toggle == 0) {
                //Reduce the opacity of all but the neighbouring nodes
                var d = d3.select(this).node().__data__;
                alias.node.style("opacity", function (o) {
                    return alias.neighboring(d, o) | alias.neighboring(o, d) ? 1 : 0.1;
                });
                alias.link.style("opacity", function (o) {
                    return d.index==o.source.index | d.index==o.target.index ? 1 : 0.1;
                });
                //Reduce the op
                alias.toggle = 1;
            } else {
                //Put them back to opacity=1
                alias.node.style("opacity", 1);
                alias.link.style("opacity", 1);
                alias.toggle = 0;
            }
        }

    }

    //
    //  ADJUSTABLE THRESHOLD
    //
    threshold(thresh) { 
        this.graph.links.splice(0, this.graph.links.length);
        for (var i = 0; i < this.graphRec.links.length; i++) 
            if (this.graphRec.links[i].weight > thresh) {
                this.graph.links.push(this.graphRec.links[i]);
            } 
        this.restart();
    }

    //Restart the visualisation after any node and link changes
    restart() {
        this.link = this.link.data(this.graph.links);
        this.link.exit().remove();
        this.link.enter().insert("line", ".node").attr("class", "link");
        this.node = this.node.data(this.graph.nodes);
        this.node.enter().insert("circle", ".cursor").attr("class", "node").attr("r", 5).call(this.force.drag);
        this.force.start();
    }

    //This function looks up whether a pair are neighbours
    neighboring(a, b) {
        return this.linkedByIndex[a.index + "," + b.index];
    }
    
}








var slideIndex = 1;
showSlides(slideIndex);

// Next/previous controls
function plusSlides(n) {
  showSlides(slideIndex += n);
}

// Thumbnail image controls
function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  var i;
  var slides = document.getElementsByClassName("mySlides");
  var dots = document.getElementsByClassName("dot");
  if (n > slides.length) {slideIndex = 1} 
  if (n < 1) {slideIndex = slides.length}
  for (i = 0; i < slides.length; i++) {
      slides[i].style.display = "none"; 
  }
  for (i = 0; i < dots.length; i++) {
      dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex-1].style.display = "block"; 
  dots[slideIndex-1].className += " active";
}














