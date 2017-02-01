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

export default class SupportView extends EventHandler {
  static EVENT_DATASET_ADDED = 'added';

  private readonly filter: FilterManager;

  constructor(public readonly idType: IDType, readonly node: HTMLElement) {
    super();
    this.node.classList.add('support-view');
    this.filter = new FilterManager(idType, node);
  }

  private addDataset(data: IDataType) {
    if (isFilterAble(data) && !this.filter.contains(<IFilterAbleType>data)) {
      this.filter.push(<IFilterAbleType>data);
    }
    this.fire(SupportView.EVENT_DATASET_ADDED, data);
  }

  private async buildSelectionBox(parent: HTMLElement) {
    parent.insertAdjacentHTML('afterbegin', `<div class="selection">
       <select class="form-control">
           <option></option>             
      </select>
    </div>`);
    const select = <HTMLSelectElement>parent.querySelector('select');

    // list all data, filter to the matching ones, and prepare them
    let datasets = (await listData())
      .filter((d) => d.idtypes.indexOf(this.idType) >= 0 && isPossibleDataset(d))
      .map((d) => transposeMatrixIfNeeded(this.idType, d));
    datasets = convertTableToVectors(datasets);

    //
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
}

function isFilterAble(data: IDataType) {
  // everything except matrices can be filtered
  return data.desc.type !== 'matrix';
}

function isPossibleDataset(data: IDataType) {
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

function transposeMatrixIfNeeded(rowtype: IDType, d: IDataType) {
  // tranpose if the rowtype is not the target one
  if (d.desc.type === 'matrix' && d.idtypes[0] !== rowtype) {
    return (<INumericalMatrix>d).t;
  }
  return d;
}
