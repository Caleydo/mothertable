/**
 * Created by bikramkawan on 21/01/2017.
 */

import UpdateBlockManager from './UpdateBlockManager';
export default class RangeManager {


  private _data;
  private _filterType;
  private _uniqueID;
  private _narrowRange;
  private _numericalRange;

  constructor(data, uniqueID, filterType?) {
    this._data = data;
    this._uniqueID = uniqueID;
    this._filterType = filterType;
  }

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
  }

  onClickCat() {
    const data = this._data;
    const catFilter = this._filterType.category;
    (<any>data).filter(findCatName.bind(this, catFilter))
      .then((vectorView) => {
        console.log(vectorView.data());
        this.setRange(vectorView.range);
        const updateVis = new UpdateBlockManager(vectorView.range);
        updateVis.updateVis();
        // this.calculateRangeIntersect(App.blockList, vectorView.range);

      });
  }

  onBrushNumerical() {
    const data = this._data;
    const numFilter = this._filterType.numerical;
    (<any>data).filter(numericalFilter.bind(this, numFilter))
      .then((vectorView) => {
        console.log(vectorView.data(), numFilter);
       // this.setRange(vectorView.range);
        const updateVis = new UpdateBlockManager(vectorView.range);
        updateVis.updateVis();
        // this.calculateRangeIntersect(App.blockList, vectorView.range);

      });


  }


  calculateRangeIntersect(blockList, range,) {


    //To Do
    let rangeIntersected = range;
    blockList.forEach((value, key) => {
      console.log(key);
      (<any>value).ids().then((r) => {

        rangeIntersected = range.intersect(r)
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

    console.log(numRange)
    console.log(value, 'yes', index);
    return value;
  } else {
    console.log(numRange)
    console.log(value, 'No', index);
    return;
  }


}

