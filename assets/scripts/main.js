$.fn.peity.defaults.line = {
    delimiter: ",",
    fill: "transparent",
    height: 15,
    max: null,
    min: 0,
    stroke: "#919191",
    strokeWidth: 1,
    width: 78
};

var sparklines = function() {
    jQuery(".sparkline").peity("line");
};

jQuery(function() {
    sparklines();
});
