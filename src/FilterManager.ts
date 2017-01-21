/**
 * Created by bikramkawan on 21/01/2017.
 */

import * as d3 from 'd3';


export default class FilterManager {

  private _filterData;
  private _filterUID;
  private _filterDiv;


  constructor(filterData, filterUID, filterDiv) {
    this._filterData = filterData;
    this._filterUID = filterUID;
    this._filterDiv = filterDiv;
  }

  get filterData() {
    return this._filterData;
  }

  set filterData(value) {
    this._filterData = value;
  }

  get filterUID() {
    return this._filterUID;
  }

  set filterUID(value) {
    this._filterUID = value;
  }

  get filterDiv() {
    return this._filterDiv;
  }

  set filterDiv(value) {
    this._filterDiv = value;
  }

  createFilter() {

    console.log(this._filterData, this._filterUID);
    const data = this._filterData;
    const vectorOrMatrix = (<any>data.desc).type;
    const name = (<any>data.desc).name;
    const fid = this._filterUID;
    const range = (<any>data).desc.value.range;
    const divInfo = {filterDialogWidth: 200, filterRowHeight: 30, 'uid': fid, 'div': this._filterDiv};


    if (vectorOrMatrix === 'vector') {
      const dataType = (<any>data.desc).value.type;
      if (dataType === 'categorical') {

        (<any>data).data().then(function (dataVal) {
          const uniqCat = dataVal.filter((x, i, a) => a.indexOf(x) === i);
          const dataInfo = {'name': name, value: uniqCat, type: dataType};
          console.log(divInfo, dataInfo, fid);
          makeCategories(divInfo, dataInfo);
        });
      } else if (dataType === 'int' || dataType === 'real') {
        (<any>data).data().then(function (dataVal) {
          const dataInfo = {'name': name, value: dataVal, type: dataType};
          makeNumerical(divInfo, dataInfo);
        });
      } else {
        (<any>data).data().then(function (dataVal) {
          const dataInfo = {'name': name, value: dataVal, type: dataType};
          makeStringRect(divInfo, dataInfo);

        });
      }

    } else if (vectorOrMatrix === 'matrix') {
      (<any>data).data().then(function (dataVal) {
        const dataInfo = {'name': name, value: dataVal[0], type: vectorOrMatrix, 'range': range};
        makeMatrix(divInfo, dataInfo);
      });
    }

  }

}

function makeCategories(divInfo, dataInfo) {
  const cellHeight = divInfo.filterRowHeight;
  const filterDiv = divInfo.div;
  const c20 = d3.scale.category20();
  const divBlock = filterDiv.append('div')
    .attr('data-uid', divInfo.uid)
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
    .text((d: any) => d)
  // .on('click', function () {
  //   const catName = (d3.select(this).datum());
  //   onClickCat(catName, uid);
  //
  // });

  div.exit().remove();
}


function makeNumerical(divInfo, dataInfo) {
  const cellHeight = divInfo.filterRowHeight;
  const filterDiv = divInfo.div;
  const divBlock = filterDiv.append('div')
    .attr('data-uid', divInfo.uid)
    .style('display', 'flex')
    .style('height', cellHeight + 'px')
    .style('margin', '1px');
  const div = divBlock.selectAll('div.numerical').data([dataInfo.name]).enter();
  div.append('div')
    .attr('class', 'numerical')
    .text((d: any) => d);

}


function makeMatrix(divInfo, dataInfo) {
  const cellHeight = divInfo.filterRowHeight;
  const filterDiv = divInfo.div;
  const divBlock = filterDiv.append('div')
    .attr('data-uid', divInfo.uid)
    .style('display', 'flex')
    .style('height', cellHeight + 'px')
    .style('margin', '1px');
  const div = divBlock.selectAll('div.matrix').data(dataInfo.value).enter();
  const colorScale = d3.scale.linear<string, number>().domain(dataInfo.range).range(['white', 'red']);
  div.append('div')
    .attr('class', 'matrix')
    .style('background-color', colorScale);

  const matrixName = divBlock.selectAll('div.matrixName').data([dataInfo.name]).enter();
  matrixName.append('div')
    .attr('class', 'matrixName')
    .text((d) => d);

}


function makeStringRect(divInfo, dataInfo) {
  const cellHeight = divInfo.filterRowHeight;
  const filterDiv = divInfo.div;
  const divBlock = filterDiv.append('div');
  divBlock.selectAll('div.' + dataInfo.name).data([dataInfo.name]).enter()
    .append('div')
    .classed(dataInfo.name, true)
    .style('height', cellHeight + 'px')
    .style('margin', '1px')
    .style('border', '1px')
    .text((d) => d);
}
