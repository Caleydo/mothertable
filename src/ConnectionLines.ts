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
    console.log(FilterManager.filterListOrder);


    if (FilterManager.filterList.size > 1) {

      const cellWidth = parseFloat(d3.select(`[f-uid="${id}"]`).style('width'));
      const rowHeight = parseFloat(d3.select(`[f-uid="${id}"]`).style('height'));

      FilterManager.filterListOrder.forEach(function (d, i) {

        if (d === id) {


          const previousKey = FilterManager.filterListOrder[i - 1];
          const previousBlock = App.blockList.get(previousKey);
          const previousData = previousBlock.data;
          const currentBlock = App.blockList.get(id);
          const currentData = currentBlock.data;
          console.log(previousData)

          previousData.data().then((previousValue) => {

            currentData.data().then((currentValue) => {

              console.log(currentValue, previousValue, currentValue[1], previousValue[1])

              const data = previousValue;
              const cellDimension = cellWidth / 5;  //To be modified
              console.log(cellDimension)
              const startingLineFrom = previousKey;
              const currentGroup = d3.selectAll(`[f-uid="${id}"]`);
              const catNames = currentGroup.selectAll('.categories');
              const currentPathData = new Map();
              catNames[0].forEach(function (d, i) {
                const name = d3.select(catNames[0][i]).datum();
                const xpos =  5+i * cellDimension;
                const ypos = rowHeight;

                currentPathData.set(name, {'xpos': xpos, 'ypos': ypos});

              });

              console.log(currentPathData)
              const checkXposOverlap = new Map();
              const lineDiv = d3.select(`[f-uid="${previousKey}"]`).append('div').classed('lineConnection', true);
              const svg = lineDiv.append('svg').attr('width', cellWidth)
                .attr('height', rowHeight).selectAll('path').data(data)
              svg.enter().append('path').attr('d', function (d, i) {
                console.log(currentValue[i]);
                const xposition = currentPathData.get(currentValue[i]).xpos;
                const yposition = currentPathData.get(currentValue[i]).ypos;
                console.log(checkXposOverlap, d)

                if (checkXposOverlap.has(currentValue[i])) {
                  console.log('yes')
                  const xpos = checkXposOverlap.get(currentValue[i]).x;

                  checkXposOverlap.set(currentValue[i], {x: xpos + 10, y: yposition});
                  console.log(checkXposOverlap.get(currentValue[i]));


                } else {
                  console.log('no')
                  checkXposOverlap.set(currentValue[i], {x: xposition, y: yposition});
                  console.log(checkXposOverlap.get(currentValue[i]));

                }


                const xpos = checkXposOverlap.get(currentValue[i]).x;

                const ypos = yposition;

                return `M ${cellWidth / 2} 0 L ${xpos} ${yposition}`;

              })
                .attr('stroke', 'red')
                .attr('stroke-width', 1)
                .attr('fill', 'red');

            })


          })

        }


      });
      console.log('I  make line');

    } else {

      console.log('cannot make line');
    }


  }


}

