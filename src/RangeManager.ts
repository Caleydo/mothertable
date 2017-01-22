/**
 * Created by bikramkawan on 21/01/2017.
 */

import UpdateBlockManager from './UpdateBlockManager';
import App from './app';
import * as d3 from 'd3';
export default class RangeManager {


 // private _data;
 // private _filterType;
 // private _uniqueID;
  //private _narrowRange;
  //private _numericalRange;
  private  _visManager;

  constructor(visManager) {
   // this._data = data;
   // this._uniqueID = uniqueID;
   // this._filterType = filterType;
    this._visManager = visManager;
  }
/*
  get data() {
    return this._data;
  }

  set data(value) {
    this._data = value;
  }

  get uniqueID() {
    return this._uniqueID;
  }

  set uniqueID(value) {
    this._uniqueID = value;
  }

  getRange() {
    return this._narrowRange;

  }

  setRange(value) {
    this._narrowRange = value;
  }*/

  updateVis(range) {

    App.blockList.forEach((value, key) => {
      console.log(key);
      console.log((<any>value).data(range));

      (<any>value).idView(range).then((d) => {

        d3.selectAll(`[data-uid="${key}"]`).remove();

       // const newVis = new VisManager(d, key);
        this._visManager.createVis(d, key);

      });

    });
  }


  onClickCat(data, uniqueID, filterType?) {
   // const data = data;
    const catFilter = filterType.category;
    (<any>data).filter(findCatName.bind(this, catFilter))
      .then((vectorView) => {
        console.log(vectorView.data());
      //  this.setRange(vectorView.range);
       //const updateVis = new UpdateBlockManager(vectorView.range);
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
        // this.setRange(vectorView.range);
      //  const updateVis = new UpdateBlockManager();
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


function findCatName(catName, value, index,) {

  if (value === catName) {
    return value;
  } else {
    return;
  }
}


function numericalFilter(numRange, value, index) {

  if (value >= numRange[0] && value <= numRange[1]) {
    return value;
  } else {
    return;
  }


}

