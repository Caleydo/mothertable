/**
 * Created by bikramkawan on 26/01/2017.
 */


import * as d3 from 'd3';
import App from './app';
import Block from './Block';
import VisManager from './VisManager';
import FilterManager from './FilterManager';
import values = d3.values;

export default class ConnectionLines {

  private _filterManager: FilterManager;


  constructor(filterManager) {
    this._filterManager = filterManager;
  }


  makeLines(div, id) {

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

              if (previousDataType === 'string') {


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
                const cellData = {width: cellWidth, height: cellHeight};

                if (currentData.desc.value.type === 'categorical') {

                  categoricalLines(topPathData, values, tableVector, keys, cellData);
                } else if (currentDataType === 'string' || currentDataType === 'real' || currentDataType === 'int') {

                  console.log('single attribute');

                  nonCategoricalLines(topPathData, values, tableVector, keys, cellData)

                } else {

                  return;
                }


              } else if (previousDataType === 'categorical') {


                const categories = previousData.desc.value.categories;
                const bottomCellDimension = cellWidth / categories.length;
                console.log(bottomCellDimension)

                const topCatGroup = d3.selectAll(`[f-uid="${previousKey}"]`);
                const divCatNames = topCatGroup.selectAll('.categories');
                const topPathData = new Map();
                divCatNames[0].forEach(function (d, i) {
                  const catName = d3.select(divCatNames[0][i]).datum();
                  const xpos = bottomCellDimension / 2 + i * bottomCellDimension;
                  const ypos = cellHeight - cellHeight;
                  topPathData.set(catName, {x: xpos, y: ypos});

                });
                console.log(topPathData);
                const values = {previous: previousValue, current: currentValue};
                const keys = {previous: previousKey, current: id};
                const tableVector = {previous: previousData, current: currentData};
                const cellData = {width: cellWidth, height: cellHeight};

                if (currentData.desc.value.type === 'categorical') {
                  categoricalLines(topPathData, values, tableVector, keys, cellData);
                }
              }


            });


          });

        }


      });
      console.log('I  make line');

    } else {

      console.log('cannot make line');
    }


  }


}


function categoricalLines(topPathData, values, tableVector, keys, cellData) {

  const categories = tableVector.current.desc.value.categories;
  const bottomCellDimension = cellData.width / categories.length;

  const data = values.previous;

  console.log(tableVector.previous)
  console.log(tableVector.current)

  const currentCatGroup = d3.selectAll(`[f-uid="${keys.current}"]`);
  const divCatNames = currentCatGroup.selectAll('.categories');
  const bottomPathData = new Map();
  divCatNames[0].forEach(function (d, i) {
    const name = d3.select(divCatNames[0][i]).datum();
    const xpos = 5 + i * bottomCellDimension;
    const ypos = cellData.height;

    bottomPathData.set(name, {'xpos': xpos, 'ypos': ypos});

  });

  // console.log(currentPathData)
  const checkXposOverlap = new Map();
  const lineDiv = d3.select(`[f-uid="${keys.previous}"]`).append('div').classed('lineConnection', true);
  const svg = lineDiv.append('svg').attr('width', cellData.width)
    .attr('height', cellData.height).selectAll('path').data(data)
  svg.enter().append('path').attr('d', function (d, i) {
    // console.log(currentValue[i]);
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

}

function nonCategoricalLines(topPathData, values, tableVector, keys, cellData) {

  console.log('noncategorical lines');

  const data = values.previous;
  console.log(data, values.current)
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
    .attr('height', cellData.height).selectAll('path').data(data)
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


}
