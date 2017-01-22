/**
 * Created by bikramkawan on 20/01/2017.
 */



export default class BlockManager {

  private _data;
  private _uid;
  private _dataList;

  constructor(data, uid) {

    this._data = data;
    this._uid = uid;
  }


  get data() {
    return this._data;
  }

  set data(value) {
    this._data = value;
  }

  get uid() {
    return this._uid;
  }

  set uid(value) {
    this._uid = value;
  }


}

