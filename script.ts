const colorPalette = [
    '#7EB26D', // 0: pale green
    '#EAB839', // 1: mustard
    '#6ED0E0', // 2: light blue
    '#EF843C', // 3: orange
    '#E24D42', // 4: red
    '#1F78C1', // 5: ocean
    '#BA43A9', // 6: purple
    '#705DA0', // 7: violet
    '#508642', // 8: dark green
    '#CCA300', // 9: dark sand
];

class Metrics {
    label: string;
    commit: string[];
    timestamp: number[];
    value: number[];

    constructor(name: string) {
        this.label = name.split('/')[1];
        this.commit = [];
        this.timestamp = [];
        this.value = [];
    }
}

function generatePlot(title: string, timestamps: any[], data: Metrics[]) {
    const options = {
        title,
        width: 700,
        height: 325,
        series: [{}]
    };

    data.forEach((it, idx) => {
        options.series.push(
            {
                label: it.label.toString(),
                stroke: colorPalette[idx],
                width: 1.5,
                // fill: "rgba(255,0,0,0.1)",
            }
        )
    });

    new uPlot(
        options,
        [timestamps, ...(data.map((it) => it.value.map((it) => it / 1000)))],
        document.getElementById("plots")!
    );
}

function unzip(content: string): [any[], Map<string, Metrics>] {
    const entries = content.split('\n').filter((it) => it.length > 0).map((it) => JSON.parse(it));
    const timestamps = entries.map((it) => it.timestamp);

    const data = new Map<string, Metrics>();
    for (const entry of entries) {
        for (let [key, value] of Object.entries(entry.metrics)) {
            if (!data.has(key)) {
                data.set(key, new Metrics(key));
            }

            const tmp = data.get(key)!;
            tmp.commit.push(entry.commit);
            tmp.timestamp.push(entry.timestamp);
            tmp.value.push(Number(value));
        }
    }

    return [timestamps, data]
}

async function main() {
    const url = "https://raw.githubusercontent.com/PLC-lang/rusty/metrics/metrics.json";
    const content = await (await fetch(url)).text();
    let [timestamps, data] = unzip(content);

    generatePlot(
        "build-times oscat",
        timestamps,
        [
            data.get("oscat/none")!,
            data.get("oscat/less")!,
            data.get("oscat/default")!,
            data.get("oscat/aggressive")!,
        ]
    );

    generatePlot(
        "wall-times rusty --check",
        timestamps,
        [
            data.get("check/oscat")!,
        ]
    );

    generatePlot(
        "wall-times sieve-st",
        timestamps,
        [
            data.get("sieve-st/none")!,
            data.get("sieve-st/less")!,
            data.get("sieve-st/default")!,
            data.get("sieve-st/aggressive")!,
        ]
    );

    generatePlot(
        "wall-times sieve-st & sieve-c",
        timestamps,
        [
            data.get("sieve-st/none")!,
            data.get("sieve-c/0")!,
            data.get("sieve-st/aggressive")!,
            data.get("sieve-c/3")!,
        ]
    );
}

main();