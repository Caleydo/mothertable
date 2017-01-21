/**
 * Created by bikramkawan on 21/01/2017.
 */

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
    console.log(this._filterData);
    const data = this._filterData;

    const vectorOrMatrix = (<any>data.desc).type;
    const fid = this._filterUID;
    const range = (<any>data).desc.value.range;

    const divInfo = {filterDialogWidth: 200, filterRowHeight: 30, 'uid': fid};

    if (vectorOrMatrix === 'vector') {
      const dataType = (<any>data.desc).value.type;
      if (dataType === 'categorical') {
        (<any>data).data().then(function (dataVal) {
          const uniqCat = dataVal.filter((x, i, a) => a.indexOf(x) === i);
          const dataInfo = {'name': name, value: uniqCat, type: dataType};
          this.makeCategories(divInfo, dataInfo, uid);
        });
      } else if (dataType === 'int' || dataType === 'real') {

        (<any>data).data().then(function (dataVal) {
          const dataInfo = {'name': name, value: dataVal, type: dataType};
          this.makeNumerical(divInfo, dataInfo);
        });
      } else {
        (<any>data).data().then(function (dataVal) {
          const dataInfo = {'name': name, value: dataVal, type: dataType};
          this.makeStringRect(divInfo, dataInfo);

        });
      }

    } else if (vectorOrMatrix === 'matrix') {
      (<any>data).data().then(function (dataVal) {
        const dataInfo = {'name': name, value: dataVal[0], type: vectorOrMatrix, 'range': range};
        this.makeMatrix(divInfo, dataInfo);
      });
    }


  }


  makeCategories(divInfo, dataInfo, uid) {
    const cellHeight = divInfo.filterRowHeight;
    const c20 = d3.scale.category20();
    const divBlock = d3.select('.filterdialog').append('div')
      .attr('data-uid', 'f' + divInfo.uid)
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
      .on('click', function () {
        const catName = (d3.select(this).datum());
        onClickCat(catName, uid);

      });

    div.exit().remove();
  }


  makeNumerical(divInfo, dataInfo) {
    const cellHeight = divInfo.filterRowHeight;
    const divBlock = d3.select('.filterdialog').append('div')
      .attr('data-uid', 'f' + divInfo.uid)
      .style('display', 'flex')
      .style('height', cellHeight + 'px')
      .style('margin', '1px');
    const div = divBlock.selectAll('div.numerical').data([dataInfo.name]).enter();
    div.append('div')
      .attr('class', 'numerical')
      .text((d: any) => d);

  }


  makeMatrix(divInfo, dataInfo) {
    const cellHeight = divInfo.filterRowHeight;
    const divBlock = d3.select('.filterdialog').append('div')
      .attr('data-uid', 'f' + divInfo.uid)
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


  makeStringRect(divInfo, dataInfo) {
    const cellHeight = divInfo.filterRowHeight;
    d3.select('.filterdialog').selectAll('div.' + dataInfo.name).data([dataInfo.name]).enter()
      .append('div')
      .classed(dataInfo.name, true)
      .style('height', cellHeight + 'px')
      .style('margin', '1px')
      .style('border', '1px')
      .text((d) => d);
  }


}

