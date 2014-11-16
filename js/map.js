
var ProjectionFactory = ProjectionFactory || {};

ProjectionFactory.satellite = function(width, height) {
    return d3.geo.satellite()
    .distance(1.1)
//    .scale(5500)
    .rotate([78.00, -36.50, 2.12])
    .center([-2, 5])
    .tilt(5)
//    .clipAngle(Math.acos(1 / 1.1) * 180 / Math.PI - 1e-6)
//    .precision(.1)
    ;
};

function BackgroundMap(elementIdSelector) {

    this.mapSelector = elementIdSelector;

    this.drawMap = function() {

        var map = this;

        var el = $(map.mapSelector)[0];
        if (typeof el === 'undefined') {
            console.log('ERROR - No element matching: ' + this.mapSelector);
            return;
        }

        map.height = el.clientHeight;
        map.width = el.clientWidth;
        console.log('Making map size: ' + map.width + 'x' + map.height);

        map.projection = ProjectionFactory.satellite(map.width, map.height);

        map.path = d3.geo.path().projection(map.projection);

        map.svg = d3.select(map.mapSelector).append('svg')
            .attr('width', map.width)
            .attr('height', map.height);

        map.cv = map.svg.append('g');
        map.bg = map.svg.append('g');
        map.fg = map.svg.append('g');

        var app = this;
        app.drawState().then(function() {
            app.drawCounties();
        })
    };

    this.drawState = function() {
        var deferred = $.Deferred();

        var map = this;
        d3.json('../data/states.json', function(error, response) {

            console.log('Drawing state');

            map.projection.scale(.25).translate([0, 0]);

            var b = map.path.bounds(response),
                s = 0.95 / Math.max((b[1][0] - b[0][0]) / map.width, (b[1][1] - b[0][1]) / map.height),
                t = [(map.width - s * (b[1][0] + b[0][0])) / 2, (map.height - s * (b[1][1] + b[0][1])) / 2];
            map.projection.scale(s).translate(t);

            var graticule = d3.geo.graticule()
                .extent([[-93, 27], [-47 + 1e-6, 57 + 1e-6]])
                .step([3, 3]);

            map.cv.append('path')
                .datum(graticule)
                .attr('class', 'graticule')
                .attr('d', map.path);

            map.fg.selectAll('path')
                .data(response.features)
                .enter().append('path')
                .attr('class', 'state')
                .attr('d', map.path);

            deferred.resolve();
        });

        return deferred.promise();
    };

    this.drawCounties = function() {
        // use promises since d3.json is async
        var deferred = $.Deferred();

        var map = this;
        d3.json('../data/counties.json', function(error, response) {
            map.bg.selectAll('path')
                .data(response.features)
                .enter().append('path')
                .attr('class', 'county')
                .attr('d', map.path)
                .on('mouseover', function() {
                    d3.select(this)
                        .transition()
                        .duration(2000)
                        .ease('elastic')
                        .style('fill', '#feb24c');
                })
                .on('mouseout', function() {
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .ease('elastic')
                        .style('fill', '#333639');
                });
            deferred.resolve();
        });

        return deferred.promise();
    };
}; 
