// Define variables for storing the selected year and search term
var selectedYear2 = "2017"; // Default value
var previousYear2 = "2016"; // Default value
var player2 = ""; // Default value
var selectedMonth2 = "All"; // Default value
var selectedPitchType2 = "All"; // Default valuevar filteredData = []; // Initialize empty array
var zonePercentages2 = new Map(); // Initialize empty map
var zoneAverageWoba2 = new Map();
var keepPlayerListUnchanged2 = true; // Default value
var selectedStand2 = "All"; // Default value
// Define a color scale for the heatmap
var heatmapIZColor2 = d3.scaleSequential().interpolator(d3.interpolateRdYlGn)
    .domain([.6, .1]);
var heatmapOZColor2 = d3.scaleSequential().interpolator(d3.interpolateReds)
    .domain([4, 35]);


// Add event listeners for the dropdowns
d3.select("#vis2-year-dropdown").on("change", function () {
    selectedYear2 = d3.select(this).property("value");
    updateData2();
});

d3.select("#vis2-month-dropdown").on("change", function () {
    selectedMonth2 = d3.select(this).property("value");
    updateData2();
});

d3.select("#vis2-player-input").on("change", function () {
    player2 = d3.select(this).property("value");
    updateData2();
});

d3.select("#vis2-pitch-type-dropdown").on("change", function () {
    selectedPitchType2 = d3.select(this).property("value");
    updateData2();
});

d3.select("#toggle-click2").on("change", function () {
    keepPlayerListUnchanged2 = d3.select(this).property("checked");
});

d3.select("#vis2-stand-dropdown").on("change", function () {
    selectedStand2 = d3.select(this).property("value");
    updateData2();
});

function initializePlayerDropdown2(data) {
    var uniquePitchers = [...new Set(data.map(d => d.Pitcher))];

    // Count the number of rows for each unique pitcher
    var pitcherCounts = d3.rollup(data, v => v.length, d => d.Pitcher);

    // Sort the uniquePitchers array by the count
    uniquePitchers.sort((a, b) => d3.descending(pitcherCounts.get(a), pitcherCounts.get(b)));
    var select = d3.select("#vis2-player-input");

    select.selectAll("option").remove();

    select.selectAll("option")
        .data(uniquePitchers)
        .enter()
        .append("option")
        .attr("value", function (d) { return d; })
        .text(function (d) {
            var filteredData = data.filter(x => x.Pitcher === d);
            var pitcherThrow = "";
            if (filteredData.length > 0) {
                if (filteredData[0].p_throws === "R") {
                    pitcherThrow = "(R)";
                } else if (filteredData[0].p_throws === "L") {
                    pitcherThrow = "(L)";
                }
            }
            return d + " " + pitcherThrow;
        })
        ;
    console.log(uniquePitchers);
    // Set an initial value for player
    player2 = d3.select("#vis2-player-input").property("value");
}

function updateData2() {
    var filename2 = "Statcast" + selectedYear2.slice(-2) + "-Pit.zip";

    // Load the zip file using the fetch API
    fetch(filename2)
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
            const data2 = d3.csvParse(csvText);
            // Filter the data based on user selections
            filteredData2 = data2.filter(function (d) {
                var validStand = selectedStand2 === "All" || d.stand === selectedStand2;
                if (selectedMonth2 === "All") {
                    if (selectedPitchType2 === "All") {
                        return validStand && d.Pitcher === player2;
                    } else if (selectedPitchType2 === "FF_FT_FC") {
                        return validStand && d.Pitcher === player2 && (d.pitch_type === "FF" || d.pitch_type === "FT" || d.pitch_type === "FC");
                    } else if (selectedPitchType2 === "SL_CH_CU") {
                        return validStand && d.Pitcher === player2 && (d.pitch_type === "SL" || d.pitch_type === "CH" || d.pitch_type === "CU");
                    } else {
                        return validStand && d.Pitcher === player2 && d.pitch_type === selectedPitchType2;
                    }
                } else {
                    if (selectedPitchType2 === "All") {
                        return validStand && d.Pitcher === player2 && d.Month === selectedMonth2;
                    } else if (selectedPitchType2 === "FF_FT_FC") {
                        return validStand && d.Pitcher === player2 && d.Month === selectedMonth2 && (d.pitch_type === "FF" || d.pitch_type === "FT" || d.pitch_type === "FC");
                    } else if (selectedPitchType2 === "SL_CH_CU") {
                        return validStand && d.Pitcher === player2 && d.Month === selectedMonth2 && (d.pitch_type === "SL" || d.pitch_type === "CH" || d.pitch_type === "CU");
                    } else {
                        return validStand && d.Pitcher === player2 && d.Month === selectedMonth2 && d.pitch_type === selectedPitchType2;
                    }
                }
            });
            var zoneCounts2 = d3.rollup(filteredData2, v => v.length, d => d.zone);
            var totalPitches2 = filteredData2.length;
            zoneCounts2.forEach((value, key) => {
                zonePercentages2.set(key, (value / totalPitches2 * 100).toFixed(2));
            });
            var zoneWobaCounts2 = d3.rollup(
                filteredData2.filter(d => d.estimated_woba_using_speedangle || d.events === "strikeout" || d.events === "walk"),
                v => v.length,
                d => d.zone
            );

            var zoneWobaSum2 = d3.rollup(
                filteredData2.filter(d => d.estimated_woba_using_speedangle || d.events === "strikeout" || d.events === "walk"),
                v => d3.sum(v, d => parseFloat(d.estimated_woba_using_speedangle) || (d.events === "strikeout" ? 0 : (d.events === "walk" ? .7 : NaN))),
                d => d.zone
            );

            zoneWobaSum2.forEach((value, key) => {
                zoneAverageWoba2.set(key, (value / zoneWobaCounts2.get(key)).toFixed(2));
            });

            var totalWobaFilteredData2 = filteredData2.filter(d => d.estimated_woba_using_speedangle || d.events === "strikeout" || d.events === "walk");
            var totalWobaSum2 = d3.sum(totalWobaFilteredData2, d => parseFloat(d.estimated_woba_using_speedangle) || (d.events === "strikeout" ? 0 : (d.events === "walk" ? 0.69 : NaN)));
            var totalWobaCount2 = totalWobaFilteredData2.length;
            var totalAverageWoba2 = (totalWobaSum2 / totalWobaCount2).toFixed(2);
            zoneAverageWoba2.set("All Zones", totalAverageWoba2);

            updateVisualization2(zonePercentages2);

        })
        .catch((error) => {
            console.error("An error occurred while loading the CSV file:", error);
        });
}

var margin = { top: 50, right: 50, bottom: 50, left: 50 },
    width = 500 - margin.left - margin.right,
    height = 550 - margin.top - margin.bottom;

// Create the SVG container
var svg2 = d3.select("#vis2-container")
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
function updateVisualization2(zonePercentages2) {
    // Remove existing rectangles and labels
    svg2.selectAll("rect.inZone").remove();
    svg2.selectAll("rect.outZone").remove();
    svg2.selectAll("text.inzonelabel").remove();
    svg2.selectAll("text.outzonelabel").remove();
    svg2.selectAll("text.wobaIZ").remove();

    // Add the outZones rectangles to the SVG
    svg2.selectAll("rect.outZone")
        .data(outZones)
        .enter()
        .append("rect")
        .attr("class", "outZone")
        .attr("x", function (d) { return d.x; })
        .attr("y", function (d) { return d.y; })
        .attr("width", squareSize * 2)
        .attr("height", squareSize * 2)
        .style("fill", function (d) {
            var percentage = zonePercentages2.get(d.id.toString());
            if (!percentage) {
                return "white";
            } else {
                return heatmapOZColor2(parseFloat(percentage));
            }
        })

        .style("stroke", "#8B0000")
        .style("stroke-width", "6px");

    // Add the inZones to the SVG
    svg2.selectAll("rect.inZone")
        .data(inZones)
        .enter()
        .append("rect")
        .attr("class", "inZone")
        .attr("x", function (d) { return d.x; })
        .attr("y", function (d) { return d.y; })
        .attr("width", squareSize)
        .attr("height", squareSize)
        .style("fill", function (d) {
            var averageWoba = zoneAverageWoba2.get(d.id.toString());
            if (averageWoba === "na") {
                return "white";
            } else {
                return heatmapIZColor2(parseFloat(averageWoba));
            }
        })
        .style("stroke", "#006400")
        .style("stroke-width", "3px");

    // Add text labels to the squares
    svg2.selectAll(".inzonelabel")
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
            var percentage = zonePercentages2.get(d.id.toString()) || "0";
            return d.id + ": " + percentage + "%";
        });

    svg2.selectAll(".wobaIZ")
        .data(inZones)
        .enter()
        .append("text")
        .attr("class", "wobaIZ")
        .attr("x", function (d) { return d.x + squareSize / 2; })
        .attr("y", function (d) { return 16 + d.y + squareSize / 2; })
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "central")
        .text(function (d) {
            var averageWoba = zoneAverageWoba2.get(d.id.toString()) || "na";
            return "xwOBA: " + averageWoba;
        });

    svg2.selectAll(".outzonelabel")
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
            var percentage = zonePercentages2.get(d.id) || "0";
            return d.id + ": " + percentage + "%";
        });

    svg2.selectAll("wobaOZ")
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
            var averageWoba = zoneAverageWoba2.get(d.id.toString()) || "na";
            return "xwOBA: " + averageWoba;
        });


    svg2.append("svg2:image")
        .attr("xlink:href", "http://localhost:8080/homeplate.png")
        .attr("width", "80%")
        .attr("height", "15%")
        .attr("preserveAspectRatio", "none")
        .attr("x", 0)
        .attr("y", height - 30)

    svg2.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("class", "outzonelabel")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "central")
        .style("font-weight", "bold")
        .text("Overall xwOBA: " + zoneAverageWoba2.get("All Zones", toString()));
}

// Call the updateData function initially to load and filter the data with default values
updateData2();
