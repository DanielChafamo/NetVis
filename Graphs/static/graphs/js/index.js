  

for (var i = 0; i < feats['study_id'].length; i++) {
    let id = feats['study_id'][i];
    let li = document.createElement("li");
    document.getElementById("pIDs").appendChild(li);
    li.value = i+1;
    li.id = 'sample'+ id;
    li.classList.add('pref'); 
    document.getElementById('sample'+id).innerHTML = 'Patient ID: ' + id;
} 


$(".pref").click(function() {
    location.href = "/graphs/?initial="+$(this).attr('value');
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






/*
*
*   Landing Page Chart
*   powered by Highchart
* 
 */

var data = feats['PhyFunc_TScore']
            .map((y,i)=> ({ 'y' : y, 
                           'x' : feats['constraint'][i],
                           'z' : feats['network.size'][i],
                           'study_id' : feats['study_id'][i],
                           'id': i+1 })).sort((entry)=>entry.x)
for (var i = feats['PhyFunc_TScore'].length - 1; i >= 0; i--) {
    if (isNaN(feats['PhyFunc_TScore'][i])) {
        feats['PhyFunc_TScore'].splice(i)
        feats['constraint'].splice(i)
        data.splice(i)
    }
} 

function round(number, precision) {
    const factor = 10 ** precision;
    return Math.round(number * factor) / factor;
}

function gaussianElimination(input, order) {
    const matrix = input;
    const n = input.length - 1;
    const coefficients = [order];

    for (let i = 0; i < n; i++) {
        let maxrow = i;
        for (let j = i + 1; j < n; j++) {
            if (Math.abs(matrix[i][j]) > Math.abs(matrix[i][maxrow])) 
                maxrow = j; 
        }

        for (let k = i; k < n + 1; k++) {
            const tmp = matrix[k][i];
            matrix[k][i] = matrix[k][maxrow];
            matrix[k][maxrow] = tmp;
        }

        for (let j = i + 1; j < n; j++) {
            for (let k = n; k >= i; k--) 
                matrix[k][j] -= (matrix[k][i] * matrix[i][j]) / matrix[i][i]; 
        }
    }

    for (let j = n - 1; j >= 0; j--) {
        let total = 0;
        for (let k = j + 1; k < n; k++) 
            total += matrix[k][j] * coefficients[k];
        coefficients[j] = (matrix[n][j] - total) / matrix[j][j];
    }

    return coefficients;
}

function polynomial(data, order) {
    const lhs = [];
    const rhs = [];
    let a = 0;
    let b = 0;
    const len = data.length;
    const k = order + 1;

    for (let i = 0; i < k; i++) {
      for (let l = 0; l < len; l++) {
        if (data[l][1] !== null) {
          a += (data[l][0] ** i) * data[l][1];
        }
      }

      lhs.push(a);
      a = 0;

      const c = [];
      for (let j = 0; j < k; j++) {
        for (let l = 0; l < len; l++) {
          if (data[l][1] !== null) {
            b += data[l][0] ** (i + j);
          }
        }
        c.push(b);
        b = 0;
      }
      rhs.push(c);
    }
    rhs.push(lhs);

    const coefficients = gaussianElimination(rhs, k).map(v => round(v, 4));

    const predict = x => ([
      round(x, 4),
      round(
        coefficients.reduce((sum, coeff, power) => sum + (coeff * (x ** power)), 0),
        4,
      ),
    ]);

    const points = data.map(point => predict(point[0])); 

    return points;
}


var dat = feats['constraint'].map((x,i)=> [x, feats['PhyFunc_TScore'][i]])
var fit = polynomial(dat, 1).sort() 
console.log(fit)
 
Highcharts.chart('container', {

    chart: {
        type: 'bubble',
        plotBorderWidth: 1,
        zoomType: 'xy'
    },

    title: {
        text: 'Physical Function TScore Versus Constraint'
    }, 

    xAxis: {
        title: {
            enabled: true,
            text: 'Constraint'
        }, 
        startOnTick: true,
        endOnTick: true,
        showLastLabel: true, 
        gridLineWidth: 1
    },

    yAxis: {
        title: {
            text: 'Physical Function TScore'
        }, 
        startOnTick: true,
        endOnTick: true, 
        gridLineWidth: 1
    }, 

    legend: {
        enabled: false
    },  

    tooltip: {
        headerFormat: '<b>{point.study_id}</b><br>',
        pointFormat: '<b>{point.study_id}</b><br>'
    }, 

    series: 
    [{
        type: 'line',
        name: 'Regression Line',
        data: fit,
        color: '#F00',
        marker: {
            enabled: false
        },
        states: {
            hover: {
                lineWidth: 0
            }
        },
        enableMouseTracking: false
    }, {
        data: data,
        name: 'patient',
        id: 'patient',
        allowPointSelect: true,
        marker: { 
            fillColor: {
                radialGradient: { cx: 0.4, cy: 0.3, r: 0.7 },
                stops: [
                    [0, 'rgba(255,255,255,0.5)'],
                    [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0.5).get('rgba')]
                ]
            }
        },
        cursor: 'pointer',
            events: {
                click: function (event) {
                    console.log(event.point.id)
                    location.href = "/graphs/?initial="+event.point.id;
                }
            }
    }]

});

