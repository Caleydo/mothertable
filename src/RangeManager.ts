/**
 * Created by bikramkawan on 21/01/2017.
 */

import UpdateBlockManager from './UpdateBlockManager';
export default class RangeManager {


  private _data;
  private _catName;
  private _uniqueID;
  private _narrowRange;

  constructor(data, uniqueID, catName) {
    this._data = data;
    this._uniqueID = uniqueID;
    this._catName = catName;
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
    (<any>data).filter(findCatName.bind(this, this._catName))
      .then((vectorView) => {
        console.log(vectorView.data());
        this.setRange(vectorView.range);
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

