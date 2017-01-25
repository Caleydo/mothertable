/**
 * Created by bikramkawan on 21/01/2017.
 */

import * as d3 from 'd3';
import App from './app';
import Block from './Block';

export default class FilterManager {

  private filterUID = [];
  private filterData = [];
  private _filterDiv = App.filterNode;
  private _rangeManager;


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

    console.log(block.data, block.uid);
    const data = block.data;
    const vectorOrMatrix = (<any>data.desc).type;
    const name = (<any>data.desc).name;
    const fid = block.uid;
    const range = (<any>data).desc.value.range;
    const divInfo = {filterDialogWidth: 274, filterRowHeight: 30, 'uid': fid, 'div': this._filterDiv};
    console.log(block);

    Block.filtersRange.set(fid, data.indices);

    if (vectorOrMatrix === 'vector') {
      const dataType = (<any>data.desc).value.type;
      if (dataType === 'categorical') {

        const uniqCat = (<any>data).desc.value.categories;
        block.activeCategories = uniqCat;
        block.activeCategories = uniqCat;
        const dataInfo = {'name': name, value: uniqCat, type: dataType, 'data': data};
        makeCategories(divInfo, dataInfo, block, self);

      } else if (dataType === 'int' || dataType === 'real') {
        (<any>data).data().then(function (dataVal) {
          const dataInfo = {'name': name, value: dataVal, type: dataType, 'data': data, 'range': range};
          makeNumerical(divInfo, dataInfo, block, self);
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
    const filterDiv = divInfo.div;
    const c20 = d3.scale.category20();
    const divBlock = filterDiv.append('div')
      .attr('f-uid', divInfo.uid)
      .style('display', 'flex')
      .style('margin', '1px')
      .style('height', cellHeight + 'px');
    const div = divBlock
      .selectAll('div.categories')
      .data(dataInfo.value);

    div.enter()
      .append('div')
      .attr('class', 'categories')
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


      });

    div.exit().remove();
  } else {
    return console.log('Already Exists');
  }

}


function makeNumerical(divInfo, dataInfo, block, self) {
  const id = dataInfo.data.desc.id;
  const checkMe = checkMeIfExist(id);
  if (checkMe === false) {
    const brushHeight = 20;
    const cellHeight = divInfo.filterRowHeight + brushHeight;
    const cellWidth = divInfo.filterDialogWidth;

    const range = dataInfo.range;
    const filterDiv = divInfo.div;
    const divBlock = filterDiv.append('div')
      .attr('f-uid', divInfo.uid)
      .style('height', cellHeight + 'px')
      .style('margin', '1px');
    const div = divBlock.selectAll('div.numerical').data([dataInfo.name]).enter();
    const numDiv = div.append('div')
      .attr('class', 'numerical')
      .text((d: any) => d);
    block.filterDiv = divBlock;

    const svg = divBlock.append('svg')
      .attr('height', cellHeight - brushHeight)
      .attr('width', cellWidth)
      .append('g')
      .attr('transform', 'translate(2,0)');

    //Adapted from https://bl.ocks.org/alexmacy/eb284831aff6f9d0119b

    const scale = d3.scale.linear()
      .domain(range)
      .range([0, cellWidth]);

    const brush = d3.svg.brush()
      .x(scale)
      .extent(range);


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
      .style('text-anchor', (d, i) => (i === 0) ? 'start' : 'end');

    const brushg = svg.append('g').attr('class', 'brush')
      .call(brush);

    brushg.selectAll('rect')
      .attr('height', brushHeight);


    brush.on('brush', function () {
      //console.log(brush.extent());
    });

  } else {
    return console.log('Already Exists');
  }


}


function makeMatrix(divInfo, dataInfo, block, self) {
  const id = dataInfo.data.desc.id;
  const checkMe = checkMeIfExist(id);
  if (checkMe === false) {
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
  if (checkMe === false) {
    const cellHeight = divInfo.filterRowHeight;
    const filterDiv = divInfo.div;
    const divBlock = filterDiv.append('div')
      .attr('f-uid', divInfo.uid);
    block.filterDiv = divBlock;
    divBlock.selectAll('div.' + dataInfo.name).data([dataInfo.name]).enter()
      .append('div')
      .classed(dataInfo.name, true)
      .style('height', cellHeight + 'px')
      .style('margin', '1px')
      .style('background-color', 'grey')
      .style('border', '1px')
      .text((d) => d);
  } else {
    return console.log('Already Exists');
  }

}


function checkMeIfExist(id) {
  let count = 0;
  App.blockList.forEach((value, key) => {

    if ((id === value.uid)) {
      count = count + 1;
    }
  });

  return ((count > 1) ? true : false);

}
