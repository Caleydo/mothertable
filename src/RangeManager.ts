/**
 * Created by bikramkawan on 21/01/2017.
 */

import App from './app';
import * as d3 from 'd3';
import Block from './Block';
export default class RangeManager {


  private _visManager;

  constructor(visManager) {
    this._visManager = visManager;
  }

  updateVis(range) {

    App.blockList.forEach((value, key) => {
      (<any>value).data.idView(range).then((d) => {


        d3.selectAll(`[data-uid="${key}"]`).remove();

        // const newVis = new VisManager(d, key);

        this._visManager.createVis((<any>value).data, d, key);

      });

    });
  }


  onClickCat(data, uniqueID, filterType?) {
    // const data = data;
    const catFilter = filterType;
    (<any>data).filter(findCatName.bind(this, catFilter))
      .then((vectorView) => {

        // console.log(vectorView.range.dim(0).asList(), uniqueID, 'start');
        Block.filtersRange.set(uniqueID, vectorView.range);
        this.calculateRangeIntersect(vectorView.range, uniqueID);

      });
  }

  onBrushNumerical(data, uniqueID, filterType?) {
    // const data = data;
    const numFilter = filterType.numerical;
    (<any>data).filter(numericalFilter.bind(this, numFilter))
      .then((vectorView) => {

        Block.filtersRange.set(uniqueID, vectorView.range);
        this.calculateRangeIntersect(vectorView.range, uniqueID);


      });

  }


  onStringSlider(data, uniqueID, filterType?) {
    const stringFilter = [Block.stringRange.get(Math.floor(filterType[0])), Block.stringRange.get(Math.floor(filterType[1]))];

    (<any>data).filter(findString.bind(this, stringFilter))
      .then((vectorView) => {

        // console.log(vectorView.range.dim(0).asList(), uniqueID, 'start');

        Block.filtersRange.set(uniqueID, vectorView.range);
        this.calculateRangeIntersect(vectorView.range, uniqueID);

      });
  }


  inputTextSearch(data, uniqueID, filterType?) {

    const stringFilter = filterType;

    (<any>data).filter(inputStringPattern.bind(this, stringFilter))
      .then((vectorView) => {

        // console.log(vectorView.range.dim(0).asList(), uniqueID, 'start');

        Block.filtersRange.set(uniqueID, vectorView.range);
        this.calculateRangeIntersect(vectorView.range, uniqueID);

      });
  }


  calculateRangeIntersect(range, key) {

    let rangeIntersected = range;
    //To Do


    Block.filtersRange.forEach(function (value, key) {

      rangeIntersected = rangeIntersected.intersect(value);

    });

    // console.log(rangeIntersected.dim(0).asList(), 'intersected',key)
    Block.filtersRange.set(key, range);
    Block.currentRange = rangeIntersected;
    this.updateVis(rangeIntersected);
  }
}


function findCatName(catName: any[], value, index,) {

  for (const x in catName) {
    if (catName[x] === value) {

      return value;
    }
  }
  return;


}


function numericalFilter(numRange, value, index) {

  if (value >= numRange[0] && value <= numRange[1]) {
    return value;
  } else {
    return;
  }


}


function findString(stringFilter, value, index) {

  const re = new RegExp(`[${stringFilter[0]}-${stringFilter[0]}]`, 'gi');

  if (value.match(re) === null) {
    return;

  } else {

    return value;
  }


}


function inputStringPattern(stringFilter, value, index) {

  const re = new RegExp(`${stringFilter}`, 'gi');
  if (value.match(re) === null) {

    return;

  } else {

    return value;
  }


}

