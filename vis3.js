// Define variables for storing the selected year and search term
var selectedYear3 = "2017"; // Default value
var previousYear3 = "2016"; // Default value
var player3 = ""; // Default value
var selectedMonth3 = "All"; // Default value
var selectedPitchType3 = "All"; // Default valuevar filteredData = []; // Initialize empty array
var zonePercentages3 = new Map(); // Initialize empty map
var zoneAverageWoba3 = new Map();
// Define a color scale for the heatmap
var heatmapIZColor3 = d3.scaleSequential().interpolator(d3.interpolateRdBu)
    .domain([-.1, .6]);

// Add event listeners for the dropdowns
d3.select("#vis3-year-dropdown").on("change", function () {
    selectedYear3 = d3.select(this).property("value");
    updateData3();
});

d3.select("#vis3-month-dropdown").on("change", function () {
    selectedMonth3 = d3.select(this).property("value");
    updateData3();
});

d3.select("#vis3-player-input").on("change", function () {
    player3 = d3.select(this).property("value");
    updateData3();
});

d3.select("#vis3-pitch-type-dropdown").on("change", function () {
    selectedPitchType3 = d3.select(this).property("value");
    updateData3();
});

function initializePlayerDropdown3(data) {
    var pitcherHitterPairs = [...new Set(data.map(d => d.Pitcher + " vs " + d.Batter))];

    var select = d3.select("#vis3-player-input");

    select.selectAll("option").remove();

    select.selectAll("option")
        .data(pitcherHitterPairs)
        .enter()
        .append("option")
        .attr("value", function (d) { return d; })
        .text(function (d) { return d; });

    // Set an initial value for player
    player3 = d3.select("#vis3-player-input").property("value");
}

function updateData3() {
    var filename3 = "http://localhost:8080/" + "Statcast" + selectedYear3.slice(-2) + "-matchups.csv";

    // Load the zip file using the fetch API
    fetch(filename3)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.arrayBuffer();
        })
        .then((arrayBuffer) => {
            // Use JSZip to extract the contents of the zip file
            return JSZip.loadAsync(arrayBuffer);
        })
        .then((zip) => {
            // Find the CSV file inside the zip (assuming there is only one file)
            const csvFile = Object.values(zip.files)[0];

            // Extract the content of the CSV file as text
            return csvFile.async("text");
        })
        .then((csvText) => {
            // Parse the CSV text using D3.js
            const data3 = d3.csvParse(csvText);
            // Filter the data based on user selections
            filteredData2 = data3.filter(function (d) {
                if (selectedMonth3 === "All") {
                    if (selectedPitchType3 === "All") {
                        return d.Pitcher === selectedPitcher && d.Batter === selectedBatter;
                    } else if (selectedPitchType3 === "FF_FT_FC") {
                        return d.Pitcher === selectedPitcher && d.Batter === selectedBatter && (d.pitch_type === "FF" || d.pitch_type === "FT" || d.pitch_type === "FC");
                    } else if (selectedPitchType3 === "SL_CH_CU") {
                        return d.Pitcher === selectedPitcher && d.Batter === selectedBatter && (d.pitch_type === "SL" || d.pitch_type === "CH" || d.pitch_type === "CU");
                    } else {
                        return d.Pitcher === selectedPitcher && d.Batter === selectedBatter && d.pitch_type === selectedPitchType3;
                    }
                } else if (selectedMonth3 === "First Half") {

                    if (selectedPitchType3 === "All") {
                        return d.Pitcher === selectedPitcher && d.Batter === selectedBatter && (d.Month === "4" || d.Month === "5" || d.Month === "6");
                    } else if (selectedPitchType3 === "FF_FT_FC") {
                        return d.Pitcher === selectedPitcher && d.Batter === selectedBatter && (d.Month === "4" || d.Month === "5" || d.Month === "6") && (d.pitch_type === "FF" || d.pitch_type === "FT" || d.pitch_type === "FC");
                    } else if (selectedPitchType3 === "SL_CH_CU") {
                        return d.Pitcher === selectedPitcher && d.Batter === selectedBatter && (d.Month === "4" || d.Month === "5" || d.Month === "6") && (d.pitch_type === "SL" || d.pitch_type === "CH" || d.pitch_type === "CU");
                    } else {
                        return d.Pitcher === selectedPitcher && d.Batter === selectedBatter && (d.Month === "4" || d.Month === "5" || d.Month === "6") && d.pitch_type === selectedPitchType3;
                    }

                } else if (selectedMonth3 === "Second Half") {

                    if (selectedPitchType3 === "All") {
                        return d.Pitcher === selectedPitcher && d.Batter === selectedBatter && (d.Month === "7" || d.Month === "8" || d.Month === "9");
                    } else if (selectedPitchType3 === "FF_FT_FC") {
                        return d.Pitcher === selectedPitcher && d.Batter === selectedBatter && (d.Month === "7" || d.Month === "8" || d.Month === "9") && (d.pitch_type === "FF" || d.pitch_type === "FT" || d.pitch_type === "FC");
                    } else if (selectedPitchType3 === "SL_CH_CU") {
                        return d.Pitcher === selectedPitcher && d.Batter === selectedBatter && (d.Month === "7" || d.Month === "8" || d.Month === "9") && (d.pitch_type === "SL" || d.pitch_type === "CH" || d.pitch_type === "CU");
                    } else {
                        return d.Pitcher === selectedPitcher && d.Batter === selectedBatter && (d.Month === "7" || d.Month === "8" || d.Month === "9") && d.pitch_type === selectedPitchType3;
                    }

                } else {
                    if (selectedPitchType3 === "All") {
                        return d.Pitcher === selectedPitcher && d.Batter === selectedBatter && d.Month === selectedMonth3;
                    } else if (selectedPitchType3 === "FF_FT_FC") {
                        return d.Pitcher === selectedPitcher && d.Batter === selectedBatter && d.Month === selectedMonth3 && (d.pitch_type === "FF" || d.pitch_type === "FT" || d.pitch_type === "FC");
                    } else if (selectedPitchType3 === "SL_CH_CU") {
                        return d.Pitcher === selectedPitcher && d.Batter === selectedBatter && d.Month === selectedMonth3 && (d.pitch_type === "SL" || d.pitch_type === "CH" || d.pitch_type === "CU");
                    } else {
                        return d.Pitcher === selectedPitcher && d.Batter === selectedBatter && d.Month === selectedMonth3 && d.pitch_type === selectedPitchType3;
                    }
                }
            });
            var zoneCounts3 = d3.rollup(filteredData3, v => v.length, d => d.zone);
            var totalPitches3 = filteredData3.length;
            zoneCounts3.forEach((value, key) => {
                zonePercentages3.set(key, (value / totalPitches3 * 100).toFixed(2));
            });
            var zoneWobaCounts3 = d3.rollup(
                filteredData3.filter(d => d.estimated_woba_using_speedangle || d.events === "strikeout" || d.events === "walk"),
                v => v.length,
                d => d.zone
            );

            var zoneWobaSum3 = d3.rollup(
                filteredData3.filter(d => d.estimated_woba_using_speedangle || d.events === "strikeout" || d.events === "walk"),
                v => d3.sum(v, d => parseFloat(d.estimated_woba_using_speedangle) || (d.events === "strikeout" ? 0 : (d.events === "walk" ? .7 : NaN))),
                d => d.zone
            );

            zoneWobaSum3.forEach((value, key) => {
                zoneAverageWoba3.set(key, (value / zoneWobaCounts3.get(key)).toFixed(2));
            });

            var totalWobaFilteredData3 = filteredData3.filter(d => d.estimated_woba_using_speedangle || d.events === "strikeout" || d.events === "walk");
            var totalWobaSum3 = d3.sum(totalWobaFilteredData3, d => parseFloat(d.estimated_woba_using_speedangle) || (d.events === "strikeout" ? 0 : (d.events === "walk" ? 0.69 : NaN)));
            var totalWobaCount3 = totalWobaFilteredData3.length;
            var totalAverageWoba3 = (totalWobaSum3 / totalWobaCount3).toFixed(2);
            zoneAverageWoba3.set("All Zones", totalAverageWoba3);

            updateVisualization3(zonePercentages3);

        })
        .catch((error) => {
            console.error("An error occurred while loading the CSV file:", error);
        });
}

var margin = { top: 50, right: 50, bottom: 50, left: 50 },
    width = 500 - margin.left - margin.right,
    height = 550 - margin.top - margin.bottom;

// Create the SVG container
var svg3 = d3.select("#vis3-container")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// Define the size of the larger rectangle
var rectSize = width;

// Define the size of each square
var squareSize = rectSize / 4;

// Define the padding between the larger rectangle and the grid
var padding = rectSize / 8;

// Define the data for out of Strikezone
var outZones = [
    { id: "11", x: 0, y: 0 },
    { id: "12", x: 2 * squareSize, y: 0 },
    { id: "13", x: 0, y: 2 * squareSize },
    { id: "14", x: 2 * squareSize, y: 2 * squareSize },
];

// Define the data for the strike zone
var inZones = [
    { id: 1, x: padding, y: padding },
    { id: 2, x: padding + squareSize, y: padding },
    { id: 3, x: padding + 2 * squareSize, y: padding },
    { id: 4, x: padding, y: padding + squareSize },
    { id: 5, x: padding + squareSize, y: padding + squareSize },
    { id: 6, x: padding + 2 * squareSize, y: padding + squareSize },
    { id: 7, x: padding, y: padding + 2 * squareSize },
    { id: 8, x: padding + squareSize, y: padding + 2 * squareSize },
    { id: 9, x: padding + 2 * squareSize, y: padding + 2 * squareSize },
];



// Define a function to update the visualization
function updateVisualization3(zonePercentages3) {
    // Remove existing rectangles and labels
    svg3.selectAll("rect.inZone").remove();
    svg3.selectAll("rect.outZone").remove();
    svg3.selectAll("text.inzonelabel").remove();
    svg3.selectAll("text.outzonelabel").remove();
    svg3.selectAll("text.wobaIZ").remove();

    // Add the outZones rectangles to the SVG
    svg3.selectAll("rect.outZone")
        .data(outZones)
        .enter()
        .append("rect")
        .attr("class", "outZone")
        .attr("x", function (d) { return d.x; })
        .attr("y", function (d) { return d.y; })
        .attr("width", squareSize * 2)
        .attr("height", squareSize * 2)
        .style("fill", function (d) {
            var percentage = zonePercentages3.get(d.id.toString());
            if (!percentage) {
                return "white";
            } else {
                return "#d1d1e0";
            }
        })

        .style("stroke", "#8B0000")
        .style("stroke-width", "6px");

    // Add the inZones to the SVG
    svg3.selectAll("rect.inZone")
        .data(inZones)
        .enter()
        .append("rect")
        .attr("class", "inZone")
        .attr("x", function (d) { return d.x; })
        .attr("y", function (d) { return d.y; })
        .attr("width", squareSize)
        .attr("height", squareSize)
        .style("fill", function (d) {
            var averageWoba = zoneAverageWoba3.get(d.id.toString());
            if (averageWoba === "na" || isNaN(parseFloat(averageWoba))) {
                return "white";
            } else {
                return heatmapIZColor3(parseFloat(averageWoba));
            }
        })
        .style("stroke", "#006400")
        .style("stroke-width", "3px");

    // Add text labels to the squares
    svg3.selectAll(".inzonelabel")
        .data(inZones)
        .enter()
        .append("text")
        .attr("class", "inzonelabel")
        .attr("x", function (d) { return d.x + squareSize / 2; })
        .attr("y", function (d) { return d.y + squareSize / 2; })
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "central")
        .style("font-weight", "bold")
        .text(function (d) {
            var percentage = zonePercentages3.get(d.id.toString()) || "0";
            return d.id + ": " + percentage + "%";
        });

    svg3.selectAll(".wobaIZ")
        .data(inZones)
        .enter()
        .append("text")
        .attr("class", "wobaIZ")
        .attr("x", function (d) { return d.x + squareSize / 2; })
        .attr("y", function (d) { return 16 + d.y + squareSize / 2; })
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "central")
        .text(function (d) {
            var averageWoba = zoneAverageWoba3.get(d.id.toString()) || "na";
            return "xwOBA: " + averageWoba;
        });

    svg3.selectAll(".outzonelabel")
        .data(outZones)
        .enter()
        .append("text")
        .attr("class", "outzonelabel")
        .style("font-weight", "bold")
        .attr("x", function (d) { return d.x + squareSize; })
        .attr("y", function (d) {
            if (d.id === "11" || d.id === "12") {
                return d.y + 20; // Position labels at the top for zones 11 and 12
            } else {
                return d.y + squareSize * 2 - 40; // Position labels at the bottom for zones 13 and 14
            }
        })
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "central")
        .text(function (d) {
            var percentage = zonePercentages3.get(d.id) || "0";
            return d.id + ": " + percentage + "%";
        });

    svg3.selectAll("wobaOZ")
        .data(outZones)
        .enter()
        .append("text")
        .attr("class", "outzonelabel")
        .attr("x", function (d) { return d.x + squareSize; })
        .attr("y", function (d) {
            if (d.id === "11" || d.id === "12") {
                return d.y + 35; // Position labels at the top for zones 11 and 12
            } else {
                return d.y + squareSize * 2 - 26; // Position labels at the bottom for zones 13 and 14
            }
        })
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "central")
        .text(function (d) {
            var averageWoba = zoneAverageWoba3.get(d.id.toString()) || "na";
            return "xwOBA: " + averageWoba;
        });


    svg3.append("svg3:image")
        .attr("xlink:href", "http://localhost:8080/homeplate.png")
        .attr("width", "80%")
        .attr("height", "15%")
        .attr("preserveAspectRatio", "none")
        .attr("x", 0)
        .attr("y", height - 30)

    svg3.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("class", "outzonelabel")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "central")
        .style("font-weight", "bold")
        .text("Overall xwOBA: " + zoneAverageWoba3.get("All Zones", toString()));
}

// Call the updateData function initially to load and filter the data with default values
updateData3();