"use strict";
const colorPalette = [
    '#7EB26D',
    '#EAB839',
    '#6ED0E0',
    '#EF843C',
    '#E24D42',
    '#1F78C1',
    '#BA43A9',
    '#705DA0',
    '#508642',
    '#CCA300', // 9: dark sand
];
class Metrics {
    constructor(name) {
        this.label = name.split('/')[1];
        this.commit = [];
        this.timestamp = [];
        this.value = [];
    }
}
function generatePlot(title, yLabel, timestamps, data, toSeconds = true) {
    const options = {
        title,
        width: 700,
        height: 300,
        series: [{}],
        axes: [
            {},
            {
                label: yLabel,
                labelGap: 10,
            }
        ]
    };
    data.forEach((it, idx) => {
        options.series.push({
            label: it.label.toString(),
            stroke: colorPalette[idx],
            width: 1.5,
            fill: colorPalette[idx] + '10',
        });
    });
    const rate = toSeconds ? 1000 : 1;
    new uPlot(options, [timestamps, ...(data.map((it) => it.value.map((it) => it / rate)))], document.getElementById("plots"));
}
function unzip(content) {
    const entries = content.split('\n').filter((it) => it.length > 0).map((it) => JSON.parse(it));
    const timestamps = entries.map((it) => it.timestamp);
    const data = new Map();
    for (const entry of entries) {
        for (let [key, value] of Object.entries(entry.metrics)) {
            if (!data.has(key)) {
                data.set(key, new Metrics(key));
            }
            const tmp = data.get(key);
            tmp.commit.push(entry.commit);
            tmp.timestamp.push(entry.timestamp);
            tmp.value.push(Number(value));
        }
    }
    return [timestamps, data];
}
async function main() {
    const url = "https://raw.githubusercontent.com/PLC-lang/rusty/metrics-data/metrics.json";
    const content = await (await fetch(url)).text();
    let [timestamps, data] = unzip(content);
    generatePlot("oscat", "build times in seconds", timestamps, [
        data.get("oscat/none"),
        data.get("oscat/less"),
        data.get("oscat/default"),
        data.get("oscat/aggressive"),
    ]);
    generatePlot("Lexer", "wall times in microseconds", timestamps, [
        data.get("lexer/combined.st"),
    ], false);
    generatePlot("sieve-st", "wall times in seconds", timestamps, [
        data.get("sieve-st/none"),
        data.get("sieve-st/less"),
        data.get("sieve-st/default"),
        data.get("sieve-st/aggressive"),
    ]);
    generatePlot("sieve-st & sieve-c", "wall times in seconds", timestamps, [
        data.get("sieve-st/none"),
        data.get("sieve-c/0"),
        data.get("sieve-st/aggressive"),
        data.get("sieve-c/3"),
    ]);
}
main();
