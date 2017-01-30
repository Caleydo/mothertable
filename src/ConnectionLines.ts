/**
 * Created by bikramkawan on 26/01/2017.
 */


import * as d3 from 'd3';
import App from './app';
import Block from './Block';
import VisManager from './VisManager';
import FilterManager from './FilterManager';
import values = d3.values;
import RangeManager from './RangeManager';

export default class ConnectionLines {

  private _filterManager: FilterManager;
  private _rangeManager: RangeManager;

  constructor(rangeManager, filterManager) {
    this._filterManager = filterManager;
    this._rangeManager = rangeManager;

  }


  makeLines(div, id, block, self) {

    console.log(this._filterManager)
    console.log(this._rangeManager)

    FilterManager.filterListOrder.push(id);

    if (FilterManager.filterList.size > 1) {

      const cellWidth = parseFloat(d3.select(`[f-uid="${id}"]`).style('width'));
      const cellHeight = parseFloat(d3.select(`[f-uid="${id}"]`).style('height'));

      FilterManager.filterListOrder.forEach(function (d, i) {

        if (d === id) {

          const previousKey = FilterManager.filterListOrder[i - 1];
          const previousBlock = App.blockList.get(previousKey);
          const previousData = previousBlock.data;
          const currentBlock = App.blockList.get(id);
          const currentData = currentBlock.data;
          const previousDataType = (<any>previousData).desc.value.type;
          const currentDataType = (<any>currentData).desc.value.type;

          previousData.data().then((previousValue) => {

            currentData.data().then((currentValue) => {

              // console.log(currentValue, previousValue, currentValue[1], previousValue[1])

              if (previousDataType === 'string' || previousDataType === 'real' || previousDataType === 'int') {


                const topPathData = new Map();
                const xpos = cellWidth / 2;
                const ypos = cellHeight - cellHeight;

                // console.log(currentValue);
                previousValue.forEach((d, i) => {
                  //    console.log(d, i);
                  topPathData.set(d, {'x': xpos, 'y': ypos});
                });

                const values = {previous: previousValue, current: currentValue};
                const keys = {previous: previousKey, current: id};
                const tableVector = {previous: previousData, current: currentData};
                const cellData = {width: cellWidth, height: cellHeight, type: previousDataType};

                if (currentData.desc.value.type === 'categorical') {

                  categoricalLines(topPathData, values, tableVector, keys, cellData, block, self);
                } else if (currentDataType === 'string' || currentDataType === 'real' || currentDataType === 'int') {

                  nonCategoricalLines(topPathData, values, tableVector, keys, cellData);

                } else {

                  return;
                }


              } else if (previousDataType === 'categorical') {


                const categories = previousData.desc.value.categories;
                const bottomCellDimension = cellWidth / categories.length;

                const topCatGroup = d3.selectAll(`[f-uid="${previousKey}"]`);
                const divCatNames = topCatGroup.selectAll('.categories');
                const topPathData = new Map();
                divCatNames[0].forEach(function (d, i) {
                  const catName = d3.select(divCatNames[0][i]).datum();
                  const xpos = bottomCellDimension / 2 + i * bottomCellDimension;
                  const ypos = cellHeight - cellHeight;
                  topPathData.set(catName, {x: xpos, y: ypos});
                });
                const values = {previous: previousValue, current: currentValue};
                const keys = {previous: previousKey, current: id};
                const tableVector = {previous: previousData, current: currentData};
                const cellData = {width: cellWidth, height: cellHeight, type: previousDataType};
                if (currentDataType === 'categorical') {

                  categoricalLines(topPathData, values, tableVector, keys, cellData, block, self);
                } else if (currentDataType === 'string' || currentDataType === 'real' || currentDataType === 'int') {
                  nonCategoricalLines(topPathData, values, tableVector, keys, cellData);
                }
              }
            });
          });
        }
      });

    } else {

      console.log('cannot make line');
    }
  }
}


function categoricalLines(topPathData, values, tableVector, keys, cellData, block, self) {

  const categories = tableVector.current.desc.value.categories;
  const bottomCellDimension = cellData.width / categories.length;
  let data = values.previous;
  const currentCatGroup = d3.selectAll(`[f-uid="${keys.current}"]`);
  const divCatNames = currentCatGroup.selectAll('.categories');
  const bottomPathData = new Map();
  const bottomCatCount = [];
  const bottomUniqCatNames = [];
  const pathData = [];

  divCatNames[0].forEach(function (d, i) {
    const name = d3.select(divCatNames[0][i]).datum();
    const xpos = 5 + i * bottomCellDimension;
    const ypos = cellData.height;
    const countSameLikeMe = values.current.filter(isSame.bind(this, name));
    bottomCatCount.push(countSameLikeMe.length);
    bottomUniqCatNames.push(name);
    bottomPathData.set(name, {'xpos': xpos, 'ypos': ypos, count: countSameLikeMe.length});
  });


  if (cellData.type !== 'categorical') {

    const lineDiv = d3.select(`[f-uid="${keys.previous}"]`).append('div').classed('lineConnection', true);
    const domain = d3.extent(bottomCatCount);

    // const domain = [1, 30];
    const lineScale = d3.scale.linear().domain(domain).range([1, 5]);
    data = bottomUniqCatNames;
    const svg = lineDiv.append('svg').attr('width', cellData.width)
      .attr('height', cellData.height).selectAll('path').data(data);
    svg.enter().append('path')
      .attr('d', function (d, i) {
        // console.log(currentValue[i]);
        const xposition = bottomPathData.get(bottomUniqCatNames[i]).xpos;
        const yposition = bottomPathData.get(bottomUniqCatNames[i]).ypos;
        return `M ${topPathData.get(values.previous[i]).x} ${topPathData.get(values.previous[i]).y} L ${xposition} ${yposition}`;

      })
      .attr('stroke', 'red')
      .attr('stroke-width', function (d, i) {
        return lineScale(bottomPathData.get(bottomUniqCatNames[i]).count);
      })
      .attr('fill', 'red')
      .on('click', function (d) {
        // d3.select(this).attr('opacity', toggle ? 0.1 : 1);
        // toggle = !toggle;
        d3.select(this).classed('active', !d3.select(this).classed('active'));
        if (d3.select(this).classed('active') === false) {
          d3.select(this).attr('opacity', 1);

          const divNames = d3.select(`[f-uid="${keys.current}"]`)
            .selectAll('.catentries')
            .selectAll('.categories');


          divNames[0].forEach((e, i) => {

            const name = d3.select(divNames[0][i]).datum();

            if (name === d) {

              d3.select(divNames[0][i]).classed('active', false);

            }

          });


          const catName = (d3.select(this).datum());

          const cat = block.activeCategories;
          cat.push(catName);
          block.activeCategories = cat;

          const filterType = cat;
          self.onClickCat(tableVector.current, keys.current, filterType, block);
        } else if (d3.select(this).classed('active') === true) {
          d3.select(this).attr('opacity', 0.1);
          const divNames = d3.select(`[f-uid="${keys.current}"]`)
            .selectAll('.catentries')
            .selectAll('.categories');


          divNames[0].forEach((e, i) => {

            const name = d3.select(divNames[0][i]).datum();

            if (name === d) {

              d3.select(divNames[0][i]).classed('active', true);

            }

          });

          const catName = (d3.select(this).datum());
          const cat = block.activeCategories;
          let ind = -1;
          for (let i = 0; i < cat.length; ++i) {
            if (cat[i] === catName) {
              ind = i;
            }
          }
          cat.splice(ind, 1);
          block.activeCategories = cat;
          const filterType = cat;

          self.onClickCat(tableVector.current, keys.current, filterType, block);
          // block.filterDiv = divBlock;
        }


      });


  } else if (cellData.type === 'categorical') {

    tableVector.previous.desc.value.categories.forEach((d, i) => {

      const prevCatIndexes = [];
      values.previous.filter(function (elem, index, array) {
        if (elem === d) {
          prevCatIndexes.push(index);
        }
      });

      const currentCatValues = prevCatIndexes.map((item) => values.current[item]);
      const bottomCatData = new Map();
      currentCatValues.forEach((e, i) => {
        const countMe = currentCatValues.filter(isSame.bind(this, e));
        bottomCatData.set(e, {bottomCatName: e, bottomCatCount: countMe.length});

      });

      bottomCatData.forEach(function (value, key) {

        const val = value;
        pathData.push({topCatName: d, bottomCatName: value.bottomCatName, bottomCatCount: value.bottomCatCount});
      });
    });

    const lineDiv = d3.select(`[f-uid="${keys.previous}"]`).append('div').classed('lineConnection', true);
    const domain = d3.extent(pathData, function (d) {
      return d.bottomCatCount;

    });

    // const domain = [1, 30];
    const lineScale = d3.scale.linear().domain(domain).range([1, 5]);
    const svg = lineDiv.append('svg').attr('width', cellData.width)
      .attr('height', cellData.height).selectAll('path').data(pathData);
    let toggle = true;
    svg.enter().append('path')
      .attr('d', function (d, i) {
        const xposition = bottomPathData.get(d.bottomCatName).xpos;
        const yposition = bottomPathData.get(d.bottomCatName).ypos;
        return `M ${topPathData.get(d.topCatName).x} ${topPathData.get(d.topCatName).y} L ${xposition} ${yposition}`;

      })
      .attr('stroke', 'red')
      .attr('stroke-width', function (d, i) {
        return lineScale(d.bottomCatCount);
      })
      .attr('fill', 'red')
      .on('click', function (d) {

        d3.select(this).attr('opacity', toggle ? 0.1 : 1);
        toggle = !toggle;
      });
  }
}

function nonCategoricalLines(topPathData, values, tableVector, keys, cellData) {

  const data = values.previous;
  const bottomCellDimension = cellData.width / data.length;


  const currentValues = values.current;
  const bottomPathData = new Map();
  currentValues.forEach(function (d, i) {
    const name = d;
    const xpos = 5 + i * bottomCellDimension;
    const ypos = cellData.height;
    bottomPathData.set(name, {'xpos': xpos, 'ypos': ypos});

  });

  // console.log(currentPathData)
  const checkXposOverlap = new Map();
  const lineDiv = d3.select(`[f-uid="${keys.previous}"]`).append('div').classed('lineConnection', true);
  const svg = lineDiv.append('svg').attr('width', cellData.width)
    .attr('height', cellData.height).selectAll('path').data(data);
  svg.enter().append('path').attr('d', function (d, i) {

    const xposition = bottomPathData.get(values.current[i]).xpos;
    const yposition = bottomPathData.get(values.current[i]).ypos;

    //console.log(values.current[i], values.previous[i])
    if (checkXposOverlap.has(values.current[i])) {
      const xpos = checkXposOverlap.get(values.current[i]).x;
      checkXposOverlap.set(values.current[i], {x: xpos + 10, y: yposition});
    } else {
      checkXposOverlap.set(values.current[i], {x: xposition, y: yposition});
    }
    const bottomXpos = checkXposOverlap.get(values.current[i]).x;

    const ypos = yposition;

    return `M ${topPathData.get(values.previous[i]).x} ${topPathData.get(values.previous[i]).y} L ${bottomXpos} ${yposition}`;

  })
    .attr('stroke', 'red')
    .attr('stroke-width', 1)
    .attr('fill', 'red');

  svg.exit().remove();
}


function isSame(value, compareWith) {


  return value === compareWith;
}
