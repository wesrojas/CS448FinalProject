// Define variables for storing the selected year and search term
var selectedYear = "2017"; // Default value
var previousYear = "2016"; // Default value
var player = ""; // Default value
var selectedMonth = "All"; // Default value
var selectedPitchType = "All"; // Default valuevar filteredData = []; // Initialize empty array
var zonePercentages = new Map(); // Initialize empty map
var zoneAverageWoba = new Map();
var keepPlayerListUnchanged = true; // Default value
var selectedThrows = "All"; // Default value
// Define a color scale for the heatmap
var heatmapIZColor = d3.scaleSequential().interpolator(d3.interpolateRdYlGn)
    .domain([.1, .6]);
var heatmapOZColor = d3.scaleSequential().interpolator(d3.interpolateBlues)
    .domain([2, 40]);


// Add event listeners for the dropdowns
d3.select("#vis1-year-dropdown").on("change", function () {
    selectedYear = d3.select(this).property("value");
    updateData();
});

d3.select("#vis1-month-dropdown").on("change", function () {
    selectedMonth = d3.select(this).property("value");
    updateData();
});

d3.select("#vis1-player-input").on("change", function () {
    player = d3.select(this).property("value");
    updateData();
});

d3.select("#vis1-pitch-type-dropdown").on("change", function () {
    selectedPitchType = d3.select(this).property("value");
    updateData();
});

d3.select("#toggle-click1").on("change", function () {
    keepPlayerListUnchanged = d3.select(this).property("checked");
});

d3.select("#vis1-throws-dropdown").on("change", function () {
    selectedThrows = d3.select(this).property("value");
    updateData();
});

function initializePlayerDropdown(data) {
    var uniqueBatters = [...new Set(data.map(d => d.Batter))];

    // Count the number of rows for each unique batter
    var batterCounts = d3.rollup(data, v => v.length, d => d.Batter);

    // Sort the uniqueBatters array by the count
    uniqueBatters.sort((a, b) => d3.descending(batterCounts.get(a), batterCounts.get(b)));
    var select = d3.select("#vis1-player-input");

    select.selectAll("option").remove();

    select.selectAll("option")
        .data(uniqueBatters)
        .enter()
        .append("option")
        .attr("value", function (d) { return d; })
        .text(function (d) {
            var filteredData = data.filter(x => x.Batter === d).slice(0, 40);
            var batterStand = "";
            if (filteredData.length > 0) {
                var allSame = filteredData.every(x => x.stand === "R");
                if (allSame) {
                    batterStand = "(R)";
                } else {
                    allSame = filteredData.every(x => x.stand === "L");
                    if (allSame) {
                        batterStand = "(L)";
                    } else {
                        batterStand = "(S)";
                    }
                }
            }
            return d + " " + batterStand;
        });

    // Set an initial value for player
    player = d3.select("#vis1-player-input").property("value");
}

function updateData() {
    var filename = "Statcast" + selectedYear.slice(-2) + "-Bat.zip";

    // Load the zip file using the fetch API
    fetch(filename)
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
            const data = d3.csvParse(csvText);    // Filter the data based on user selections
            filteredData = data.filter(function (d) {
                var validThrows = selectedThrows === "All" || d.p_throws === selectedThrows;
                if (selectedMonth === "All") {
                    if (selectedPitchType === "All") {
                        return validThrows && d.Batter === player;
                    } else if (selectedPitchType === "FF_FT_FC") {
                        return validThrows && d.Batter === player && (d.pitch_type === "FF" || d.pitch_type === "FT" || d.pitch_type === "FC");
                    } else if (selectedPitchType === "SL_CH_CU") {
                        return validThrows && d.Batter === player && (d.pitch_type === "SL" || d.pitch_type === "CH" || d.pitch_type === "CU");
                    } else {
                        return validThrows && d.Batter === player && d.pitch_type === selectedPitchType;
                    }
                } else {
                    if (selectedPitchType === "All") {
                        return validThrows && d.Batter === player && d.Month === selectedMonth;
                    } else if (selectedPitchType === "FF_FT_FC") {
                        return validThrows && d.Batter === player && d.Month === selectedMonth && (d.pitch_type === "FF" || d.pitch_type === "FT" || d.pitch_type === "FC");
                    } else if (selectedPitchType === "SL_CH_CU") {
                        return validThrows && d.Batter === player && d.Month === selectedMonth && (d.pitch_type === "SL" || d.pitch_type === "CH" || d.pitch_type === "CU");
                    } else {
                        return validThrows && d.Batter === player && d.Month === selectedMonth && d.pitch_type === selectedPitchType;
                    }
                }
            });
            var zoneCounts = d3.rollup(filteredData, v => v.length, d => d.zone);
            var totalPitches = filteredData.length;
            zoneCounts.forEach((value, key) => {
                zonePercentages.set(key, (value / totalPitches * 100).toFixed(2));
            });
            var zoneWobaCounts = d3.rollup(
                filteredData.filter(d => d.estimated_woba_using_speedangle || d.events === "strikeout" || d.events === "walk"),
                v => v.length,
                d => d.zone
            );

            var zoneWobaSum = d3.rollup(
                filteredData.filter(d => d.estimated_woba_using_speedangle || d.events === "strikeout" || d.events === "walk"),
                v => d3.sum(v, d => parseFloat(d.estimated_woba_using_speedangle) || (d.events === "strikeout" ? 0 : (d.events === "walk" ? .7 : NaN))),
                d => d.zone
            );

            zoneWobaSum.forEach((value, key) => {
                zoneAverageWoba.set(key, (value / zoneWobaCounts.get(key)).toFixed(2));
            });

            var totalWobaFilteredData = filteredData.filter(d => d.estimated_woba_using_speedangle || d.events === "strikeout" || d.events === "walk");
            var totalWobaSum = d3.sum(totalWobaFilteredData, d => parseFloat(d.estimated_woba_using_speedangle) || (d.events === "strikeout" ? 0 : (d.events === "walk" ? 0.69 : NaN)));
            var totalWobaCount = totalWobaFilteredData.length;
            var totalAverageWoba = (totalWobaSum / totalWobaCount).toFixed(2);
            zoneAverageWoba.set("All Zones", totalAverageWoba);

            updateVisualization(zonePercentages);

        })
        .catch((error) => {
            console.error("An error occurred while loading the CSV file:", error);
        });
}

var margin = { top: 50, right: 50, bottom: 50, left: 50 },
    width = 500 - margin.left - margin.right,
    height = 550 - margin.top - margin.bottom;

// Create the SVG container
var svg = d3.select("#vis1-container")
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
function updateVisualization(zonePercentages) {
    // Remove existing rectangles and labels
    svg.selectAll("rect.inZone").remove();
    svg.selectAll("rect.outZone").remove();
    svg.selectAll("text.inzonelabel").remove();
    svg.selectAll("text.outzonelabel").remove();
    svg.selectAll("text.wobaIZ").remove();

    //var wobaValues = Array.from(zoneAverageWoba.values()).filter(val => val !== "na").map(val => parseFloat(val));
    //heatmapIZColor.domain([d3.min(wobaValues), d3.max(wobaValues)]);

    // Add the outZones rectangles to the SVG
    svg.selectAll("rect.outZone")
        .data(outZones)
        .enter()
        .append("rect")
        .attr("class", "outZone")
        .attr("x", function (d) { return d.x; })
        .attr("y", function (d) { return d.y; })
        .attr("width", squareSize * 2)
        .attr("height", squareSize * 2)
        .style("fill", function (d) {
            var percentage = zonePercentages.get(d.id.toString());
            if (!percentage) {
                return "white";
            } else {
                return heatmapOZColor(parseFloat(percentage));
            }
        })

        .style("stroke", "#8B0000")
        .style("stroke-width", "6px");

    // Add the inZones to the SVG
    svg.selectAll("rect.inZone")
        .data(inZones)
        .enter()
        .append("rect")
        .attr("class", "inZone")
        .attr("x", function (d) { return d.x; })
        .attr("y", function (d) { return d.y; })
        .attr("width", squareSize)
        .attr("height", squareSize)
        .style("fill", function (d) {
            var averageWoba = zoneAverageWoba.get(d.id.toString());
            if (averageWoba === "na") {
                return "white";
            } else {
                return heatmapIZColor(parseFloat(averageWoba));
            }
        })
        .style("stroke", "#006400")
        .style("stroke-width", "3px");

    // Add text labels to the squares
    svg.selectAll(".inzonelabel")
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
            var percentage = zonePercentages.get(d.id.toString()) || "0";
            return d.id + ": " + percentage + "%";
        });

    svg.selectAll(".wobaIZ")
        .data(inZones)
        .enter()
        .append("text")
        .attr("class", "wobaIZ")
        .attr("x", function (d) { return d.x + squareSize / 2; })
        .attr("y", function (d) { return 16 + d.y + squareSize / 2; })
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "central")
        .text(function (d) {
            var averageWoba = zoneAverageWoba.get(d.id.toString()) || "na";
            return "xwOBA: " + averageWoba;
        });

    svg.selectAll(".outzonelabel")
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
            var percentage = zonePercentages.get(d.id) || "0";
            return d.id + ": " + percentage + "%";
        });

    svg.selectAll("wobaOZ")
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
            var averageWoba = zoneAverageWoba.get(d.id.toString()) || "na";
            return "xwOBA: " + averageWoba;
        });


    svg.append("svg:image")
        .attr("xlink:href", "http://localhost:8080/homeplate.png")
        .attr("width", "80%")
        .attr("height", "15%")
        .attr("preserveAspectRatio", "none")
        .attr("x", 0)
        .attr("y", height - 30)

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("class", "outzonelabel")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "central")
        .style("font-weight", "bold")
        .text("Overall xwOBA: " + zoneAverageWoba.get("All Zones", toString()));
}

// Call the updateData function initially to load and filter the data with default values
updateData();
