const path = require('path');
const chalk = require('chalk');
const logger = require(path.resolve(__dirname, '../../../server/logger'));

module.exports = async function (data){
    switch (data.type){
        case 'getmap':
            const result = data.path.match(/^(.*?)(?=\/)/);
            const mapName = result ? result[1] : '';
            this.cmd.send(`map ${mapName}`)
            break;
        case 'map':
            this.mapdata = data
            break;
            
        case 'showmap':
            showmap(this.mapdata, data.id)
            break;
            
        default:
            break;
        }
}

function showmap(data, id) {
    const points = data.map.map(location => ({
        id: location.id,
        name: location.n,
        p: location.p
    }));

    const minP = points.reduce((min, { p }) => [Math.min(min[0], p[0]), Math.min(min[1], p[1])], [Infinity, Infinity]);
    const maxP = points.reduce((max, { p }) => [Math.max(max[0], p[0]), Math.max(max[1], p[1])], [-Infinity, -Infinity]);

    const width = maxP[0] - minP[0] + 1;
    const height = maxP[1] - minP[1] + 1;

    const grid = Array.from({ length: height }, () => Array(width).fill('  '));

    points.forEach(({ id: locationId, name, p }) => {
        const [x, y] = p;
        const gridX = x - minP[0];
        const gridY = y - minP[1];
        if (locationId === id) {
            grid[gridY][gridX] = chalk.red(name.length > 1 ? name[0] : name);
        } else {
            grid[gridY][gridX] = name.length > 1 ? name[0] : name;
        }
    });

    grid.forEach(row => {
        console.log(row.join(' ').padEnd(width * 2));
    });
}