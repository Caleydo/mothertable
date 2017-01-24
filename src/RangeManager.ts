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

        Block.filtersRange.set(uniqueID, vectorView.range);
        this.calculateRangeIntersect(vectorView.range);

      });
  }

  onBrushNumerical(data, uniqueID, filterType?) {
    // const data = data;
    const numFilter = filterType.numerical;
    (<any>data).filter(numericalFilter.bind(this, numFilter))
      .then((vectorView) => {

        Block.filtersRange.set(uniqueID, vectorView.range);
        this.calculateRangeIntersect(vectorView.range);


      });

  }


  calculateRangeIntersect(range) {

    let rangeIntersected = range;
    //To Do
    Block.filtersRange.forEach(function (value, key) {

      // console.log(range.dim(0).asList(), value.dim(0).asList())
      // console.log(range.intersect(value).dim(0).asList())
      rangeIntersected = range.intersect(value);
      //Block.filtersRange.delete(key);
      Block.filtersRange.set(key, rangeIntersected);

    });


    Block.filtersRange.forEach(function (value, key) {

      Block.filtersRange.set(key, rangeIntersected);

    });

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


