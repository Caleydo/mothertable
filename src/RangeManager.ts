/**
 * Created by bikramkawan on 21/01/2017.
 */

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

  get narrowRange() {
    return this._narrowRange;
  }

  set narrowRange(value) {
    this._narrowRange = value;
  }

  onClickCat() {
    const data = this._data;
    (<any>data).filter(findCatName.bind(this, this._catName))
      .then((vectorView) => {
        console.log(vectorView.data());
        this._narrowRange = vectorView.range;
      });
  }

}


function setRange(range) {

  console.log(range)


  // filteredData(range, blockList)

}

function findCatName(catName, value, index,) {

  if (value === catName) {
    return value;
  } else {
    return;
  }
}


function filteredData(range, dataArray) {
  console.log(range, dataArray)
  let newVisDataArray = [];
  let rangeIntersected = range;
  dataArray.forEach((d, i) => {

    (<any>d).ids().then((r) => {
      console.log(r, i, (<any>d).desc.name);
      rangeIntersected = rangeIntersected.intersect(r);
    })
  })


  dataArray.forEach((d, i) => {

    newVisDataArray.push(d.idView(rangeIntersected));

    // d.idView(rangeIntersected).then((e) => {
    //
    //   newVisDataArray.push(e);
    // })
  })


  // Promise.all(newVisDataArray).then((val) => {
  // //  filterVisFactory(val);
  //   console.log(val);
  // })


}
