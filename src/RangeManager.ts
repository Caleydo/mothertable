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


  onClickCat(data, uniqueID, filterType?, block?) {
    // const data = data;
    const catFilter = filterType;

    (<any>data).filter(findCatName.bind(this, catFilter))
      .then((vectorView) => {

        Block.filtersRange.delete(uniqueID);
        Block.filtersRange.set(uniqueID, vectorView.range);
        //   console.log(Block.filtersRange)
        // console.log(vectorView)
        // console.log(vectorView.range)
        // console.log(vectorView.data());
        this.updateVis((vectorView.range));
        //this.updateVis(calculateRangeIntersect(vectorView.range));
      });
  }

  onBrushNumerical(data, uniqueID, filterType?) {
    // const data = data;
    const numFilter = filterType.numerical;
    (<any>data).filter(numericalFilter.bind(this, numFilter))
      .then((vectorView) => {
        //  console.log(vectorView.data(), numFilter);
        Block.filtersRange.delete(uniqueID);
        Block.filtersRange.set(uniqueID, vectorView.range);
        this.updateVis(calculateRangeIntersect(vectorView.range));


      });

  }


  //
  //
  // Block.filtersRange.forEach((value, key) => {
  //   console.log(key);
  //   (<any>value).ids().then((r) => {
  //
  //     rangeIntersected = range.intersect(r);
  //     console.log(rangeIntersected);
  //   });
  // });
}


function findCatName(catName: any[], value, index,) {
  for (let i = 0; i < catName.length; ++i) {
    if (value === catName[i]) {
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


function calculateRangeIntersect(range) {

  let rangeIntersected = range;
  //To Do
  Block.filtersRange.forEach(function (value, key) {
    // console.log(range, key)
    // console.log(range.union(value))
    // console.log(range.intersect(value))
    rangeIntersected = range.intersect(value);


  });
  return rangeIntersected;

}
