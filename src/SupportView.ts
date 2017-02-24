/**
 * Created by Samuel Gratzl on 01.02.2017.
 */

import IDType from 'phovea_core/src/idtype/IDType';
import {ICategoricalVector, INumericalVector} from 'phovea_core/src/vector';
import {
  VALUE_TYPE_STRING, VALUE_TYPE_CATEGORICAL, VALUE_TYPE_INT, VALUE_TYPE_REAL,
  IDataType
} from 'phovea_core/src/datatype';
import {EventHandler} from 'phovea_core/src/event';
import FilterManager from './filter/FilterManager';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import {IAnyVector} from 'phovea_core/src/vector';
import {list as listData, convertTableToVectors} from 'phovea_core/src/data';
import {IFilterAbleType} from 'mothertable/src/filter/FilterManager';
import {AnyColumn} from './column/ColumnManager';


export default class SupportView extends EventHandler {

  static EVENT_DATASET_ADDED = 'added';
  static EVENT_FILTER_CHANGED = FilterManager.EVENT_FILTER_CHANGED;

  private readonly filter: FilterManager;
  readonly node: HTMLElement;
  private _matrixData;

  constructor(public readonly idType: IDType, parent: HTMLElement) {
    super();
    this.node = parent.ownerDocument.createElement('div');
    parent.appendChild(this.node);
    this.node.classList.add(idType.id);
    this.buildSelectionBox(this.node);
    this.filter = new FilterManager(idType, this.node);

    this.filter.on(FilterManager.EVENT_SORT_DRAGGING, (evt: any, data: AnyColumn[]) => {
      this.fire(FilterManager.EVENT_SORT_DRAGGING, data);
    });

    this.propagate(this.filter, FilterManager.EVENT_FILTER_CHANGED);
  }

  destroy() {
    this.node.remove();
  }

  private addDataset(data: IDataType) {
    if (isFilterAble(data) && !this.filter.contains(<IFilterAbleType>data)) {

      this.filter.push(<IFilterAbleType>data);


    }

    this._matrixData = data;

    this.fire(SupportView.EVENT_DATASET_ADDED, data);
  }

  primarySortColumn(sortColdata) {
    this.filter.primarySortColumn(sortColdata);

  }

  get matrixData() {
    return this._matrixData;
  }


  public remove(data: IDataType) {
    if (isFilterAble(data) && this.filter.contains(<IFilterAbleType>data)) {
      this.filter.removeData(<IFilterAbleType>data);
    }
  }

  private async buildSelectionBox(parent: HTMLElement) {

    parent.insertAdjacentHTML('afterbegin', `<div class="selection">
       <select class="form-control">
       <option value="attribute">Select Attribute</option>             
      </select>
    </div>`);
    const select = <HTMLSelectElement>parent.querySelector('select');

    const datasets = await this.addColor();
    // console.log(datasets);

    // list all data, filter to the matching ones, and prepare them
    // const datasets = convertTableToVectors(await listData())
    //   .filter((d) => d.idtypes.indexOf(this.idType) >= 0 && isPossibleDataset(d))
    // datasets.map((d) => transposeMatrixIfNeeded(this.idType, d));

    datasets.forEach((d) => {
      const option = parent.ownerDocument.createElement('option');
      option.text = d.desc.name;
      option.value = d.desc.id;
      select.add(option);
    });

    select.addEventListener('change', (evt) => {
      const index = select.selectedIndex;
      if (index === 0) { // empty selection
        return false;
      }
      // -1 because of empty option
      this.addDataset(datasets[index - 1]);
      // reset selection
      select.selectedIndex = 0;
      return false;
    });
  }

  private async addColor() {
    const color = ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5'];
    const datasets = convertTableToVectors(await listData())
      .filter((d) => d.idtypes.indexOf(this.idType) >= 0 && isPossibleDataset(d));

    datasets.forEach((tableVector) => {
      if (tableVector.desc.value.type === 'categorical') {
        const categories = tableVector.desc.value.categories;
        categories.forEach((v, i) => {
          if (v.color === undefined) {
            tableVector.desc.value.categories[i] = {name: v, color: color[i]};
          }
          if (v.label !== undefined) {
            tableVector.desc.value.categories[i] = {name: v.name, color: color[i]};
          }
        });
      }
    });


    return datasets;

  }


}

function isFilterAble(data: IDataType) {
  // everything except matrices can be filtered

  return true;
  //return data.desc.type !== 'matrix';
}


export function isPossibleDataset(data: IDataType) {
  switch (data.desc.type) {
    case 'vector':
      const v = <IAnyVector>data;
      switch (v.desc.value.type) {
        case VALUE_TYPE_STRING:
          return true;
        case VALUE_TYPE_CATEGORICAL:
          return true;
        case VALUE_TYPE_INT:
        case VALUE_TYPE_REAL:
          return true;
      }
      return false;
    case 'matrix':
      const m = <INumericalMatrix>data;
      switch (m.desc.value.type) {
        case VALUE_TYPE_INT:
        case VALUE_TYPE_REAL:
          return true;
      }
      return false;
    default:
      return false;
  }
}

export function transposeMatrixIfNeeded(rowtype: IDType, d: IDataType) {

  // tranpose if the rowtype is not the target one
  if (d.desc.type === 'matrix' && d.idtypes[0] !== rowtype) {
    return (<INumericalMatrix>d).t;
  }

  return d;
}
