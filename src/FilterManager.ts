/**
 * Created by bikramkawan on 21/01/2017.
 */

import * as d3 from 'd3';
import App from './app';
import Block from './Block';
import ConnectionLines from './ConnectionLines';
import ascending = d3.ascending;

export default class FilterManager {

  private filterUID = [];
  private filterData = [];
  private _filterDiv = App.filterNode;
  private _rangeManager;
  public static filterList = new Map();
  public static filterListOrder = [];

  constructor(rangeManager) {
    this._rangeManager = rangeManager;


  }


  get filterDiv() {
    return this._filterDiv;
  }

  set filterDiv(value) {
    this._filterDiv = value;
  }

  createFilter(block, self) {
    const data = block.data;
    const vectorOrMatrix = (<any>data.desc).type;
    const name = (<any>data.desc).name;
    const fid = block.uid;
    const range = (<any>data).desc.value.range;
    const divInfo = {filterDialogWidth: 274, filterRowHeight: 30, 'uid': fid, 'div': this._filterDiv};

    Block.filtersRange.set(fid, data.indices);

    if (vectorOrMatrix === 'vector') {
      const dataType = (<any>data.desc).value.type;
      if (dataType === 'categorical') {
        (<any>data).data().then(function (dataVal) {
          const uniqCat = (<any>data).desc.value.categories;
          block.activeCategories = uniqCat;
          const dataInfo = {'name': name, value: uniqCat, type: dataType, 'data': data, allCategories: dataVal};
          makeCategories(divInfo, dataInfo, block, self);
        });


      } else if (dataType === 'int' || dataType === 'real') {


        (<any>data).data().then(function (dataVal) {

          const uniqVal = dataVal.filter((x, i, a) => a.indexOf(x) === i);
          block.activeNuericalValue = uniqVal;

          const binSize = [];
          (<any>data).hist().then((d, i) => {
            const binSize = [];
            d.forEach((bins, index) => {
              binSize.push(bins);
            });

            const dataInfo = {
              'name': name,
              value: dataVal,
              type: dataType,
              'data': data,
              'range': range,
              bins: binSize
            };
            makeNumerical(divInfo, dataInfo, block, self);
          });


        });
      } else {
        (<any>data).data().then(function (dataVal) {
          const dataInfo = {'name': name, value: dataVal, type: dataType, 'data': data};
          makeStringRect(divInfo, dataInfo, block, self);

        });
      }


    } else if (vectorOrMatrix === 'matrix') {
      (<any>data).data().then(function (dataVal) {
        const dataInfo = {'name': name, value: dataVal[0], type: vectorOrMatrix, 'range': range, 'data': data};
        makeMatrix(divInfo, dataInfo, block, self);
      });
    }
    this.filterData.push(block.data);
    this.filterUID.push(block.uid);

  }

}

function makeCategories(divInfo, dataInfo, block, self) {
  const id = dataInfo.data.desc.id;
  const checkMe = checkMeIfExist(id);
  if (checkMe === false) {

    const cellHeight = divInfo.filterRowHeight;
    const cellWidth = divInfo.filterDialogWidth;
    const cellDimension = (100 / dataInfo.value.length);
    const filterDiv = divInfo.div;
    const c20 = d3.scale.category20();
    const divBlock = filterDiv.append('div')
      .attr('f-uid', divInfo.uid);

    const tooltipDiv = filterDiv.append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    const divCat = divBlock.append('div').classed('catentries', true)
      .style('display', 'flex')
      .style('align-items', 'flex-end');

    const dataVal = dataInfo.allCategories;
    const uniqueValues = dataVal.filter((x, i, a) => a.indexOf(x) === i);

    const categoriesName = [];
    const bins = [];
    uniqueValues.forEach(((val, i) => {
      const countId = dataVal.filter(isSame.bind(this, val));
      categoriesName.push(val);
      bins.push(countId.length);
    }));
    const binScale = d3.scale.linear()
      .domain(d3.extent(bins)).range([cellHeight / 2, cellHeight]);


    const div = divCat
      .selectAll('div.categories')
      .data(categoriesName);
    div.enter()
      .append('div')
      .attr('class', 'categories')
      .style('height', (d, i) => {
        return binScale(bins[i]) + 'px';
      })
      .style('background-color', c20)
      .text((d: any) => {
        return d;
      })
      .on('click', function () {
        d3.select(this).classed('active', !d3.select(this).classed('active'));
        if (d3.select(this).classed('active') === false) {
          const catName = (d3.select(this).datum());

          const cat = block.activeCategories;
          cat.push(catName);
          block.activeCategories = cat;

          const filterType = cat;
          self._rangeManager.onClickCat(dataInfo.data, divInfo.uid, filterType, block);
        } else if (d3.select(this).classed('active') === true) {
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
          self._rangeManager.onClickCat(dataInfo.data, divInfo.uid, filterType, block);
          block.filterDiv = divBlock;
        }
      })
      .on('mouseover', function (d, i) {
        tooltipDiv.transition()
          .duration(200)
          .style('opacity', 1);
        tooltipDiv.html(`${d} </br> count = ${bins[i]}`)
          .style('left', ((<any>d3).event.pageX) + 'px')
          .style('top', ((<any>d3).event.pageY - 28) + 'px');
      })
      .on('mouseout', function (d) {
        tooltipDiv.transition()
          .duration(500)
          .style('opacity', 0);
      });
    div.exit().remove();

    FilterManager.filterList.set(divInfo.uid, self);
    const connectionLine = new ConnectionLines(self);
    connectionLine.makeLines(divBlock, divInfo.uid);

  } else {
    return console.log('Already Exists');
  }

}


function makeNumerical(divInfo, dataInfo, block, self) {
  const id = dataInfo.data.desc.id;
  const checkMe = checkMeIfExist(id);
  if (checkMe === false) {

    const cellHeight = divInfo.filterRowHeight;
    const cellWidth = divInfo.filterDialogWidth;

    const range = dataInfo.range;
    const filterDiv = divInfo.div;
    const divBlock = filterDiv.append('div')
      .attr('f-uid', divInfo.uid)
      //.style('height', cellHeight + 'px')
      .style('margin', '1px');
    const tooltipDiv = filterDiv.append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);
    const div = divBlock.selectAll('div.numerical').data([dataInfo.name]).enter();
    const numDiv = div.append('div')
      .attr('class', 'numerical')
      .text((d: any) => d);
    block.filterDiv = divBlock;
    const svgDIV = div.append('svg')
      .attr('height', cellHeight + 25)
      .attr('width', cellWidth);
    const binSize = dataInfo.bins;

    const cellDimension = cellWidth / binSize.length;
    const colorScale = d3.scale.linear<string,number>().domain([0, d3.max(binSize)]).range(['white', 'darkgrey']);
    const bidDivs = svgDIV.append('g').classed('binsEntries', true)
      .selectAll('g.bins').data(binSize).enter();
    bidDivs.append('rect').classed('bins', true)
      .attr('x', (d, i) => i * cellDimension)
      .attr('width', cellDimension)
      .attr('height', cellHeight)
      .style('opacity', 1)
      .attr('fill', (d: any) => colorScale(d))
      .on('mouseover', function (d, i) {
        tooltipDiv.transition()
          .duration(200)
          .style('opacity', 1);
        tooltipDiv.html(`Bin:${i + 1}, Entries: ${d}`)
          .style('left', ((<any>d3).event.pageX) + 'px')
          .style('top', ((<any>d3).event.pageY - 28) + 'px');
      })
      .on('mouseout', function (d) {
        tooltipDiv.transition()
          .duration(500)
          .style('opacity', 0);
      });
    let iconAPos = 5;
    let iconBPos = cellWidth - 5;
    const leftRectBrush = svgDIV.append('rect').attr('x', 0)
      .attr('width', cellWidth)
      .attr('height', cellHeight)
      .attr('visibility', 'hidden')
      .attr('opacity', 1)
      .attr('fill', '#666');

    const rightRectBrush = svgDIV.append('rect').attr('x', 0)
      .attr('width', cellWidth)
      .attr('height', cellHeight)
      .attr('visibility', 'hidden')
      .attr('opacity', 0.2)
      .attr('fill', '#666');
    const lineA = svgDIV.append('path')
      .classed('brushline', true)
      .attr('d', `M${iconAPos} 0,L${iconAPos} ${cellHeight + 5}`)
      .attr('stroke', 'black');

    const lineB = svgDIV.append('path')
      .classed('brushline', true)
      .attr('d', `M${iconBPos} 0,L${iconBPos} ${cellHeight + 5}`)
      .attr('stroke', 'black');
    //Adapted from https://bl.ocks.org/alexmacy/eb284831aff6f9d0119b

    // const scale = d3.scale.linear()
    //   .domain(range)
    //   .range([5, cellWidth - 5]);
    // const brush = d3.svg.brush().x(scale)
    //   .extent(range);

    // const brushg = svgDIV.select('g.binsEntries').append('g').classed('brush', true).call(brush);
    // brushg.selectAll('rect')
    //   .attr('height', cellHeight);

    const axisScale = d3.scale.linear().domain([iconAPos, iconBPos]).range(range);

    const textA = svgDIV.append('text').classed('leftVal', true)

      .attr('x', 0)
      .attr('y', cellHeight + 25)
      .attr('font-family', 'sans-serif')
      .attr('font-size', '12px')
      .attr('fill', 'black');
    const textB = svgDIV.append('text').classed('rightVal', true)
      .attr('x', cellWidth - 20)
      .attr('y', cellHeight + 25)
      .attr('font-family', 'sans-serif')
      .attr('font-size', '10px')
      .attr('fill', 'black');

    let brushVal = range;

    const dragA = d3.behavior.drag()
      .on('drag', function (d, i) {
        const x = (<any>d3).event.x;
        iconAPos = x;
        if (x >= 5 && x <= cellWidth - 5) {
          if ((iconBPos - iconAPos) > 20) {
            brushVal = [axisScale(iconAPos), axisScale(iconBPos)];
            textA.attr('x', iconAPos)
              .text(`${Math.floor(brushVal[0])}`);
            textB.attr('x', iconBPos).text(`${Math.floor(brushVal[1])}`);

            leftRectBrush.attr('width', iconAPos)
              .attr('visibility', 'visible')
              .attr('opacity', 0.8);

            rightRectBrush.attr('x', iconBPos)
              .attr('width', cellWidth - iconBPos)
              .attr('visibility', 'visible')
              .attr('opacity', 0.8);

            lineA.attr('d', `M${iconAPos} 0,L${iconAPos} ${cellHeight + 5}`);
            lineB.attr('d', `M${iconBPos} 0,L${iconBPos} ${cellHeight + 5}`);

            const filterType = {numerical: brushVal};
            self._rangeManager.onBrushNumerical(dataInfo.data, divInfo.uid, filterType);
            d3.select(this).attr('transform', `translate(${iconAPos},${cellHeight + 10})`);
          }

        }
      });

    const dragB = d3.behavior.drag()
      .on('drag', function (d, i) {
        const x = (<any>d3).event.x;
        iconBPos = x;
        if (x >= 5 && x <= cellWidth - 5 && (iconBPos - iconAPos) > 20) {
          brushVal = [axisScale(iconAPos), axisScale(iconBPos)];
          textA.attr('x', iconAPos)
            .text(`${Math.floor(brushVal[0])}`);
          textB.attr('x', iconBPos).text(`${Math.floor(brushVal[1])}`);

          leftRectBrush.attr('width', iconAPos)
            .attr('visibility', 'visible')
            .attr('opacity', 0.8);

          rightRectBrush.attr('x', iconBPos)
            .attr('width', cellWidth - iconBPos)
            .attr('visibility', 'visible')
            .attr('opacity', 0.8);

          lineA.attr('d', `M${iconAPos} 0,L${iconAPos} ${cellHeight + 5}`);
          lineB.attr('d', `M${iconBPos} 0,L${iconBPos} ${cellHeight + 5}`);

          const filterType = {numerical: brushVal};
          self._rangeManager.onBrushNumerical(dataInfo.data, divInfo.uid, filterType);
          d3.select(this).attr('transform', `translate(${iconBPos},${cellHeight + 10})`);
        }
      });


    const triangleSymbol = d3.svg.symbol().type('triangle-up').size(100);
    const iconA = svgDIV.append('path')
      .classed('draggable', true)
      .attr('d', triangleSymbol)
      .attr('transform', `translate(${5},${cellHeight + 10})`)
      .call(dragA);

    const iconB = svgDIV.append('path')
      .attr('d', triangleSymbol)
      .attr('transform', `translate(${cellWidth - 5},${cellHeight + 10})`)
      .call(dragB);

    textA.text(`${(<any>Math).floor(brushVal[0])}`);
    textB.text(`${(<any>Math).floor(brushVal[1])}`);


    // const scalePos = d3.scale.linear().domain(brushVal).range([5, cellWidth - 5]);


    // brush.on('brush', function () {
    //   console.log(iconAPos, iconBPos)
    //   console.log(brush.extent())
    //   brushVal = brush.extent();
    //   textA.attr('x', scalePos(brushVal[0]))
    //     .text(`${Math.floor(brushVal[0])}`);
    //   textB.attr('x', scalePos(brushVal[1]) - 20).text(`${Math.floor(brushVal[1])}`);
    //
    //   iconA.attr('transform', `translate(${scalePos(brushVal[0])},${cellHeight + 10})`);
    //   iconB.attr('transform', `translate(${scalePos(brushVal[1])},${cellHeight + 10})`);


    // });


    FilterManager.filterList.set(divInfo.uid, self);
    const connectionLine = new ConnectionLines(self);
    connectionLine.makeLines(divBlock, divInfo.uid);


  } else {
    return console.log('Already Exists');
  }


}


function makeMatrix(divInfo, dataInfo, block, self) {
  const id = dataInfo.data.desc.id;
  const checkMe = checkMeIfExist(id);
  if (checkMe === false) {

    FilterManager.filterList.set(divInfo.uid, self);
    const cellHeight = divInfo.filterRowHeight;
    const filterDiv = divInfo.div;
    const divBlock = filterDiv.append('div')
      .attr('f-uid', divInfo.uid)
      .style('display', 'flex')
      .style('height', cellHeight + 'px')
      .style('margin', '1px');


    const div = divBlock.selectAll('div.matrix').data(dataInfo.value).enter();
    const colorScale = d3.scale.linear<string, number>().domain(dataInfo.range).range(['white', 'red']);
    div.append('div')
      .attr('class', 'matrix')
      .style('background-color', colorScale);

    block.filterDiv = divBlock;
    const matrixName = divBlock.selectAll('div.matrixName').data([dataInfo.name]).enter();
    matrixName.append('div')
      .attr('class', 'matrixName')
      .text((d) => d);
  } else {
    return console.log('Already Exists');
  }


}

function makeStringRect(divInfo, dataInfo, block, self) {

  const id = dataInfo.data.desc.id;
  const checkMe = checkMeIfExist(id);
  const brushHeight = 20;
  const cellHeight = divInfo.filterRowHeight + brushHeight;
  const stringRange = [1, 26];
  const cellWidth = divInfo.filterDialogWidth;
  if (checkMe === false) {

    const filterDiv = divInfo.div;
    const divBlock = filterDiv.append('div')
      .attr('f-uid', divInfo.uid);

    block.filterDiv = divBlock;

    const textSearch = divBlock.append('input', 'text').classed('textField', true);
    textSearch.on('keyup', function (d) {
      const filterType = this.value;
      self._rangeManager.inputTextSearch(dataInfo.data, divInfo.uid, filterType, block);

    });


    const textBlock = divBlock.selectAll('div.' + dataInfo.name).data([dataInfo.name]);
    textBlock.enter()
      .append('div')
      .classed(dataInfo.name, true)
      .style('height', cellHeight - brushHeight + 'px')
      .style('margin', '1px')
      .style('background-color', 'grey')
      .style('border', '1px')
      .text((d) => d);
    textBlock.exit().remove();


    const svg = divBlock.append('svg')
      .attr('height', cellHeight - brushHeight)
      .attr('width', cellWidth)
      .append('g')
      .attr('transform', 'translate(2,0)');

    const scale = d3.scale.linear()
      .domain(stringRange)
      .range([0, cellWidth]);

    const brush = d3.svg.brush()
      .x(scale)
      .extent([stringRange[0], stringRange[1]]);


    const xAxis = d3.svg.axis()
      .scale(scale)
      .orient('bottom')
      .tickValues(scale.domain())
      .tickFormat(d3.format(''));

    svg.append('g')
      .attr('class', 'x axis')
      .call(xAxis)
      .selectAll('text')
      .attr('y', 6)
      .attr('x', 0)
      .attr('dx', (d, i) => (i === 0) ? '0px' : '-3px')
      .attr('dy', '8px')
      .text((d, i) => (i === 0) ? 'A' : 'Z')
      .style('text-anchor', (d, i) => (i === 0) ? 'start' : 'end');

    const brushg = svg.append('g').attr('class', 'brush')
      .call(brush);

    brushg.selectAll('rect')
      .attr('height', brushHeight);


    brush.on('brush', function () {
      const filterType = brush.extent();
      self._rangeManager.onStringSlider(dataInfo.data, divInfo.uid, filterType, block);
      //console.log(brush.extent());
    });

    FilterManager.filterList.set(divInfo.uid, self);
    const connectionLine = new ConnectionLines(self);
    connectionLine.makeLines(divBlock, divInfo.uid);


  } else {
    return console.log('Already Exists');
  }

}


function checkMeIfExist(id) {
  let count = 0;
  App.blockList.forEach((value, key) => {
    if ((id === value.data.desc.id)) {
      count = count + 1;
    }
  });

  return ((count > 1) ? true : false);

}


function isSame(value, compareWith) {


  return value === compareWith;
}
