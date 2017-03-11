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
import {hash} from 'phovea_core/src/index';


export default class SupportView extends EventHandler {

  static EVENT_DATASET_ADDED = 'added';
  static EVENT_FILTER_CHANGED = FilterManager.EVENT_FILTER_CHANGED;

  private static readonly HASH_FILTER_DELIMITER = ',';

  node: HTMLElement;

  private filterManager: FilterManager;
  private _matrixData;
  private datasets: IDataType[];

  constructor(public readonly idType: IDType, parent: HTMLElement, public readonly id?: string) {
    super();
    this.build(parent);
  }

  private async build(parent) {
    this.node = parent.ownerDocument.createElement('div');
    parent.appendChild(this.node);
    this.node.classList.add(this.idType.id);

    this.setupFilterManager();

    await this.loadDatasets();
    this.buildSelectionBox(this.node);
    this.addInitialFilters();
  }

  private async loadDatasets() {
    this.datasets = convertTableToVectors(await listData())
      .filter((d) => d.idtypes.indexOf(this.idType) >= 0 && isPossibleDataset(d));
  }

  private setupFilterManager() {
    this.filterManager = new FilterManager(this.idType, this.node);
    this.filterManager.on(FilterManager.EVENT_SORT_DRAGGING, (evt: any, data: AnyColumn[]) => {
      this.updateURLHash();
      this.fire(FilterManager.EVENT_SORT_DRAGGING, data);
    });

    this.propagate(this.filterManager, FilterManager.EVENT_FILTER_CHANGED);
  }

  private addInitialFilters() {
    if (hash.has(this.idType.id)) {
      hash.getProp(this.idType.id)
        .split(SupportView.HASH_FILTER_DELIMITER)
        .map((name) => this.datasets.filter((d) => d.desc.name === name)[0])
        .filter((data) => data !== undefined)
        .forEach((data) => {
          this.addDataset(data);
        });
    }
  }

  private updateURLHash() {
    hash.setProp(this.idType.id,
      this.filterManager.filters
        .map((d) => d.data.desc.name)
        .join(SupportView.HASH_FILTER_DELIMITER)
    );
  }

  destroy() {
    this.filterManager.off(FilterManager.EVENT_SORT_DRAGGING, null);
    this.node.remove();
  }

  primarySortColumn(sortColdata) {
    this.filterManager.primarySortColumn(sortColdata);
  }

  get matrixData() {
    return this._matrixData;
  }

  public remove(data: IDataType) {
    if (isFilterAble(data) && this.filterManager.contains(<IFilterAbleType>data)) {
      this.filterManager.remove(<IFilterAbleType>data);
      this.updateURLHash();
    }
  }

  private buildSelectionBox(parent: HTMLElement) {

    parent.insertAdjacentHTML('afterbegin', `<div class="selection">
       <select class="form-control">
       <option value="attribute">Select Attribute</option>             
      </select>
    </div>`);
    const select = <HTMLSelectElement>parent.querySelector('select');

    this.addExplicitColors(this.datasets);

    // list all data, filter to the matching ones, and prepare them
    // const datasets = convertTableToVectors(await listData())
    //   .filter((d) => d.idtypes.indexOf(this.idType) >= 0 && isPossibleDataset(d))
    // datasets.map((d) => transposeMatrixIfNeeded(this.idType, d));

    this.datasets.forEach((d) => {
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
      this.addDataset(this.datasets[index - 1]);
      this.updateURLHash();
      // reset selection
      select.selectedIndex = 0;
      return false;
    });
  }

  /**
   * Special function to define colors for the TCGA dataset
   * @param datasets
   * @returns {Promise<void>}
   */
  private async addExplicitColors(datasets) {
    const color = [
      ['#7fc97f', '#beaed4', '#fdc086', '#ffff99', '#386cb0', '#f0027f'],
      ['#1b9e77', '#1d9ee8', '#d97979', '#e7298a', '#66a61e', '#e6ab02'],
      ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c'],
      ['#e41a1c', '#377eb8', '#984ea3', '#ff7f00', '#ffff33'],
      ['#8dd3c7', '#fdb462', '#bebada', '#fb8072', '#80b1d3', '#fdb462'],
      ['#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f']
    ];

    datasets.forEach((tableVector, j) => {
      if (tableVector.desc.value.type === 'categorical') {
        const categories = tableVector.desc.value.categories;
        categories.forEach((v, i) => {
          if (v.color === undefined) {
            tableVector.desc.value.categories[i] = {name: v, color: color[j - 4][i]};
          }
          if (v.label !== undefined) {
            tableVector.desc.value.categories[i] = {name: v.name, color: color[j - 4][i]};
          }
        });
      }
    });
  }

  private addDataset(data: IDataType) {
    if (isFilterAble(data) && !this.filterManager.contains(<IFilterAbleType>data)) {
      this.filterManager.push(<IFilterAbleType>data);
    }

    this._matrixData = data;

    this.fire(SupportView.EVENT_DATASET_ADDED, data);
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
