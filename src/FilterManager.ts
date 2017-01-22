/**
 * Created by bikramkawan on 21/01/2017.
 */

import * as d3 from 'd3';
import RangeManager from './RangeManager';
import App from './app';
import Range1D from 'phovea_core/src/range/Range1D';


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
    const fid =block.uid;
    const range = (<any>data).desc.value.range;
    const divInfo = {filterDialogWidth: 274, filterRowHeight: 30, 'uid': fid, 'div': this._filterDiv};


    if (vectorOrMatrix === 'vector') {
      const dataType = (<any>data.desc).value.type;
      if (dataType === 'categorical') {

        var uniqCat = (<any>data).desc.value.categories;
        block.activeCategories = uniqCat;
        const dataInfo = {'name': name, value: uniqCat, type: dataType, 'data': data};
        makeCategories(divInfo, dataInfo,block,self);

      } else if (dataType === 'int' || dataType === 'real') {
        (<any>data).data().then(function (dataVal) {
          const dataInfo = {'name': name, value: dataVal, type: dataType, 'data': data, 'range': range};
          makeNumerical(divInfo, dataInfo,block,self);
        });
      } else {
        (<any>data).data().then(function (dataVal) {
          const dataInfo = {'name': name, value: dataVal, type: dataType, 'data': data};
          makeStringRect(divInfo, dataInfo,block,self);

        });
      }


    } else if (vectorOrMatrix === 'matrix') {
      (<any>data).data().then(function (dataVal) {
        const dataInfo = {'name': name, value: dataVal[0], type: vectorOrMatrix, 'range': range, 'data': data};
        makeMatrix(divInfo, dataInfo,block,self);
      });
    }
     this.filterData.push(block.data);
     this.filterUID.push(block.uid);

  }

}

function makeCategories(divInfo, dataInfo,block,self) {
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
          const catSelected = true;
          const catName = (d3.select(this).datum());
          var cat = block.activeCategories;
          cat.push(catName);
          block.activeCategories = cat;
          var filterType= cat;
          self._rangeManager.onClickCat(dataInfo.data, divInfo.uid, filterType);
        } else if (d3.select(this).classed('active') === true) {
          const catSelected = false;
          const catName = (d3.select(this).datum());
          var cat = block.activeCategories;
          var ind = -1;
          for (var i = 0; i < cat.length; ++i) {
              if (cat[i] === catName) {
                  ind = i;
              }
          }
          cat.splice(ind,1);
          block.activeCategories = cat;
           var filterType= cat;
          self._rangeManager.onClickCat(dataInfo.data, divInfo.uid, filterType);

  block.filterDiv = divBlock;
        }


      });

    div.exit().remove();
  } else {
    return console.log('Already Exists');
  }

}


function makeNumerical(divInfo, dataInfo,block,self) {
  const id = dataInfo.data.desc.id;
  const checkMe = checkMeIfExist(id);
  if (checkMe === false) {
    const cellHeight = divInfo.filterRowHeight;
    const cellWidth = divInfo.filterDialogWidth - 2;
    const range = dataInfo.range;
    const filterDiv = divInfo.div;
    const divBlock = filterDiv.append('div')
      .attr('f-uid', divInfo.uid)
      .style('height', cellHeight + 'px')
      .style('margin', '1px');
    // const div = divBlock.selectAll('div.numerical').data([dataInfo.name]).enter();
    // div.append('div')
    //   .attr('class', 'numerical')
    //   .text((d: any) => d);
  block.filterDiv = divBlock;

    const svg = divBlock.append('svg')
      .attr('height', cellHeight)
      .attr('width', cellWidth);
    const svgDefs = svg.append('defs');

    const mainGradient = svgDefs.append('linearGradient')
      .attr('id', 'numGradient');

    mainGradient.append('stop')
      .attr('class', 'stop-left')
      .attr('offset', '0');
    mainGradient.append('stop')
      .attr('class', 'stop-right')
      .attr('offset', '1');


    const scale = d3.scale.linear()
      .domain(range)
      .range([0, cellWidth]);

    const brush = d3.svg.brush();
    brush.x(scale);
    brush.extent(range);

    brush.on('brushend', function () {
      console.log(brush.extent());
      const filterType = {numerical: brush.extent()};
      self._rangeManager.onBrushNumerical(dataInfo.data, divInfo.uid, filterType);
    });

    const g = svg.append('g');

    brush(g);
    g.selectAll('rect').attr('height', cellHeight);
    g.selectAll('.background')
      .style({fill: 'url(#numGradient)', visibility: 'visible', opacity: 0.5});
    g.selectAll('.extent')
      .style({fill: 'url(#numGradient)', visibility: 'visible', opacity: 1});
    g.selectAll('.resize rect')
      .style({fill: 'url(#numGradient)', visibility: 'visible'});

    const textDiv = svg.selectAll('.text').data([dataInfo.name]).enter();
    textDiv.append('text')
      .attr('x', 0)
      .attr('y', cellHeight / 2)
      .text((d: any) => d);
  } else {
    return console.log('Already Exists');
  }


}


function makeMatrix(divInfo, dataInfo, block,self) {
  const id = dataInfo.data.desc.id;
  console.log(id)
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

function makeStringRect(divInfo, dataInfo,block,self) {

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
