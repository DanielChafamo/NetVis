
var thresh_toggle = 0;

for (var i = 0; i < feats['study_id'].length; i++) {
    let id = feats['study_id'][i];
    let li = document.createElement("li");
    document.getElementById("pIDs").appendChild(li);
    li.value = i+1;
    li.id = 'sample'+ id;
    li.classList.add('pref'); 
    document.getElementById('sample'+id).innerHTML = 'Patient ID: ' + id;
} 

var coll = document.getElementsByClassName("collapsible");
for (var i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var content = this.nextElementSibling;
        if (content.style.display === "block") content.style.display = "none";
        else content.style.display = "block";
    });
}



$(".pref").click(function() { 
    select_pid($(this).attr('value') );
});

$("#thersholdSlider").change(function(){
    thresh_toggle = 1 - thresh_toggle;
    graph.threshold(thresh_toggle);
});

// Filter sliders
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

// Properties sliders
var linktime = document.getElementById('linktime');
noUiSlider.create(linktime, {start: 1000, connect: [true, false],
    range: { 'min': 0, 'max': 5000 } });
var nodetime = document.getElementById('nodetime');
noUiSlider.create(nodetime, {start: 1700, connect: [true, false],
    range: { 'min': 0, 'max': 5000 } });
var monthtime = document.getElementById('monthtime');
noUiSlider.create(monthtime, {start: 1700, margin: 1, connect: [true, false],
    range: { 'min': 18, 'max': 5000 } });
var alphaT = document.getElementById('alphaT');
noUiSlider.create(alphaT, {start: 0.1, connect: [true, false],  
    range: { 'min': 0, 'max': 1 }});
var alphaR = document.getElementById('alphaR');
noUiSlider.create(alphaR, {start: 0.1, margin: 1, connect: [true, false], 
    range: { 'min': 0, 'max': 1 }});


range0.noUiSlider.on('set', function(){ filter() });
range1.noUiSlider.on('set', function(){ filter() });
range2.noUiSlider.on('set', function(){ filter() });
range3.noUiSlider.on('set', function(){ filter() });
range4.noUiSlider.on('set', function(){ filter() });

linktime.noUiSlider.on('set', function() { 
    graph.linktime = +linktime.noUiSlider.get(); });
nodetime.noUiSlider.on('set', function() { 
    graph.nodetime = +nodetime.noUiSlider.get(); });
monthtime.noUiSlider.on('set', function() { 
    graph.monthtime = +monthtime.noUiSlider.get(); });
alphaT.noUiSlider.on('set', function() { 
    graph.alphaT = +alphaT.noUiSlider.get(); });
alphaR.noUiSlider.on('set', function() { 
    graph.alphaR = +alphaR.noUiSlider.get(); });


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






