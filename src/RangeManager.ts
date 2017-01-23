/**
 * Created by bikramkawan on 21/01/2017.
 */

import App from './app';
import * as d3 from 'd3';
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
        // console.log(vectorView.data());
        this.updateVis(vectorView.range);
        // this.calculateRangeIntersect(App.blockList, vectorView.range);

      });
  }

  onBrushNumerical(data, uniqueID, filterType?) {
    // const data = data;
    const numFilter = filterType.numerical;
    (<any>data).filter(numericalFilter.bind(this, numFilter))
      .then((vectorView) => {
        console.log(vectorView.data(), numFilter);
        this.updateVis(vectorView.range);
        // this.calculateRangeIntersect(App.blockList, vectorView.range);

      });

  }


  calculateRangeIntersect(blockList, range,) {


    //To Do
    let rangeIntersected = range;
    blockList.forEach((value, key) => {
      console.log(key);
      (<any>value).ids().then((r) => {

        rangeIntersected = range.intersect(r);
        console.log(rangeIntersected);
      });
    });
  }
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

